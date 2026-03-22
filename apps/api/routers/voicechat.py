"""VoiceChat router — POST /voicechat/turn (Pro-only speech-to-speech)

Accepts audio from the user, runs the full ASR → NIM → TTS pipeline,
and returns Max's coaching feedback + audio response as a multipart response.
"""
import json
import base64
from fastapi import APIRouter, Depends, File, UploadFile, Form, HTTPException
from pydantic import BaseModel

from dependencies import get_current_user, supabase
from services.nvidia_nim import ConversationTurn
from services.nvidia_voicechat import voicechat_service

router = APIRouter(prefix="/voicechat", tags=["voicechat"])


class VoiceChatTurnResponse(BaseModel):
    transcript: str
    ai_response_text: str
    grammar_feedback: str
    vocabulary_suggestions: str
    fp_multiplier: float
    overall_score: int
    audio_base64: str   # mp3 audio of Max's voice response, base64-encoded
    has_audio: bool     # False if TTS unavailable


@router.post("/turn", response_model=VoiceChatTurnResponse)
async def voice_chat_turn(
    lesson_id: str = Form(...),
    audio: UploadFile = File(...),
    audio_format: str = Form(default="m4a"),
    conversation_history: str = Form(default="[]"),
    current_user=Depends(get_current_user),
):
    """
    Pro-only: Full speech-to-speech conversation turn.

    1. ASR: transcribe user's audio via NVIDIA Riva
    2. NIM: get Max's coaching feedback + conversational response
    3. TTS: synthesize Max's response via NVIDIA Magpie TTS

    Returns: coaching data + base64-encoded mp3 audio of Max's voice.
    Requires Pro subscription.
    """
    # Check pro access
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
            detail="Voice Chat mode requires a Pro subscription",
        )

    # Validate lesson
    lesson_resp = (
        supabase.table("lessons")
        .select("id, conversation_system_prompt")
        .eq("id", lesson_id)
        .execute()
    )
    if not lesson_resp.data:
        raise HTTPException(status_code=404, detail="Lesson not found")

    lesson = lesson_resp.data[0]

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

    # Read audio
    audio_bytes = await audio.read()
    if len(audio_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty audio file")

    if len(audio_bytes) > 25 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Audio too large (max 25MB)")

    # Run speech-to-speech pipeline
    try:
        result, audio_response = await voicechat_service.process_voice_turn(
            audio_bytes=audio_bytes,
            lesson_system_prompt=lesson["conversation_system_prompt"],
            conversation_history=conv_history,
            audio_format=audio_format,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))

    audio_b64 = base64.b64encode(audio_response).decode("utf-8") if audio_response else ""

    return VoiceChatTurnResponse(
        transcript=result.transcript,
        ai_response_text=result.ai_response_text,
        grammar_feedback=result.grammar_feedback,
        vocabulary_suggestions=result.vocabulary_suggestions,
        fp_multiplier=result.fp_multiplier,
        overall_score=result.overall_score,
        audio_base64=audio_b64,
        has_audio=bool(audio_response),
    )
