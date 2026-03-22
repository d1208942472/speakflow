/**
 * useVoiceChat — Pro-only speech-to-speech conversation with Max.
 *
 * Pipeline:
 *   1. startTurn()  — begins microphone recording via expo-av
 *   2. endTurn()    — stops recording, uploads audio to /voicechat/turn,
 *                     plays back Max's spoken response via expo-av
 *
 * The API call is multipart/form-data matching POST /voicechat/turn:
 *   lesson_id           : string
 *   audio               : File (.m4a)
 *   audio_format        : "m4a"
 *   conversation_history: JSON string of [{role, content}] pairs
 *
 * Returns coaching feedback (grammar, vocabulary, score) alongside audio.
 * All errors fail silently — voice mode never blocks the lesson UI.
 *
 * Requires Pro subscription (API returns 403 for non-Pro users).
 */
import { useState, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { useUserStore } from '../store/userStore';
import { apiPostForm } from '../services/api';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface VoiceChatTurnResult {
  transcript: string;
  aiResponseText: string;
  grammarFeedback: string;
  vocabularySuggestions: string;
  fpMultiplier: number;
  overallScore: number;
  hasAudio: boolean;
}

export type VoiceChatPhase =
  | 'idle'        // waiting to start
  | 'recording'   // mic is open, capturing user speech
  | 'processing'  // audio uploaded, waiting for API + TTS
  | 'playing'     // Max is speaking his response
  | 'error';      // non-fatal error (UI can retry)

export interface UseVoiceChatReturn {
  phase: VoiceChatPhase;
  conversationHistory: ConversationMessage[];
  lastResult: VoiceChatTurnResult | null;
  startTurn: () => Promise<void>;
  endTurn: () => Promise<void>;
  resetConversation: () => void;
  isProRequired: boolean;    // true if API returned 403
}

// ─── API response shape from /voicechat/turn ────────────────────────────────

interface VoiceChatTurnApiResponse {
  transcript: string;
  ai_response_text: string;
  grammar_feedback: string;
  vocabulary_suggestions: string;
  fp_multiplier: number;
  overall_score: number;
  audio_base64: string;
  has_audio: boolean;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useVoiceChat(lessonId: string): UseVoiceChatReturn {
  const [phase, setPhase] = useState<VoiceChatPhase>('idle');
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [lastResult, setLastResult] = useState<VoiceChatTurnResult | null>(null);
  const [isProRequired, setIsProRequired] = useState(false);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const token = useUserStore((s) => s.token);

  // ── Stop any playing audio ─────────────────────────────────────────────────
  const stopAudio = useCallback(async (): Promise<void> => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch {
        // ignore cleanup errors
      }
      soundRef.current = null;
    }
  }, []);

  // ── Play Max's response from base64-encoded mp3 ────────────────────────────
  const playAudioBase64 = useCallback(
    async (base64: string): Promise<void> => {
      if (!base64) return;

      const tempPath = `${FileSystem.cacheDirectory}voicechat-max-${Date.now()}.mp3`;

      try {
        await FileSystem.writeAsStringAsync(tempPath, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
        });

        setPhase('playing');

        const { sound } = await Audio.Sound.createAsync(
          { uri: tempPath },
          { shouldPlay: true, volume: 1.0 }
        );
        soundRef.current = sound;

        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            setPhase('idle');
            sound.unloadAsync().catch(() => {});
            soundRef.current = null;
            FileSystem.deleteAsync(tempPath, { idempotent: true }).catch(() => {});
          }
        });
      } catch {
        // Audio playback failure — return to idle (coaching text is still shown)
        setPhase('idle');
        FileSystem.deleteAsync(tempPath, { idempotent: true }).catch(() => {});
      }
    },
    []
  );

  // ── Start recording a turn ─────────────────────────────────────────────────
  const startTurn = useCallback(async (): Promise<void> => {
    if (phase === 'recording' || !token) return;

    // Stop any in-progress audio
    await stopAudio();

    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setPhase('recording');
    } catch {
      setPhase('error');
    }
  }, [phase, token, stopAudio]);

  // ── Stop recording and send to API ────────────────────────────────────────
  const endTurn = useCallback(async (): Promise<void> => {
    if (phase !== 'recording' || !recordingRef.current || !token) return;

    setPhase('processing');

    try {
      // Stop the recording and get the file URI
      await recordingRef.current.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      const audioUri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (!audioUri) {
        setPhase('error');
        return;
      }

      // Build multipart form matching POST /voicechat/turn
      const formData = new FormData();
      formData.append('lesson_id', lessonId);
      formData.append('audio', {
        uri: audioUri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      } as unknown as Blob);
      formData.append('audio_format', 'm4a');
      formData.append(
        'conversation_history',
        JSON.stringify(conversationHistory)
      );

      const response = await apiPostForm<VoiceChatTurnApiResponse>(
        '/voicechat/turn',
        formData,
        token
      );

      // Build result object for the UI
      const result: VoiceChatTurnResult = {
        transcript: response.transcript,
        aiResponseText: response.ai_response_text,
        grammarFeedback: response.grammar_feedback,
        vocabularySuggestions: response.vocabulary_suggestions,
        fpMultiplier: response.fp_multiplier,
        overallScore: response.overall_score,
        hasAudio: response.has_audio,
      };

      setLastResult(result);

      // Update conversation history with this exchange
      setConversationHistory((prev) => [
        ...prev,
        { role: 'user', content: response.transcript },
        { role: 'assistant', content: response.ai_response_text },
      ]);

      // Play Max's spoken response if audio is available
      if (response.has_audio && response.audio_base64) {
        await playAudioBase64(response.audio_base64);
      } else {
        setPhase('idle');
      }

      // Clean up recorded file
      FileSystem.deleteAsync(audioUri, { idempotent: true }).catch(() => {});
    } catch (err: unknown) {
      recordingRef.current = null;

      // Detect 403 — requires Pro subscription
      if (err && typeof err === 'object' && 'status' in err && (err as { status: number }).status === 403) {
        setIsProRequired(true);
      }

      setPhase('error');
    }
  }, [phase, token, lessonId, conversationHistory, playAudioBase64]);

  // ── Reset conversation (e.g. new lesson session) ──────────────────────────
  const resetConversation = useCallback((): void => {
    if (recordingRef.current) {
      recordingRef.current.stopAndUnloadAsync().catch(() => {});
      recordingRef.current = null;
    }
    stopAudio();
    setConversationHistory([]);
    setLastResult(null);
    setPhase('idle');
    setIsProRequired(false);
  }, [stopAudio]);

  return {
    phase,
    conversationHistory,
    lastResult,
    startTurn,
    endTurn,
    resetConversation,
    isProRequired,
  };
}
