import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useUserStore, LeagueTier } from '../store/userStore';
import { Colors } from '../constants/Colors';

const LEAGUE_LABELS: Record<LeagueTier, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  diamond: 'Diamond',
};

export function StreakBanner(): React.JSX.Element {
  const streak = useUserStore((s) => s.streak);
  const totalFP = useUserStore((s) => s.totalFP);
  const league = useUserStore((s) => s.league);
  const streakShields = useUserStore((s) => s.streakShields);

  const leagueColor = Colors.league[league];

  return (
    <View style={styles.container}>
      <View style={styles.stat}>
        <Text style={styles.icon}>🔥</Text>
        <Text style={styles.value}>{streak}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.stat}>
        <Text style={styles.icon}>⚡</Text>
        <Text style={styles.value}>{totalFP.toLocaleString()}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.stat}>
        <Text style={styles.icon}>🏆</Text>
        <Text style={[styles.value, { color: leagueColor }]}>
          {LEAGUE_LABELS[league]}
        </Text>
      </View>

      {streakShields > 0 && (
        <>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.icon}>🛡️</Text>
            <Text style={styles.value}>{streakShields}</Text>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'space-around',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  icon: {
    fontSize: 18,
  },
  value: {
    color: Colors.text.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: Colors.text.muted,
    opacity: 0.4,
  },
});
