"""Sessions router — POST /sessions/complete (Riva + NIM + gamification pipeline)"""
from fastapi import APIRouter, BackgroundTasks, Depends, File, UploadFile, Form, HTTPException
from pydantic import BaseModel
from typing import Optional

import asyncio
from dependencies import get_current_user, supabase
from services.access_control import (
    describe_lesson_access,
    ensure_profile,
    get_daily_quota,
    has_active_pro,
)
from services.nvidia_riva import riva_service
from services.nvidia_nim import nim_service, ConversationTurn
from services.gamification import GamificationService
from services.nvidia_guardrails import guardrails_service
from services.nvidia_reward import reward_service
from services.recommendation_cache import get_or_create_profile_embedding
from services.nvidia_embed import build_user_learning_profile

router = APIRouter(prefix="/sessions", tags=["sessions"])


class SessionCompleteResponse(BaseModel):
    session_id: str
    pronunciation_score: float
    fluency_score: float
    transcript: str
    nim_response: str
    grammar_feedback: str
    vocabulary_suggestions: str
    fp_earned: int
    new_total_fp: int
    new_weekly_fp: int
    new_streak: int
    streak_broken: bool
    shield_consumed: bool
    league_rank: int
    level_up_message: Optional[str]
    overall_nim_score: int


@router.post("/complete", response_model=SessionCompleteResponse)
async def complete_session(
    background_tasks: BackgroundTasks,
    lesson_id: str = Form(...),
    audio: UploadFile = File(...),
    target_phrase: str = Form(...),
    audio_format: str = Form(default="wav"),
    conversation_history: str = Form(default="[]"),
    current_user=Depends(get_current_user),
):
    """
    Complete a lesson session pipeline:
    1. Transcribe + score pronunciation via NVIDIA Riva
    2. Get conversation feedback via NVIDIA NIM (Llama 3.1 70B)
    3. Process gamification (FP + streak + league)
    4. Save session result to database
    5. Return comprehensive result
    """
    import json

    # Parse conversation history
    try:
        history_data = json.loads(conversation_history)
        conv_history = [
            ConversationTurn(role=t["role"], content=t["content"])
            for t in history_data
            if isinstance(t, dict) and "role" in t and "content" in t
        ]
    except (json.JSONDecodeError, KeyError, TypeError):
        conv_history = []

    # Validate lesson exists and check access
    lesson_resp = (
        supabase.table("lessons")
        .select("id, title, scenario, conversation_system_prompt, fp_reward, is_pro_only")
        .eq("id", lesson_id)
        .execute()
    )

    if not lesson_resp.data:
        raise HTTPException(status_code=404, detail="Lesson not found")

    lesson = lesson_resp.data[0]
    ensure_profile(supabase, current_user)

    access = describe_lesson_access(lesson, has_active_pro(supabase, current_user.id))
    if not access["can_access"]:
        raise HTTPException(status_code=403, detail=access["lock_reason"])

    quota = get_daily_quota(supabase, current_user.id)
    if not quota["is_unlimited"] and quota["remaining_today"] == 0:
        raise HTTPException(
            status_code=403,
            detail="You have used all 5 free practice sessions for today. Upgrade to Pro for unlimited sessions.",
        )

    # Read audio
    audio_bytes = await audio.read()
    if len(audio_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty audio file")

    if len(audio_bytes) > 25 * 1024 * 1024:
        raise HTTPException(
            status_code=413, detail="Audio file too large (max 25MB)"
        )

    # Step 1: Riva pronunciation scoring
    try:
        pronunciation_result = await riva_service.score_pronunciation(
            audio_bytes=audio_bytes,
            target_phrase=target_phrase.strip(),
        )
    except RuntimeError as e:
        raise HTTPException(
            status_code=502, detail=f"Riva scoring error: {str(e)}"
        )

    # Step 2: Safety check + NIM feedback + Nemotron reward scoring (parallel)
    transcript_text = pronunciation_result.transcript or target_phrase

    async def _get_nim_feedback():
        try:
            return await nim_service.get_conversation_response(
                lesson_system_prompt=lesson["conversation_system_prompt"],
                conversation_history=conv_history,
                user_message=transcript_text,
            )
        except Exception:
            from services.nvidia_nim import ConversationFeedback
            return ConversationFeedback(
                response="Great effort! Keep practicing.",
                grammar_feedback="Analysis unavailable at this time.",
                vocabulary_suggestions="Try using more professional business language.",
                fp_multiplier=1.0,
                overall_score=int(pronunciation_result.pronunciation_score),
            )

    async def _safety_check():
        is_safe, _ = await guardrails_service.is_safe(transcript_text)
        return is_safe

    async def _reward_score():
        return await reward_service.score_user_response(
            user_response=transcript_text,
            context_prompt=lesson.get("scenario", "Business English practice"),
        )

    # Run NIM feedback, safety check, and reward scoring in parallel
    nim_feedback, is_safe, reward_result = await asyncio.gather(
        _get_nim_feedback(),
        _safety_check(),
        _reward_score(),
    )

    # Safety: if transcript contains unsafe content, cap fp_multiplier
    if not is_safe:
        from services.nvidia_nim import ConversationFeedback
        nim_feedback.fp_multiplier = 0.5  # type: ignore[attr-defined]
        nim_feedback.grammar_feedback = "Please keep your practice professional."  # type: ignore[attr-defined]

    # Blend reward model score with NIM score (70/30 split)
    final_overall_score = nim_feedback.overall_score
    if reward_result is not None:
        final_overall_score = int(
            nim_feedback.overall_score * 0.7 +
            reward_result["overall_score"] * 0.3
        )
        # Boost fp_multiplier slightly for high reward scores
        if reward_result.get("quality_tier") == "excellent" and nim_feedback.fp_multiplier < 2.0:
            nim_feedback.fp_multiplier = min(2.0, nim_feedback.fp_multiplier * 1.1)  # type: ignore[attr-defined]

    # Step 3: Gamification
    gamification_service = GamificationService(supabase)
    try:
        gamification_result = gamification_service.process_session_completion(
            user_id=current_user.id,
            base_fp=lesson.get("fp_reward", 10),
            pronunciation_score=pronunciation_result.pronunciation_score,
            nim_fp_multiplier=nim_feedback.fp_multiplier,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    # Step 4: Save session result
    audio_duration_estimate = len(audio_bytes) // 16000  # Rough estimate from WAV size

    session_resp = (
        supabase.table("session_results")
        .insert(
            {
                "user_id": current_user.id,
                "lesson_id": lesson_id,
                "pronunciation_score": float(pronunciation_result.pronunciation_score),
                "fluency_score": float(pronunciation_result.fluency_score),
                "fp_earned": gamification_result.fp_earned,
                "grammar_feedback": nim_feedback.grammar_feedback,
                "vocabulary_suggestions": nim_feedback.vocabulary_suggestions,
                "niva_feedback": (
                    f"{pronunciation_result.feedback_summary} | "
                    f"Grammar: {nim_feedback.grammar_feedback} | "
                    f"Vocabulary: {nim_feedback.vocabulary_suggestions}"
                ),
                "audio_duration_seconds": max(1, audio_duration_estimate),
            }
        )
        .execute()
    )

    session_id = ""
    if session_resp.data:
        session_id = session_resp.data[0].get("id", "")

    async def _refresh_recommendation_profile() -> None:
        try:
            sessions_resp = (
                supabase.table("session_results")
                .select("pronunciation_score, grammar_feedback, vocabulary_suggestions, lesson_id")
                .eq("user_id", current_user.id)
                .order("completed_at", desc=True)
                .limit(10)
                .execute()
            )
            sessions = sessions_resp.data or []
            recent_scores = [s["pronunciation_score"] for s in sessions if s.get("pronunciation_score")]
            grammar_feedbacks = [s["grammar_feedback"] for s in sessions if s.get("grammar_feedback")]
            vocab_feedbacks = [s["vocabulary_suggestions"] for s in sessions if s.get("vocabulary_suggestions")]
            completed_lesson_ids = list({s["lesson_id"] for s in sessions if s.get("lesson_id")})
            completed_scenarios: list[str] = []
            if completed_lesson_ids:
                completed_lessons_resp = (
                    supabase.table("lessons")
                    .select("scenario")
                    .in_("id", completed_lesson_ids)
                    .execute()
                )
                completed_scenarios = [l["scenario"] for l in (completed_lessons_resp.data or [])]

            profile_text = build_user_learning_profile(
                recent_scores=recent_scores,
                grammar_feedback=grammar_feedbacks,
                vocabulary_feedback=vocab_feedbacks,
                completed_scenarios=completed_scenarios,
            )
            await get_or_create_profile_embedding(
                supabase,
                user_id=current_user.id,
                profile_text=profile_text,
            )
        except Exception:
            # Recommendation refresh is best-effort and must never fail the session flow.
            return

    background_tasks.add_task(_refresh_recommendation_profile)

    # Step 5: Return comprehensive result
    return SessionCompleteResponse(
        session_id=session_id,
        pronunciation_score=pronunciation_result.pronunciation_score,
        fluency_score=pronunciation_result.fluency_score,
        transcript=pronunciation_result.transcript,
        nim_response=nim_feedback.response,
        grammar_feedback=nim_feedback.grammar_feedback,
        vocabulary_suggestions=nim_feedback.vocabulary_suggestions,
        fp_earned=gamification_result.fp_earned,
        new_total_fp=gamification_result.new_total_fp,
        new_weekly_fp=gamification_result.new_weekly_fp,
        new_streak=gamification_result.new_streak,
        streak_broken=gamification_result.streak_broken,
        shield_consumed=gamification_result.shield_consumed,
        league_rank=gamification_result.league_rank,
        level_up_message=gamification_result.level_up_message,
        overall_nim_score=final_overall_score,
    )
