"""NVIDIA NemoGuard Topic Control — keep SpeakFlow sessions on business English

Uses nvidia/llama-3.1-nemoguard-8b-topic-control to detect when users drift
off-topic (e.g., asking about unrelated subjects, trying to use the coaching AI
as a general-purpose chatbot).

Unlike Llama Guard (content safety), NemoGuard focuses on TOPIC relevance:
  - Is this message related to: English learning, business communication,
    presentations, meetings, negotiations, interviews, professional writing?

Behavior:
  - on_topic=True: message is relevant → proceed normally
  - on_topic=False: coach redirects user back to business English practice
  - Fails open: API errors always return on_topic=True (never block learners)
"""
import os
from openai import AsyncOpenAI

# Topics that are in-scope for SpeakFlow
_ALLOWED_TOPICS = """- Business English communication
- Professional meetings and presentations
- Email and written business communication
- Job interviews and career conversations
- Negotiations and client interactions
- English grammar, vocabulary, and pronunciation
- Business vocabulary and idioms
- Workplace conversations and etiquette
- English learning strategies and practice"""

_SYSTEM_PROMPT = f"""You are a topic classifier for SpeakFlow, a business English learning app.

Your ONLY job is to determine if a user message is related to:
{_ALLOWED_TOPICS}

Reply with exactly one of these two values:
- "on-topic" if the message relates to any of the above
- "off-topic" if the message is about something completely unrelated to English learning or business communication

Examples:
- "How do I say 'let's table this discussion'?" → on-topic
- "Can you help me with my presentation skills?" → on-topic
- "What's the weather like today?" → off-topic
- "Can you write my code for me?" → off-topic
- "I need to practice for a job interview" → on-topic
"""


class NvidiaNemoGuardService:
    """
    Topic control layer using NVIDIA NemoGuard 8B.

    Keeps coaching sessions focused on business English. Returns a
    (on_topic, redirect_message) tuple. When off_topic, redirect_message
    contains a polite coaching nudge back to the lesson.
    """

    def __init__(self):
        api_key = os.environ.get("NVIDIA_NIM_API_KEY") or os.environ.get("NVIDIA_API_KEY", "PENDING")
        self.client = AsyncOpenAI(
            api_key=api_key,
            base_url="https://integrate.api.nvidia.com/v1",
        )
        self.model = "nvidia/llama-3.1-nemoguard-8b-topic-control"
        self.enabled = api_key not in ("PENDING", "")

    async def check_topic(self, user_message: str) -> tuple[bool, str]:
        """
        Check if a user message is on-topic for business English coaching.

        Returns:
            (on_topic: bool, redirect_message: str)
            - on_topic=True, redirect_message="": proceed normally
            - on_topic=False, redirect_message="...": coach redirects user

        Fails open: API errors return (True, "") — never block learners.
        """
        if not self.enabled or not user_message.strip():
            return True, ""

        # Short messages (greetings, single words) are always on_topic
        if len(user_message.strip()) < 15:
            return True, ""

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": _SYSTEM_PROMPT},
                    {"role": "user", "content": user_message.strip()[:500]},
                ],
                max_tokens=10,
                temperature=0.0,
            )
            result = (response.choices[0].message.content or "").strip().lower()

            if "off-topic" in result:
                redirect = (
                    "Let's keep our practice focused on business English! "
                    "I'm Max, your speaking coach — I'm best at helping with presentations, "
                    "meetings, emails, and professional conversations. "
                    "What would you like to practice today?"
                )
                return False, redirect

            return True, ""

        except Exception:
            # Fail open — topic drift is annoying but API unavailability is worse
            return True, ""


nemoguard_service = NvidiaNemoGuardService()
