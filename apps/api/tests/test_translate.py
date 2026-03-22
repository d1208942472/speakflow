"""Tests for NvidiaTranslateService — 5 tests"""
import os
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

os.environ.setdefault("NVIDIA_API_KEY", "test-api-key")

import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.nvidia_translate import NvidiaTranslateService, SUPPORTED_LANGS


@pytest.fixture
def translate_service():
    return NvidiaTranslateService()


# Test 1: translate returns translated text for supported language
@pytest.mark.asyncio
async def test_translate_supported_language(translate_service):
    """Test that translate calls NIM and returns translation for supported lang."""
    mock_choice = MagicMock()
    mock_choice.message.content = "您的语法很好！"

    mock_completion = MagicMock()
    mock_completion.choices = [mock_choice]

    with patch.object(
        translate_service.client.chat.completions, "create", new=AsyncMock(return_value=mock_completion)
    ):
        result = await translate_service.translate("Your grammar is great!", "zh")

    assert result == "您的语法很好！"


# Test 2: translate returns original text for unsupported language
@pytest.mark.asyncio
async def test_translate_unsupported_language_passthrough(translate_service):
    """Test that unsupported language codes pass through original text."""
    result = await translate_service.translate("Great work!", "xx")
    assert result == "Great work!"


# Test 3: translate returns original text when same language
@pytest.mark.asyncio
async def test_translate_same_language_passthrough(translate_service):
    """Test that source==target returns original without API call."""
    called = False

    async def mock_create(**kwargs):
        nonlocal called
        called = True
        return MagicMock()

    with patch.object(translate_service.client.chat.completions, "create", new=mock_create):
        result = await translate_service.translate("Hello", "en", source_lang="en")

    assert result == "Hello"
    assert not called  # should not call API


# Test 4: translate returns original text on API failure
@pytest.mark.asyncio
async def test_translate_falls_back_on_error(translate_service):
    """Test that API errors return original text (non-blocking)."""
    with patch.object(
        translate_service.client.chat.completions, "create",
        new=AsyncMock(side_effect=Exception("API error"))
    ):
        result = await translate_service.translate("Your pronunciation was excellent!", "ja")

    assert result == "Your pronunciation was excellent!"


# Test 5: SUPPORTED_LANGS includes key Asian languages
def test_supported_langs_includes_key_languages(translate_service):
    """Test that supported languages include the primary target markets."""
    assert "zh" in SUPPORTED_LANGS  # Chinese
    assert "ja" in SUPPORTED_LANGS  # Japanese
    assert "ko" in SUPPORTED_LANGS  # Korean
    assert "es" in SUPPORTED_LANGS  # Spanish
    assert len(SUPPORTED_LANGS) >= 10
