"""Lessons router — GET /lessons/, GET /lessons/{id}"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from dependencies import get_current_user, supabase

router = APIRouter(prefix="/lessons", tags=["lessons"])


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

    # Check user's pro status
    profile_resp = (
        supabase.table("profiles")
        .select("is_pro")
        .eq("id", current_user.id)
        .execute()
    )

    is_pro = False
    if profile_resp.data:
        is_pro = profile_resp.data[0].get("is_pro", False)

    # Build query
    query = supabase.table("lessons").select(
        "id, scenario, level, title, description, target_phrases, "
        "conversation_system_prompt, fp_reward, is_pro_only, sort_order"
    )

    if scenario:
        query = query.eq("scenario", scenario)

    # Non-pro users only get free lessons
    if not is_pro:
        query = query.eq("is_pro_only", False)

    query = query.order("sort_order").order("level")
    lessons_resp = query.execute()

    lessons_data = lessons_resp.data or []

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
