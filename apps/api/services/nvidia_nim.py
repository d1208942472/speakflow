"""NVIDIA NIM — OpenAI-compatible Llama 3.1 70B for conversation + coaching"""
import os
import json
import re
from openai import AsyncOpenAI
from pydantic import BaseModel


class ConversationTurn(BaseModel):
    role: str
    content: str


class ConversationFeedback(BaseModel):
    response: str
    grammar_feedback: str
    vocabulary_suggestions: str
    fp_multiplier: float
    overall_score: int


class NvidiaNimService:
    def __init__(self):
        self.client = AsyncOpenAI(
            api_key=os.environ["NVIDIA_NIM_API_KEY"],
            base_url="https://integrate.api.nvidia.com/v1",
        )
        self.model = "meta/llama-3.1-70b-instruct"

    async def get_conversation_response(
        self,
        lesson_system_prompt: str,
        conversation_history: list,
        user_message: str,
    ) -> ConversationFeedback:
        """Get AI conversation response with grammar and vocabulary feedback."""
        system_prompt = self._build_system_prompt(lesson_system_prompt)

        messages = [{"role": "system", "content": system_prompt}]

        # Add conversation history
        for turn in conversation_history:
            if isinstance(turn, dict):
                messages.append({"role": turn["role"], "content": turn["content"]})
            elif isinstance(turn, ConversationTurn):
                messages.append({"role": turn.role, "content": turn.content})

        # Add current user message
        messages.append({"role": "user", "content": user_message})

        try:
            completion = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.7,
                max_tokens=800,
                top_p=0.9,
            )
            raw_response = completion.choices[0].message.content or ""
            return self._parse_structured_response(raw_response, user_message)
        except Exception as e:
            # Graceful fallback: return a basic response if API fails
            return ConversationFeedback(
                response="I understand. Could you elaborate on that?",
                grammar_feedback="Unable to analyze grammar at this time.",
                vocabulary_suggestions="Try using more specific business vocabulary.",
                fp_multiplier=1.0,
                overall_score=50,
            )

    def _build_system_prompt(self, lesson_prompt: str) -> str:
        """Include lesson context + strict JSON response format instruction."""
        return f"""You are Max, an expert AI business English coach. Your role is to help users practice professional English communication.

LESSON CONTEXT:
{lesson_prompt}

INSTRUCTIONS:
1. Respond naturally as the conversation partner described in the lesson context
2. Keep responses concise and professional (2-4 sentences)
3. After your conversational response, provide coaching feedback

You MUST respond ONLY in the following JSON format — no other text outside the JSON:

{{
  "response": "<your conversational reply as the scenario partner>",
  "grammar_feedback": "<specific grammar corrections or 'Your grammar is correct!' if no issues>",
  "vocabulary_suggestions": "<2-3 alternative professional phrases the user could use>",
  "fp_multiplier": <float between 0.5 and 2.0 based on English quality>,
  "overall_score": <integer 0-100 reflecting the quality of the user's English>
}}

FP multiplier guide:
- 2.0: Excellent professional English, advanced vocabulary, perfect grammar
- 1.5: Good English with minor issues
- 1.0: Average English, some errors but understandable
- 0.75: Significant errors affecting clarity
- 0.5: Very poor English, major comprehension issues

Evaluate the USER's message (not your own response) for grammar_feedback, vocabulary_suggestions, fp_multiplier, and overall_score."""

    def _parse_structured_response(
        self, raw: str, user_message: str
    ) -> ConversationFeedback:
        """Parse JSON with regex extraction fallback."""
        # First try direct JSON parse
        try:
            # Strip any markdown code fences
            cleaned = raw.strip()
            if cleaned.startswith("```"):
                cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
                cleaned = re.sub(r"\s*```$", "", cleaned)
            data = json.loads(cleaned)
            return ConversationFeedback(
                response=str(data.get("response", "I see. Please continue.")),
                grammar_feedback=str(
                    data.get("grammar_feedback", "Your grammar looks good!")
                ),
                vocabulary_suggestions=str(
                    data.get(
                        "vocabulary_suggestions",
                        "Consider using more formal business language.",
                    )
                ),
                fp_multiplier=float(data.get("fp_multiplier", 1.0)),
                overall_score=int(data.get("overall_score", 70)),
            )
        except (json.JSONDecodeError, ValueError, KeyError):
            pass

        # Regex fallback: extract individual fields
        response_match = re.search(
            r'"response"\s*:\s*"((?:[^"\\]|\\.)*)"', raw, re.DOTALL
        )
        grammar_match = re.search(
            r'"grammar_feedback"\s*:\s*"((?:[^"\\]|\\.)*)"', raw, re.DOTALL
        )
        vocab_match = re.search(
            r'"vocabulary_suggestions"\s*:\s*"((?:[^"\\]|\\.)*)"', raw, re.DOTALL
        )
        fp_match = re.search(r'"fp_multiplier"\s*:\s*([\d.]+)', raw)
        score_match = re.search(r'"overall_score"\s*:\s*(\d+)', raw)

        response_text = (
            response_match.group(1).encode().decode("unicode_escape")
            if response_match
            else "Thank you for your response. Let's continue practicing."
        )
        grammar_text = (
            grammar_match.group(1).encode().decode("unicode_escape")
            if grammar_match
            else "Your grammar is acceptable."
        )
        vocab_text = (
            vocab_match.group(1).encode().decode("unicode_escape")
            if vocab_match
            else "Try using more professional business terminology."
        )
        fp_value = float(fp_match.group(1)) if fp_match else 1.0
        score_value = int(score_match.group(1)) if score_match else 65

        # Clamp values to valid ranges
        fp_value = max(0.5, min(2.0, fp_value))
        score_value = max(0, min(100, score_value))

        return ConversationFeedback(
            response=response_text,
            grammar_feedback=grammar_text,
            vocabulary_suggestions=vocab_text,
            fp_multiplier=fp_value,
            overall_score=score_value,
        )


nim_service = NvidiaNimService()
