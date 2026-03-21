import { useState, useCallback } from 'react';
import { apiPostForm, apiPost } from '../services/api';
import { useUserStore } from '../store/userStore';

export type SessionPhase = 'intro' | 'recording' | 'scored' | 'conversation' | 'complete';

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface SessionState {
  phase: SessionPhase;
  pronunciationScore: number | null;
  fpEarned: number;
  aiResponse: string;
  grammarFeedback: string;
  conversationHistory: ConversationMessage[];
  isLoading: boolean;
  error: string | null;
}

interface SpeechScoreResponse {
  score: number;
  feedback: string;
  grammar_feedback: string;
  fp_earned: number;
}

interface ConversationResponse {
  message: string;
  conversation_history: ConversationMessage[];
  is_complete: boolean;
}

const INITIAL_STATE: SessionState = {
  phase: 'intro',
  pronunciationScore: null,
  fpEarned: 0,
  aiResponse: '',
  grammarFeedback: '',
  conversationHistory: [],
  isLoading: false,
  error: null,
};

export function useSpeakingSession(
  lessonId: string,
  targetPhrase: string,
  systemPrompt: string
) {
  const [state, setState] = useState<SessionState>(INITIAL_STATE);
  const token = useUserStore((s) => s.token);
  const addFP = useUserStore((s) => s.addFP);
  const incrementStreak = useUserStore((s) => s.incrementStreak);

  const setPhase = useCallback((phase: SessionPhase) => {
    setState((prev) => ({ ...prev, phase }));
  }, []);

  const submitRecording = useCallback(
    async (audioUri: string): Promise<void> => {
      if (!token) {
        setState((prev) => ({ ...prev, error: 'Not authenticated' }));
        return;
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        // Step 1: Score pronunciation
        const formData = new FormData();
        formData.append('audio', {
          uri: audioUri,
          type: 'audio/m4a',
          name: 'recording.m4a',
        } as unknown as Blob);
        formData.append('lesson_id', lessonId);
        formData.append('target_phrase', targetPhrase);

        const scoreResponse = await apiPostForm<SpeechScoreResponse>(
          '/speech/score',
          formData,
          token
        );

        const earnedFP = scoreResponse.fp_earned;

        // Step 2: Get AI conversational response
        const updatedHistory: ConversationMessage[] = [
          ...state.conversationHistory,
          { role: 'user', content: targetPhrase },
        ];

        const conversationResponse = await apiPost<ConversationResponse>(
          '/conversation/respond',
          {
            lesson_id: lessonId,
            system_prompt: systemPrompt,
            conversation_history: updatedHistory,
            user_message: targetPhrase,
          },
          token
        );

        // Update local FP
        addFP(earnedFP);
        incrementStreak();

        setState((prev) => ({
          ...prev,
          phase: conversationResponse.is_complete ? 'complete' : 'scored',
          pronunciationScore: scoreResponse.score,
          fpEarned: prev.fpEarned + earnedFP,
          aiResponse: scoreResponse.feedback,
          grammarFeedback: scoreResponse.grammar_feedback,
          conversationHistory: conversationResponse.conversation_history,
          isLoading: false,
          error: null,
        }));
      } catch (e) {
        const message = e instanceof Error ? e.message : 'An error occurred';
        setState((prev) => ({ ...prev, isLoading: false, error: message }));
      }
    },
    [token, lessonId, targetPhrase, systemPrompt, state.conversationHistory, addFP, incrementStreak]
  );

  const continueConversation = useCallback(
    async (userMessage: string): Promise<void> => {
      if (!token) return;

      setState((prev) => ({
        ...prev,
        phase: 'conversation',
        isLoading: true,
        error: null,
      }));

      try {
        const updatedHistory: ConversationMessage[] = [
          ...state.conversationHistory,
          { role: 'user', content: userMessage },
        ];

        const conversationResponse = await apiPost<ConversationResponse>(
          '/conversation/respond',
          {
            lesson_id: lessonId,
            system_prompt: systemPrompt,
            conversation_history: updatedHistory,
            user_message: userMessage,
          },
          token
        );

        setState((prev) => ({
          ...prev,
          phase: conversationResponse.is_complete ? 'complete' : 'conversation',
          aiResponse: conversationResponse.message,
          conversationHistory: conversationResponse.conversation_history,
          isLoading: false,
          error: null,
        }));
      } catch (e) {
        const message = e instanceof Error ? e.message : 'An error occurred';
        setState((prev) => ({ ...prev, isLoading: false, error: message }));
      }
    },
    [token, lessonId, systemPrompt, state.conversationHistory]
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
    continueConversation,
    resetSession,
  };
}
