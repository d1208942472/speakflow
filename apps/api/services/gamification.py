"""Streak + FP + League engine — mirrors Duolingo mechanics"""
from datetime import date, timedelta
from supabase import Client
from pydantic import BaseModel


class GamificationResult(BaseModel):
    fp_earned: int
    new_total_fp: int
    new_weekly_fp: int
    streak_updated: bool
    new_streak: int
    streak_broken: bool
    shield_consumed: bool
    league_rank: int
    level_up_message: str | None = None


LEAGUE_ORDER = ["bronze", "silver", "gold", "platinum", "diamond"]

# FP thresholds to move up a league (weekly FP)
LEAGUE_PROMOTION_THRESHOLD = 300
LEAGUE_DEMOTION_THRESHOLD = 50


def _get_week_start(d: date) -> date:
    """Get the Monday of the week for the given date."""
    return d - timedelta(days=d.weekday())


def _next_league(current: str) -> str | None:
    """Return the next league above current, or None if already diamond."""
    idx = LEAGUE_ORDER.index(current) if current in LEAGUE_ORDER else 0
    if idx < len(LEAGUE_ORDER) - 1:
        return LEAGUE_ORDER[idx + 1]
    return None


def _prev_league(current: str) -> str | None:
    """Return the league below current, or None if already bronze."""
    idx = LEAGUE_ORDER.index(current) if current in LEAGUE_ORDER else 0
    if idx > 0:
        return LEAGUE_ORDER[idx - 1]
    return None


class GamificationService:
    def __init__(self, supabase: Client):
        self.db = supabase

    def process_session_completion(
        self,
        user_id: str,
        base_fp: int,
        pronunciation_score: float,
        nim_fp_multiplier: float,
    ) -> GamificationResult:
        """
        Process a completed lesson session:
        1. Load profile
        2. Compute FP: max(1, int(base_fp * max(0.5, score/100) * nim_multiplier))
        3. Streak logic: today vs yesterday vs shield
        4. Update profile (streak, shields, total_fp, weekly_fp, last_activity_date)
        5. Upsert league_standings
        6. Get league rank
        7. Return GamificationResult
        """
        today = date.today()

        # 1. Load profile
        profile_resp = (
            self.db.table("profiles")
            .select("*")
            .eq("id", user_id)
            .single()
            .execute()
        )
        profile = profile_resp.data
        if not profile:
            raise ValueError(f"Profile not found for user {user_id}")

        # 2. Compute FP
        score_factor = max(0.5, pronunciation_score / 100.0)
        fp_earned = max(1, int(base_fp * score_factor * nim_fp_multiplier))

        # 3. Streak logic
        current_streak = profile.get("streak", 0)
        streak_shields = profile.get("streak_shields", 0)
        last_activity = profile.get("last_activity_date")
        streak_updated = False
        streak_broken = False
        shield_consumed = False

        if last_activity is None:
            # First activity ever
            current_streak = 1
            streak_updated = True
        else:
            # Parse last activity date
            if isinstance(last_activity, str):
                last_activity_date = date.fromisoformat(last_activity)
            else:
                last_activity_date = last_activity

            days_since = (today - last_activity_date).days

            if days_since == 0:
                # Already active today, no streak change
                streak_updated = False
            elif days_since == 1:
                # Consecutive day — extend streak
                current_streak += 1
                streak_updated = True
            elif days_since == 2 and streak_shields > 0:
                # Missed one day but shield saves streak
                current_streak += 1
                streak_shields -= 1
                streak_updated = True
                shield_consumed = True
            else:
                # Streak broken
                streak_broken = True
                current_streak = 1
                streak_updated = True

        # Streak shield reward: earn a shield every 7-day streak milestone
        if current_streak > 0 and current_streak % 7 == 0 and streak_updated:
            streak_shields = min(3, streak_shields + 1)

        # 4. Update profile
        total_fp = profile.get("total_fp", 0) + fp_earned
        weekly_fp = profile.get("weekly_fp", 0) + fp_earned

        update_data = {
            "streak": current_streak,
            "streak_shields": streak_shields,
            "total_fp": total_fp,
            "weekly_fp": weekly_fp,
            "last_activity_date": today.isoformat(),
        }

        self.db.table("profiles").update(update_data).eq("id", user_id).execute()

        # 5. Upsert league_standings
        week_start = _get_week_start(today)
        current_league = profile.get("league", "bronze")

        existing_standing = (
            self.db.table("league_standings")
            .select("*")
            .eq("user_id", user_id)
            .eq("week_start", week_start.isoformat())
            .execute()
        )

        if existing_standing.data:
            standing = existing_standing.data[0]
            new_weekly_standing_fp = standing.get("weekly_fp", 0) + fp_earned
            self.db.table("league_standings").update(
                {"weekly_fp": new_weekly_standing_fp}
            ).eq("id", standing["id"]).execute()
        else:
            self.db.table("league_standings").insert(
                {
                    "user_id": user_id,
                    "week_start": week_start.isoformat(),
                    "league": current_league,
                    "weekly_fp": fp_earned,
                    "rank": None,
                    "promoted": False,
                    "demoted": False,
                }
            ).execute()

        # 6. Get league rank (rank by weekly_fp within same league and week)
        standings_resp = (
            self.db.table("league_standings")
            .select("user_id, weekly_fp")
            .eq("week_start", week_start.isoformat())
            .eq("league", current_league)
            .order("weekly_fp", desc=True)
            .execute()
        )

        league_rank = 1
        standings_list = standings_resp.data or []
        for i, entry in enumerate(standings_list):
            if entry["user_id"] == user_id:
                league_rank = i + 1
                break

        # Update rank in standings
        self.db.table("league_standings").update({"rank": league_rank}).eq(
            "user_id", user_id
        ).eq("week_start", week_start.isoformat()).execute()

        # 7. Generate level-up message if applicable
        level_up_message = None
        if streak_updated and not streak_broken:
            if current_streak % 7 == 0:
                level_up_message = (
                    f"Amazing! {current_streak}-day streak! You've earned a Streak Shield!"
                )
            elif current_streak % 30 == 0:
                level_up_message = (
                    f"Incredible! {current_streak}-day streak! You're on fire!"
                )
        if streak_broken:
            level_up_message = (
                "Streak reset! Don't worry, every expert was once a beginner. Start a new streak today!"
            )

        return GamificationResult(
            fp_earned=fp_earned,
            new_total_fp=total_fp,
            new_weekly_fp=weekly_fp,
            streak_updated=streak_updated,
            new_streak=current_streak,
            streak_broken=streak_broken,
            shield_consumed=shield_consumed,
            league_rank=league_rank,
            level_up_message=level_up_message,
        )
