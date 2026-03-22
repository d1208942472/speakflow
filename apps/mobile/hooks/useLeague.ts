import { useState, useEffect, useCallback } from 'react';
import { apiGet } from '../services/api';
import { useUserStore } from '../store/userStore';
import type { LeagueTier } from '../store/userStore';

export interface LeagueStanding {
  userId: string;
  username: string | null;
  weeklyFP: number;
  streak: number;
  league: LeagueTier;
  rank: number;
  isCurrentUser: boolean;
}

// Shape of /leagues/standings response from backend (snake_case)
interface LeagueStandingsApiResponse {
  week_start: string;
  league: string;
  standings: Array<{
    rank: number;
    user_id: string;
    username: string | null;
    weekly_fp: number;
    streak: number;
    league: string;
    is_current_user: boolean;
  }>;
  current_user_rank: number;
  current_user_weekly_fp: number;
  total_participants: number;
  promotion_zone_cutoff: number;
  demotion_zone_cutoff: number;
}

export interface UseLeagueReturn {
  standings: LeagueStanding[];
  userRank: number | null;
  promotionCutoff: number;
  demotionCutoff: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useLeague(): UseLeagueReturn {
  const [standings, setStandings] = useState<LeagueStanding[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [promotionCutoff, setPromotionCutoff] = useState(0);
  const [demotionCutoff, setDemotionCutoff] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = useUserStore((s) => s.token);

  const fetchStandings = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);
    setError(null);

    try {
      // week_offset=0 = current week; backend derives league from authenticated user's profile
      const response = await apiGet<LeagueStandingsApiResponse>(
        '/leagues/standings?week_offset=0',
        token
      );

      // Map snake_case API fields to camelCase frontend types
      const mapped: LeagueStanding[] = response.standings.map((entry) => ({
        rank: entry.rank,
        userId: entry.user_id,
        username: entry.username,
        weeklyFP: entry.weekly_fp,
        streak: entry.streak,
        league: entry.league as LeagueTier,
        isCurrentUser: entry.is_current_user,
      }));

      setStandings(mapped);
      setUserRank(response.current_user_rank);
      setPromotionCutoff(response.promotion_zone_cutoff);
      setDemotionCutoff(response.demotion_zone_cutoff);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load standings';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchStandings();
  }, [fetchStandings]);

  return {
    standings,
    userRank,
    promotionCutoff,
    demotionCutoff,
    isLoading,
    error,
    refresh: fetchStandings,
  };
}
