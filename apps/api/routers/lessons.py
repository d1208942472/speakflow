"""Lessons router — GET /lessons/, GET /lessons/{id}"""
import time
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from dependencies import get_current_user, supabase

router = APIRouter(prefix="/lessons", tags=["lessons"])

# In-memory lesson cache — lessons are essentially static content
# Cache TTL: 10 minutes (600s). Avoids repeated Supabase round-trips.
_lesson_cache: dict = {}
_cache_ttl = 600  # seconds


def _get_cached_lessons() -> list | None:
    """Return cached lesson list if still fresh, else None."""
    entry = _lesson_cache.get("all")
    if entry and (time.time() - entry["ts"]) < _cache_ttl:
        return entry["data"]
    return None


def _set_cached_lessons(lessons: list) -> None:
    _lesson_cache["all"] = {"data": lessons, "ts": time.time()}


class LessonResponse(BaseModel):
    id: str
    scenario: str
    level: int
    title: str
    description: str
    target_phrases: list[str]
    conversation_system_prompt: str
    fp_reward: int
    is_pro_only: bool
    sort_order: int


class LessonsListResponse(BaseModel):
    lessons: list[LessonResponse]
    total: int
    scenario_filter: Optional[str]


@router.get("/", response_model=LessonsListResponse)
async def list_lessons(
    scenario: Optional[str] = Query(
        default=None,
        description="Filter by scenario: job_interview, presentation, small_talk, email, negotiation",
    ),
    current_user=Depends(get_current_user),
):
    """
    List all lessons accessible to the current user.
    Pro-only lessons are shown but marked. Free users can filter by is_pro_only=false.
    """
    valid_scenarios = {
        "job_interview",
        "presentation",
        "small_talk",
        "email",
        "negotiation",
    }

    if scenario and scenario not in valid_scenarios:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid scenario. Must be one of: {valid_scenarios}",
        )

    # Check user's pro status (still requires a DB call per user)
    profile_resp = (
        supabase.table("profiles")
        .select("is_pro")
        .eq("id", current_user.id)
        .execute()
    )

    is_pro = False
    if profile_resp.data:
        is_pro = profile_resp.data[0].get("is_pro", False)

    # Use cache for the full lesson list — lessons are static content
    all_lessons = _get_cached_lessons()
    if all_lessons is None:
        lessons_resp = (
            supabase.table("lessons")
            .select(
                "id, scenario, level, title, description, target_phrases, "
                "conversation_system_prompt, fp_reward, is_pro_only, sort_order"
            )
            .order("sort_order")
            .order("level")
            .execute()
        )
        all_lessons = lessons_resp.data or []
        _set_cached_lessons(all_lessons)

    # Filter in Python (no extra DB round-trip)
    lessons_data = all_lessons
    if scenario:
        lessons_data = [l for l in lessons_data if l.get("scenario") == scenario]
    if not is_pro:
        lessons_data = [l for l in lessons_data if not l.get("is_pro_only")]

    lessons = [
        LessonResponse(
            id=lesson["id"],
            scenario=lesson["scenario"],
            level=lesson["level"],
            title=lesson["title"],
            description=lesson["description"],
            target_phrases=lesson.get("target_phrases") or [],
            conversation_system_prompt=lesson["conversation_system_prompt"],
            fp_reward=lesson["fp_reward"],
            is_pro_only=lesson["is_pro_only"],
            sort_order=lesson["sort_order"],
        )
        for lesson in lessons_data
    ]

    return LessonsListResponse(
        lessons=lessons,
        total=len(lessons),
        scenario_filter=scenario,
    )


@router.get("/{lesson_id}", response_model=LessonResponse)
async def get_lesson(
    lesson_id: str,
    current_user=Depends(get_current_user),
):
    """Get a specific lesson by ID."""
    lesson_resp = (
        supabase.table("lessons")
        .select(
            "id, scenario, level, title, description, target_phrases, "
            "conversation_system_prompt, fp_reward, is_pro_only, sort_order"
        )
        .eq("id", lesson_id)
        .execute()
    )

    if not lesson_resp.data:
        raise HTTPException(status_code=404, detail="Lesson not found")

    lesson = lesson_resp.data[0]

    # Check pro access for pro-only lessons
    if lesson.get("is_pro_only"):
        profile_resp = (
            supabase.table("profiles")
            .select("is_pro")
            .eq("id", current_user.id)
            .execute()
        )
        is_pro = False
        if profile_resp.data:
            is_pro = profile_resp.data[0].get("is_pro", False)

        if not is_pro:
            raise HTTPException(
                status_code=403,
                detail="This lesson requires a Pro subscription",
            )

    return LessonResponse(
        id=lesson["id"],
        scenario=lesson["scenario"],
        level=lesson["level"],
        title=lesson["title"],
        description=lesson["description"],
        target_phrases=lesson.get("target_phrases") or [],
        conversation_system_prompt=lesson["conversation_system_prompt"],
        fp_reward=lesson["fp_reward"],
        is_pro_only=lesson["is_pro_only"],
        sort_order=lesson["sort_order"],
    )
