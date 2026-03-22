"""NVIDIA Nemotron VoiceChat — speech-to-speech for Pro voice conversation mode

This service chains:
1. NVIDIA Riva ASR (transcription)
2. NVIDIA NIM Llama 3.1 70B (conversation + coaching feedback)
3. NVIDIA Magpie TTS (Max's voice response)

For Pro users, this enables a fully voice-native conversation practice session —
speak, get Max's spoken response, and receive coaching — no typing required.

The nemotron-voicechat model (when available via NVCF) would handle steps 1-3
natively. This service provides the same capability via our existing services
as a graceful fallback that works today.
"""
import asyncio
from pydantic import BaseModel
from services.nvidia_riva import NvidiaRivaService
from services.nvidia_nim import NvidiaNimService, ConversationTurn
from services.nvidia_tts import NvidiaTTSService


class VoiceChatResult(BaseModel):
    transcript: str              # What the user said
    ai_response_text: str        # What Max said (text)
    grammar_feedback: str
    vocabulary_suggestions: str
    fp_multiplier: float
    overall_score: int
    # audio_bytes excluded from model (returned separately as binary)


class NvidiaVoiceChatService:
    """
    Speech-to-speech conversation service for SpeakFlow Pro voice mode.

    Pipeline:
      audio_bytes → ASR → transcript
      transcript + history → NIM → coaching feedback + response text
      response text → TTS → audio_bytes (Max's voice)
    """

    def __init__(self):
        self.riva = NvidiaRivaService()
        self.nim = NvidiaNimService()
        self.tts = NvidiaTTSService()

    async def process_voice_turn(
        self,
        audio_bytes: bytes,
        lesson_system_prompt: str,
        conversation_history: list[ConversationTurn],
        audio_format: str = "m4a",
    ) -> tuple[VoiceChatResult, bytes]:
        """
        Process a single voice conversation turn.

        Returns:
          - VoiceChatResult with transcript, coaching feedback, and scores
          - bytes: Max's audio response (mp3) — empty bytes if TTS fails
        """
        # Step 1: Transcribe user's audio
        transcript = await self.riva.transcribe_audio(
            audio_bytes=audio_bytes,
            audio_format=audio_format,
        )

        if not transcript.strip():
            transcript = "[unclear speech]"

        # Step 2: Get NIM coaching feedback + conversational response
        nim_feedback = await self.nim.get_conversation_response(
            lesson_system_prompt=lesson_system_prompt,
            conversation_history=conversation_history,
            user_message=transcript,
        )

        # Step 3: Synthesize Max's spoken response (TTS) — non-blocking
        try:
            audio_response = await self.tts.synthesize(
                nim_feedback.response, voice="male-1"
            )
        except Exception:
            audio_response = b""  # TTS failure is non-blocking

        result = VoiceChatResult(
            transcript=transcript,
            ai_response_text=nim_feedback.response,
            grammar_feedback=nim_feedback.grammar_feedback,
            vocabulary_suggestions=nim_feedback.vocabulary_suggestions,
            fp_multiplier=nim_feedback.fp_multiplier,
            overall_score=nim_feedback.overall_score,
        )

        return result, audio_response


voicechat_service = NvidiaVoiceChatService()
