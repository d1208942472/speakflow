import { useState, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';

export type RecordingState = 'idle' | 'recording' | 'processing' | 'done';

export interface UseRecordingReturn {
  recordingState: RecordingState;
  audioUri: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  reset: () => void;
}

export function useRecording(): UseRecordingReturn {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
      console.warn('[useRecording] Microphone permission not granted.');
      return false;
    }
    return true;
  }, []);

  const startRecording = useCallback(async (): Promise<void> => {
    if (recordingState === 'recording') return;

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      // Configure audio session for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = recording;
      setRecordingState('recording');
    } catch (e) {
      console.error('[useRecording] startRecording error:', e);
      setRecordingState('idle');
    }
  }, [recordingState, requestPermissions]);

  const stopRecording = useCallback(async (): Promise<void> => {
    if (recordingState !== 'recording' || !recordingRef.current) return;

    setRecordingState('processing');

    try {
      await recordingRef.current.stopAndUnloadAsync();

      // Reset audio mode to playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (uri) {
        setAudioUri(uri);
      }

      setRecordingState('done');
    } catch (e) {
      console.error('[useRecording] stopRecording error:', e);
      recordingRef.current = null;
      setRecordingState('idle');
    }
  }, [recordingState]);

  const reset = useCallback((): void => {
    if (recordingRef.current) {
      recordingRef.current.stopAndUnloadAsync().catch(() => {});
      recordingRef.current = null;
    }
    setAudioUri(null);
    setRecordingState('idle');
  }, []);

  return {
    recordingState,
    audioUri,
    startRecording,
    stopRecording,
    reset,
  };
}
