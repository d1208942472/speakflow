"""NVIDIA Riva Translate — real-time translation for coaching feedback

Uses riva-translate-4b-instruct-v1_1 (FREE endpoint) to translate
Max's English coaching feedback into the user's native language.

Supported language pairs (to/from English):
  Chinese (zh), Japanese (ja), Korean (ko), Spanish (es),
  French (fr), German (de), Portuguese (pt), Russian (ru),
  Arabic (ar), Hindi (hi), Italian (it), Dutch (nl)
"""
import os
from openai import AsyncOpenAI


SUPPORTED_LANGS = {
    "zh": "Chinese",
    "ja": "Japanese",
    "ko": "Korean",
    "es": "Spanish",
    "fr": "French",
    "de": "German",
    "pt": "Portuguese",
    "ru": "Russian",
    "ar": "Arabic",
    "hi": "Hindi",
    "it": "Italian",
    "nl": "Dutch",
}


class NvidiaTranslateService:
    def __init__(self):
        api_key = os.environ.get("NVIDIA_NIM_API_KEY") or os.environ.get("NVIDIA_API_KEY", "PENDING")
        self.client = AsyncOpenAI(
            api_key=api_key,
            base_url="https://integrate.api.nvidia.com/v1",
        )
        self.model = "nvidia/riva-translate-4b-instruct-v1_1"

    async def translate(self, text: str, target_lang: str, source_lang: str = "en") -> str:
        """Translate text from source_lang to target_lang.

        Uses NVIDIA Riva Translate (FREE endpoint).
        Returns original text if translation fails or lang not supported.
        """
        text = text.strip()
        if not text:
            return text

        if target_lang not in SUPPORTED_LANGS:
            return text  # passthrough for unsupported languages

        if source_lang == target_lang:
            return text

        target_name = SUPPORTED_LANGS[target_lang]

        try:
            completion = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": f"Translate the following English text to {target_name}. "
                                   "Output ONLY the translated text, no explanation or additional content.",
                    },
                    {"role": "user", "content": text},
                ],
                temperature=0.1,
                max_tokens=600,
            )
            translated = completion.choices[0].message.content or ""
            return translated.strip() or text
        except Exception:
            # Translation is non-blocking — return original on failure
            return text

    async def translate_coaching(
        self, grammar_feedback: str, vocabulary_suggestions: str, target_lang: str
    ) -> tuple[str, str]:
        """Translate coaching feedback fields. Returns (grammar, vocab) translated."""
        if target_lang == "en" or target_lang not in SUPPORTED_LANGS:
            return grammar_feedback, vocabulary_suggestions

        translated_grammar = await self.translate(grammar_feedback, target_lang)
        translated_vocab = await self.translate(vocabulary_suggestions, target_lang)
        return translated_grammar, translated_vocab


translate_service = NvidiaTranslateService()
