"""NVIDIA NIM Embeddings — semantic lesson recommendation for SpeakFlow

Uses nvidia/llama-3.2-nv-embedqa-1b-v2 (NIM OpenAI-compatible endpoint) to:
1. Embed user's learning profile (performance history, weak areas, scenario preferences)
2. Embed lesson descriptions
3. Rank lessons by cosine similarity → surface the most relevant next lesson

This powers the /recommend/next-lesson endpoint — users get AI-selected lessons
that match their current level and address their specific grammar/vocabulary gaps.

Model: nvidia/llama-3.2-nv-embedqa-1b-v2
- Max context: 8,192 tokens
- Output dimensions: up to 2048 (Matryoshka embeddings)
- Languages: 26 (matches our Riva ASR multilingual coverage)
- `input_type` is REQUIRED: "query" for search, "passage" for documents
"""
import os
import math
from openai import AsyncOpenAI


class NvidiaEmbedService:
    """
    NVIDIA NIM embedding service using llama-3.2-nv-embedqa-1b-v2.

    Upgraded from nv-embedqa-e5-v5 for:
    - 26-language multilingual support (matches Riva ASR languages)
    - Configurable output dimensions (up to 2048)
    - Longer context window (8,192 tokens)

    Supports two input_type modes per the model spec:
    - "query"   : embed the user profile/query
    - "passage" : embed lesson descriptions to be retrieved
    """

    def __init__(self):
        api_key = os.environ.get("NVIDIA_NIM_API_KEY") or os.environ.get("NVIDIA_API_KEY", "PENDING")
        self.client = AsyncOpenAI(
            api_key=api_key,
            base_url="https://integrate.api.nvidia.com/v1",
        )
        self.model = "nvidia/llama-3.2-nv-embedqa-1b-v2"

    async def embed_query(self, text: str) -> list[float]:
        """
        Embed a user query / learning profile.
        Truncates at 512 chars to stay within model limits.
        """
        truncated = text.strip()[:2000]  # Model supports 8192 tokens; 2000 chars is safe
        response = await self.client.embeddings.create(
            model=self.model,
            input=[truncated],
            extra_body={"input_type": "query", "truncate": "END"},
        )
        return response.data[0].embedding

    async def embed_passages(self, texts: list[str]) -> list[list[float]]:
        """
        Embed a batch of lesson descriptions (passages).
        NIM supports up to 50 inputs per call.
        """
        if not texts:
            return []

        # Truncate each passage
        truncated = [t.strip()[:2000] for t in texts]  # 8192 token context

        # Batch in chunks of 50 (NIM limit)
        all_embeddings: list[list[float]] = []
        chunk_size = 50
        for i in range(0, len(truncated), chunk_size):
            chunk = truncated[i : i + chunk_size]
            response = await self.client.embeddings.create(
                model=self.model,
                input=chunk,
                extra_body={"input_type": "passage", "truncate": "END"},
            )
            # NIM returns embeddings in order
            chunk_embeddings = [item.embedding for item in sorted(response.data, key=lambda x: x.index)]
            all_embeddings.extend(chunk_embeddings)

        return all_embeddings


def cosine_similarity(a: list[float], b: list[float]) -> float:
    """Compute cosine similarity between two vectors."""
    dot = sum(x * y for x, y in zip(a, b))
    mag_a = math.sqrt(sum(x * x for x in a))
    mag_b = math.sqrt(sum(x * x for x in b))
    if mag_a == 0 or mag_b == 0:
        return 0.0
    return dot / (mag_a * mag_b)


def build_user_learning_profile(
    recent_scores: list[int],
    grammar_feedback: list[str],
    vocabulary_feedback: list[str],
    completed_scenarios: list[str],
    target_scenario: str | None = None,
) -> str:
    """
    Build a natural language representation of the user's learning state.
    This will be embedded as the query vector for recommendation.
    """
    avg_score = sum(recent_scores) / len(recent_scores) if recent_scores else 50
    level = "beginner" if avg_score < 50 else "intermediate" if avg_score < 75 else "advanced"

    # Summarize recurring issues from feedback
    feedback_sample = " ".join(grammar_feedback[-3:] + vocabulary_feedback[-3:])

    completed_str = ", ".join(set(completed_scenarios[-5:])) if completed_scenarios else "none yet"

    profile = (
        f"Business English learner at {level} level. "
        f"Average pronunciation score: {avg_score:.0f}/100. "
        f"Recent coaching feedback: {feedback_sample[:200]}. "
        f"Recently practiced scenarios: {completed_str}. "
    )

    if target_scenario:
        profile += f"Interested in practicing: {target_scenario}. "

    return profile


embed_service = NvidiaEmbedService()
