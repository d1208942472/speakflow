"""Embedding cache helpers for lesson retrieval and user profile refresh."""
from __future__ import annotations

import hashlib
from typing import Any

from supabase import Client

from services.nvidia_embed import embed_service

EMBED_MODEL = "nvidia/llama-3.2-nv-embedqa-1b-v2"


def text_hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


async def get_or_create_profile_embedding(
    db: Client,
    *,
    user_id: str,
    profile_text: str,
) -> list[float]:
    profile_hash = text_hash(profile_text)
    existing = (
        db.table("user_recommendation_profiles")
        .select("embedding, profile_hash")
        .eq("user_id", user_id)
        .execute()
    )
    if existing.data and existing.data[0].get("profile_hash") == profile_hash:
        return existing.data[0]["embedding"]

    embedding = await embed_service.embed_query(profile_text)
    payload = {
        "user_id": user_id,
        "model_name": EMBED_MODEL,
        "profile_text": profile_text,
        "profile_hash": profile_hash,
        "embedding": embedding,
    }
    if existing.data:
        db.table("user_recommendation_profiles").update(payload).eq("user_id", user_id).execute()
    else:
        db.table("user_recommendation_profiles").insert(payload).execute()
    return embedding


async def get_or_create_lesson_embeddings(
    db: Client,
    lessons: list[dict[str, Any]],
    passages: list[str],
) -> list[list[float]]:
    lesson_ids = [lesson["id"] for lesson in lessons]
    cached = (
        db.table("lesson_embedding_cache")
        .select("lesson_id, content_hash, embedding")
        .in_("lesson_id", lesson_ids)
        .execute()
    )
    cache_map = {item["lesson_id"]: item for item in (cached.data or [])}

    results: list[list[float]] = []
    missing_indices: list[int] = []
    missing_passages: list[str] = []

    for index, (lesson, passage) in enumerate(zip(lessons, passages)):
        passage_hash = text_hash(passage)
        cached_item = cache_map.get(lesson["id"])
        if cached_item and cached_item.get("content_hash") == passage_hash:
            results.append(cached_item["embedding"])
            continue

        results.append([])
        missing_indices.append(index)
        missing_passages.append(passage)

    if missing_passages:
        new_embeddings = await embed_service.embed_passages(missing_passages)
        for idx, embedding in zip(missing_indices, new_embeddings):
            lesson = lessons[idx]
            passage = passages[idx]
            payload = {
                "lesson_id": lesson["id"],
                "model_name": EMBED_MODEL,
                "content_hash": text_hash(passage),
                "embedding": embedding,
            }
            if cache_map.get(lesson["id"]):
                db.table("lesson_embedding_cache").update(payload).eq("lesson_id", lesson["id"]).execute()
            else:
                db.table("lesson_embedding_cache").insert(payload).execute()
            results[idx] = embedding

    return results
