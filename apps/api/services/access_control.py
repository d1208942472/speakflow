"""Access control, entitlement, and free-tier quota helpers."""
from __future__ import annotations

from datetime import date, datetime, time, timedelta, timezone
from typing import Any

from supabase import Client

FREE_SCENARIOS = {"job_interview", "presentation", "small_talk"}
FREE_DAILY_SESSION_LIMIT = 5
PRO_ENTITLEMENT_KEY = "pro"


def ensure_profile(db: Client, user: Any) -> dict[str, Any]:
    """Fetch the profile or create a minimal profile on first access."""
    profile_resp = (
        db.table("profiles")
        .select("*")
        .eq("id", user.id)
        .execute()
    )
    if profile_resp.data:
        return profile_resp.data[0]

    email = getattr(user, "email", "") or ""
    username = email.split("@")[0] if email else "user"
    insert_resp = (
        db.table("profiles")
        .insert(
            {
                "id": user.id,
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
    return insert_resp.data[0]


def list_entitlements(db: Client, user_id: str) -> list[dict[str, Any]]:
    resp = (
        db.table("entitlements")
        .select(
            "id, entitlement_key, status, source_provider, expires_at, "
            "metadata, updated_at"
        )
        .eq("user_id", user_id)
        .order("updated_at", desc=True)
        .execute()
    )
    entitlements = resp.data or []

    if entitlements:
        return entitlements

    profile_resp = (
        db.table("profiles")
        .select("is_pro")
        .eq("id", user_id)
        .execute()
    )
    is_pro = bool(profile_resp.data and profile_resp.data[0].get("is_pro"))
    if not is_pro:
        return []

    return [
        {
            "id": None,
            "entitlement_key": PRO_ENTITLEMENT_KEY,
            "status": "active",
            "source_provider": "system",
            "expires_at": None,
            "metadata": {"legacy_profile_flag": True},
            "updated_at": None,
        }
    ]


def has_active_pro(db: Client, user_id: str) -> bool:
    now_iso = datetime.now(timezone.utc).isoformat()
    entitlements = list_entitlements(db, user_id)
    for entitlement in entitlements:
        if entitlement.get("entitlement_key") != PRO_ENTITLEMENT_KEY:
            continue
        if entitlement.get("status") != "active":
            continue
        expires_at = entitlement.get("expires_at")
        if expires_at and expires_at <= now_iso:
            continue
        return True
    return False


def lesson_requires_pro(lesson: dict[str, Any]) -> bool:
    return bool(
        lesson.get("is_pro_only") or lesson.get("scenario") not in FREE_SCENARIOS
    )


def describe_lesson_access(
    lesson: dict[str, Any],
    has_pro: bool,
) -> dict[str, Any]:
    requires_pro = lesson_requires_pro(lesson)
    can_access = has_pro or not requires_pro

    lock_reason = None
    if not can_access:
        if lesson.get("is_pro_only"):
            lock_reason = "Upgrade to Pro to unlock this lesson."
        elif lesson.get("scenario") not in FREE_SCENARIOS:
            lock_reason = "Free tier includes 3 scenarios. Upgrade to unlock this scenario."
        else:
            lock_reason = "Upgrade to Pro to unlock this lesson."

    return {
        "requires_pro": requires_pro,
        "can_access": can_access,
        "lock_reason": lock_reason,
    }


def get_daily_quota(db: Client, user_id: str) -> dict[str, Any]:
    today = date.today()
    start = datetime.combine(today, time.min).isoformat()
    end = datetime.combine(today + timedelta(days=1), time.min).isoformat()
    used_resp = (
        db.table("session_results")
        .select("id, completed_at")
        .eq("user_id", user_id)
        .gte("completed_at", start)
        .lt("completed_at", end)
        .execute()
    )
    used_today = len(used_resp.data or [])
    is_pro = has_active_pro(db, user_id)
    remaining = None if is_pro else max(0, FREE_DAILY_SESSION_LIMIT - used_today)
    return {
        "has_pro": is_pro,
        "is_unlimited": is_pro,
        "daily_session_limit": None if is_pro else FREE_DAILY_SESSION_LIMIT,
        "used_today": used_today,
        "remaining_today": remaining,
        "resets_at": end,
    }
