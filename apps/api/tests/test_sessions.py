"""Tests for sessions router — POST /sessions/complete pipeline"""
import os
import json
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

# Set required env vars before importing app modules
os.environ.setdefault("SUPABASE_URL", "https://test.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_KEY", "test-service-key")
os.environ.setdefault("NVIDIA_API_KEY", "test-nvidia-key")
os.environ.setdefault("NVIDIA_NIM_API_KEY", "test-nim-key")

import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from fastapi import FastAPI
from routers.sessions import router as sessions_router


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_mock_user():
    user = MagicMock()
    user.id = "user-test-123"
    return user


def _make_mock_supabase(lesson_data, profile_data, session_insert_data=None):
    """Build a chainable Supabase mock for sessions router queries."""
    mock_db = MagicMock()

    lesson_resp = MagicMock()
    lesson_resp.data = lesson_data

    profile_resp = MagicMock()
    profile_resp.data = profile_data

    session_resp = MagicMock()
    session_resp.data = session_insert_data or [{"id": "session-abc-123"}]

    call_counter = [0]

    def table_side_effect(table_name):
        chain = MagicMock()
        chain.select.return_value = chain
        chain.eq.return_value = chain
        chain.insert.return_value = chain
        chain.update.return_value = chain

        if table_name == "lessons":
            chain.execute.return_value = lesson_resp
        elif table_name == "profiles":
            call_counter[0] += 1
            if call_counter[0] == 1:
                chain.execute.return_value = profile_resp
            else:
                chain.execute.return_value = profile_resp
        elif table_name == "session_results":
            chain.execute.return_value = session_resp

        return chain

    mock_db.table = MagicMock(side_effect=table_side_effect)
    return mock_db


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def test_complete_session_returns_404_for_missing_lesson():
    """POST /sessions/complete returns 404 when lesson_id doesn't exist."""
    app = FastAPI()
    app.include_router(sessions_router)

    mock_db = _make_mock_supabase(lesson_data=[], profile_data=[])

    with patch("routers.sessions.supabase", mock_db), \
         patch("routers.sessions.get_current_user", return_value=_make_mock_user()):

        client = TestClient(app, raise_server_exceptions=False)
        response = client.post(
            "/sessions/complete",
            data={
                "lesson_id": "nonexistent-lesson-id",
                "target_phrase": "Hello world",
                "audio_format": "wav",
                "conversation_history": "[]",
            },
            files={"audio": ("recording.wav", b"\x00\x01\x02\x03", "audio/wav")},
            headers={"Authorization": "Bearer test-token"},
        )

    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_complete_session_returns_403_for_pro_lesson_free_user():
    """POST /sessions/complete returns 403 when free user tries to access pro lesson."""
    app = FastAPI()
    app.include_router(sessions_router)

    lesson = {
        "id": "pro-lesson-001",
        "title": "Advanced Negotiation",
        "scenario": "negotiation",
        "conversation_system_prompt": "You are a tough negotiator.",
        "fp_reward": 35,
        "is_pro_only": True,
    }
    profile = [{"id": "user-test-123", "is_pro": False}]

    mock_db = _make_mock_supabase(
        lesson_data=[lesson],
        profile_data=profile,
    )

    with patch("routers.sessions.supabase", mock_db), \
         patch("routers.sessions.get_current_user", return_value=_make_mock_user()):

        client = TestClient(app, raise_server_exceptions=False)
        response = client.post(
            "/sessions/complete",
            data={
                "lesson_id": "pro-lesson-001",
                "target_phrase": "Let me make an offer.",
                "audio_format": "wav",
                "conversation_history": "[]",
            },
            files={"audio": ("recording.wav", b"\x00\x01\x02\x03", "audio/wav")},
            headers={"Authorization": "Bearer test-token"},
        )

    assert response.status_code == 403
    assert "pro" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_complete_session_full_pipeline_success():
    """POST /sessions/complete returns 200 with gamification data on success."""
    from services.nvidia_riva import PronunciationResult
    from services.nvidia_nim import ConversationFeedback
    from services.gamification import GamificationResult

    lesson = {
        "id": "interview-001",
        "title": "Tell Me About Yourself",
        "scenario": "job_interview",
        "conversation_system_prompt": "You are an interviewer.",
        "fp_reward": 15,
        "is_pro_only": False,
    }

    mock_riva_result = PronunciationResult(
        transcript="I have five years of experience",
        pronunciation_score=82.0,
        fluency_score=79.0,
        word_scores=[],
        feedback_summary="Good pronunciation!",
    )

    mock_nim_result = ConversationFeedback(
        response="Great introduction! Tell me more about your key achievements.",
        grammar_feedback="Your grammar is correct!",
        vocabulary_suggestions="Consider using 'extensive' instead of 'have'",
        fp_multiplier=1.5,
        overall_score=80,
    )

    mock_gamification_result = GamificationResult(
        fp_earned=18,
        new_total_fp=118,
        new_weekly_fp=68,
        streak_updated=True,
        new_streak=6,
        streak_broken=False,
        shield_consumed=False,
        league_rank=3,
        level_up_message=None,
    )

    mock_db = _make_mock_supabase(
        lesson_data=[lesson],
        profile_data=[{"id": "user-test-123", "is_pro": False}],
        session_insert_data=[{"id": "session-result-abc"}],
    )

    with patch("routers.sessions.riva_service") as mock_riva, \
         patch("routers.sessions.nim_service") as mock_nim, \
         patch("routers.sessions.GamificationService") as MockGamService, \
         patch("routers.sessions.supabase", mock_db), \
         patch("routers.sessions.get_current_user", return_value=_make_mock_user()):

        mock_riva.score_pronunciation = AsyncMock(return_value=mock_riva_result)
        mock_nim.get_conversation_response = AsyncMock(return_value=mock_nim_result)

        mock_gam_instance = MagicMock()
        mock_gam_instance.process_session_completion.return_value = mock_gamification_result
        MockGamService.return_value = mock_gam_instance

        from fastapi.testclient import TestClient as TC
        app = FastAPI()
        app.include_router(sessions_router)
        client = TC(app)

        response = client.post(
            "/sessions/complete",
            data={
                "lesson_id": "interview-001",
                "target_phrase": "I have five years of experience",
                "audio_format": "wav",
                "conversation_history": "[]",
            },
            files={"audio": ("recording.wav", b"\x52\x49\x46\x46" + b"\x00" * 40, "audio/wav")},
            headers={"Authorization": "Bearer test-token"},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["pronunciation_score"] == 82.0
    assert data["fp_earned"] == 18
    assert data["new_streak"] == 6
    assert data["streak_broken"] is False
    assert data["nim_response"] == mock_nim_result.response
