"""Conversation router — POST /conversation/respond"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, field_validator

from dependencies import get_current_user, supabase
from services.nvidia_nim import nim_service, ConversationFeedback, ConversationTurn
from services.nvidia_guardrails import guardrails_service
from services.nvidia_nemoguard import nemoguard_service

router = APIRouter(prefix="/conversation", tags=["conversation"])


class ConversationRequest(BaseModel):
    lesson_id: str
    conversation_history: list[ConversationTurn] = []
    user_message: str

    @field_validator("user_message")
    @classmethod
    def validate_user_message(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("user_message cannot be empty")
        if len(v) > 2000:
            raise ValueError("user_message too long (max 2000 characters)")
        return v

    @field_validator("conversation_history")
    @classmethod
    def validate_history(cls, v: list) -> list:
        if len(v) > 50:
            raise ValueError(
                "conversation_history too long (max 50 turns)"
            )
        return v


class ConversationResponse(BaseModel):
    feedback: ConversationFeedback
    lesson_title: str
    lesson_scenario: str


@router.post("/respond", response_model=ConversationResponse)
async def get_conversation_response(
    request: ConversationRequest,
    current_user=Depends(get_current_user),
):
    """
    Get AI conversation response + coaching feedback for a lesson turn.
    Returns Max's conversational reply + grammar/vocabulary feedback + FP multiplier.
    """
    # Fetch lesson to get system prompt
    lesson_resp = (
        supabase.table("lessons")
        .select("id, title, scenario, conversation_system_prompt, is_pro_only")
        .eq("id", request.lesson_id)
        .execute()
    )

    if not lesson_resp.data:
        raise HTTPException(status_code=404, detail="Lesson not found")

    lesson = lesson_resp.data[0]

    # Check pro access
    if lesson.get("is_pro_only"):
        profile_resp = (
            supabase.table("profiles")
            .select("is_pro")
            .eq("id", current_user.id)
            .execute()
        )
        if not profile_resp.data or not profile_resp.data[0].get("is_pro"):
            raise HTTPException(
                status_code=403,
                detail="This lesson requires a Pro subscription",
            )

    # Content safety check via Llama Guard 4 (non-blocking on API failure)
    is_safe, safety_reason = await guardrails_service.is_safe(request.user_message)
    if not is_safe:
        raise HTTPException(
            status_code=422,
            detail="Message violates content policy. Please keep conversations professional.",
        )

    # Topic control via NemoGuard (non-blocking — off-topic gets redirect, not 422)
    on_topic, redirect_message = await nemoguard_service.check_topic(request.user_message)
    if not on_topic and redirect_message:
        # Return a redirect coaching response without calling the main LLM
        from services.nvidia_nim import ConversationFeedback
        redirect_feedback = ConversationFeedback(
            response=redirect_message,
            grammar_feedback="",
            vocabulary_suggestions="",
            fp_multiplier=1.0,
            overall_score=100,
        )
        return ConversationResponse(
            feedback=redirect_feedback,
            lesson_title=lesson["title"],
            lesson_scenario=lesson["scenario"],
        )

    try:
        feedback = await nim_service.get_conversation_response(
            lesson_system_prompt=lesson["conversation_system_prompt"],
            conversation_history=request.conversation_history,
            user_message=request.user_message,
        )
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"AI conversation service error: {str(e)}",
        )

    return ConversationResponse(
        feedback=feedback,
        lesson_title=lesson["title"],
        lesson_scenario=lesson["scenario"],
    )
