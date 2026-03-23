"""NVIDIA Vision — slide and document analysis for SpeakFlow Pro

Uses meta/llama-3.2-11b-vision-instruct (NIM) to analyze presentation slides,
business documents, and visual content to generate coaching context.

Pro use cases:
1. Slide analyzer: User uploads a slide → Max understands the content and
   generates targeted English coaching for presenting that specific content
2. Document proofreader: User uploads a business document → Max checks
   professional English, suggests improvements
3. Presentation prep: User shares slide deck → Max helps practice the
   English needed to present each slide effectively

This service is Pro-only (requires is_pro=True).
"""
import base64
import os
from openai import AsyncOpenAI


class NvidiaVisionService:
    """
    Vision-language coaching using NVIDIA Llama 3.2 Vision 11B.

    Analyzes images (slides, documents, whiteboards) to generate
    contextual business English coaching.
    """

    def __init__(self):
        api_key = os.environ.get("NVIDIA_NIM_API_KEY") or os.environ.get("NVIDIA_API_KEY", "PENDING")
        self.client = AsyncOpenAI(
            api_key=api_key,
            base_url="https://integrate.api.nvidia.com/v1",
        )
        self.model = "meta/llama-3.2-11b-vision-instruct"
        self.enabled = api_key not in ("PENDING", "")

    async def analyze_presentation_slide(
        self,
        image_bytes: bytes,
        image_mime: str = "image/jpeg",
        coaching_focus: str = "presentation",
    ) -> dict:
        """
        Analyze a presentation slide and generate English coaching context.

        Args:
            image_bytes: Raw image bytes (JPEG, PNG, WebP)
            image_mime: MIME type of the image
            coaching_focus: "presentation" | "email" | "document" | "general"

        Returns:
            {
                "slide_summary": str,          # What's on the slide
                "key_vocabulary": list[str],   # Business terms to practice
                "suggested_phrases": list[str],# English phrases for presenting this
                "coaching_prompt": str,        # System prompt for follow-up NIM session
                "practice_questions": list[str] # Questions to practice presenting this content
            }
        """
        if not self.enabled:
            return self._fallback_response()

        if not image_bytes:
            return self._fallback_response()

        # Encode image as base64 data URL
        b64_image = base64.b64encode(image_bytes).decode("utf-8")
        image_url = f"data:{image_mime};base64,{b64_image}"

        focus_instructions = {
            "presentation": "Focus on how to present this content verbally in a business meeting.",
            "email": "Focus on written business English for email communication.",
            "document": "Focus on formal business writing and professional English.",
            "general": "Focus on general business English communication.",
        }
        instruction = focus_instructions.get(coaching_focus, focus_instructions["presentation"])

        system_prompt = f"""You are Max, an expert business English speaking coach powered by NVIDIA AI.
A user has shared an image for English coaching practice.

{instruction}

Analyze the image and provide a JSON response with these exact fields:
{{
  "slide_summary": "Brief description of what's shown (1-2 sentences)",
  "key_vocabulary": ["term1", "term2", "term3"],
  "suggested_phrases": ["phrase to present this", "another useful phrase"],
  "coaching_prompt": "A system prompt for a follow-up coaching session about presenting this content",
  "practice_questions": ["Question 1 to practice?", "Question 2 to practice?"]
}}

Respond ONLY with valid JSON. No markdown, no explanation."""

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image_url",
                                "image_url": {"url": image_url},
                            },
                            {
                                "type": "text",
                                "text": "Please analyze this for business English coaching.",
                            },
                        ],
                    },
                ],
                max_tokens=1024,
                temperature=0.3,
            )

            content = (response.choices[0].message.content or "").strip()

            # Strip markdown code fences if present
            if content.startswith("```"):
                lines = content.split("\n")
                content = "\n".join(lines[1:-1]) if len(lines) > 2 else content

            import json
            try:
                result = json.loads(content)
                # Normalize fields
                return {
                    "slide_summary": result.get("slide_summary", ""),
                    "key_vocabulary": result.get("key_vocabulary", []),
                    "suggested_phrases": result.get("suggested_phrases", []),
                    "coaching_prompt": result.get("coaching_prompt", ""),
                    "practice_questions": result.get("practice_questions", []),
                }
            except json.JSONDecodeError:
                # Extract what we can from malformed response
                return {
                    "slide_summary": content[:200] if content else "Unable to analyze image.",
                    "key_vocabulary": [],
                    "suggested_phrases": [],
                    "coaching_prompt": "Let's practice presenting the content in this image.",
                    "practice_questions": ["How would you describe the main points of this slide?"],
                }

        except Exception:
            return self._fallback_response()

    async def analyze_business_document(
        self,
        image_bytes: bytes,
        image_mime: str = "image/jpeg",
    ) -> dict:
        """
        Analyze a business document image and provide English feedback.

        Returns:
            {
                "document_type": str,          # "email" | "report" | "proposal" | etc.
                "language_score": int,         # 0-100 professional English score
                "strengths": list[str],        # What's written well
                "improvements": list[str],     # Suggested English improvements
                "rewritten_excerpt": str,      # Improved version of key section
            }
        """
        if not self.enabled:
            return {
                "document_type": "document",
                "language_score": 75,
                "strengths": ["Clear structure"],
                "improvements": ["Consider more formal vocabulary"],
                "rewritten_excerpt": "",
            }

        b64_image = base64.b64encode(image_bytes).decode("utf-8")
        image_url = f"data:{image_mime};base64,{b64_image}"

        system_prompt = """You are Max, an expert business English writing coach.
Analyze the business document in the image and provide JSON feedback:
{
  "document_type": "email|report|proposal|memo|other",
  "language_score": 85,
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["suggestion 1", "suggestion 2"],
  "rewritten_excerpt": "Improved version of the opening or key section"
}
Respond ONLY with valid JSON."""

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {
                        "role": "user",
                        "content": [
                            {"type": "image_url", "image_url": {"url": image_url}},
                            {"type": "text", "text": "Please review this business document's English."},
                        ],
                    },
                ],
                max_tokens=800,
                temperature=0.3,
            )
            content = (response.choices[0].message.content or "").strip()
            if content.startswith("```"):
                lines = content.split("\n")
                content = "\n".join(lines[1:-1])

            import json
            result = json.loads(content)
            return {
                "document_type": result.get("document_type", "document"),
                "language_score": min(100, max(0, int(result.get("language_score", 75)))),
                "strengths": result.get("strengths", []),
                "improvements": result.get("improvements", []),
                "rewritten_excerpt": result.get("rewritten_excerpt", ""),
            }
        except Exception:
            return {
                "document_type": "document",
                "language_score": 75,
                "strengths": [],
                "improvements": [],
                "rewritten_excerpt": "",
            }

    def _fallback_response(self) -> dict:
        return {
            "slide_summary": "Vision analysis temporarily unavailable.",
            "key_vocabulary": [],
            "suggested_phrases": [],
            "coaching_prompt": "Let's practice your presentation skills with some general business English exercises.",
            "practice_questions": [
                "How would you introduce this topic to your team?",
                "What key points would you emphasize in your presentation?",
            ],
        }


vision_service = NvidiaVisionService()
