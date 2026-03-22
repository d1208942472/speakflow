"""Tests for NVIDIA Llama Guard 3 content safety service."""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch


def test_guardrails_service_init():
    from services.nvidia_guardrails import NvidiaGuardrailsService
    service = NvidiaGuardrailsService()
    assert service.model == "meta/llama-guard-3-8b"


@pytest.mark.asyncio
async def test_safe_message_returns_true():
    from services.nvidia_guardrails import NvidiaGuardrailsService
    service = NvidiaGuardrailsService()
    service.enabled = True

    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = "safe"

    with patch.object(service.client.chat.completions, "create", new=AsyncMock(return_value=mock_response)):
        is_safe, reason = await service.is_safe("Good morning, I have a meeting today.")

    assert is_safe is True
    assert reason == ""


@pytest.mark.asyncio
async def test_unsafe_message_returns_false():
    from services.nvidia_guardrails import NvidiaGuardrailsService
    service = NvidiaGuardrailsService()
    service.enabled = True

    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = "unsafe\nS10"

    with patch.object(service.client.chat.completions, "create", new=AsyncMock(return_value=mock_response)):
        is_safe, reason = await service.is_safe("I hate everyone in this office")

    assert is_safe is False
    assert "s10" in reason.lower()


@pytest.mark.asyncio
async def test_api_failure_fails_open():
    """Guardrails must fail open — never block legitimate learners on API errors."""
    from services.nvidia_guardrails import NvidiaGuardrailsService
    service = NvidiaGuardrailsService()
    service.enabled = True

    with patch.object(service.client.chat.completions, "create", new=AsyncMock(side_effect=Exception("timeout"))):
        is_safe, reason = await service.is_safe("Can we reschedule the meeting?")

    assert is_safe is True
    assert reason == ""


@pytest.mark.asyncio
async def test_empty_message_skips_api():
    """Empty messages should skip the API call entirely and return safe."""
    from services.nvidia_guardrails import NvidiaGuardrailsService
    service = NvidiaGuardrailsService()
    service.enabled = True

    called = []
    async def mock_create(**kwargs):
        called.append(True)
        raise AssertionError("API should not be called for empty message")

    with patch.object(service.client.chat.completions, "create", new=mock_create):
        is_safe, reason = await service.is_safe("   ")

    assert is_safe is True
    assert len(called) == 0


@pytest.mark.asyncio
async def test_disabled_service_skips_check():
    """When NVIDIA API key is PENDING, guardrails should pass through."""
    from services.nvidia_guardrails import NvidiaGuardrailsService
    service = NvidiaGuardrailsService()
    service.enabled = False  # API key not configured

    is_safe, reason = await service.is_safe("any message at all")
    assert is_safe is True


@pytest.mark.asyncio
async def test_business_english_is_safe():
    from services.nvidia_guardrails import NvidiaGuardrailsService
    service = NvidiaGuardrailsService()
    service.enabled = True

    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = "safe"

    business_phrases = [
        "I'd like to present our Q4 results.",
        "Could we schedule a follow-up meeting?",
        "The project timeline needs adjustment.",
        "I'm pleased to announce our new partnership.",
    ]

    with patch.object(service.client.chat.completions, "create", new=AsyncMock(return_value=mock_response)):
        for phrase in business_phrases:
            is_safe, _ = await service.is_safe(phrase)
            assert is_safe is True, f"Business phrase incorrectly flagged: {phrase}"
