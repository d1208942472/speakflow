"""Tests for conversation router — POST /conversation/respond"""
import os
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

# Set required env vars before importing app modules
os.environ.setdefault("SUPABASE_URL", "https://test.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_KEY", "test-service-key")
os.environ.setdefault("NVIDIA_NIM_API_KEY", "test-nim-key")

import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from fastapi import FastAPI
from routers.conversation import router as conversation_router


def _make_mock_user():
    user = MagicMock()
    user.id = "user-test-456"
    return user


def _make_lesson_supabase(lesson_data, profile_data=None):
    """Build chainable Supabase mock for conversation router."""
    mock_db = MagicMock()
    lesson_resp = MagicMock()
    lesson_resp.data = lesson_data

    profile_resp = MagicMock()
    profile_resp.data = profile_data or []

    call_count = [0]

    def table_side(table_name):
        chain = MagicMock()
        chain.select.return_value = chain
        chain.eq.return_value = chain
        chain.execute.return_value = lesson_resp if table_name == "lessons" else profile_resp
        return chain

    mock_db.table = MagicMock(side_effect=table_side)
    return mock_db


def _make_app():
    app = FastAPI()
    app.include_router(conversation_router)
    return app


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_conversation_respond_returns_feedback_on_success():
    """POST /conversation/respond returns ConversationFeedback for valid request."""
    from services.nvidia_nim import ConversationFeedback

    lesson = {
        "id": "lesson-free-01",
        "title": "Interview Intro",
        "scenario": "job_interview",
        "conversation_system_prompt": "You are an interviewer.",
        "is_pro_only": False,
    }

    mock_feedback = ConversationFeedback(
        response="Excellent! That was a strong self-introduction.",
        grammar_feedback="Your grammar is correct!",
        vocabulary_suggestions="Consider using 'expertise' instead of 'skills'",
        fp_multiplier=1.5,
        overall_score=82,
    )

    mock_db = _make_lesson_supabase(lesson_data=[lesson])

    with patch("routers.conversation.supabase", mock_db), \
         patch("routers.conversation.nim_service") as mock_nim, \
         patch("routers.conversation.get_current_user", return_value=_make_mock_user()):

        mock_nim.get_conversation_response = AsyncMock(return_value=mock_feedback)

        client = TestClient(_make_app())
        response = client.post(
            "/conversation/respond",
            json={
                "lesson_id": "lesson-free-01",
                "user_message": "I have been working in software for five years.",
                "conversation_history": [],
            },
            headers={"Authorization": "Bearer test-token"},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["feedback"]["fp_multiplier"] == 1.5
    assert data["feedback"]["overall_score"] == 82
    assert data["lesson_title"] == "Interview Intro"
    assert data["lesson_scenario"] == "job_interview"


def test_conversation_respond_returns_404_for_missing_lesson():
    """POST /conversation/respond returns 404 when lesson_id doesn't exist."""
    mock_db = _make_lesson_supabase(lesson_data=[])

    with patch("routers.conversation.supabase", mock_db), \
         patch("routers.conversation.get_current_user", return_value=_make_mock_user()):

        client = TestClient(_make_app(), raise_server_exceptions=False)
        response = client.post(
            "/conversation/respond",
            json={
                "lesson_id": "nonexistent-lesson",
                "user_message": "Hello there.",
                "conversation_history": [],
            },
            headers={"Authorization": "Bearer test-token"},
        )

    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_conversation_respond_validates_empty_user_message():
    """POST /conversation/respond returns 422 for empty user_message."""
    mock_db = _make_lesson_supabase(lesson_data=[])

    with patch("routers.conversation.supabase", mock_db), \
         patch("routers.conversation.get_current_user", return_value=_make_mock_user()):

        client = TestClient(_make_app(), raise_server_exceptions=False)
        response = client.post(
            "/conversation/respond",
            json={
                "lesson_id": "lesson-001",
                "user_message": "   ",  # whitespace-only — should fail validation
                "conversation_history": [],
            },
            headers={"Authorization": "Bearer test-token"},
        )

    assert response.status_code == 422


def test_conversation_respond_returns_403_for_pro_lesson_free_user():
    """POST /conversation/respond returns 403 when free user accesses pro lesson."""
    lesson = {
        "id": "pro-lesson-001",
        "title": "Advanced Negotiation",
        "scenario": "negotiation",
        "conversation_system_prompt": "You are a tough negotiator.",
        "is_pro_only": True,
    }
    profile = [{"is_pro": False}]

    mock_db = _make_lesson_supabase(lesson_data=[lesson], profile_data=profile)

    with patch("routers.conversation.supabase", mock_db), \
         patch("routers.conversation.get_current_user", return_value=_make_mock_user()):

        client = TestClient(_make_app(), raise_server_exceptions=False)
        response = client.post(
            "/conversation/respond",
            json={
                "lesson_id": "pro-lesson-001",
                "user_message": "I would like to negotiate.",
                "conversation_history": [],
            },
            headers={"Authorization": "Bearer test-token"},
        )

    assert response.status_code == 403
