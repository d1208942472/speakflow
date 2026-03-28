"""Tests for entitlement, quota, and lesson access endpoints."""
import os
import sys
from unittest.mock import MagicMock, patch

from fastapi import FastAPI
from fastapi.testclient import TestClient

# Set required env vars before importing app modules
os.environ.setdefault("SUPABASE_URL", "https://test.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_KEY", "test-service-key")

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from routers.lessons import router as lessons_router  # noqa: E402
from routers.me import router as me_router  # noqa: E402


def _make_mock_user():
    user = MagicMock()
    user.id = "user-access-001"
    user.email = "tester@example.com"
    return user


def _make_supabase_mock(
    *,
    entitlements=None,
    profiles=None,
    session_results=None,
    lessons=None,
):
    mock_db = MagicMock()

    entitlements_resp = MagicMock()
    entitlements_resp.data = entitlements or []

    profiles_resp = MagicMock()
    profiles_resp.data = profiles or []

    session_results_resp = MagicMock()
    session_results_resp.data = session_results or []

    lessons_resp = MagicMock()
    lessons_resp.data = lessons or []

    def table_side_effect(table_name):
        chain = MagicMock()
        chain.select.return_value = chain
        chain.eq.return_value = chain
        chain.gte.return_value = chain
        chain.lt.return_value = chain
        chain.order.return_value = chain
        chain.insert.return_value = chain

        if table_name == "entitlements":
            chain.execute.return_value = entitlements_resp
        elif table_name == "profiles":
            chain.execute.return_value = profiles_resp
        elif table_name == "session_results":
            chain.execute.return_value = session_results_resp
        elif table_name == "lessons":
            chain.execute.return_value = lessons_resp
        else:
            chain.execute.return_value = MagicMock(data=[])

        return chain

    mock_db.table = MagicMock(side_effect=table_side_effect)
    return mock_db


def _make_app():
    app = FastAPI()
    app.include_router(me_router)
    app.include_router(lessons_router)
    return app


def test_get_my_entitlements_returns_active_pro_provider():
    mock_db = _make_supabase_mock(
        entitlements=[
            {
                "id": "ent-1",
                "entitlement_key": "pro",
                "status": "active",
                "source_provider": "stripe",
                "expires_at": None,
                "metadata": {"plan": "annual"},
                "updated_at": "2026-03-28T00:00:00Z",
            }
        ],
        profiles=[{"id": "user-access-001", "is_pro": True}],
    )

    with patch("routers.me.supabase", mock_db), \
         patch("routers.me.get_current_user", return_value=_make_mock_user()):
        client = TestClient(_make_app())
        response = client.get("/me/entitlements", headers={"Authorization": "Bearer test-token"})

    assert response.status_code == 200
    payload = response.json()
    assert payload["has_pro"] is True
    assert payload["billing_provider"] == "stripe"
    assert payload["entitlements"][0]["entitlement_key"] == "pro"


def test_get_my_quota_returns_remaining_sessions_for_free_user():
    mock_db = _make_supabase_mock(
        entitlements=[],
        profiles=[{"id": "user-access-001", "is_pro": False}],
        session_results=[
            {"id": "sess-1", "completed_at": "2026-03-28T01:00:00"},
            {"id": "sess-2", "completed_at": "2026-03-28T02:00:00"},
        ],
    )

    with patch("routers.me.supabase", mock_db), \
         patch("routers.me.get_current_user", return_value=_make_mock_user()):
        client = TestClient(_make_app())
        response = client.get("/me/quota", headers={"Authorization": "Bearer test-token"})

    assert response.status_code == 200
    payload = response.json()
    assert payload["has_pro"] is False
    assert payload["daily_session_limit"] == 5
    assert payload["used_today"] == 2
    assert payload["remaining_today"] == 3


def test_list_lessons_keeps_locked_lessons_visible_for_free_users():
    from routers import lessons as lessons_module

    lessons_module._lesson_cache.clear()
    mock_db = _make_supabase_mock(
        entitlements=[],
        profiles=[{"id": "user-access-001", "is_pro": False}],
        lessons=[
            {
                "id": "lesson-free-1",
                "scenario": "job_interview",
                "level": 1,
                "title": "Interview opener",
                "description": "Intro lesson",
                "target_phrases": ["Tell me about yourself"],
                "conversation_system_prompt": "You are an interviewer.",
                "fp_reward": 10,
                "is_pro_only": False,
                "sort_order": 1,
            },
            {
                "id": "lesson-pro-1",
                "scenario": "email",
                "level": 2,
                "title": "Write better emails",
                "description": "Email lesson",
                "target_phrases": ["Following up on our meeting"],
                "conversation_system_prompt": "You are an executive coach.",
                "fp_reward": 20,
                "is_pro_only": False,
                "sort_order": 2,
            },
        ],
    )

    with patch("routers.lessons.supabase", mock_db), \
         patch("routers.lessons.get_current_user", return_value=_make_mock_user()):
        client = TestClient(_make_app())
        response = client.get("/lessons/", headers={"Authorization": "Bearer test-token"})

    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] == 2
    assert payload["lessons"][0]["can_access"] is True
    assert payload["lessons"][1]["can_access"] is False
    assert payload["lessons"][1]["requires_pro"] is True
    assert "3 scenarios" in payload["lessons"][1]["lock_reason"]
