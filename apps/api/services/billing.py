"""Billing helpers shared across provider webhooks and checkout flows."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Iterable

from supabase import Client

from services.access_control import PRO_ENTITLEMENT_KEY


def record_billing_event(
    db: Client,
    *,
    provider: str,
    event_id: str,
    event_type: str,
    payload: dict[str, Any],
    user_id: str | None = None,
    provider_customer_id: str | None = None,
    provider_subscription_id: str | None = None,
    status: str = "processed",
) -> bool:
    """Return False when the event was already seen."""
    existing = (
        db.table("billing_events")
        .select("id")
        .eq("provider", provider)
        .eq("event_id", event_id)
        .execute()
    )
    if existing.data:
        return False

    db.table("billing_events").insert(
        {
            "provider": provider,
            "event_id": event_id,
            "event_type": event_type,
            "user_id": user_id,
            "provider_customer_id": provider_customer_id,
            "provider_subscription_id": provider_subscription_id,
            "payload": payload,
            "status": status,
        }
    ).execute()
    return True


def upsert_provider_reference(
    db: Client,
    *,
    provider: str,
    reference_type: str,
    reference_value: str | None,
    user_id: str | None,
    metadata: dict[str, Any] | None = None,
) -> None:
    if not reference_value:
        return

    existing = (
        db.table("provider_references")
        .select("id")
        .eq("provider", provider)
        .eq("reference_type", reference_type)
        .eq("reference_value", reference_value)
        .execute()
    )
    payload = {
        "provider": provider,
        "reference_type": reference_type,
        "reference_value": reference_value,
        "user_id": user_id,
        "metadata": metadata or {},
    }
    if existing.data:
        db.table("provider_references").update(payload).eq("id", existing.data[0]["id"]).execute()
    else:
        db.table("provider_references").insert(payload).execute()


def upsert_subscription(
    db: Client,
    *,
    provider: str,
    provider_subscription_id: str,
    user_id: str | None,
    provider_customer_id: str | None,
    billing_email: str | None,
    status: str,
    plan_code: str = "pro",
    current_period_end: str | None = None,
    canceled_at: str | None = None,
    metadata: dict[str, Any] | None = None,
) -> str:
    existing = (
        db.table("subscriptions")
        .select("id")
        .eq("provider", provider)
        .eq("provider_subscription_id", provider_subscription_id)
        .execute()
    )
    payload = {
        "provider": provider,
        "provider_subscription_id": provider_subscription_id,
        "user_id": user_id,
        "provider_customer_id": provider_customer_id,
        "billing_email": billing_email,
        "status": status,
        "plan_code": plan_code,
        "current_period_end": current_period_end,
        "canceled_at": canceled_at,
        "metadata": metadata or {},
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    if existing.data:
        db.table("subscriptions").update(payload).eq("id", existing.data[0]["id"]).execute()
        return existing.data[0]["id"]

    insert = db.table("subscriptions").insert(payload).execute()
    return insert.data[0]["id"]


def set_pro_entitlement(
    db: Client,
    *,
    user_id: str,
    active: bool,
    source_provider: str,
    source_subscription_id: str | None = None,
    expires_at: str | None = None,
    metadata: dict[str, Any] | None = None,
) -> None:
    existing = (
        db.table("entitlements")
        .select("id")
        .eq("user_id", user_id)
        .eq("entitlement_key", PRO_ENTITLEMENT_KEY)
        .execute()
    )

    payload = {
        "user_id": user_id,
        "entitlement_key": PRO_ENTITLEMENT_KEY,
        "source_provider": source_provider,
        "source_subscription_id": source_subscription_id,
        "status": "active" if active else "inactive",
        "expires_at": expires_at,
        "metadata": metadata or {},
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    if existing.data:
        db.table("entitlements").update(payload).eq("id", existing.data[0]["id"]).execute()
    else:
        db.table("entitlements").insert(payload).execute()

    db.table("profiles").update({"is_pro": active}).eq("id", user_id).execute()


def _normalize_timestamp(value: Any) -> str | None:
    if value in (None, "", 0):
        return None
    if isinstance(value, str):
        return value
    if isinstance(value, (int, float)):
        return datetime.fromtimestamp(float(value), tz=timezone.utc).isoformat()
    return None


def _extract_users(result: Any) -> Iterable[Any]:
    if result is None:
        return []
    if isinstance(result, dict):
        for key in ("users", "data"):
            users = result.get(key)
            if isinstance(users, list):
                return users
        return []
    for key in ("users", "data"):
        users = getattr(result, key, None)
        if isinstance(users, list):
            return users
    return []


def find_user_id_by_email(db: Client, email: str | None) -> str | None:
    if not email:
        return None

    try:
        auth = getattr(db, "auth", None)
        admin = getattr(auth, "admin", None) if auth else None
        list_users = getattr(admin, "list_users", None) if admin else None
        if not callable(list_users):
            return None

        for user in _extract_users(list_users()):
            candidate_email = getattr(user, "email", None)
            candidate_id = getattr(user, "id", None)
            if isinstance(user, dict):
                candidate_email = candidate_email or user.get("email")
                candidate_id = candidate_id or user.get("id")
            if candidate_email == email:
                return candidate_id
    except Exception:
        return None

    return None


def sync_stripe_event(db: Client, event: dict[str, Any]) -> dict[str, Any]:
    event_id = event.get("id", "")
    event_type = event.get("type", "")
    data = event.get("data", {}).get("object", {})

    billing_email = None
    provider_customer_id = None
    provider_subscription_id = None
    user_id = None
    status = "inactive"
    expires_at = None
    canceled_at = None

    if event_type == "checkout.session.completed":
        billing_email = data.get("customer_email") or data.get("customer_details", {}).get("email")
        provider_customer_id = data.get("customer")
        provider_subscription_id = data.get("subscription")
        metadata = data.get("metadata", {}) or {}
        user_id = metadata.get("internal_user_id") or None
        status = "active"
    elif event_type in {
        "customer.subscription.updated",
        "customer.subscription.deleted",
        "invoice.payment_failed",
        "invoice.payment_succeeded",
    }:
        provider_customer_id = data.get("customer")
        provider_subscription_id = data.get("id") or data.get("subscription")
        metadata = data.get("metadata", {}) or {}
        billing_email = metadata.get("billing_email") or data.get("customer_email")
        user_id = metadata.get("internal_user_id") or None
        status = (
            "canceled"
            if event_type == "customer.subscription.deleted"
            else "past_due"
            if event_type == "invoice.payment_failed"
            else data.get("status", "active")
        )
        expires_at = _normalize_timestamp(data.get("current_period_end"))
        canceled_at = _normalize_timestamp(data.get("canceled_at"))

    if not user_id and billing_email:
        user_id = find_user_id_by_email(db, billing_email)

    if not record_billing_event(
        db,
        provider="stripe",
        event_id=event_id,
        event_type=event_type,
        payload=event,
        user_id=user_id,
        provider_customer_id=provider_customer_id,
        provider_subscription_id=provider_subscription_id,
    ):
        return {"duplicate": True}

    if provider_customer_id:
        upsert_provider_reference(
            db,
            provider="stripe",
            reference_type="customer_id",
            reference_value=provider_customer_id,
            user_id=user_id,
            metadata={"billing_email": billing_email} if billing_email else {},
        )

    if not provider_subscription_id:
        return {"duplicate": False, "linked_user_id": user_id, "status": status}

    subscription_id = upsert_subscription(
        db,
        provider="stripe",
        provider_subscription_id=provider_subscription_id,
        user_id=user_id,
        provider_customer_id=provider_customer_id,
        billing_email=billing_email,
        status=status,
        plan_code="pro",
        current_period_end=expires_at,
        canceled_at=canceled_at,
        metadata={"event_type": event_type},
    )

    if user_id:
        set_pro_entitlement(
            db,
            user_id=user_id,
            active=status in {"active", "trialing"},
            source_provider="stripe",
            source_subscription_id=subscription_id,
            expires_at=expires_at,
            metadata={"event_type": event_type, "billing_email": billing_email},
        )

    return {"duplicate": False, "linked_user_id": user_id, "status": status}
