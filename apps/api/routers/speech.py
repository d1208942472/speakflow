"""Speech router — POST /speech/score, POST /speech/transcribe"""
from fastapi import APIRouter, Depends, File, UploadFile, Form, HTTPException
from pydantic import BaseModel

from dependencies import get_current_user
from services.nvidia_riva import riva_service, PronunciationResult

router = APIRouter(prefix="/speech", tags=["speech"])


class TranscribeResponse(BaseModel):
    transcript: str
    audio_format: str
    duration_hint: str


@router.post("/transcribe", response_model=TranscribeResponse)
async def transcribe_audio(
    audio: UploadFile = File(...),
    audio_format: str = Form(default="wav"),
    current_user=Depends(get_current_user),
):
    """
    Transcribe uploaded audio using NVIDIA Riva ASR.
    Accepts WAV, MP3, or M4A audio files.
    """
    allowed_formats = {"wav", "mp3", "m4a", "flac", "ogg"}
    if audio_format.lower() not in allowed_formats:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported audio format '{audio_format}'. Allowed: {allowed_formats}",
        )

    content_type = audio.content_type or ""
    if not any(
        ct in content_type
        for ct in ["audio/", "application/octet-stream"]
    ):
        # Permit octet-stream for binary uploads from mobile apps
        if content_type and content_type not in [
            "audio/wav",
            "audio/mp3",
            "audio/mpeg",
            "audio/m4a",
            "audio/x-m4a",
            "audio/flac",
            "audio/ogg",
            "application/octet-stream",
            "",
        ]:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid content type: {content_type}",
            )

    audio_bytes = await audio.read()
    if len(audio_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty audio file")

    if len(audio_bytes) > 25 * 1024 * 1024:  # 25MB limit
        raise HTTPException(
            status_code=413, detail="Audio file too large (max 25MB)"
        )

    try:
        transcript = await riva_service.transcribe_audio(
            audio_bytes=audio_bytes, audio_format=audio_format.lower()
        )
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))

    return TranscribeResponse(
        transcript=transcript,
        audio_format=audio_format.lower(),
        duration_hint=f"~{len(audio_bytes) // 16000}s",
    )


@router.post("/score", response_model=PronunciationResult)
async def score_pronunciation(
    audio: UploadFile = File(...),
    target_phrase: str = Form(...),
    audio_format: str = Form(default="wav"),
    current_user=Depends(get_current_user),
):
    """
    Score pronunciation of uploaded audio against target phrase.
    Returns pronunciation score (0-100), fluency score, word scores, and feedback.
    """
    if not target_phrase.strip():
        raise HTTPException(
            status_code=400, detail="target_phrase cannot be empty"
        )

    if len(target_phrase) > 500:
        raise HTTPException(
            status_code=400,
            detail="target_phrase too long (max 500 characters)",
        )

    audio_bytes = await audio.read()
    if len(audio_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty audio file")

    if len(audio_bytes) > 25 * 1024 * 1024:
        raise HTTPException(
            status_code=413, detail="Audio file too large (max 25MB)"
        )

    try:
        result = await riva_service.score_pronunciation(
            audio_bytes=audio_bytes,
            target_phrase=target_phrase.strip(),
        )
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))

    return result
