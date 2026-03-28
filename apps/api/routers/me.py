"""Current-user entitlement and quota endpoints."""
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from dependencies import get_current_user, supabase
from services.access_control import get_daily_quota, list_entitlements

router = APIRouter(prefix="/me", tags=["me"])


class EntitlementItem(BaseModel):
    entitlement_key: str
    status: str
    source_provider: str
    expires_at: str | None = None
    metadata: dict = {}


class EntitlementsResponse(BaseModel):
    entitlements: list[EntitlementItem]
    has_pro: bool
    billing_provider: str | None = None


class QuotaResponse(BaseModel):
    has_pro: bool
    is_unlimited: bool
    daily_session_limit: int | None = None
    used_today: int
    remaining_today: int | None = None
    resets_at: str


@router.get("/entitlements", response_model=EntitlementsResponse)
async def get_my_entitlements(current_user=Depends(get_current_user)):
    entitlements = list_entitlements(supabase, current_user.id)
    active = [
        EntitlementItem(
            entitlement_key=item["entitlement_key"],
            status=item["status"],
            source_provider=item["source_provider"],
            expires_at=item.get("expires_at"),
            metadata=item.get("metadata") or {},
        )
        for item in entitlements
    ]
    active_providers = [item.source_provider for item in active if item.status == "active"]
    return EntitlementsResponse(
        entitlements=active,
        has_pro=any(item.entitlement_key == "pro" and item.status == "active" for item in active),
        billing_provider=active_providers[0] if active_providers else None,
    )


@router.get("/quota", response_model=QuotaResponse)
async def get_my_quota(current_user=Depends(get_current_user)):
    return QuotaResponse(**get_daily_quota(supabase, current_user.id))
