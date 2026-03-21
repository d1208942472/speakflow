import { useState, useEffect, useCallback } from 'react';
import { apiGet } from '../services/api';
import { useUserStore } from '../store/userStore';

export interface LeagueStanding {
  userId: string;
  username: string;
  weeklyFP: number;
  league: 'bronze' | 'silver' | 'gold' | 'diamond';
  rank: number;
}

interface LeagueStandingsResponse {
  standings: LeagueStanding[];
  user_rank: number;
}

export interface UseLeagueReturn {
  standings: LeagueStanding[];
  userRank: number | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useLeague(): UseLeagueReturn {
  const [standings, setStandings] = useState<LeagueStanding[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = useUserStore((s) => s.token);
  const league = useUserStore((s) => s.league);

  const fetchStandings = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiGet<LeagueStandingsResponse>(
        `/leagues/standings?league=${league}`,
        token
      );
      setStandings(response.standings);
      setUserRank(response.user_rank);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load standings';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [token, league]);

  useEffect(() => {
    fetchStandings();
  }, [fetchStandings]);

  return {
    standings,
    userRank,
    isLoading,
    error,
    refresh: fetchStandings,
  };
}
