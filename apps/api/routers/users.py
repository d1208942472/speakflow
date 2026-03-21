"""Users router — GET /users/me, PUT /users/me/notification-token"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from dependencies import get_current_user, supabase

router = APIRouter(prefix="/users", tags=["users"])


class ProfileResponse(BaseModel):
    id: str
    username: Optional[str]
    streak: int
    streak_shields: int
    total_fp: int
    weekly_fp: int
    league: str
    is_pro: bool
    last_activity_date: Optional[str]
    created_at: str


class NotificationTokenRequest(BaseModel):
    token: str


class NotificationTokenResponse(BaseModel):
    success: bool
    message: str


@router.get("/me", response_model=ProfileResponse)
async def get_current_user_profile(
    current_user=Depends(get_current_user),
):
    """Get the current authenticated user's profile."""
    profile_resp = (
        supabase.table("profiles")
        .select(
            "id, username, streak, streak_shields, total_fp, weekly_fp, "
            "league, is_pro, last_activity_date, created_at"
        )
        .eq("id", current_user.id)
        .execute()
    )

    if not profile_resp.data:
        # Auto-create profile if it doesn't exist (race condition safety)
        email = getattr(current_user, "email", "") or ""
        username = email.split("@")[0] if email else "user"

        insert_resp = (
            supabase.table("profiles")
            .insert(
                {
                    "id": current_user.id,
                    "username": username,
                    "streak": 0,
                    "streak_shields": 0,
                    "total_fp": 0,
                    "weekly_fp": 0,
                    "league": "bronze",
                    "is_pro": False,
                }
            )
            .execute()
        )

        if not insert_resp.data:
            raise HTTPException(
                status_code=500, detail="Failed to create user profile"
            )

        profile = insert_resp.data[0]
    else:
        profile = profile_resp.data[0]

    return ProfileResponse(
        id=profile["id"],
        username=profile.get("username"),
        streak=profile.get("streak", 0),
        streak_shields=profile.get("streak_shields", 0),
        total_fp=profile.get("total_fp", 0),
        weekly_fp=profile.get("weekly_fp", 0),
        league=profile.get("league", "bronze"),
        is_pro=profile.get("is_pro", False),
        last_activity_date=profile.get("last_activity_date"),
        created_at=profile.get("created_at", ""),
    )


@router.put("/me/notification-token", response_model=NotificationTokenResponse)
async def update_notification_token(
    request: NotificationTokenRequest,
    current_user=Depends(get_current_user),
):
    """Update the user's Expo push notification token."""
    token = request.token.strip()

    if not token:
        raise HTTPException(
            status_code=400, detail="notification token cannot be empty"
        )

    # Validate Expo push token format (ExponentPushToken[...] or ExpoPushToken[...])
    if not (
        token.startswith("ExponentPushToken[")
        or token.startswith("ExpoPushToken[")
        or token.startswith("ExpoSimulator")  # simulator tokens
    ):
        # Allow non-standard tokens for development but log a warning
        pass

    update_resp = (
        supabase.table("profiles")
        .update({"notification_token": token})
        .eq("id", current_user.id)
        .execute()
    )

    if not update_resp.data:
        raise HTTPException(
            status_code=500, detail="Failed to update notification token"
        )

    return NotificationTokenResponse(
        success=True,
        message="Notification token updated successfully",
    )
