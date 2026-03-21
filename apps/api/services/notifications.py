"""Expo Push Notifications service — Max the AI coach personality"""
import httpx
from datetime import date, timedelta
from supabase import Client

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"

# Max the AI coach personality strings
MAX_STREAK_REMINDERS = [
    "Hey! Max here. Your streak is calling — don't let it down today! 🔥",
    "Max here! One practice session keeps your streak alive. 5 minutes, that's all!",
    "It's Max! Your business English skills are getting rusty. Time to practice!",
    "Max reminder: Consistency beats perfection. Keep that streak going!",
    "Don't break the chain! Max believes in you — quick lesson today?",
]

MAX_ENCOURAGEMENT_MESSAGES = [
    "Max here! You're crushing it! Your pronunciation is improving every day.",
    "Amazing work! Max is proud of your dedication to professional English.",
    "You're in the top 10% of your league! Keep pushing — Max is watching!",
    "Your hard work is paying off. Native-level fluency is within reach!",
    "Max says: Every expert was once a beginner. You're on the right path!",
]

MAX_RETURN_MESSAGES = [
    "Miss me? Max here! Your business English coach is ready. Let's practice!",
    "Hey, long time no see! Max has new lessons waiting for you.",
    "Max here! Your colleagues are improving their English. Don't fall behind!",
    "It's been a while! Max missed you — come back and practice your English!",
    "Ready for your next lesson? Max has something special prepared for you.",
]


async def send_push_notification(
    token: str,
    title: str,
    body: str,
    data: dict | None = None,
) -> dict:
    """Send a push notification via Expo Push API."""
    payload = {
        "to": token,
        "title": title,
        "body": body,
        "sound": "default",
        "badge": 1,
        "data": data or {},
        "channelId": "speakflow-reminders",
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.post(
                EXPO_PUSH_URL,
                json=payload,
                headers={
                    "Accept": "application/json",
                    "Accept-Encoding": "gzip, deflate",
                    "Content-Type": "application/json",
                },
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            return {
                "error": f"Push notification failed: {e.response.status_code}",
                "detail": e.response.text,
            }
        except httpx.RequestError as e:
            return {"error": f"Push notification connection error: {e}"}


async def send_daily_reminders(supabase_client: Client) -> dict:
    """
    Send daily reminders to users who:
    1. Have not practiced today (streak at risk)
    2. Have a notification_token set
    Returns summary of notifications sent.
    """
    today = date.today()
    yesterday = today - timedelta(days=1)

    # Fetch users with tokens who were active yesterday or have a streak > 0
    # but have NOT been active today
    try:
        users_resp = (
            supabase_client.table("profiles")
            .select("id, username, streak, last_activity_date, notification_token")
            .not_.is_("notification_token", "null")
            .neq("notification_token", "")
            .execute()
        )
        users = users_resp.data or []
    except Exception as e:
        return {"error": str(e), "sent": 0, "skipped": 0}

    sent_count = 0
    skipped_count = 0

    import random

    for user in users:
        token = user.get("notification_token")
        if not token:
            skipped_count += 1
            continue

        last_activity = user.get("last_activity_date")
        streak = user.get("streak", 0)
        username = user.get("username", "there")

        if last_activity is None:
            # Never practiced — send return message
            msg = random.choice(MAX_RETURN_MESSAGES)
            title = "Start Your English Journey!"
            body = msg
        else:
            if isinstance(last_activity, str):
                last_activity_date = date.fromisoformat(last_activity)
            else:
                last_activity_date = last_activity

            days_since = (today - last_activity_date).days

            if days_since == 0:
                # Already practiced today — skip
                skipped_count += 1
                continue
            elif days_since == 1 and streak > 0:
                # At risk of losing streak
                msg = random.choice(MAX_STREAK_REMINDERS)
                title = f"Your {streak}-day streak is at risk!"
                body = msg
            elif days_since <= 3:
                # Recently inactive — encouragement
                msg = random.choice(MAX_ENCOURAGEMENT_MESSAGES)
                title = "Time to practice, " + username + "!"
                body = msg
            else:
                # Long absence — return message
                msg = random.choice(MAX_RETURN_MESSAGES)
                title = "Max misses you!"
                body = msg

        result = await send_push_notification(
            token=token,
            title=title,
            body=body,
            data={
                "type": "daily_reminder",
                "streak": streak,
                "userId": user["id"],
            },
        )

        if "error" not in result:
            sent_count += 1
        else:
            skipped_count += 1

    return {
        "sent": sent_count,
        "skipped": skipped_count,
        "total_users": len(users),
    }
