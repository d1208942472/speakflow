import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { LeagueRow } from '../../components/LeagueRow';
import { useLeague } from '../../hooks/useLeague';
import { useUserStore, type LeagueTier } from '../../store/userStore';

const LEAGUE_LABELS: Record<LeagueTier, string> = {
  bronze: 'Bronze League',
  silver: 'Silver League',
  gold: 'Gold League',
  platinum: 'Platinum League',
  diamond: 'Diamond League',
};

const LEAGUE_EMOJIS: Record<LeagueTier, string> = {
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
  platinum: '🏅',
  diamond: '💎',
};

function useCountdownToSunday(): string {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const daysUntilSunday = dayOfWeek === 0 ? 7 : 7 - dayOfWeek;

  const resetDate = new Date(now);
  resetDate.setDate(now.getDate() + daysUntilSunday);
  resetDate.setHours(0, 0, 0, 0);

  const diffMs = resetDate.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const diffDays = Math.floor(diffHours / 24);
  const remainingHours = diffHours % 24;

  if (diffDays > 0) {
    return `${diffDays}d ${remainingHours}h`;
  }
  return `${diffHours}h ${diffMinutes}m`;
}

export default function LeaguesTab(): React.JSX.Element {
  const { standings, userRank, promotionCutoff, demotionCutoff, isLoading, error, refresh } = useLeague();
  const league = useUserStore((s) => s.league);
  const userId = useUserStore((s) => s.userId);
  const weeklyFP = useUserStore((s) => s.weeklyFP);
  const leagueColor = Colors.league[league];
  const countdown = useCountdownToSunday();

  const top30 = useMemo(() => standings.slice(0, 30), [standings]);

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refresh}
            tintColor={Colors.primary}
          />
        }
      >
        {/* League Header */}
        <View style={[styles.leagueHeader, { borderColor: `${leagueColor}40` }]}>
          <Text style={styles.leagueEmoji}>{LEAGUE_EMOJIS[league]}</Text>
          <View style={styles.leagueHeaderText}>
            <Text style={[styles.leagueName, { color: leagueColor }]}>
              {LEAGUE_LABELS[league]}
            </Text>
            <Text style={styles.leagueSubtitle}>Weekly competition</Text>
          </View>
        </View>

        {/* Countdown + user rank */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{countdown}</Text>
            <Text style={styles.statLabel}>Until reset</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>
              {userRank !== null ? `#${userRank}` : '—'}
            </Text>
            <Text style={styles.statLabel}>Your rank</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: leagueColor }]}>
              ⚡ {weeklyFP}
            </Text>
            <Text style={styles.statLabel}>Weekly FP</Text>
          </View>
        </View>

        {/* League info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            Top 10 players promote to a higher league. Bottom 5 players drop down. Keep practicing to climb!
          </Text>
        </View>

        {/* Standings list */}
        <Text style={styles.sectionTitle}>Standings</Text>

        {isLoading && standings.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={Colors.primary} size="large" />
            <Text style={styles.loadingText}>Loading standings...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={refresh}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : top30.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No standings yet. Be the first to practice!</Text>
          </View>
        ) : (
          <View style={styles.standingsList}>
            {/* Promotion zone indicator */}
            <View style={styles.zoneLabel}>
              <View style={[styles.zoneDot, { backgroundColor: Colors.success }]} />
              <Text style={[styles.zoneLabelText, { color: Colors.success }]}>
                Promotion zone (Top 10)
              </Text>
            </View>

            {top30.map((standing, index) => (
              <React.Fragment key={standing.userId}>
                {/* Danger zone divider after rank 25 */}
                {index === demotionCutoff - 1 && (
                  <View style={styles.zoneLabel}>
                    <View style={[styles.zoneDot, { backgroundColor: Colors.danger }]} />
                    <Text style={[styles.zoneLabelText, { color: Colors.danger }]}>
                      Demotion zone
                    </Text>
                  </View>
                )}
                <LeagueRow
                  rank={standing.rank}
                  username={standing.username}
                  weeklyFP={standing.weeklyFP}
                  league={standing.league}
                  isCurrentUser={standing.userId === userId}
                />
              </React.Fragment>
            ))}
          </View>
        )}

        <View style={styles.bottomPad} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 16,
  },
  leagueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 18,
    gap: 14,
    borderWidth: 1,
  },
  leagueEmoji: {
    fontSize: 44,
  },
  leagueHeaderText: {
    gap: 3,
  },
  leagueName: {
    fontSize: 22,
    fontWeight: '800',
  },
  leagueSubtitle: {
    color: Colors.text.secondary,
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  statValue: {
    color: Colors.text.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    color: Colors.text.muted,
    fontSize: 11,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.text.muted,
    opacity: 0.3,
  },
  infoCard: {
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.25)',
  },
  infoText: {
    color: Colors.text.secondary,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  sectionTitle: {
    color: Colors.text.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  standingsList: {
    gap: 2,
  },
  zoneLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  zoneDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  zoneLabelText: {
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: Colors.text.secondary,
    fontSize: 14,
  },
  errorContainer: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.text.secondary,
    fontSize: 15,
    textAlign: 'center',
  },
  bottomPad: {
    height: 20,
  },
});
