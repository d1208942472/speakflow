"""Vision router — POST /vision/analyze-slide and /vision/analyze-document (Pro-only)

Accepts image uploads (slides, documents, whiteboards) and returns
business English coaching context using NVIDIA Llama 3.2 Vision 11B.

Pro-only endpoint: requires is_pro=True in user profile.
"""
from fastapi import APIRouter, Depends, File, UploadFile, Form, HTTPException
from pydantic import BaseModel

from dependencies import get_current_user, supabase
from services.nvidia_vision import vision_service

router = APIRouter(prefix="/vision", tags=["vision"])

_SUPPORTED_TYPES = {
    "image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"
}
_MAX_SIZE_BYTES = 10 * 1024 * 1024  # 10MB


class SlideAnalysisResponse(BaseModel):
    slide_summary: str
    key_vocabulary: list[str]
    suggested_phrases: list[str]
    coaching_prompt: str
    practice_questions: list[str]


class DocumentAnalysisResponse(BaseModel):
    document_type: str
    language_score: int
    strengths: list[str]
    improvements: list[str]
    rewritten_excerpt: str


def _check_pro_access(user_id: str) -> None:
    """Raise 403 if user doesn't have Pro access."""
    profile_resp = (
        supabase.table("profiles")
        .select("is_pro")
        .eq("id", user_id)
        .execute()
    )
    is_pro = profile_resp.data[0].get("is_pro", False) if profile_resp.data else False
    if not is_pro:
        raise HTTPException(
            status_code=403,
            detail="Slide and document analysis requires a Pro subscription",
        )


def _validate_image(image: UploadFile) -> None:
    """Raise 400/413 on invalid image input."""
    if image.content_type not in _SUPPORTED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported image type: {image.content_type}. Use JPEG, PNG, or WebP.",
        )


@router.post("/analyze-slide", response_model=SlideAnalysisResponse)
async def analyze_slide(
    image: UploadFile = File(...),
    coaching_focus: str = Form(default="presentation"),
    current_user=Depends(get_current_user),
):
    """
    Pro-only: Analyze a presentation slide for business English coaching.

    Upload a slide image → Max explains the content and generates:
    - Key business vocabulary from the slide
    - Suggested English phrases for presenting this content
    - Practice questions to prepare your presentation

    coaching_focus: "presentation" | "email" | "document" | "general"
    """
    _check_pro_access(current_user.id)
    _validate_image(image)

    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty image file")
    if len(image_bytes) > _MAX_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="Image too large (max 10MB)")

    mime_type = image.content_type or "image/jpeg"
    result = await vision_service.analyze_presentation_slide(
        image_bytes=image_bytes,
        image_mime=mime_type,
        coaching_focus=coaching_focus,
    )

    return SlideAnalysisResponse(**result)


@router.post("/analyze-document", response_model=DocumentAnalysisResponse)
async def analyze_document(
    image: UploadFile = File(...),
    current_user=Depends(get_current_user),
):
    """
    Pro-only: Analyze a business document for English quality feedback.

    Upload a document image (email, report, proposal) → Max reviews:
    - Professional English quality score (0-100)
    - What's written well
    - Suggested improvements
    - Rewritten version of key sections
    """
    _check_pro_access(current_user.id)
    _validate_image(image)

    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty image file")
    if len(image_bytes) > _MAX_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="Image too large (max 10MB)")

    mime_type = image.content_type or "image/jpeg"
    result = await vision_service.analyze_business_document(
        image_bytes=image_bytes,
        image_mime=mime_type,
    )

    return DocumentAnalysisResponse(**result)
