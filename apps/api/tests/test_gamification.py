"""Tests for GamificationService — 5 tests"""
import os
import pytest
from datetime import date, timedelta
from unittest.mock import MagicMock, call

import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.gamification import GamificationService, GamificationResult


def _make_query_chain(execute_response):
    """Create a fully chainable mock that returns execute_response on .execute()"""
    chain = MagicMock()
    chain.select.return_value = chain
    chain.eq.return_value = chain
    chain.neq.return_value = chain
    chain.order.return_value = chain
    chain.limit.return_value = chain
    chain.in_.return_value = chain
    chain.update.return_value = chain
    chain.insert.return_value = chain
    chain.upsert.return_value = chain

    # single() also returns a chain whose .execute() returns the response
    single_chain = MagicMock()
    single_chain.execute.return_value = execute_response
    chain.single.return_value = single_chain

    chain.execute.return_value = execute_response
    return chain


def _make_mock_db(
    profile: dict,
    existing_standing: list,
    standings_rank_list: list,
):
    """
    Build a Supabase mock that handles all table() calls in process_session_completion.
    The service makes these table() calls in order:
      1. profiles.select().single()  → profile
      2. profiles.update()           → update profile
      3. league_standings.select()   → existing_standing (for upsert check)
      4. league_standings.insert() OR league_standings.update()  → upsert standing
      5. league_standings.select()   → standings_rank_list (for rank)
      6. league_standings.update()   → update rank
    """
    mock_db = MagicMock()

    # Responses
    profile_resp = MagicMock()
    profile_resp.data = profile

    update_profile_resp = MagicMock()
    update_profile_resp.data = [profile]

    existing_standing_resp = MagicMock()
    existing_standing_resp.data = existing_standing

    upsert_standing_resp = MagicMock()
    upsert_standing_resp.data = [{"id": "standing-1", "weekly_fp": 10}]

    rank_standings_resp = MagicMock()
    rank_standings_resp.data = standings_rank_list

    update_rank_resp = MagicMock()
    update_rank_resp.data = [{"id": "standing-1"}]

    # Track which calls have been made per table
    profiles_calls = [0]
    standings_calls = [0]

    def table_side_effect(table_name):
        if table_name == "profiles":
            profiles_calls[0] += 1
            if profiles_calls[0] == 1:
                # First call: select profile
                return _make_query_chain(profile_resp)
            else:
                # Subsequent calls: update profile
                return _make_query_chain(update_profile_resp)

        elif table_name == "league_standings":
            standings_calls[0] += 1
            if standings_calls[0] == 1:
                # Check existing standing
                return _make_query_chain(existing_standing_resp)
            elif standings_calls[0] == 2:
                # Insert or update standing
                return _make_query_chain(upsert_standing_resp)
            elif standings_calls[0] == 3:
                # Get standings for rank calculation
                return _make_query_chain(rank_standings_resp)
            else:
                # Update rank
                return _make_query_chain(update_rank_resp)

        return _make_query_chain(MagicMock())

    mock_db.table = MagicMock(side_effect=table_side_effect)
    return mock_db


# Test 1: FP calculation follows correct formula
def test_fp_calculation_correct_formula():
    """Test: max(1, int(base_fp * max(0.5, score/100) * nim_multiplier))"""
    today = date.today()
    yesterday = today - timedelta(days=1)

    profile = {
        "id": "user-123",
        "streak": 5,
        "streak_shields": 0,
        "total_fp": 100,
        "weekly_fp": 50,
        "league": "bronze",
        "last_activity_date": yesterday.isoformat(),
    }

    standings_rank = [
        {"user_id": "user-123", "weekly_fp": 74},
        {"user_id": "other-user", "weekly_fp": 30},
    ]

    mock_db = _make_mock_db(
        profile=profile,
        existing_standing=[],
        standings_rank_list=standings_rank,
    )

    service = GamificationService(mock_db)

    # base_fp=20, score=80, multiplier=1.5
    # expected: max(1, int(20 * max(0.5, 80/100) * 1.5))
    #         = max(1, int(20 * 0.8 * 1.5))
    #         = max(1, int(24.0))
    #         = 24
    result = service.process_session_completion(
        user_id="user-123",
        base_fp=20,
        pronunciation_score=80.0,
        nim_fp_multiplier=1.5,
    )

    assert result.fp_earned == 24
    assert result.new_total_fp == 100 + 24  # 124
    assert result.new_weekly_fp == 50 + 24  # 74


