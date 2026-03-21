"""Tests for NvidiaRivaService — 6 tests"""
import os
import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch

# Set required env vars before importing the module
os.environ.setdefault("NVIDIA_API_KEY", "test-api-key")
os.environ.setdefault("RIVA_ASR_FUNCTION_ID", "1598d209-5e27-4d3c-8079-4751568b1081")

import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.nvidia_riva import NvidiaRivaService, PronunciationResult


@pytest.fixture
def riva_service():
    """Create a NvidiaRivaService instance with test env vars."""
    return NvidiaRivaService()


# Test 1: transcribe_audio returns correct transcript from mocked API
@pytest.mark.asyncio
async def test_transcribe_audio_success(riva_service):
    """Test that transcribe_audio correctly parses the Riva API response."""
    mock_response_data = {
        "results": [
            {
                "alternatives": [
                    {"transcript": "I have five years of experience in software engineering"}
                ]
            }
        ]
    }

    mock_response = MagicMock()
    mock_response.json.return_value = mock_response_data
    mock_response.raise_for_status = MagicMock()

    with patch("httpx.AsyncClient") as mock_client_class:
        mock_client = AsyncMock()
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=None)
        mock_client.post = AsyncMock(return_value=mock_response)
        mock_client_class.return_value = mock_client

        result = await riva_service.transcribe_audio(b"fake_audio_bytes", "wav")

    assert result == "I have five years of experience in software engineering"


# Test 2: transcribe_audio handles empty results gracefully
@pytest.mark.asyncio
async def test_transcribe_audio_empty_results(riva_service):
    """Test that empty API results return empty string."""
    mock_response = MagicMock()
    mock_response.json.return_value = {"results": []}
    mock_response.raise_for_status = MagicMock()

    with patch("httpx.AsyncClient") as mock_client_class:
        mock_client = AsyncMock()
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=None)
        mock_client.post = AsyncMock(return_value=mock_response)
        mock_client_class.return_value = mock_client

        result = await riva_service.transcribe_audio(b"fake_audio", "wav")

    assert result == ""


# Test 3: _compute_pronunciation_score with perfect match
def test_compute_pronunciation_score_perfect_match(riva_service):
    """Test pronunciation score with transcript identical to target."""
    score = riva_service._compute_pronunciation_score(
        "I have been working in this field for five years",
        "I have been working in this field for five years",
    )
    assert score > 90.0
    assert score <= 100.0


# Test 4: _compute_pronunciation_score with partial match
def test_compute_pronunciation_score_partial_match(riva_service):
    """Test pronunciation score with partial word overlap."""
    score = riva_service._compute_pronunciation_score(
        "I working field five",
        "I have been working in this field for five years",
    )
    assert 0.0 < score < 100.0


# Test 5: score_pronunciation returns PronunciationResult with correct fields
@pytest.mark.asyncio
async def test_score_pronunciation_returns_full_result(riva_service):
    """Test that score_pronunciation returns a complete PronunciationResult."""
    mock_response = MagicMock()
    mock_response.json.return_value = {
        "results": [
            {
                "alternatives": [
                    {"transcript": "I am excited about this opportunity"}
                ]
            }
        ]
    }
    mock_response.raise_for_status = MagicMock()

    with patch("httpx.AsyncClient") as mock_client_class:
        mock_client = AsyncMock()
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=None)
        mock_client.post = AsyncMock(return_value=mock_response)
        mock_client_class.return_value = mock_client

        result = await riva_service.score_pronunciation(
            b"fake_audio",
            "I am excited about this opportunity",
        )

    assert isinstance(result, PronunciationResult)
    assert result.transcript == "I am excited about this opportunity"
    assert 0.0 <= result.pronunciation_score <= 100.0
    assert 0.0 <= result.fluency_score <= 100.0
    assert isinstance(result.word_scores, list)
    assert isinstance(result.feedback_summary, str)
    assert len(result.feedback_summary) > 0


# Test 6: _generate_basic_feedback returns appropriate messages for different score ranges
def test_generate_basic_feedback_score_ranges(riva_service):
    """Test feedback messages for various score ranges."""
    excellent_feedback = riva_service._generate_basic_feedback(95.0)
    good_feedback = riva_service._generate_basic_feedback(80.0)
    decent_feedback = riva_service._generate_basic_feedback(65.0)
    poor_feedback = riva_service._generate_basic_feedback(45.0)
    very_poor_feedback = riva_service._generate_basic_feedback(20.0)

    # Each feedback level should be different
    assert excellent_feedback != poor_feedback
    assert good_feedback != very_poor_feedback

    # Excellent score should have positive language
    assert any(
        word in excellent_feedback.lower()
        for word in ["excellent", "great", "outstanding", "perfect", "clear"]
    )

    # Poor score should have encouraging language
    assert any(
        word in very_poor_feedback.lower()
        for word in ["practice", "keep", "try", "time"]
    )
