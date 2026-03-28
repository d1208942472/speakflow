import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';
import type { LeagueTier } from '../store/userStore';

export interface LeagueRowProps {
  rank: number;
  username: string;
  weeklyFP: number;
  league: LeagueTier;
  isCurrentUser?: boolean;
}

const LEAGUE_EMOJI: Record<LeagueTier, string> = {
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
  platinum: '🏅',
  diamond: '💎',
};

function getRankStyle(rank: number): { color: string; fontWeight: '800' | '700' | '600' } {
  if (rank === 1) return { color: Colors.accent, fontWeight: '800' };
  if (rank === 2) return { color: Colors.league.silver, fontWeight: '700' };
  if (rank === 3) return { color: Colors.league.bronze, fontWeight: '700' };
  return { color: Colors.text.secondary, fontWeight: '600' };
}

export function LeagueRow({
  rank,
  username,
  weeklyFP,
  league,
  isCurrentUser = false,
}: LeagueRowProps): React.JSX.Element {
  const rankStyle = getRankStyle(rank);
  const leagueColor = Colors.league[league];

  return (
    <View style={[styles.row, isCurrentUser && styles.rowHighlighted]}>
      {/* Rank */}
      <View style={styles.rankContainer}>
        <Text style={[styles.rank, rankStyle]}>{rank}</Text>
      </View>

      {/* League badge */}
      <Text style={styles.leagueEmoji}>{LEAGUE_EMOJI[league]}</Text>

      {/* Username */}
      <Text style={[styles.username, isCurrentUser && styles.usernameHighlighted]} numberOfLines={1}>
        {username}
        {isCurrentUser ? ' (You)' : ''}
      </Text>

      {/* FP */}
      <View style={styles.fpContainer}>
        <Text style={styles.fpIcon}>⚡</Text>
        <Text style={[styles.fpValue, { color: leagueColor }]}>
          {weeklyFP.toLocaleString()}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 4,
    gap: 10,
    backgroundColor: 'transparent',
  },
  rowHighlighted: {
    backgroundColor: 'rgba(108, 99, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.4)',
  },
  rankContainer: {
    width: 28,
    alignItems: 'center',
  },
  rank: {
    fontSize: 15,
  },
  leagueEmoji: {
    fontSize: 18,
  },
  username: {
    flex: 1,
    color: Colors.text.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  usernameHighlighted: {
    color: Colors.primaryLight,
    fontWeight: '700',
  },
  fpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  fpIcon: {
    fontSize: 13,
  },
  fpValue: {
    fontSize: 14,
    fontWeight: '700',
  },
});
