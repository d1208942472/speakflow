"""NVIDIA Llama Guard 4 — content safety for SpeakFlow conversations

Uses meta/llama-guard-4-12b (NIM) to screen user speech transcripts
before they're sent to the main coaching model. This prevents coaching sessions
from drifting into inappropriate content.

Screening is non-blocking: if Llama Guard times out or fails, the session
continues (safe > blocking). Only explicit policy violations are flagged.

Llama Guard 4 improvements over 3-8b:
- 12B parameters: more nuanced content understanding
- Better multilingual coverage (25 languages — matches our Riva ASR)
- Reduced false positives on edge cases
- Supports image+text inputs (future vision integration)

Policy: _UNSAFE_CATEGORIES defines the hazards we screen for. Business English
coaching only needs: hate speech, violence, and sexual content filtering.
The model returns "safe" / "unsafe\nS{category_id}" format.
"""
import os
from openai import AsyncOpenAI

# Llama Guard 4 hazard categories we care about (subset relevant to an edtech app)
# Full ML Commons taxonomy — we screen all by default for edtech safety
_UNSAFE_CATEGORIES = """S1: Violent Crimes
S2: Non-Violent Crimes
S3: Sex Crimes
S4: Child Exploitation
S5: Defamation
S6: Specialized Advice
S7: Privacy
S8: Intellectual Property
S9: Indiscriminate Weapons
S10: Hate
S11: Self-Harm
S12: Sexual Content
S13: Elections
S14: Code Interpreter Abuse"""


class NvidiaGuardrailsService:
    """
    Content safety layer using NVIDIA Llama Guard 4 (12B).

    Upgraded from Llama Guard 3 (8B) for better multilingual accuracy
    and lower false-positive rate on business English content.
    """

    def __init__(self):
        api_key = os.environ.get("NVIDIA_NIM_API_KEY") or os.environ.get("NVIDIA_API_KEY", "PENDING")
        self.client = AsyncOpenAI(
            api_key=api_key,
            base_url="https://integrate.api.nvidia.com/v1",
        )
        self.model = "meta/llama-guard-4-12b"
        self.enabled = api_key not in ("PENDING", "")

    async def is_safe(self, user_message: str) -> tuple[bool, str]:
        """
        Check if a user message is safe to process.

        Returns:
            (is_safe: bool, reason: str)
            - is_safe=True: proceed normally
            - is_safe=False: block the message with `reason` for logging

        Fails open (returns True) on API errors to not disrupt learning sessions.
        """
        if not self.enabled or not user_message.strip():
            return True, ""

        # Truncate to avoid token limit issues
        message = user_message.strip()[:1000]

        prompt = f"""[INST] Task: Check if there is unsafe content in the 'User' messages in conversations according our safety policy with the below categories.

<BEGIN UNSAFE CONTENT CATEGORIES>
{_UNSAFE_CATEGORIES}
<END UNSAFE CONTENT CATEGORIES>

<BEGIN CONVERSATION>
User: {message}
<END CONVERSATION>

Provide your safety assessment for the above conversation:
- First line must read 'safe' or 'unsafe'.
- If unsafe, a second line must include a comma-separated list of violated categories. [/INST]"""

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=20,
                temperature=0.0,
            )
            result = (response.choices[0].message.content or "").strip().lower()

            if result.startswith("unsafe"):
                # Extract category codes from second line if present
                lines = result.split("\n")
                categories = lines[1].strip() if len(lines) > 1 else "unknown"
                return False, f"Content policy violation: {categories}"

            return True, ""

        except Exception:
            # Fail open: don't block legitimate English learners on API hiccups
            return True, ""


guardrails_service = NvidiaGuardrailsService()
