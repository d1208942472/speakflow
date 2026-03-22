"""Lesson recommendation router — GET /recommend/next-lesson

Uses NVIDIA NIM Embeddings (nv-embedqa-e5-v5) to semantically match the user's
current learning profile to the most relevant next lesson in the catalog.

Algorithm:
1. Fetch user's recent session_results (last 10) + grammar/vocab feedback
2. Build natural language profile: level, score trend, weak areas, done scenarios
3. Embed profile as a "query" vector
4. Embed all available (unseen) lesson descriptions as "passage" vectors
5. Rank by cosine similarity → return top 3 recommended lessons

This is more intelligent than rule-based level progression: a user who has high
scores but consistently gets "passive voice" grammar feedback will be steered
toward lessons that practice passive voice in business context.
"""
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

from dependencies import get_current_user, supabase
from services.nvidia_embed import (
    embed_service,
    cosine_similarity,
    build_user_learning_profile,
)

router = APIRouter(prefix="/recommend", tags=["recommend"])


class RecommendedLesson(BaseModel):
    id: str
    title: str
    scenario: str
    level: int
    fp_reward: int
    is_pro_only: bool
    relevance_score: float   # cosine similarity [0, 1]
    reason: str              # human-readable explanation


class RecommendationResponse(BaseModel):
    recommendations: list[RecommendedLesson]
    profile_summary: str


@router.get("/next-lesson", response_model=RecommendationResponse)
async def get_next_lesson_recommendation(
    limit: int = Query(default=3, ge=1, le=10),
    scenario_filter: str | None = Query(default=None, description="Filter by scenario type"),
    current_user=Depends(get_current_user),
):
    """
    AI-powered next lesson recommendation using NVIDIA NIM Embeddings.

    Analyzes the user's learning history and returns the most semantically
    relevant lessons for their current skill level and weak areas.
    """
    user_id = current_user.id

    # ── 1. Fetch user's recent sessions ────────────────────────────────────
    sessions_resp = (
        supabase.table("session_results")
        .select("pronunciation_score, grammar_feedback, vocabulary_suggestions, lesson_id")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(10)
        .execute()
    )
    sessions = sessions_resp.data or []

    recent_scores = [s["pronunciation_score"] for s in sessions if s.get("pronunciation_score")]
    grammar_feedbacks = [s["grammar_feedback"] for s in sessions if s.get("grammar_feedback")]
    vocab_feedbacks = [s["vocabulary_suggestions"] for s in sessions if s.get("vocabulary_suggestions")]
    completed_lesson_ids = list({s["lesson_id"] for s in sessions if s.get("lesson_id")})

    # ── 2. Fetch completed lesson scenarios ────────────────────────────────
    completed_scenarios: list[str] = []
    if completed_lesson_ids:
        completed_lessons_resp = (
            supabase.table("lessons")
            .select("scenario")
            .in_("id", completed_lesson_ids)
            .execute()
        )
        completed_scenarios = [l["scenario"] for l in (completed_lessons_resp.data or [])]

    # ── 3. Build user learning profile ────────────────────────────────────
    profile_text = build_user_learning_profile(
        recent_scores=recent_scores,
        grammar_feedback=grammar_feedbacks,
        vocabulary_feedback=vocab_feedbacks,
        completed_scenarios=completed_scenarios,
        target_scenario=scenario_filter,
    )

    # ── 4. Fetch candidate lessons (exclude already-completed) ─────────────
    lessons_query = (
        supabase.table("lessons")
        .select("id, title, scenario, level, description, fp_reward, is_pro_only, target_phrases")
        .not_.in_("id", completed_lesson_ids) if completed_lesson_ids else
        supabase.table("lessons")
        .select("id, title, scenario, level, description, fp_reward, is_pro_only, target_phrases")
    )

    if scenario_filter:
        lessons_query = lessons_query.eq("scenario", scenario_filter)

    lessons_resp = lessons_query.limit(100).execute()
    candidate_lessons = lessons_resp.data or []

    if not candidate_lessons:
        # If user has done everything, include all lessons
        all_resp = (
            supabase.table("lessons")
            .select("id, title, scenario, level, description, fp_reward, is_pro_only, target_phrases")
            .limit(100)
            .execute()
        )
        candidate_lessons = all_resp.data or []

    if not candidate_lessons:
        return RecommendationResponse(recommendations=[], profile_summary=profile_text)

    # ── 5. Build lesson passage texts for embedding ────────────────────────
    def lesson_to_passage(lesson: dict) -> str:
        target_phrases = lesson.get("target_phrases") or []
        if isinstance(target_phrases, list):
            phrases_str = ", ".join(target_phrases[:3])
        else:
            phrases_str = str(target_phrases)
        return (
            f"{lesson['title']}. "
            f"Scenario: {lesson.get('scenario', '')}. "
            f"Level {lesson.get('level', 1)}. "
            f"{lesson.get('description', '')} "
            f"Practice phrases: {phrases_str}."
        )

    lesson_passages = [lesson_to_passage(l) for l in candidate_lessons]

    # ── 6. Get embeddings (query + passages in parallel) ──────────────────
    try:
        query_embedding = await embed_service.embed_query(profile_text)
        passage_embeddings = await embed_service.embed_passages(lesson_passages)
    except Exception:
        # Embedding unavailable — fall back to level-based recommendation
        avg_score = sum(recent_scores) / len(recent_scores) if recent_scores else 50
        target_level = 1 if avg_score < 50 else 2 if avg_score < 75 else 3
        fallback = [
            l for l in sorted(candidate_lessons, key=lambda x: abs(x.get("level", 1) - target_level))
        ][:limit]
        return RecommendationResponse(
            recommendations=[
                RecommendedLesson(
                    id=l["id"],
                    title=l["title"],
                    scenario=l.get("scenario", ""),
                    level=l.get("level", 1),
                    fp_reward=l.get("fp_reward", 10),
                    is_pro_only=l.get("is_pro_only", False),
                    relevance_score=0.5,
                    reason="Recommended based on your level progression",
                )
                for l in fallback
            ],
            profile_summary=profile_text,
        )

    # ── 7. Rank lessons by cosine similarity ──────────────────────────────
    scored_lessons = []
    for lesson, embedding in zip(candidate_lessons, passage_embeddings):
        score = cosine_similarity(query_embedding, embedding)
        scored_lessons.append((lesson, score))

    scored_lessons.sort(key=lambda x: x[1], reverse=True)
    top_lessons = scored_lessons[:limit]

    # ── 8. Build response with human-readable reason ───────────────────────
    def make_reason(lesson: dict, score: float) -> str:
        level = lesson.get("level", 1)
        scenario = lesson.get("scenario", "").replace("_", " ")
        if score > 0.85:
            return f"Highly relevant to your current weak areas in {scenario}"
        elif score > 0.70:
            return f"Good match for your Level {level} {scenario} practice"
        else:
            return f"Recommended to broaden your {scenario} vocabulary"

    recommendations = [
        RecommendedLesson(
            id=lesson["id"],
            title=lesson["title"],
            scenario=lesson.get("scenario", ""),
            level=lesson.get("level", 1),
            fp_reward=lesson.get("fp_reward", 10),
            is_pro_only=lesson.get("is_pro_only", False),
            relevance_score=round(score, 4),
            reason=make_reason(lesson, score),
        )
        for lesson, score in top_lessons
    ]

    return RecommendationResponse(
        recommendations=recommendations,
        profile_summary=profile_text,
    )
