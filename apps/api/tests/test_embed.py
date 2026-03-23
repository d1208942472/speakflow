"""Tests for NVIDIA NIM Embedding service and recommendation utilities."""
import pytest
import math
from unittest.mock import AsyncMock, MagicMock, patch


# ─── Utility tests (no mocking needed) ──────────────────────────────────────

def test_cosine_similarity_identical():
    from services.nvidia_embed import cosine_similarity
    v = [1.0, 0.5, 0.3]
    assert abs(cosine_similarity(v, v) - 1.0) < 1e-9


def test_cosine_similarity_orthogonal():
    from services.nvidia_embed import cosine_similarity
    a = [1.0, 0.0]
    b = [0.0, 1.0]
    assert abs(cosine_similarity(a, b)) < 1e-9


def test_cosine_similarity_zero_vector():
    from services.nvidia_embed import cosine_similarity
    assert cosine_similarity([0.0, 0.0], [1.0, 2.0]) == 0.0


def test_cosine_similarity_range():
    """Cosine similarity between two realistic vectors stays in [-1, 1]."""
    from services.nvidia_embed import cosine_similarity
    import random
    random.seed(42)
    a = [random.gauss(0, 1) for _ in range(512)]
    b = [random.gauss(0, 1) for _ in range(512)]
    sim = cosine_similarity(a, b)
    assert -1.0 <= sim <= 1.0


def test_build_user_learning_profile_beginner():
    from services.nvidia_embed import build_user_learning_profile
    profile = build_user_learning_profile(
        recent_scores=[30, 40, 35],
        grammar_feedback=["Mix up past tense"],
        vocabulary_feedback=["Use more formal words"],
        completed_scenarios=["small_talk"],
    )
    assert "beginner" in profile
    assert "small_talk" in profile


def test_build_user_learning_profile_advanced():
    from services.nvidia_embed import build_user_learning_profile
    profile = build_user_learning_profile(
        recent_scores=[85, 90, 92],
        grammar_feedback=["Perfect grammar"],
        vocabulary_feedback=["Excellent vocabulary"],
        completed_scenarios=["job_interview", "negotiation", "presentation"],
    )
    assert "advanced" in profile


def test_build_user_learning_profile_empty():
    from services.nvidia_embed import build_user_learning_profile
    profile = build_user_learning_profile(
        recent_scores=[],
        grammar_feedback=[],
        vocabulary_feedback=[],
        completed_scenarios=[],
    )
    # Should not crash and should return a non-empty string
    assert isinstance(profile, str)
    assert len(profile) > 0


def test_build_user_learning_profile_with_target():
    from services.nvidia_embed import build_user_learning_profile
    profile = build_user_learning_profile(
        recent_scores=[70],
        grammar_feedback=[],
        vocabulary_feedback=[],
        completed_scenarios=[],
        target_scenario="negotiation",
    )
    assert "negotiation" in profile


# ─── Service tests (mocked NVIDIA API) ──────────────────────────────────────

@pytest.mark.asyncio
async def test_embed_query_calls_nvidia():
    from services.nvidia_embed import NvidiaEmbedService
    service = NvidiaEmbedService()

    mock_embedding = [0.1] * 1024  # llama-3.2-nv-embedqa-1b-v2 default 1024-dim
    mock_response = MagicMock()
    mock_response.data = [MagicMock(embedding=mock_embedding)]

    with patch.object(service.client.embeddings, "create", new=AsyncMock(return_value=mock_response)):
        result = await service.embed_query("Business English learner at intermediate level.")

    assert result == mock_embedding
    assert len(result) == 1024


@pytest.mark.asyncio
async def test_embed_passages_returns_ordered():
    from services.nvidia_embed import NvidiaEmbedService
    service = NvidiaEmbedService()

    emb1 = [1.0] * 1024
    emb2 = [0.5] * 1024
    mock_response = MagicMock()
    mock_response.data = [
        MagicMock(index=0, embedding=emb1),
        MagicMock(index=1, embedding=emb2),
    ]

    with patch.object(service.client.embeddings, "create", new=AsyncMock(return_value=mock_response)):
        result = await service.embed_passages(["lesson one", "lesson two"])

    assert result[0] == emb1
    assert result[1] == emb2


@pytest.mark.asyncio
async def test_embed_passages_empty_input():
    from services.nvidia_embed import NvidiaEmbedService
    service = NvidiaEmbedService()
    result = await service.embed_passages([])
    assert result == []


@pytest.mark.asyncio
async def test_embed_truncates_long_text():
    from services.nvidia_embed import NvidiaEmbedService
    service = NvidiaEmbedService()

    long_text = "x" * 1000  # exceeds 512 char limit
    captured = {}

    async def mock_create(**kwargs):
        captured["input"] = kwargs["input"]
        mock_resp = MagicMock()
        mock_resp.data = [MagicMock(embedding=[0.1] * 1024)]
        return mock_resp

    with patch.object(service.client.embeddings, "create", new=mock_create):
        await service.embed_query(long_text)

    assert len(captured["input"][0]) <= 2000  # Updated for 8192-token model
