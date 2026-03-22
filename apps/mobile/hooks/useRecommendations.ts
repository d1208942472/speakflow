/**
 * useRecommendations — AI-powered lesson recommendations from /recommend/next-lesson
 *
 * Calls NVIDIA NIM Embeddings on the backend to semantically match the user's
 * current learning profile (scores, grammar weak areas, completed scenarios) to
 * the most relevant next lessons in the catalog.
 *
 * Usage:
 *   const { recommendations, profileSummary, loading, refetch } = useRecommendations();
 */
import { useState, useEffect, useCallback } from 'react';
import { useUserStore } from '../store/userStore';
import { apiGet } from '../services/api';

export interface RecommendedLesson {
  id: string;
  title: string;
  scenario: string;
  level: number;
  fpReward: number;
  isProOnly: boolean;
  relevanceScore: number;
  reason: string;
}

interface ApiRecommendedLesson {
  id: string;
  title: string;
  scenario: string;
  level: number;
  fp_reward: number;
  is_pro_only: boolean;
  relevance_score: number;
  reason: string;
}

interface ApiRecommendationResponse {
  recommendations: ApiRecommendedLesson[];
  profile_summary: string;
}

export interface UseRecommendationsReturn {
  recommendations: RecommendedLesson[];
  profileSummary: string;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useRecommendations(limit = 3): UseRecommendationsReturn {
  const [recommendations, setRecommendations] = useState<RecommendedLesson[]>([]);
  const [profileSummary, setProfileSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const token = useUserStore((s) => s.token);

  const fetchRecommendations = useCallback(async (): Promise<void> => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const data = await apiGet<ApiRecommendationResponse>(
        `/recommend/next-lesson?limit=${limit}`,
        token
      );

      setRecommendations(
        data.recommendations.map((r) => ({
          id: r.id,
          title: r.title,
          scenario: r.scenario,
          level: r.level,
          fpReward: r.fp_reward,
          isProOnly: r.is_pro_only,
          relevanceScore: r.relevance_score,
          reason: r.reason,
        }))
      );
      setProfileSummary(data.profile_summary);
    } catch {
      setError('Could not load recommendations');
    } finally {
      setLoading(false);
    }
  }, [token, limit]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  return {
    recommendations,
    profileSummary,
    loading,
    error,
    refetch: fetchRecommendations,
  };
}
