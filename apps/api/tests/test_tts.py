"""Tests for NvidiaTTSService — 5 tests"""
import os
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

os.environ.setdefault("NVIDIA_API_KEY", "test-api-key")

import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.nvidia_tts import NvidiaTTSService


@pytest.fixture
def tts_service():
    return NvidiaTTSService()


# Test 1: synthesize returns audio bytes from mocked client
@pytest.mark.asyncio
async def test_synthesize_returns_bytes(tts_service):
    """Test that synthesize calls the TTS API and returns bytes."""
    fake_audio = b"ID3\x03\x00\x00\x00\x00fake_mp3_content"

    mock_response = MagicMock()
    mock_response.content = fake_audio

    with patch.object(tts_service.client.audio.speech, "create", new=AsyncMock(return_value=mock_response)):
        result = await tts_service.synthesize("Hello, great pronunciation!")

    assert result == fake_audio
    assert isinstance(result, bytes)


# Test 2: synthesize with empty text returns empty bytes
@pytest.mark.asyncio
async def test_synthesize_empty_text_returns_empty(tts_service):
    """Test that empty text returns empty bytes without calling API."""
    result = await tts_service.synthesize("")
    assert result == b""


# Test 3: synthesize truncates text to 4096 characters
@pytest.mark.asyncio
async def test_synthesize_truncates_long_text(tts_service):
    """Test that very long text is truncated before sending to TTS API."""
    long_text = "x" * 6000
    fake_audio = b"fake_audio"

    mock_response = MagicMock()
    mock_response.content = fake_audio

    captured_call = {}

    async def mock_create(**kwargs):
        captured_call.update(kwargs)
        return mock_response

    with patch.object(tts_service.client.audio.speech, "create", new=mock_create):
        await tts_service.synthesize(long_text)

    assert len(captured_call["input"]) <= 4096


# Test 4: synthesize uses default male-1 voice for Max
@pytest.mark.asyncio
async def test_synthesize_uses_default_voice(tts_service):
    """Test that the default voice is male-1 (Max's voice)."""
    assert tts_service.default_voice == "male-1"

    fake_audio = b"fake_audio"
    mock_response = MagicMock()
    mock_response.content = fake_audio

    captured_call = {}

    async def mock_create(**kwargs):
        captured_call.update(kwargs)
        return mock_response

    with patch.object(tts_service.client.audio.speech, "create", new=mock_create):
        await tts_service.synthesize("Great work!")

    assert captured_call["voice"] == "male-1"


# Test 5: synthesize_coaching truncates to 500 characters
@pytest.mark.asyncio
async def test_synthesize_coaching_truncates_to_500(tts_service):
    """Test that coaching audio is truncated to 500 chars for brevity."""
    long_feedback = "Your pronunciation was excellent! " * 30  # ~990 chars

    fake_audio = b"coaching_audio"
    mock_response = MagicMock()
    mock_response.content = fake_audio

    captured_call = {}

    async def mock_create(**kwargs):
        captured_call.update(kwargs)
        return mock_response

    with patch.object(tts_service.client.audio.speech, "create", new=mock_create):
        await tts_service.synthesize_coaching(long_feedback)

    assert len(captured_call["input"]) <= 500
