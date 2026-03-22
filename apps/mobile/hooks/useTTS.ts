/**
 * useTTS — NVIDIA Magpie TTS hook for playing Max's coaching voice.
 *
 * Usage:
 *   const { speak, isSpeaking, isLoading } = useTTS();
 *   await speak("Great pronunciation! Keep it up.");
 *
 * Falls back silently if TTS API is unavailable (non-blocking UX).
 */
import { useState, useCallback, useRef } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { useUserStore } from '../store/userStore';
import { apiPostBinary } from '../services/api';

export interface UseTTSReturn {
  speak: (text: string) => Promise<void>;
  stop: () => Promise<void>;
  isSpeaking: boolean;
  isLoading: boolean;
}

export function useTTS(): UseTTSReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  const token = useUserStore((s) => s.token);

  const stop = useCallback(async (): Promise<void> => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch {
        // ignore cleanup errors
      }
      soundRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  const speak = useCallback(
    async (text: string): Promise<void> => {
      if (!text.trim() || !token) return;

      // Stop any currently playing audio first
      await stop();

      setIsLoading(true);

      try {
        // Fetch mp3 audio from NVIDIA Magpie TTS endpoint
        const audioBuffer = await apiPostBinary(
          '/speech/synthesize',
          { text: text.trim().slice(0, 500), voice: 'male-1' },
          token
        );

        if (!audioBuffer || audioBuffer.byteLength === 0) {
          // TTS unavailable — fail silently (non-blocking)
          return;
        }

        // Write audio bytes to a temp file (expo-av requires a URI)
        const tempPath = `${FileSystem.cacheDirectory}max-tts-${Date.now()}.mp3`;
        const base64Audio = arrayBufferToBase64(audioBuffer);
        await FileSystem.writeAsStringAsync(tempPath, base64Audio, {
          encoding: FileSystem.EncodingType.Base64,
        });

        // Set audio mode to playback (undo recording mode if set)
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
        });

        setIsLoading(false);
        setIsSpeaking(true);

        const { sound } = await Audio.Sound.createAsync(
          { uri: tempPath },
          { shouldPlay: true, volume: 1.0 }
        );
        soundRef.current = sound;

        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            setIsSpeaking(false);
            sound.unloadAsync().catch(() => {});
            soundRef.current = null;
            // Clean up temp file
            FileSystem.deleteAsync(tempPath, { idempotent: true }).catch(() => {});
          }
        });
      } catch {
        // TTS errors are non-blocking — never crash the lesson
        setIsLoading(false);
        setIsSpeaking(false);
      }
    },
    [token, stop]
  );

  return { speak, stop, isSpeaking, isLoading };
}

/** Convert ArrayBuffer to base64 string for FileSystem.writeAsStringAsync */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}
