"""Tests for NVIDIA NemoGuard topic control service."""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch


def test_nemoguard_service_init():
    from services.nvidia_nemoguard import NvidiaNemoGuardService
    service = NvidiaNemoGuardService()
    assert service.model == "nvidia/llama-3.1-nemoguard-8b-topic-control"


@pytest.mark.asyncio
async def test_on_topic_message_returns_true():
    from services.nvidia_nemoguard import NvidiaNemoGuardService
    service = NvidiaNemoGuardService()
    service.enabled = True

    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    # NemoGuard API returns "on-topic" (hyphen, not underscore)
    mock_response.choices[0].message.content = "on-topic"

    with patch.object(service.client.chat.completions, "create", new=AsyncMock(return_value=mock_response)):
        on_topic, redirect = await service.check_topic("How do I present Q4 results in a meeting?")

    assert on_topic is True
    assert redirect == ""


@pytest.mark.asyncio
async def test_off_topic_message_returns_redirect():
    from services.nvidia_nemoguard import NvidiaNemoGuardService
    service = NvidiaNemoGuardService()
    service.enabled = True

    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    # NemoGuard API returns "off-topic" (hyphen, not underscore)
    mock_response.choices[0].message.content = "off-topic"

    with patch.object(service.client.chat.completions, "create", new=AsyncMock(return_value=mock_response)):
        on_topic, redirect = await service.check_topic("What is the capital of France?")

    assert on_topic is False
    assert len(redirect) > 0
    assert "business English" in redirect.lower() or "english" in redirect.lower()


@pytest.mark.asyncio
async def test_api_failure_fails_open():
    """NemoGuard must fail open — topic drift is not a blocking error."""
    from services.nvidia_nemoguard import NvidiaNemoGuardService
    service = NvidiaNemoGuardService()
    service.enabled = True

    with patch.object(service.client.chat.completions, "create", new=AsyncMock(side_effect=Exception("timeout"))):
        on_topic, redirect = await service.check_topic("Random off-topic question here")

    assert on_topic is True
    assert redirect == ""


@pytest.mark.asyncio
async def test_disabled_service_skips_check():
    """When API key is PENDING, topic check should pass through."""
    from services.nvidia_nemoguard import NvidiaNemoGuardService
    service = NvidiaNemoGuardService()
    service.enabled = False

    on_topic, redirect = await service.check_topic("anything")
    assert on_topic is True


@pytest.mark.asyncio
async def test_short_message_skips_api():
    """Messages under 15 chars skip the API call (likely greetings)."""
    from services.nvidia_nemoguard import NvidiaNemoGuardService
    service = NvidiaNemoGuardService()
    service.enabled = True

    called = []
    async def mock_create(**kwargs):
        called.append(True)
        raise AssertionError("API should not be called for short message")

    with patch.object(service.client.chat.completions, "create", new=mock_create):
        on_topic, redirect = await service.check_topic("Hi")

    assert on_topic is True
    assert len(called) == 0


@pytest.mark.asyncio
async def test_business_english_phrases_are_on_topic():
    """All business English phrases should be on_topic."""
    from services.nvidia_nemoguard import NvidiaNemoGuardService
    service = NvidiaNemoGuardService()
    service.enabled = True

    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = "on-topic"

    business_phrases = [
        "I'd like to present our quarterly results to the board.",
        "Could we reschedule the client meeting to next Thursday?",
        "What's the most professional way to decline a meeting request?",
        "I need help with my presentation skills for the conference.",
    ]

    with patch.object(service.client.chat.completions, "create", new=AsyncMock(return_value=mock_response)):
        for phrase in business_phrases:
            on_topic, _ = await service.check_topic(phrase)
            assert on_topic is True, f"Business phrase incorrectly flagged as off-topic: {phrase}"
