"""Webhooks router — POST /webhooks/revenuecat (updates is_pro)"""
import hmac
import hashlib
import os
from fastapi import APIRouter, Request, HTTPException, Header
from pydantic import BaseModel
from typing import Optional

from dependencies import supabase

router = APIRouter(prefix="/webhooks", tags=["webhooks"])

# RevenueCat event types that grant Pro access
PRO_GRANTING_EVENTS = {
    "INITIAL_PURCHASE",
    "RENEWAL",
    "PRODUCT_CHANGE",
    "UNCANCELLATION",
}

# RevenueCat event types that revoke Pro access
PRO_REVOKING_EVENTS = {
    "CANCELLATION",
    "EXPIRATION",
    "BILLING_ISSUE",
    "SUBSCRIBER_ALIAS",
}


class RevenueCatWebhookPayload(BaseModel):
    event: dict
    api_version: Optional[str] = None


def _verify_revenuecat_signature(
    payload_bytes: bytes,
    signature_header: Optional[str],
    webhook_secret: Optional[str],
) -> bool:
    """Verify RevenueCat webhook signature using HMAC-SHA256."""
    if not webhook_secret:
        # If no secret configured, skip verification (development mode)
        return True

    if not signature_header:
        return False

    expected = hmac.new(
        webhook_secret.encode("utf-8"),
        payload_bytes,
        hashlib.sha256,
    ).hexdigest()

    return hmac.compare_digest(expected, signature_header)


@router.post("/revenuecat")
async def revenuecat_webhook(
    request: Request,
    authorization: Optional[str] = Header(default=None),
):
    """
    Handle RevenueCat webhook events to update user Pro status.
    Supports INITIAL_PURCHASE, RENEWAL, CANCELLATION, EXPIRATION events.
    """
    payload_bytes = await request.body()

    # Optional signature verification
    webhook_secret = os.environ.get("REVENUECAT_WEBHOOK_SECRET")
    rc_signature = request.headers.get("X-RevenueCat-Signature")

    if webhook_secret and not _verify_revenuecat_signature(
        payload_bytes, rc_signature, webhook_secret
    ):
        raise HTTPException(
            status_code=401, detail="Invalid webhook signature"
        )

    try:
        import json
        payload = json.loads(payload_bytes)
    except (json.JSONDecodeError, ValueError):
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    event = payload.get("event", {})
    event_type = event.get("type", "")
    app_user_id = event.get("app_user_id", "")
    product_id = event.get("product_id", "")

    if not app_user_id:
        raise HTTPException(
            status_code=400, detail="Missing app_user_id in webhook payload"
        )

    # Determine Pro status change
    if event_type in PRO_GRANTING_EVENTS:
        is_pro = True
    elif event_type in PRO_REVOKING_EVENTS:
        is_pro = False
    else:
        # Unknown event type — acknowledge but don't update
        return {
            "status": "acknowledged",
            "event_type": event_type,
            "action": "no_update",
        }

    # Update profile
    update_resp = (
        supabase.table("profiles")
        .update({"is_pro": is_pro})
        .eq("id", app_user_id)
        .execute()
    )

    if not update_resp.data:
        # User might not have a profile yet — try to find by auth
        # This handles cases where the webhook fires before profile creation
        return {
            "status": "acknowledged",
            "event_type": event_type,
            "action": "profile_not_found",
            "app_user_id": app_user_id,
        }

    action = "pro_granted" if is_pro else "pro_revoked"

    return {
        "status": "success",
        "event_type": event_type,
        "action": action,
        "app_user_id": app_user_id,
        "product_id": product_id,
        "is_pro": is_pro,
    }
