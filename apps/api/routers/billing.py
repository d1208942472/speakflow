"""Unified billing webhooks and checkout flows."""
from __future__ import annotations

import hashlib
import hmac
import json
import os
from uuid import uuid4

import stripe
from fastapi import APIRouter, Header, HTTPException, Request
from pydantic import BaseModel

from dependencies import supabase
from services.billing import (
    record_billing_event,
    set_pro_entitlement,
    sync_stripe_event,
    upsert_provider_reference,
    upsert_subscription,
)

router = APIRouter(prefix="/billing", tags=["billing"])


class CheckoutSessionRequest(BaseModel):
    email: str
    userId: str | None = None


class BillingPortalRequest(BaseModel):
    email: str | None = None
    userId: str | None = None


def _verify_revenuecat_signature(payload_bytes: bytes, signature_header: str | None) -> None:
    secret = os.environ.get("REVENUECAT_WEBHOOK_SECRET")
    if not secret:
        return
    if not signature_header:
        raise HTTPException(status_code=401, detail="Missing RevenueCat signature")
    expected = hmac.new(secret.encode("utf-8"), payload_bytes, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, signature_header):
        raise HTTPException(status_code=401, detail="Invalid RevenueCat signature")


def _verify_airwallex_signature(payload_bytes: bytes, signature_header: str | None) -> None:
    secret = os.environ.get("AIRWALLEX_WEBHOOK_SECRET")
    if not secret:
        return
    if not signature_header:
        raise HTTPException(status_code=401, detail="Missing Airwallex signature")
    expected = hmac.new(secret.encode("utf-8"), payload_bytes, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, signature_header):
        raise HTTPException(status_code=401, detail="Invalid Airwallex signature")


def _get_site_url() -> str:
    return os.environ.get("PUBLIC_SITE_URL", "https://speakmeteor.win").rstrip("/")


def _get_stripe_client():
    secret = os.environ.get("STRIPE_SECRET_KEY")
    if not secret:
        raise HTTPException(status_code=503, detail="Web checkout is not enabled yet")
    stripe.api_key = secret
    return stripe


