"""Tests for NvidiaNimService — 4 tests"""
import os
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

# Set required env vars before importing
os.environ.setdefault("NVIDIA_NIM_API_KEY", "test-nim-api-key")

import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.nvidia_nim import NvidiaNimService, ConversationFeedback, ConversationTurn


@pytest.fixture
def nim_service():
    """Create NvidiaNimService with test env vars."""
    return NvidiaNimService()


# Test 1: get_conversation_response parses valid JSON response correctly
@pytest.mark.asyncio
async def test_get_conversation_response_valid_json(nim_service):
    """Test that valid JSON response from NIM is correctly parsed."""
    mock_json_response = '''{
        "response": "Thank you for sharing that. Could you tell me more about your team leadership experience?",
        "grammar_feedback": "Your grammar is correct! Well-structured sentence.",
        "vocabulary_suggestions": "Consider using: 'spearheaded', 'orchestrated', 'championed' instead of 'led'",
        "fp_multiplier": 1.5,
        "overall_score": 78
    }'''

    mock_message = MagicMock()
    mock_message.content = mock_json_response

    mock_choice = MagicMock()
    mock_choice.message = mock_message

    mock_completion = MagicMock()
    mock_completion.choices = [mock_choice]

    mock_client = MagicMock()
    mock_client.chat = MagicMock()
    mock_client.chat.completions = MagicMock()
    mock_client.chat.completions.create = AsyncMock(return_value=mock_completion)

    nim_service.client = mock_client

    result = await nim_service.get_conversation_response(
        lesson_system_prompt="You are an HR interviewer.",
        conversation_history=[],
        user_message="I have led multiple cross-functional teams in product development.",
    )

    assert isinstance(result, ConversationFeedback)
    assert "leadership" in result.response.lower() or "thank" in result.response.lower()
    assert result.fp_multiplier == 1.5
    assert result.overall_score == 78
    assert len(result.grammar_feedback) > 0


# Test 2: _parse_structured_response handles malformed JSON with regex fallback
def test_parse_structured_response_fallback(nim_service):
    """Test that regex fallback works when JSON is malformed."""
    malformed_raw = '''Some preamble text here.
    "response": "I see, that is interesting. Please continue.",
    "grammar_feedback": "Consider using 'I have been' instead of 'I was'",
    "vocabulary_suggestions": "Use 'collaborate' instead of 'work with'",
    "fp_multiplier": 1.2,
    "overall_score": 72
    Some trailing text.'''

    result = nim_service._parse_structured_response(malformed_raw, "test message")

    assert isinstance(result, ConversationFeedback)
    assert result.fp_multiplier == 1.2
    assert result.overall_score == 72
    # Should clamp to valid range
    assert 0.5 <= result.fp_multiplier <= 2.0
    assert 0 <= result.overall_score <= 100


# Test 3: get_conversation_response handles API failure gracefully
@pytest.mark.asyncio
async def test_get_conversation_response_api_failure(nim_service):
    """Test that API failures return a graceful fallback response."""
    mock_client = MagicMock()
    mock_client.chat = MagicMock()
    mock_client.chat.completions = MagicMock()
    mock_client.chat.completions.create = AsyncMock(
        side_effect=Exception("API connection failed")
    )

    nim_service.client = mock_client

    result = await nim_service.get_conversation_response(
        lesson_system_prompt="You are an interviewer.",
        conversation_history=[],
        user_message="My experience includes project management.",
    )

    # Should return fallback, not raise exception
    assert isinstance(result, ConversationFeedback)
    assert len(result.response) > 0
    assert result.fp_multiplier == 1.0
    assert result.overall_score == 50


# Test 4: _build_system_prompt includes lesson prompt and JSON format instruction
def test_build_system_prompt_includes_required_elements(nim_service):
    """Test that built system prompt contains lesson context and JSON format."""
    lesson_prompt = "You are a strict technical interviewer at Google."

    system_prompt = nim_service._build_system_prompt(lesson_prompt)

    # Must include the lesson context
    assert lesson_prompt in system_prompt

    # Must include JSON format instruction
    assert "json" in system_prompt.lower() or "JSON" in system_prompt

    # Must mention all required JSON fields
    assert "response" in system_prompt
    assert "grammar_feedback" in system_prompt
    assert "vocabulary_suggestions" in system_prompt
    assert "fp_multiplier" in system_prompt
    assert "overall_score" in system_prompt

    # Should mention Max the coach
    assert "Max" in system_prompt or "coach" in system_prompt.lower()
