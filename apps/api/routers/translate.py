"""Translate router — POST /translate/coaching, POST /translate/text"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from dependencies import get_current_user
from services.nvidia_translate import translate_service, SUPPORTED_LANGS

router = APIRouter(prefix="/translate", tags=["translate"])


class TranslateTextRequest(BaseModel):
    text: str
    target_lang: str  # e.g. "zh", "ja", "ko", "es"
    source_lang: str = "en"


class TranslateTextResponse(BaseModel):
    original: str
    translated: str
    target_lang: str
    supported: bool


class TranslateCoachingRequest(BaseModel):
    grammar_feedback: str
    vocabulary_suggestions: str
    target_lang: str


class TranslateCoachingResponse(BaseModel):
    grammar_feedback: str
    vocabulary_suggestions: str
    target_lang: str


@router.get("/languages")
async def list_supported_languages():
    """List all supported translation target languages."""
    return {
        "supported_languages": [
            {"code": code, "name": name}
            for code, name in sorted(SUPPORTED_LANGS.items(), key=lambda x: x[1])
        ]
    }


@router.post("/text", response_model=TranslateTextResponse)
async def translate_text(
    request: TranslateTextRequest,
    current_user=Depends(get_current_user),
):
    """
    Translate text using NVIDIA Riva Translate (FREE endpoint).
    Returns the original text unchanged if language is unsupported.
    """
    text = request.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="text cannot be empty")

    if len(text) > 2000:
        raise HTTPException(status_code=400, detail="text too long (max 2000 characters)")

    supported = request.target_lang in SUPPORTED_LANGS

    translated = await translate_service.translate(
        text=text,
        target_lang=request.target_lang,
        source_lang=request.source_lang,
    )

    return TranslateTextResponse(
        original=text,
        translated=translated,
        target_lang=request.target_lang,
        supported=supported,
    )


@router.post("/coaching", response_model=TranslateCoachingResponse)
async def translate_coaching_feedback(
    request: TranslateCoachingRequest,
    current_user=Depends(get_current_user),
):
    """
    Translate Max's coaching feedback (grammar + vocabulary) to user's native language.
    Uses NVIDIA Riva Translate. Falls back to English if translation fails.
    """
    grammar, vocab = await translate_service.translate_coaching(
        grammar_feedback=request.grammar_feedback,
        vocabulary_suggestions=request.vocabulary_suggestions,
        target_lang=request.target_lang,
    )

    return TranslateCoachingResponse(
        grammar_feedback=grammar,
        vocabulary_suggestions=vocab,
        target_lang=request.target_lang,
    )
