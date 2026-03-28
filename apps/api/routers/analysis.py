"""Async analysis jobs for slide and document review."""
from __future__ import annotations

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel

from dependencies import get_current_user, supabase
from services.access_control import has_active_pro
from services.nvidia_vision import vision_service

router = APIRouter(prefix="/analysis", tags=["analysis"])

SUPPORTED_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"}
MAX_SIZE_BYTES = 10 * 1024 * 1024


class AnalysisJobCreateResponse(BaseModel):
    id: str
    status: str
    job_type: str


class AnalysisJobResponse(BaseModel):
    id: str
    status: str
    job_type: str
    input_metadata: dict
    result: dict | None = None
    error: str | None = None
    created_at: str
    updated_at: str


async def _run_analysis_job(
    *,
    job_id: str,
    job_type: str,
    image_bytes: bytes,
    image_mime: str,
    coaching_focus: str,
) -> None:
    supabase.table("analysis_jobs").update({"status": "processing"}).eq("id", job_id).execute()
    try:
        if job_type == "slide":
            result = await vision_service.analyze_presentation_slide(
                image_bytes=image_bytes,
                image_mime=image_mime,
                coaching_focus=coaching_focus,
            )
        else:
            result = await vision_service.analyze_business_document(
                image_bytes=image_bytes,
                image_mime=image_mime,
            )
        supabase.table("analysis_jobs").update(
            {"status": "completed", "result": result, "error": None}
        ).eq("id", job_id).execute()
    except Exception as exc:
        supabase.table("analysis_jobs").update(
            {"status": "failed", "error": str(exc)}
        ).eq("id", job_id).execute()


@router.post("/jobs", response_model=AnalysisJobCreateResponse)
async def create_analysis_job(
    background_tasks: BackgroundTasks,
    job_type: str = Form(...),
    image: UploadFile = File(...),
    coaching_focus: str = Form(default="presentation"),
    current_user=Depends(get_current_user),
):
    if job_type not in {"slide", "document"}:
        raise HTTPException(status_code=400, detail="job_type must be slide or document")
    if image.content_type not in SUPPORTED_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported image type")
    if not has_active_pro(supabase, current_user.id):
        raise HTTPException(status_code=403, detail="Slide and document analysis requires SpeakFlow Pro")

    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty image file")
    if len(image_bytes) > MAX_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="Image too large (max 10MB)")

    insert = (
        supabase.table("analysis_jobs")
        .insert(
            {
                "user_id": current_user.id,
                "job_type": job_type,
                "status": "queued",
                "input_metadata": {
                    "content_type": image.content_type,
                    "coaching_focus": coaching_focus,
                    "filename": image.filename,
                },
            }
        )
        .execute()
    )
    job = insert.data[0]
    background_tasks.add_task(
        _run_analysis_job,
        job_id=job["id"],
        job_type=job_type,
        image_bytes=image_bytes,
        image_mime=image.content_type or "image/jpeg",
        coaching_focus=coaching_focus,
    )
    return AnalysisJobCreateResponse(id=job["id"], status=job["status"], job_type=job["job_type"])


@router.get("/jobs/{job_id}", response_model=AnalysisJobResponse)
async def get_analysis_job(job_id: str, current_user=Depends(get_current_user)):
    resp = (
        supabase.table("analysis_jobs")
        .select("id, status, job_type, input_metadata, result, error, created_at, updated_at")
        .eq("id", job_id)
        .eq("user_id", current_user.id)
        .execute()
    )
    if not resp.data:
        raise HTTPException(status_code=404, detail="Analysis job not found")
    return AnalysisJobResponse(**resp.data[0])