def _parse_stripe_event(payload_bytes: bytes, signature_header: str | None) -> dict:
    secret = os.environ.get("STRIPE_WEBHOOK_SECRET")
    raw_payload = payload_bytes.decode("utf-8") if payload_bytes else "{}"

    if secret:
        if not signature_header:
            raise HTTPException(status_code=401, detail="Missing Stripe signature")
        event = stripe.Webhook.construct_event(raw_payload, signature_header, secret)
        return event.to_dict_recursive()

    try:
        return json.loads(raw_payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid JSON payload") from exc


def _handle_revenuecat(payload: dict) -> dict:
    event = payload.get("event", {})
    event_type = event.get("type", "")
    event_id = event.get("id") or event.get("transaction_id") or f"revenuecat:{event_type}:{event.get('app_user_id', '')}"
    user_id = event.get("app_user_id")
    product_id = event.get("product_id")
    expiration = event.get("expiration_at_ms")
    period_end = None
    if expiration:
        period_end = expiration

    if not record_billing_event(
        supabase,
        provider="revenuecat",
        event_id=str(event_id),
        event_type=event_type,
        payload=payload,
        user_id=user_id,
        provider_subscription_id=product_id,
    ):
        return {"status": "duplicate", "provider": "revenuecat"}

    is_active = event_type in {"INITIAL_PURCHASE", "RENEWAL", "PRODUCT_CHANGE", "UNCANCELLATION"}
    is_inactive = event_type in {"CANCELLATION", "EXPIRATION", "BILLING_ISSUE", "SUBSCRIBER_ALIAS"}

    if user_id and (is_active or is_inactive):
        subscription_id = upsert_subscription(
            supabase,
            provider="revenuecat",
            provider_subscription_id=product_id or f"rc:{user_id}:pro",
            user_id=user_id,
            provider_customer_id=user_id,
            billing_email=None,
            status="active" if is_active else "expired",
            plan_code="pro",
            current_period_end=period_end,
            metadata={"event_type": event_type},
        )
        upsert_provider_reference(
            supabase,
            provider="revenuecat",
            reference_type="app_user_id",
            reference_value=user_id,
            user_id=user_id,
            metadata={"product_id": product_id},
        )
        set_pro_entitlement(
            supabase,
            user_id=user_id,
            active=is_active,
            source_provider="revenuecat",
            source_subscription_id=subscription_id,
            expires_at=period_end,
            metadata={"product_id": product_id, "event_type": event_type},
        )

    return {"status": "processed", "provider": "revenuecat", "event_type": event_type}


def _handle_airwallex(payload: dict) -> dict:
    event_type = payload.get("name", "")
    event_id = payload.get("id") or f"airwallex:{event_type}:{payload.get('data', {}).get('object', {}).get('id', '')}"
    data = payload.get("data", {}).get("object", {})
    user_id = data.get("metadata", {}).get("user_id")
    subscription_external_id = data.get("id") or data.get("subscription_id") or "unknown"
    customer_id = data.get("customer_id")
    billing_email = data.get("email") or data.get("customer_email")
    status_map = {
        "subscription.active": ("active", True),
        "subscription.activated": ("active", True),
        "subscription.updated": ("active", True),
        "subscription.canceled": ("canceled", False),
        "subscription.expired": ("expired", False),
        "subscription.payment_failed": ("past_due", False),
    }
    subscription_status, is_active = status_map.get(event_type, ("inactive", False))

    if not record_billing_event(
        supabase,
        provider="airwallex",
        event_id=str(event_id),
        event_type=event_type,
        payload=payload,
        user_id=user_id,
        provider_customer_id=customer_id,
        provider_subscription_id=subscription_external_id,
    ):
        return {"status": "duplicate", "provider": "airwallex"}

    subscription_id = upsert_subscription(
        supabase,
        provider="airwallex",
        provider_subscription_id=subscription_external_id,
        user_id=user_id,
        provider_customer_id=customer_id,
        billing_email=billing_email,
        status=subscription_status,
        plan_code=data.get("plan_code") or "pro",
        current_period_end=data.get("current_period_end"),
        canceled_at=data.get("canceled_at"),
        metadata={"raw_status": data.get("status"), "event_type": event_type},
    )
    upsert_provider_reference(
        supabase,
        provider="airwallex",
        reference_type="customer_id",
        reference_value=customer_id,
        user_id=user_id,
    )
    if user_id:
        set_pro_entitlement(
            supabase,
            user_id=user_id,
            active=is_active,
            source_provider="airwallex",
            source_subscription_id=subscription_id,
            expires_at=data.get("current_period_end"),
            metadata={"event_type": event_type},
        )

    return {"status": "processed", "provider": "airwallex", "event_type": event_type}


def _handle_stripe(payload: dict) -> dict:
    result = sync_stripe_event(supabase, payload)
    return {
        **result,
        "status": "duplicate" if result.get("duplicate") else "processed",
        "provider": "stripe",
        "event_type": payload.get("type", ""),
    }


@router.post("/checkout-session")
async def create_checkout_session(payload: CheckoutSessionRequest):
    if not payload.email.strip():
        raise HTTPException(status_code=400, detail="Email is required to start checkout")

    price_id = os.environ.get("STRIPE_ANNUAL_PRICE_ID")
    if not price_id:
        raise HTTPException(status_code=503, detail="Web checkout is not enabled yet")

    client = _get_stripe_client()
    site_url = _get_site_url()
    client_reference_id = str(uuid4())
    session = client.checkout.Session.create(
        {
            "mode": "subscription",
            "client_reference_id": client_reference_id,
            "payment_method_types": ["card"],
            "line_items": [{"price": price_id, "quantity": 1}],
            "subscription_data": {
                "trial_period_days": 7,
                "metadata": {
                    "plan": "annual",
                    "source": "web",
                    "billing_email": payload.email.strip(),
                    "internal_user_id": payload.userId or "",
                    "client_reference_id": client_reference_id,
                },
            },
            "success_url": f"{site_url}/success?session_id={{CHECKOUT_SESSION_ID}}",
            "cancel_url": f"{site_url}/subscribe",
            "allow_promotion_codes": True,
            "customer_creation": "always",
            "billing_address_collection": "auto",
            "customer_email": payload.email.strip(),
            "metadata": {
                "plan": "annual",
                "source": "web_landing",
                "billing_email": payload.email.strip(),
                "internal_user_id": payload.userId or "",
                "client_reference_id": client_reference_id,
            },
        }
    )
    return {"url": session.url, "clientReferenceId": client_reference_id}


@router.post("/portal-session")
async def create_billing_portal_session(payload: BillingPortalRequest):
    if not payload.email and not payload.userId:
        raise HTTPException(status_code=400, detail="email or userId is required")

    query = (
        supabase.table("subscriptions")
        .select("provider_customer_id, billing_email, user_id, status")
        .eq("provider", "stripe")
        .in_("status", ["trialing", "active", "past_due"])
        .order("updated_at", desc=True)
        .limit(1)
    )
    if payload.userId:
        query = query.eq("user_id", payload.userId)
    else:
        query = query.eq("billing_email", payload.email)

    result = query.execute()
    subscription = (result.data or [None])[0]
    customer_id = subscription.get("provider_customer_id") if subscription else None
    if not customer_id:
        raise HTTPException(status_code=404, detail="No active Stripe subscription found for this account")

    client = _get_stripe_client()
    session = client.billing_portal.Session.create(
        {
            "customer": customer_id,
            "return_url": f"{_get_site_url()}/subscribe",
        }
    )
    return {"url": session.url}


@router.post("/webhooks/{provider}")
async def provider_webhook(
    provider: str,
    request: Request,
    x_revenuecat_signature: str | None = Header(default=None, alias="X-RevenueCat-Signature"),
    x_airwallex_signature: str | None = Header(default=None, alias="X-Airwallex-Signature"),
    stripe_signature: str | None = Header(default=None, alias="Stripe-Signature"),
):
    payload_bytes = await request.body()

    if provider == "revenuecat":
        try:
            payload = json.loads(payload_bytes or b"{}")
        except ValueError as exc:
            raise HTTPException(status_code=400, detail="Invalid JSON payload") from exc
        _verify_revenuecat_signature(payload_bytes, x_revenuecat_signature)
        return _handle_revenuecat(payload)
    if provider == "airwallex":
        try:
            payload = json.loads(payload_bytes or b"{}")
        except ValueError as exc:
            raise HTTPException(status_code=400, detail="Invalid JSON payload") from exc
        _verify_airwallex_signature(payload_bytes, x_airwallex_signature)
        return _handle_airwallex(payload)
    if provider == "stripe":
        payload = _parse_stripe_event(payload_bytes, stripe_signature)
        return _handle_stripe(payload)

    raise HTTPException(status_code=404, detail="Unsupported billing provider")
