"""NVIDIA Nemotron Reward Model — human-preference-aligned quality scoring

Uses nvidia/llama-3.1-nemotron-70b-reward to score the quality of user
responses in business English coaching sessions.

CRITICAL API DETAILS (from NVIDIA docs):
- Endpoint: POST https://integrate.api.nvidia.com/v1/chat/completions
- Messages MUST end with an "assistant" role message (the response being scored)
- The model outputs a single string: "reward:<float>" (e.g., "reward:-19.875")
- Score range is typically -20 to +20 (not 0-1) — normalize accordingly
- Max input: 4,096 tokens
- Trained on HelpSteer2 dataset; production-ready under Llama 3.1 license

For SpeakFlow: we send the coaching scenario as the user message and
the learner's spoken/typed response as the assistant message. The reward
score tells us how good their response is relative to human preferences.

Fails open: scoring errors return None (caller uses Riva/NIM score instead).
"""
import os
from openai import AsyncOpenAI

# Typical reward score range for Nemotron 70B
_SCORE_MIN = -20.0
_SCORE_MAX = 20.0


class NvidiaNemotronRewardService:
    """
    Human-preference-aligned quality scoring via NVIDIA Nemotron 70B Reward.

    Evaluates user spoken/typed responses in business English coaching.
    Returns None on any failure — caller uses Riva/NIM scores as fallback.
    """

    def __init__(self):
        api_key = os.environ.get("NVIDIA_NIM_API_KEY") or os.environ.get("NVIDIA_API_KEY", "PENDING")
        self.client = AsyncOpenAI(
            api_key=api_key,
            base_url="https://integrate.api.nvidia.com/v1",
        )
        self.model = "nvidia/llama-3.1-nemotron-70b-reward"
        self.enabled = api_key not in ("PENDING", "")

    async def score_user_response(
        self,
        user_response: str,
        context_prompt: str,
        ideal_response: str = "",
    ) -> dict | None:
        """
        Score a user's business English response using human preference alignment.

        IMPORTANT: messages must end with the assistant turn (user_response)
        because the Nemotron reward model evaluates the last assistant message.

        Args:
            user_response: What the user actually said/wrote (this is the "assistant" turn)
            context_prompt: The coaching scenario/question (this is the "user" turn)
            ideal_response: Unused (kept for API compatibility)

        Returns:
            {
                "raw_score": float,       # Raw reward score (-20 to +20)
                "overall_score": int,     # Normalized 0-100 SpeakFlow Quality Score
                "quality_tier": str,      # "excellent" | "good" | "developing" | "needs_work"
            }
            Returns None on API failure (caller uses fallback scoring).
        """
        if not self.enabled or not user_response.strip():
            return None

        # CRITICAL: messages must end with assistant role
        messages = [
            {
                "role": "user",
                "content": context_prompt.strip()[:300] or "Business English practice scenario",
            },
            {
                "role": "assistant",
                "content": user_response.strip()[:1000],
            },
        ]

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_tokens=1,
            )

            content = (response.choices[0].message.content or "").strip()
            raw_score = self._parse_reward_string(content)

            if raw_score is None:
                return None

            # Normalize from [-20, +20] range to [0, 100]
            clamped = max(_SCORE_MIN, min(_SCORE_MAX, raw_score))
            overall_score = int((clamped - _SCORE_MIN) / (_SCORE_MAX - _SCORE_MIN) * 100)

            tier = (
                "excellent" if overall_score >= 85 else
                "good" if overall_score >= 70 else
                "developing" if overall_score >= 50 else
                "needs_work"
            )

            return {
                "raw_score": raw_score,
                "overall_score": overall_score,
                "quality_tier": tier,
            }

        except Exception:
            return None

    async def score_coaching_feedback(
        self,
        coaching_prompt: str,
        feedback_text: str,
    ) -> float | None:
        """
        Score the quality of Max's coaching feedback on a scale 0.0–1.0.

        Returns None on failure (show all feedback if scoring unavailable).
        """
        if not self.enabled or not feedback_text.strip():
            return None

        # CRITICAL: messages must end with assistant role (feedback being scored)
        messages = [
            {
                "role": "user",
                "content": coaching_prompt.strip()[:300] or "Evaluate business English coaching feedback",
            },
            {
                "role": "assistant",
                "content": feedback_text.strip()[:800],
            },
        ]

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_tokens=1,
            )
            content = (response.choices[0].message.content or "").strip()
            raw_score = self._parse_reward_string(content)
            if raw_score is None:
                return None
            # Normalize to 0-1
            clamped = max(_SCORE_MIN, min(_SCORE_MAX, raw_score))
            return (clamped - _SCORE_MIN) / (_SCORE_MAX - _SCORE_MIN)
        except Exception:
            return None

    def _parse_reward_string(self, content: str) -> float | None:
        """
        Parse Nemotron reward model output.

        ACTUAL API FORMAT: "reward:<float>" e.g. "reward:-19.875" or "reward:5.25"
        The model always returns exactly this format with 1 completion token.
        """
        if not content:
            return None

        content_lower = content.lower().strip()

        # Primary: "reward:<float>" format (documented API response)
        if content_lower.startswith("reward:"):
            try:
                return float(content_lower.split("reward:", 1)[1].strip())
            except (ValueError, IndexError):
                return None

        # Fallback: bare float (in case model omits prefix)
        try:
            return float(content_lower.split()[0])
        except (ValueError, IndexError):
            return None


reward_service = NvidiaNemotronRewardService()
