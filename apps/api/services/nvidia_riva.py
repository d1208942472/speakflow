"""NVIDIA Riva Cloud API — ASR + pronunciation scoring"""
import os
import base64
import httpx
from pydantic import BaseModel


class PronunciationResult(BaseModel):
    transcript: str
    pronunciation_score: float  # 0-100
    fluency_score: float
    word_scores: list
    feedback_summary: str


class NvidiaRivaService:
    def __init__(self):
        self.api_key = os.environ.get("NVIDIA_API_KEY", "PENDING")
        self.base_url = "https://api.nvcf.nvidia.com/v2/nvcf/pexec/functions"
        self.asr_function_id = os.environ.get(
            "RIVA_ASR_FUNCTION_ID", "1598d209-5e27-4d3c-8079-4751568b1081"
        )

    async def transcribe_audio(self, audio_bytes: bytes, audio_format: str = "wav") -> str:
        """POST to Riva ASR endpoint and return transcript string."""
        url = f"{self.base_url}/{self.asr_function_id}"
        audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")

        payload = {
            "audio": audio_b64,
            "audio_format": audio_format,
            "language_code": "en-US",
            "profanity_filter": False,
            "enable_automatic_punctuation": True,
            "word_time_offsets": True,
        }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(url, json=payload, headers=headers)
                response.raise_for_status()
                data = response.json()
                # Extract transcript from Riva response structure
                results = data.get("results", [])
                if results:
                    alternatives = results[0].get("alternatives", [])
                    if alternatives:
                        return alternatives[0].get("transcript", "")
                return ""
            except httpx.HTTPStatusError as e:
                raise RuntimeError(
                    f"Riva ASR API error: {e.response.status_code} — {e.response.text}"
                ) from e
            except httpx.RequestError as e:
                raise RuntimeError(f"Riva ASR connection error: {e}") from e

    async def score_pronunciation(
        self, audio_bytes: bytes, target_phrase: str
    ) -> PronunciationResult:
        """Call transcribe_audio, compute word overlap score, return PronunciationResult."""
        transcript = await self.transcribe_audio(audio_bytes)

        pronunciation_score = self._compute_pronunciation_score(transcript, target_phrase)
        fluency_score = self._compute_fluency_score(transcript, target_phrase)
        word_scores = self._compute_word_scores(transcript, target_phrase)
        feedback_summary = self._generate_basic_feedback(pronunciation_score)

        return PronunciationResult(
            transcript=transcript,
            pronunciation_score=pronunciation_score,
            fluency_score=fluency_score,
            word_scores=word_scores,
            feedback_summary=feedback_summary,
        )

    def _compute_pronunciation_score(self, transcript: str, target: str) -> float:
        """Word overlap ratio, return 0-100."""
        if not target.strip():
            return 0.0

        transcript_words = set(transcript.lower().split())
        target_words = set(target.lower().split())

        if not target_words:
            return 0.0

        matched = transcript_words & target_words
        overlap_ratio = len(matched) / len(target_words)

        # Scale to 0-100 with a slight boost for near-perfect matches
        score = overlap_ratio * 100.0

        # Bonus points if transcript length is close to target length
        t_len = len(transcript.split())
        tgt_len = len(target.split())
        if tgt_len > 0:
            length_ratio = min(t_len, tgt_len) / max(t_len, tgt_len)
            # Blend: 80% word overlap, 20% length similarity
            score = score * 0.8 + length_ratio * 20.0

        return round(min(100.0, max(0.0, score)), 2)

    def _compute_fluency_score(self, transcript: str, target: str) -> float:
        """Estimate fluency based on length and completeness."""
        if not transcript.strip():
            return 0.0

        transcript_words = transcript.lower().split()
        target_words = target.lower().split()

        if not target_words:
            return 0.0

        # Fluency: how many consecutive matching words exist relative to target
        matched_count = 0
        for word in transcript_words:
            if word in [w.lower() for w in target_words]:
                matched_count += 1

        fluency_ratio = matched_count / len(target_words)
        fluency_score = round(min(100.0, fluency_ratio * 100.0), 2)
        return fluency_score

    def _compute_word_scores(self, transcript: str, target: str) -> list:
        """Return per-word score list."""
        target_words = target.lower().split()
        transcript_words = transcript.lower().split()
        transcript_set = set(transcript_words)

        word_scores = []
        for word in target_words:
            clean_word = word.strip(".,!?;:")
            score = 1.0 if clean_word in transcript_set else 0.0
            word_scores.append({"word": word, "score": score})

        return word_scores

    def _generate_basic_feedback(self, score: float) -> str:
        """Return feedback string based on score range."""
        if score >= 90:
            return (
                "Excellent pronunciation! Your speech is very clear and natural. "
                "Keep up the great work!"
            )
        elif score >= 75:
            return (
                "Good pronunciation! Most words were clear. "
                "Focus on the highlighted words to improve further."
            )
        elif score >= 60:
            return (
                "Decent effort! Some words need more practice. "
                "Try speaking more slowly and clearly for better results."
            )
        elif score >= 40:
            return (
                "Keep practicing! Focus on pronouncing each word clearly. "
                "Listening to native speakers and repeating can help a lot."
            )
        else:
            return (
                "Don't give up! Pronunciation takes time and practice. "
                "Try breaking the phrase into smaller parts and practice each part separately."
            )


riva_service = NvidiaRivaService()
