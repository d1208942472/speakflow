"""Notifications router — POST /notifications/send-reminders (admin-triggered)"""
import os
from fastapi import APIRouter, HTTPException, Header
from typing import Optional

from dependencies import supabase
from services.notifications import send_daily_reminders

router = APIRouter(prefix="/notifications", tags=["notifications"])


def _verify_admin_secret(secret: Optional[str]) -> None:
    """Verify X-Admin-Secret header against ADMIN_SECRET env var."""
    admin_secret = os.environ.get("ADMIN_SECRET")
    if not admin_secret:
        # If no secret configured, allow (dev mode)
        return
    if secret != admin_secret:
        raise HTTPException(
            status_code=401,
            detail="Invalid or missing X-Admin-Secret header",
        )


@router.post("/send-reminders")
async def send_daily_reminder_notifications(
    x_admin_secret: Optional[str] = Header(default=None, alias="X-Admin-Secret"),
):
    """
    Trigger daily reminder push notifications to all users who haven't practiced today.
    Protected by X-Admin-Secret header (set ADMIN_SECRET env var).
    Intended to be called by a cron job (e.g., Railway cron, GitHub Actions).
    """
    _verify_admin_secret(x_admin_secret)

    result = await send_daily_reminders(supabase)

    return {
        "status": "completed",
        "sent": result.get("sent", 0),
        "skipped": result.get("skipped", 0),
        "total_users": result.get("total_users", 0),
        "error": result.get("error"),
    }
