"""Webhooks router — POST /webhooks/revenuecat (updates is_pro)"""
from fastapi import APIRouter, Request, Header
from typing import Optional

from routers.billing import provider_webhook

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


@router.post("/revenuecat")
async def revenuecat_webhook(
    request: Request,
    authorization: Optional[str] = Header(default=None),
    x_revenuecat_signature: Optional[str] = Header(default=None, alias="X-RevenueCat-Signature"),
):
    """Backward-compatible alias for the unified billing route."""
    return await provider_webhook(
        provider="revenuecat",
        request=request,
        x_revenuecat_signature=x_revenuecat_signature,
    )


@router.post("/stripe")
async def stripe_webhook(
    request: Request,
    stripe_signature: Optional[str] = Header(default=None, alias="Stripe-Signature"),
):
    """Backward-compatible alias for the unified Stripe route."""
    return await provider_webhook(
        provider="stripe",
        request=request,
        stripe_signature=stripe_signature,
    )