# Test 2: Streak extends when practicing on consecutive day
def test_streak_extends_on_consecutive_day():
    """Test that streak increments by 1 when last activity was yesterday."""
    today = date.today()
    yesterday = today - timedelta(days=1)

    profile = {
        "id": "user-456",
        "streak": 7,
        "streak_shields": 0,
        "total_fp": 200,
        "weekly_fp": 80,
        "league": "silver",
        "last_activity_date": yesterday.isoformat(),
    }

    standings_rank = [{"user_id": "user-456", "weekly_fp": 91}]

    mock_db = _make_mock_db(
        profile=profile,
        existing_standing=[],
        standings_rank_list=standings_rank,
    )

    service = GamificationService(mock_db)
    result = service.process_session_completion(
        user_id="user-456",
        base_fp=15,
        pronunciation_score=75.0,
        nim_fp_multiplier=1.0,
    )

    # streak was 7, yesterday → +1 = 8; also 8 % 7 != 0 so no shield
    # Actually 7+1=8; 8%7=1, not 0, so no shield bonus
    assert result.new_streak == 8
    assert result.streak_updated is True
    assert result.streak_broken is False
    assert result.shield_consumed is False


# Test 3: Streak breaks when missed more than 2 days (no shield)
def test_streak_breaks_without_shield():
    """Test that streak resets to 1 when last activity was 3+ days ago and no shields."""
    today = date.today()
    three_days_ago = today - timedelta(days=3)

    profile = {
        "id": "user-789",
        "streak": 15,
        "streak_shields": 0,
        "total_fp": 500,
        "weekly_fp": 100,
        "league": "gold",
        "last_activity_date": three_days_ago.isoformat(),
    }

    standings_rank = [{"user_id": "user-789", "weekly_fp": 111}]

    mock_db = _make_mock_db(
        profile=profile,
        existing_standing=[],
        standings_rank_list=standings_rank,
    )

    service = GamificationService(mock_db)
    result = service.process_session_completion(
        user_id="user-789",
        base_fp=20,
        pronunciation_score=60.0,
        nim_fp_multiplier=1.0,
    )

    assert result.streak_broken is True
    assert result.new_streak == 1  # Resets to 1
    assert result.shield_consumed is False


# Test 4: Shield saves streak when missed exactly 2 days
def test_shield_saves_streak_when_missed_two_days():
    """Test that a streak shield is consumed when last activity was 2 days ago."""
    today = date.today()
    two_days_ago = today - timedelta(days=2)

    profile = {
        "id": "user-shield",
        "streak": 20,
        "streak_shields": 1,
        "total_fp": 800,
        "weekly_fp": 120,
        "league": "platinum",
        "last_activity_date": two_days_ago.isoformat(),
    }

    standings_rank = [{"user_id": "user-shield", "weekly_fp": 151}]

    mock_db = _make_mock_db(
        profile=profile,
        existing_standing=[],
        standings_rank_list=standings_rank,
    )

    service = GamificationService(mock_db)
    result = service.process_session_completion(
        user_id="user-shield",
        base_fp=25,
        pronunciation_score=85.0,
        nim_fp_multiplier=1.2,
    )

    assert result.shield_consumed is True
    assert result.streak_broken is False
    assert result.new_streak == 21  # 20 + 1, not broken


# Test 5: profile_not_found raises ValueError
def test_process_session_raises_when_profile_not_found():
    """Test that ValueError is raised when user profile doesn't exist."""
    mock_db = MagicMock()

    profile_resp = MagicMock()
    profile_resp.data = None

    single_chain = MagicMock()
    single_chain.execute.return_value = profile_resp

    query_chain = MagicMock()
    query_chain.select.return_value = query_chain
    query_chain.eq.return_value = query_chain
    query_chain.single.return_value = single_chain
    query_chain.execute.return_value = profile_resp

    mock_db.table.return_value = query_chain

    service = GamificationService(mock_db)

    with pytest.raises(ValueError, match="Profile not found"):
        service.process_session_completion(
            user_id="nonexistent-user",
            base_fp=10,
            pronunciation_score=70.0,
            nim_fp_multiplier=1.0,
        )
