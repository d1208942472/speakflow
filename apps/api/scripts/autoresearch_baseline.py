#!/usr/bin/env python3
"""Synthetic local baseline for SpeakFlow API autoresearch.

This benchmark measures SpeakFlow's own orchestration overhead with mocked
Supabase and mocked NVIDIA services so results are stable across runs.
"""

from __future__ import annotations

import os
import re
import subprocess
import sys
import time
from pathlib import Path
from types import SimpleNamespace
from typing import Any
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient


ROOT = Path(__file__).resolve().parents[1]


def _set_env_defaults() -> None:
    fake_jwt = (
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
        ".eyJyb2xlIjoic2VydmljZV9yb2xlIn0"
        ".SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
    )
    os.environ.setdefault("SUPABASE_URL", "https://test.supabase.co")
    os.environ.setdefault("SUPABASE_SERVICE_KEY", fake_jwt)
    os.environ.setdefault("NVIDIA_API_KEY", "test-nvidia-key")
    os.environ.setdefault("NVIDIA_NIM_API_KEY", "test-nim-key")


class QueryResult(SimpleNamespace):
    data: list[dict[str, Any]]


class FakeTable:
    def __init__(self, database: "FakeSupabase", name: str):
        self.database = database
        self.name = name
        self._filters: list[tuple[str, str, Any]] = []
        self._orders: list[tuple[str, bool]] = []
        self._limit: int | None = None
        self._action = "select"
        self._payload: Any = None

    def select(self, _fields: str) -> "FakeTable":
        return self

    def eq(self, field: str, value: Any) -> "FakeTable":
        self._filters.append(("eq", field, value))
        return self

    def gte(self, field: str, value: Any) -> "FakeTable":
        self._filters.append(("gte", field, value))
        return self

    def lt(self, field: str, value: Any) -> "FakeTable":
        self._filters.append(("lt", field, value))
        return self

    def in_(self, field: str, values: list[Any]) -> "FakeTable":
        self._filters.append(("in", field, values))
        return self

    def order(self, field: str, desc: bool = False) -> "FakeTable":
        self._orders.append((field, desc))
        return self

    def limit(self, value: int) -> "FakeTable":
        self._limit = value
        return self

    def insert(self, payload: Any) -> "FakeTable":
        self._action = "insert"
        self._payload = payload
        return self

    def update(self, payload: dict[str, Any]) -> "FakeTable":
        self._action = "update"
        self._payload = payload
        return self

    def execute(self) -> QueryResult:
        store = self.database.store[self.name]
        if self._action == "insert":
            rows = self._payload if isinstance(self._payload, list) else [self._payload]
            inserted = []
            for row in rows:
                new_row = dict(row)
                new_row.setdefault("id", f"{self.name}-{len(store) + 1}")
                new_row.setdefault("completed_at", "2026-03-28T00:00:00")
                store.append(new_row)
                inserted.append(new_row)
            return QueryResult(data=inserted)

        matched = self._apply_filters(store)
        if self._action == "update":
            for row in matched:
                row.update(self._payload)
            return QueryResult(data=[dict(row) for row in matched])

        ordered = [dict(row) for row in matched]
        for field, desc in reversed(self._orders):
            ordered.sort(key=lambda row: row.get(field), reverse=desc)
        if self._limit is not None:
            ordered = ordered[: self._limit]
        return QueryResult(data=ordered)

    def _apply_filters(self, rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
        matched = [row for row in rows]
        for op, field, value in self._filters:
            if op == "eq":
                matched = [row for row in matched if row.get(field) == value]
            elif op == "gte":
                matched = [row for row in matched if row.get(field) >= value]
            elif op == "lt":
                matched = [row for row in matched if row.get(field) < value]
            elif op == "in":
                matched = [row for row in matched if row.get(field) in value]
        return matched


class FakeSupabase:
    def __init__(self) -> None:
        self.store: dict[str, list[dict[str, Any]]] = {
            "lessons": [
                {
                    "id": "interview-001",
                    "scenario": "job_interview",
                    "level": 1,
                    "title": "Tell me about yourself",
                    "description": "Practice a concise self-introduction.",
                    "target_phrases": ["Tell me about yourself."],
                    "conversation_system_prompt": "You are a hiring manager.",
                    "fp_reward": 20,
                    "is_pro_only": False,
                    "sort_order": 1,
                },
                {
                    "id": "negotiation-003",
                    "scenario": "negotiation",
                    "level": 3,
                    "title": "Handle pricing objections",
                    "description": "Practice a pricing negotiation.",
                    "target_phrases": ["Our pricing reflects the value delivered."],
                    "conversation_system_prompt": "You are a skeptical buyer.",
                    "fp_reward": 35,
                    "is_pro_only": True,
                    "sort_order": 2,
                },
            ],
            "profiles": [
                {
                    "id": "user-1",
                    "username": "tester",
                    "streak": 4,
                    "streak_shields": 1,
                    "total_fp": 250,
                    "weekly_fp": 75,
                    "league": "silver",
                    "is_pro": True,
                    "last_activity_date": "2026-03-27",
                }
            ],
            "entitlements": [
                {
                    "id": "ent-1",
                    "user_id": "user-1",
                    "entitlement_key": "pro",
                    "status": "active",
                    "source_provider": "stripe",
                    "expires_at": None,
                    "metadata": {},
                    "updated_at": "2026-03-28T00:00:00",
                }
            ],
            "session_results": [],
            "user_recommendation_profiles": [],
        }

    def table(self, name: str) -> FakeTable:
        self.store.setdefault(name, [])
        return FakeTable(self, name)


def _percentile(values: list[float], percentile: float) -> float:
    ordered = sorted(values)
    index = max(0, min(len(ordered) - 1, int(round((len(ordered) - 1) * percentile))))
    return ordered[index]


def _benchmark(label: str, func, iterations: int = 12) -> float:
    latencies = []
    for _ in range(iterations):
        started = time.perf_counter()
        response = func()
        elapsed_ms = (time.perf_counter() - started) * 1000
        if response.status_code != 200:
            raise RuntimeError(f"{label} failed with {response.status_code}: {response.text}")
        latencies.append(elapsed_ms)
    return _percentile(latencies, 0.95)


def _run_pytest() -> tuple[int, int]:
    python_bin = ROOT / ".venv" / "bin" / "python"
    command = [str(python_bin), "-m", "pytest", "tests", "-q", "--disable-warnings"]
    result = subprocess.run(
        command,
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    output = f"{result.stdout}\n{result.stderr}"
    passed = 0
    failed = 0
    passed_match = re.search(r"(\d+)\s+passed", output)
    failed_match = re.search(r"(\d+)\s+failed", output)
    error_match = re.search(r"(\d+)\s+errors?", output)
    if passed_match:
        passed = int(passed_match.group(1))
    if failed_match:
        failed += int(failed_match.group(1))
    if error_match:
        failed += int(error_match.group(1))
    if passed == 0 and result.returncode == 0:
        dot_line = result.stdout.strip().splitlines()[0] if result.stdout.strip() else ""
        if dot_line:
            passed = dot_line.count(".")
    if result.returncode != 0 and failed == 0:
        failed = 1
    return passed, failed


def main() -> int:
    _set_env_defaults()
    sys.path.insert(0, str(ROOT))

    fake_db = FakeSupabase()
    fake_user = SimpleNamespace(id="user-1", email="user@example.com")

    with patch("supabase.create_client", return_value=MagicMock()):
        import dependencies
        import main as api_main
        from routers import lessons, sessions, vision, voicechat

    dependencies.supabase = fake_db
    lessons.supabase = fake_db
    sessions.supabase = fake_db
    vision.supabase = fake_db
    voicechat.supabase = fake_db

    api_main.app.dependency_overrides[dependencies.get_current_user] = lambda: fake_user

    async def fake_score_pronunciation(*_args, **_kwargs):
        return SimpleNamespace(
            transcript="I can introduce our product clearly.",
            pronunciation_score=91.0,
            fluency_score=88.0,
            feedback_summary="Strong clarity and pacing.",
        )

    async def fake_nim_feedback(*_args, **_kwargs):
        return SimpleNamespace(
            response="That sounded concise and confident.",
            grammar_feedback="Grammar was accurate.",
            vocabulary_suggestions="Try adding one stronger commercial verb.",
            fp_multiplier=1.1,
            overall_score=90,
        )

    async def fake_is_safe(*_args, **_kwargs):
        return True, {"blocked": False}

    async def fake_reward_score(*_args, **_kwargs):
        return {"overall_score": 93, "quality_tier": "excellent"}

    async def fake_profile_embedding(*_args, **_kwargs):
        return [0.1, 0.2, 0.3]

    class FakeGamificationService:
        def __init__(self, _db):
            self.db = _db

        def process_session_completion(self, **_kwargs):
            return SimpleNamespace(
                fp_earned=22,
                new_total_fp=272,
                new_weekly_fp=97,
                new_streak=5,
                streak_broken=False,
                shield_consumed=False,
                league_rank=3,
                level_up_message=None,
            )

    async def fake_voice_turn(*_args, **_kwargs):
        result = SimpleNamespace(
            transcript="I would recommend we move ahead this quarter.",
            ai_response_text="Good recommendation. Clarify the expected return.",
            grammar_feedback="Solid control of tense and articles.",
            vocabulary_suggestions="Use 'upside' and 'downside' for executive tone.",
            fp_multiplier=1.2,
            overall_score=92,
        )
        return result, b"fake-mp3"

    async def fake_slide_analysis(*_args, **_kwargs):
        return {
            "slide_summary": "Revenue grew while churn fell.",
            "key_vocabulary": ["runway", "retention", "conversion"],
            "suggested_phrases": ["Our retention gains are durable."],
            "coaching_prompt": "Present the main chart in one minute.",
            "practice_questions": ["What changed quarter over quarter?"],
        }

    sessions.riva_service.score_pronunciation = fake_score_pronunciation
    sessions.nim_service.get_conversation_response = fake_nim_feedback
    sessions.guardrails_service.is_safe = fake_is_safe
    sessions.reward_service.score_user_response = fake_reward_score
    sessions.get_or_create_profile_embedding = fake_profile_embedding
    sessions.GamificationService = FakeGamificationService
    voicechat.voicechat_service.process_voice_turn = fake_voice_turn
    vision.vision_service.analyze_presentation_slide = fake_slide_analysis

    client = TestClient(api_main.app)

    health_p95 = _benchmark("health", lambda: client.get("/health"))
    lessons_p95 = _benchmark(
        "lessons",
        lambda: client.get("/lessons/", headers={"Authorization": "Bearer test"}),
    )
    session_p95 = _benchmark(
        "session_complete",
        lambda: client.post(
            "/sessions/complete",
            headers={"Authorization": "Bearer test"},
            data={
                "lesson_id": "interview-001",
                "target_phrase": "Tell me about yourself.",
                "audio_format": "wav",
                "conversation_history": "[]",
            },
            files={"audio": ("sample.wav", b"RIFF1234WAVEfmt ", "audio/wav")},
        ),
    )
    voicechat_p95 = _benchmark(
        "voicechat_turn",
        lambda: client.post(
            "/voicechat/turn",
            headers={"Authorization": "Bearer test"},
            data={
                "lesson_id": "interview-001",
                "audio_format": "m4a",
                "conversation_history": "[]",
            },
            files={"audio": ("sample.m4a", b"voice-bytes", "audio/m4a")},
        ),
    )
    vision_p95 = _benchmark(
        "vision_slide",
        lambda: client.post(
            "/vision/analyze-slide",
            headers={"Authorization": "Bearer test"},
            data={"coaching_focus": "presentation"},
            files={"image": ("slide.png", b"\x89PNG\r\n", "image/png")},
        ),
    )

    pytest_pass_count, pytest_fail_count = _run_pytest()
    primary_metric = max(session_p95, voicechat_p95, vision_p95, lessons_p95)

    print(f"primary_metric: {primary_metric:.2f}")
    print(f"health_p95_ms: {health_p95:.2f}")
    print(f"lessons_list_p95_ms: {lessons_p95:.2f}")
    print(f"session_complete_p95_ms: {session_p95:.2f}")
    print(f"voicechat_turn_p95_ms: {voicechat_p95:.2f}")
    print(f"vision_slide_p95_ms: {vision_p95:.2f}")
    print(f"pytest_pass_count: {pytest_pass_count}")
    print(f"pytest_fail_count: {pytest_fail_count}")
    return 0 if pytest_fail_count == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
