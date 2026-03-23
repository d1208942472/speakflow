"""Tests for NVIDIA Nemotron Reward Model service."""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch


def test_reward_service_init():
    from services.nvidia_reward import NvidiaNemotronRewardService
    service = NvidiaNemotronRewardService()
    assert service.model == "nvidia/llama-3.1-nemotron-70b-reward"


@pytest.mark.asyncio
async def test_disabled_service_returns_none():
    from services.nvidia_reward import NvidiaNemotronRewardService
    service = NvidiaNemotronRewardService()
    service.enabled = False

    result = await service.score_user_response(
        user_response="I would like to present our results.",
        context_prompt="Present the Q4 results",
    )
    assert result is None


@pytest.mark.asyncio
async def test_api_failure_returns_none():
    """Reward model failure must return None (caller uses fallback scoring)."""
    from services.nvidia_reward import NvidiaNemotronRewardService
    service = NvidiaNemotronRewardService()
    service.enabled = True

    with patch.object(service.client.chat.completions, "create", new=AsyncMock(side_effect=Exception("timeout"))):
        result = await service.score_user_response(
            user_response="Good morning everyone.",
            context_prompt="Start a meeting",
        )

    assert result is None


def test_parse_reward_string_documented_format():
    """Nemotron reward model returns 'reward:<float>' format (per NVIDIA docs)."""
    from services.nvidia_reward import NvidiaNemotronRewardService
    service = NvidiaNemotronRewardService()

    # Primary format from NVIDIA docs
    assert service._parse_reward_string("reward:-19.875") == pytest.approx(-19.875)
    assert service._parse_reward_string("reward:5.25") == pytest.approx(5.25)
    assert service._parse_reward_string("reward:0.0") == pytest.approx(0.0)
    assert service._parse_reward_string("REWARD:12.5") == pytest.approx(12.5)  # case-insensitive


def test_parse_reward_string_bare_float_fallback():
    """Bare float fallback if model omits 'reward:' prefix."""
    from services.nvidia_reward import NvidiaNemotronRewardService
    service = NvidiaNemotronRewardService()

    assert service._parse_reward_string("5.5") == pytest.approx(5.5)
    assert service._parse_reward_string("-3.0") == pytest.approx(-3.0)


def test_parse_reward_string_empty_returns_none():
    from services.nvidia_reward import NvidiaNemotronRewardService
    service = NvidiaNemotronRewardService()

    assert service._parse_reward_string("") is None


@pytest.mark.asyncio
async def test_score_normalizes_to_0_100():
    """Score from [-20,+20] range must be normalized to [0,100]."""
    from services.nvidia_reward import NvidiaNemotronRewardService
    service = NvidiaNemotronRewardService()
    service.enabled = True

    # Highest possible score: +20 → 100
    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = "reward:20.0"

    with patch.object(service.client.chat.completions, "create", new=AsyncMock(return_value=mock_response)):
        result = await service.score_user_response(
            user_response="I'd like to present our Q4 financial results. Our revenue increased by 15%.",
            context_prompt="Present Q4 results to the board",
        )

    assert result is not None
    assert result["overall_score"] == 100
    assert result["quality_tier"] == "excellent"
    assert result["raw_score"] == pytest.approx(20.0)


@pytest.mark.asyncio
async def test_score_minimum_value():
    """Lowest possible score: -20 → 0."""
    from services.nvidia_reward import NvidiaNemotronRewardService
    service = NvidiaNemotronRewardService()
    service.enabled = True

    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = "reward:-20.0"

    with patch.object(service.client.chat.completions, "create", new=AsyncMock(return_value=mock_response)):
        result = await service.score_user_response(
            user_response="bad response",
            context_prompt="some task",
        )

    assert result is not None
    assert result["overall_score"] == 0
    assert result["quality_tier"] == "needs_work"


@pytest.mark.asyncio
async def test_quality_tier_mapping():
    """Tier thresholds: excellent>=85, good>=70, developing>=50, needs_work<50."""
    from services.nvidia_reward import NvidiaNemotronRewardService
    service = NvidiaNemotronRewardService()
    service.enabled = True

    # score=14.0 → normalized to (14+20)/40*100 = 85 → excellent
    for raw_score, expected_tier in [("14.0", "excellent"), ("8.0", "good"), ("0.0", "developing"), ("-5.0", "needs_work")]:
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = f"reward:{raw_score}"

        with patch.object(service.client.chat.completions, "create", new=AsyncMock(return_value=mock_response)):
            result = await service.score_user_response("test", "scenario")

        assert result is not None
        assert result["quality_tier"] == expected_tier, f"raw={raw_score} expected tier={expected_tier} got={result['quality_tier']}"


@pytest.mark.asyncio
async def test_empty_response_returns_none():
    from services.nvidia_reward import NvidiaNemotronRewardService
    service = NvidiaNemotronRewardService()
    service.enabled = True

    result = await service.score_user_response(
        user_response="   ",
        context_prompt="Say something",
    )
    assert result is None
