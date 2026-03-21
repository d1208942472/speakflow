"""Leagues router — GET /leagues/standings (weekly leaderboard)"""
from datetime import date, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from dependencies import get_current_user, supabase

router = APIRouter(prefix="/leagues", tags=["leagues"])


def _get_week_start(d: date) -> date:
    """Get Monday of the week for the given date."""
    return d - timedelta(days=d.weekday())


class LeagueEntry(BaseModel):
    rank: int
    user_id: str
    username: Optional[str]
    weekly_fp: int
    streak: int
    league: str
    is_current_user: bool


class LeagueStandingsResponse(BaseModel):
    week_start: str
    league: str
    standings: list[LeagueEntry]
    current_user_rank: int
    current_user_weekly_fp: int
    total_participants: int
    promotion_zone_cutoff: int
    demotion_zone_cutoff: int


@router.get("/standings", response_model=LeagueStandingsResponse)
async def get_league_standings(
    week_offset: int = Query(
        default=0,
        ge=-4,
        le=0,
        description="Week offset from current week (0 = current, -1 = last week)",
    ),
    current_user=Depends(get_current_user),
):
    """
    Get weekly league leaderboard for the current user's league.
    Returns top standings with promotion/demotion zone indicators.
    """
    # Get user's profile for league info
    profile_resp = (
        supabase.table("profiles")
        .select("id, username, league, streak, weekly_fp")
        .eq("id", current_user.id)
        .execute()
    )

    if not profile_resp.data:
        raise HTTPException(status_code=404, detail="User profile not found")

    profile = profile_resp.data[0]
    user_league = profile.get("league", "bronze")

    # Calculate week start
    today = date.today()
    current_week_start = _get_week_start(today)
    target_week_start = current_week_start + timedelta(weeks=week_offset)

    # Get all standings for this week + league
    standings_resp = (
        supabase.table("league_standings")
        .select("user_id, weekly_fp, league, rank")
        .eq("week_start", target_week_start.isoformat())
        .eq("league", user_league)
        .order("weekly_fp", desc=True)
        .limit(100)
        .execute()
    )

    standings_data = standings_resp.data or []

    # If current week and user not yet in standings, add them virtually
    user_in_standings = any(s["user_id"] == current_user.id for s in standings_data)

    if not user_in_standings and week_offset == 0:
        # Add user to standings if they have weekly FP
        user_weekly_fp = profile.get("weekly_fp", 0)
        if user_weekly_fp > 0:
            standings_data.append(
                {
                    "user_id": current_user.id,
                    "weekly_fp": user_weekly_fp,
                    "league": user_league,
                    "rank": None,
                }
            )
            # Re-sort after insertion
            standings_data.sort(key=lambda x: x.get("weekly_fp", 0), reverse=True)

    # Fetch usernames and streaks for all users in standings
    if standings_data:
        user_ids = [s["user_id"] for s in standings_data]
        profiles_resp = (
            supabase.table("profiles")
            .select("id, username, streak")
            .in_("id", user_ids)
            .execute()
        )
        profiles_map = {
            p["id"]: p for p in (profiles_resp.data or [])
        }
    else:
        profiles_map = {}

    # Build standings list with proper ranks
    total = len(standings_data)
    promotion_cutoff = max(1, int(total * 0.2))  # Top 20% get promoted
    demotion_cutoff = max(1, total - int(total * 0.2))  # Bottom 20% get demoted

    current_user_rank = total + 1
    current_user_weekly_fp = profile.get("weekly_fp", 0)

    league_entries = []
    for rank_idx, standing in enumerate(standings_data, start=1):
        uid = standing["user_id"]
        user_profile = profiles_map.get(uid, {})
        is_current = uid == current_user.id

        if is_current:
            current_user_rank = rank_idx
            current_user_weekly_fp = standing.get("weekly_fp", 0)

        league_entries.append(
            LeagueEntry(
                rank=rank_idx,
                user_id=uid,
                username=user_profile.get("username"),
                weekly_fp=standing.get("weekly_fp", 0),
                streak=user_profile.get("streak", 0),
                league=standing.get("league", user_league),
                is_current_user=is_current,
            )
        )

    return LeagueStandingsResponse(
        week_start=target_week_start.isoformat(),
        league=user_league,
        standings=league_entries,
        current_user_rank=current_user_rank,
        current_user_weekly_fp=current_user_weekly_fp,
        total_participants=total,
        promotion_zone_cutoff=promotion_cutoff,
        demotion_zone_cutoff=demotion_cutoff,
    )
