"""Sessions router — POST /sessions/complete (Riva + NIM + gamification pipeline)"""
from fastapi import APIRouter, Depends, File, UploadFile, Form, HTTPException
from pydantic import BaseModel
from typing import Optional

from dependencies import get_current_user, supabase
from services.nvidia_riva import riva_service
from services.nvidia_nim import nim_service, ConversationTurn
from services.gamification import GamificationService

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

    if lesson.get("is_pro_only"):
        profile_resp = (
            supabase.table("profiles")
            .select("is_pro")
            .eq("id", current_user.id)
            .execute()
        )
        is_pro = profile_resp.data[0].get("is_pro", False) if profile_resp.data else False
        if not is_pro:
            raise HTTPException(
                status_code=403,
                detail="This lesson requires a Pro subscription",
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

    # Step 2: NIM conversation feedback
    try:
        nim_feedback = await nim_service.get_conversation_response(
            lesson_system_prompt=lesson["conversation_system_prompt"],
            conversation_history=conv_history,
            user_message=pronunciation_result.transcript or target_phrase,
        )
    except Exception as e:
        # NIM failure should not block the session — use defaults
        from services.nvidia_nim import ConversationFeedback
        nim_feedback = ConversationFeedback(
            response="Great effort! Keep practicing.",
            grammar_feedback="Analysis unavailable at this time.",
            vocabulary_suggestions="Try using more professional business language.",
            fp_multiplier=1.0,
            overall_score=int(pronunciation_result.pronunciation_score),
        )

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
        overall_nim_score=nim_feedback.overall_score,
    )
