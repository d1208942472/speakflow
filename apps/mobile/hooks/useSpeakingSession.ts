import { useState, useCallback } from 'react';
import { useUserStore } from '../store/userStore';
import { apiPost } from '../services/api';

export type SessionPhase = 'intro' | 'recording' | 'scored' | 'conversation' | 'complete';

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface SessionState {
  phase: SessionPhase;
  pronunciationScore: number | null;
  fluencyScore: number | null;
  fpEarned: number;
  aiResponse: string;
  grammarFeedback: string;
  vocabularySuggestions: string;
  conversationHistory: ConversationMessage[];
  transcript: string;
  levelUpMessage: string | null;
  streakBroken: boolean;
  isLoading: boolean;
  error: string | null;
}

// Shape of /sessions/complete response
interface SessionCompleteResponse {
  session_id: string;
  pronunciation_score: number;
  fluency_score: number;
  transcript: string;
  nim_response: string;
  grammar_feedback: string;
  vocabulary_suggestions: string;
  fp_earned: number;
  new_total_fp: number;
  new_weekly_fp: number;
  new_streak: number;
  streak_broken: boolean;
  shield_consumed: boolean;
  league_rank: number;
  level_up_message: string | null;
  overall_nim_score: number;
}

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

const INITIAL_STATE: SessionState = {
  phase: 'intro',
  pronunciationScore: null,
  fluencyScore: null,
  fpEarned: 0,
  aiResponse: '',
  grammarFeedback: '',
  vocabularySuggestions: '',
  conversationHistory: [],
  transcript: '',
  levelUpMessage: null,
  streakBroken: false,
  isLoading: false,
  error: null,
};

export function useSpeakingSession(
  lessonId: string,
  targetPhrase: string,
  _systemPrompt: string
) {
  const [state, setState] = useState<SessionState>(INITIAL_STATE);
  const token = useUserStore((s) => s.token);
  const setUser = useUserStore((s) => s.setUser);
  const nativeLang = useUserStore((s) => s.nativeLang);

  const setPhase = useCallback((phase: SessionPhase) => {
    setState((prev) => ({ ...prev, phase }));
  }, []);

  const submitRecording = useCallback(
    async (audioUri: string): Promise<void> => {
      if (!token) {
        setState((prev) => ({ ...prev, error: 'Not authenticated. Please log in again.' }));
        return;
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        // POST multipart form to /sessions/complete — single unified pipeline
        const formData = new FormData();
        formData.append('lesson_id', lessonId);
        formData.append('target_phrase', targetPhrase);
        formData.append('audio_format', 'm4a');
        formData.append(
          'conversation_history',
          JSON.stringify(
            state.conversationHistory.map((msg) => ({
              role: msg.role,
              content: msg.content,
            }))
          )
        );
        formData.append('audio', {
          uri: audioUri,
          type: 'audio/m4a',
          name: 'recording.m4a',
        } as unknown as Blob);

        const response = await fetch(`${API_BASE}/sessions/complete`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            // NOTE: Do NOT set Content-Type — fetch sets multipart boundary automatically
          },
          body: formData,
        });

        if (!response.ok) {
          let errorMessage = `Session failed (${response.status})`;
          try {
            const errorBody = await response.json();
            errorMessage = errorBody.detail ?? errorBody.message ?? errorMessage;
          } catch {
            // ignore parse error
          }
          throw new Error(errorMessage);
        }

        const result: SessionCompleteResponse = await response.json();

        // Sync authoritative gamification state from server to local store
        setUser({
          totalFP: result.new_total_fp,
          weeklyFP: result.new_weekly_fp,
          streak: result.new_streak,
        });

        // Translate coaching feedback to user's native language (non-blocking)
        let grammarFeedback = result.grammar_feedback;
        let vocabularySuggestions = result.vocabulary_suggestions;
        if (nativeLang && nativeLang !== 'en' && token) {
          try {
            interface TranslateCoachingResponse {
              grammar_feedback: string;
              vocabulary_suggestions: string;
            }
            const translated = await apiPost<TranslateCoachingResponse>(
              '/translate/coaching',
              {
                grammar_feedback: result.grammar_feedback,
                vocabulary_suggestions: result.vocabulary_suggestions,
                target_lang: nativeLang,
              },
              token
            );
            grammarFeedback = translated.grammar_feedback;
            vocabularySuggestions = translated.vocabulary_suggestions;
          } catch {
            // Translation failed — use English feedback (non-blocking)
          }
        }

        // Append transcript + AI response to conversation history
        const updatedHistory: ConversationMessage[] = [
          ...state.conversationHistory,
          { role: 'user', content: result.transcript || targetPhrase },
          { role: 'assistant', content: result.nim_response },
        ];

        setState((prev) => ({
          ...prev,
          phase: 'complete',
          pronunciationScore: result.pronunciation_score,
          fluencyScore: result.fluency_score,
          fpEarned: prev.fpEarned + result.fp_earned,
          aiResponse: result.nim_response,
          grammarFeedback: grammarFeedback,
          vocabularySuggestions: vocabularySuggestions,
          conversationHistory: updatedHistory,
          transcript: result.transcript,
          levelUpMessage: result.level_up_message,
          streakBroken: result.streak_broken,
          isLoading: false,
          error: null,
        }));
      } catch (e) {
        const message = e instanceof Error ? e.message : 'An error occurred. Please try again.';
        setState((prev) => ({ ...prev, isLoading: false, error: message }));
      }
    },
    [token, lessonId, targetPhrase, state.conversationHistory, setUser, nativeLang]
  );

  const startSession = useCallback(() => {
    setState({ ...INITIAL_STATE, phase: 'recording' });
  }, []);

  const resetSession = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  return {
    state,
    setPhase,
    startSession,
    submitRecording,
    resetSession,
  };
}
