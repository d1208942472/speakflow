/**
 * useSlideAnalyzer — NVIDIA Vision slide and document analysis for Pro users
 *
 * Creates an async analysis job, then polls until completion.
 */
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { useUserStore } from '../store/userStore';

export interface SlideAnalysisResult {
  slide_summary: string;
  key_vocabulary: string[];
  suggested_phrases: string[];
  coaching_prompt: string;
  practice_questions: string[];
}

export interface DocumentAnalysisResult {
  document_type: string;
  language_score: number;
  strengths: string[];
  improvements: string[];
  rewritten_excerpt: string;
}

export type AnalysisMode = 'slide' | 'document';
export type AnalysisPhase = 'idle' | 'picking' | 'uploading' | 'done' | 'error';

export interface UseSlideAnalyzerReturn {
  phase: AnalysisPhase;
  slideResult: SlideAnalysisResult | null;
  documentResult: DocumentAnalysisResult | null;
  selectedImageUri: string | null;
  error: string | null;
  analyzeSlide: (coachingFocus?: string) => Promise<void>;
  analyzeDocument: () => Promise<void>;
  reset: () => void;
}

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'https://speakflow-api.onrender.com';

interface AnalysisJobResponse<T> {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  job_type: AnalysisMode;
  result: T | null;
  error: string | null;
}

export function useSlideAnalyzer(): UseSlideAnalyzerReturn {
  const [phase, setPhase] = useState<AnalysisPhase>('idle');
  const [slideResult, setSlideResult] = useState<SlideAnalysisResult | null>(null);
  const [documentResult, setDocumentResult] = useState<DocumentAnalysisResult | null>(null);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const token = useUserStore((s) => s.token);
  const setUser = useUserStore((s) => s.setUser);

  const reset = () => {
    setPhase('idle');
    setSlideResult(null);
    setDocumentResult(null);
    setSelectedImageUri(null);
    setError(null);
  };

  const pickImage = async (): Promise<{ uri: string; mimeType: string } | null> => {
    setPhase('picking');
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.85,
      });

      if (result.canceled || !result.assets?.[0]) {
        setPhase('idle');
        return null;
      }

      const asset = result.assets[0];
      setSelectedImageUri(asset.uri);
      const mimeType = asset.mimeType ?? 'image/jpeg';
      return { uri: asset.uri, mimeType };
    } catch {
      setPhase('error');
      setError('Failed to access photo library');
      return null;
    }
  };

  const createAnalysisJob = async (
    imageUri: string,
    mimeType: string,
    jobType: AnalysisMode,
    formData: Record<string, string> = {},
  ): Promise<string> => {
    if (!token) {
      throw new Error('Not authenticated');
    }

    // Build multipart form data
    const body = new FormData();

    // Add image as blob-like object (React Native FormData pattern)
    const ext = mimeType.split('/')[1] ?? 'jpg';
    body.append('image', {
      uri: imageUri,
      type: mimeType,
      name: `${jobType}.${ext}`,
    } as unknown as Blob);
    body.append('job_type', jobType);

    // Add additional form fields
    Object.entries(formData).forEach(([key, value]) => {
      body.append(key, value);
    });

    const response = await fetch(`${API_BASE}/analysis/jobs`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        // Note: Don't set Content-Type — fetch auto-sets multipart boundary
      },
      body,
    });

    if (response.status === 403) {
      throw new Error('UPGRADE_REQUIRED');
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error((err as { detail?: string }).detail ?? `HTTP ${response.status}`);
    }

    const result = await response.json() as { id: string }
    return result.id
  };

  const pollJob = async <T,>(jobId: string): Promise<T> => {
    if (!token) {
      throw new Error('Not authenticated');
    }

    for (let attempt = 0; attempt < 30; attempt += 1) {
      const response = await fetch(`${API_BASE}/analysis/jobs/${jobId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error((err as { detail?: string }).detail ?? `HTTP ${response.status}`);
      }

      const job = await response.json() as AnalysisJobResponse<T>
      setUser({ analysisJobStatus: job.status })
      if (job.status === 'completed' && job.result) {
        setUser({ analysisJobStatus: null })
        return job.result
      }
      if (job.status === 'failed') {
        setUser({ analysisJobStatus: null })
        throw new Error(job.error ?? 'Analysis failed')
      }

      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    setUser({ analysisJobStatus: null })
    throw new Error('Analysis timed out')
  };

  const analyzeSlide = async (coachingFocus = 'presentation'): Promise<void> => {
    const image = await pickImage();
    if (!image) return;

    setPhase('uploading');
    setError(null);
    setSlideResult(null);

    try {
      const jobId = await createAnalysisJob(
        image.uri,
        image.mimeType,
        'slide',
        { coaching_focus: coachingFocus },
      );
      const result = await pollJob<SlideAnalysisResult>(jobId);

      setSlideResult(result);
      setPhase('done');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Analysis failed';
      setError(message);
      setPhase('error');
    }
  };

  const analyzeDocument = async (): Promise<void> => {
    const image = await pickImage();
    if (!image) return;

    setPhase('uploading');
    setError(null);
    setDocumentResult(null);

    try {
      const jobId = await createAnalysisJob(
        image.uri,
        image.mimeType,
        'document',
      );
      const result = await pollJob<DocumentAnalysisResult>(jobId);

      setDocumentResult(result);
      setPhase('done');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Analysis failed';
      setError(message);
      setPhase('error');
    }
  };

  return {
    phase,
    slideResult,
    documentResult,
    selectedImageUri,
    error,
    analyzeSlide,
    analyzeDocument,
    reset,
  };
}
