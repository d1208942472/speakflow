"""NVIDIA Magpie TTS — text-to-speech for Max's coaching voice"""
import os
from openai import AsyncOpenAI


class NvidiaTTSService:
    def __init__(self):
        api_key = os.environ.get("NVIDIA_NIM_API_KEY") or os.environ.get("NVIDIA_API_KEY", "PENDING")
        self.client = AsyncOpenAI(
            api_key=api_key,
            base_url="https://integrate.api.nvidia.com/v1",
        )
        # magpie-tts-flow: NVIDIA's high-quality TTS (FREE endpoint)
        self.model = "nvidia/magpie-tts-flow"
        # Available voices: male-1, female-1, male-2, female-2
        self.default_voice = "male-1"  # Max is male

    async def synthesize(self, text: str, voice: str | None = None) -> bytes:
        """Convert text to speech using NVIDIA Magpie TTS.

        Returns raw audio bytes in mp3 format.
        Text is truncated to 4096 chars (API limit).
        """
        text = text.strip()[:4096]
        if not text:
            return b""

        chosen_voice = voice or self.default_voice

        response = await self.client.audio.speech.create(
            model=self.model,
            input=text,
            voice=chosen_voice,  # type: ignore[arg-type]
            response_format="mp3",
        )
        # response.content is bytes for the audio file
        return response.content

    async def synthesize_coaching(self, feedback_text: str) -> bytes:
        """Synthesize Max's coaching feedback in a clear, professional voice."""
        # Keep coaching audio short and punchy — truncate to 500 chars
        truncated = feedback_text.strip()[:500]
        return await self.synthesize(truncated, voice=self.default_voice)


tts_service = NvidiaTTSService()
