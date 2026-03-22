import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { useUserStore, type LeagueTier } from '../../store/userStore';
import { supabase } from '../../services/supabase';

const LEAGUE_LABELS: Record<LeagueTier, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  platinum: 'Platinum',
  diamond: 'Diamond',
};

const LEAGUE_EMOJIS: Record<LeagueTier, string> = {
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
  platinum: '🏅',
  diamond: '💎',
};

interface StatBoxProps {
  label: string;
  value: string | number;
  emoji: string;
  color?: string;
}

function StatBox({ label, value, emoji, color = Colors.text.primary }: StatBoxProps): React.JSX.Element {
  return (
    <View style={statStyles.box}>
      <Text style={statStyles.emoji}>{emoji}</Text>
      <Text style={[statStyles.value, { color }]}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  box: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 4,
    minWidth: '45%',
  },
  emoji: {
    fontSize: 24,
    marginBottom: 2,
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
  },
  label: {
    color: Colors.text.muted,
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default function ProfileTab(): React.JSX.Element {
  const router = useRouter();
  const logout = useUserStore((s) => s.logout);
  const username = useUserStore((s) => s.username);
  const streak = useUserStore((s) => s.streak);
  const totalFP = useUserStore((s) => s.totalFP);
  const weeklyFP = useUserStore((s) => s.weeklyFP);
  const league = useUserStore((s) => s.league);
  const isPro = useUserStore((s) => s.isPro);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Lessons completed is stored in the profile; we approximate from store
  const lessonsCompleted = 0; // Pulled from Supabase profile in a real impl

  const leagueColor = Colors.league[league];

  const handleLogout = (): void => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          setIsLoggingOut(true);
          await supabase.auth.signOut();
          logout();
          setIsLoggingOut(false);
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const handleUpgrade = (): void => {
    router.push('/paywall');
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar / Username */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>
              {(username ?? 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.username}>{username ?? 'User'}</Text>

          {/* League badge */}
          <View style={[styles.leagueBadge, { borderColor: `${leagueColor}60` }]}>
            <Text style={styles.leagueEmoji}>{LEAGUE_EMOJIS[league]}</Text>
            <Text style={[styles.leagueLabel, { color: leagueColor }]}>
              {LEAGUE_LABELS[league]} League
            </Text>
          </View>

          {/* Pro badge */}
          {isPro && (
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>⚡ PRO</Text>
            </View>
          )}
        </View>

        {/* Stats grid */}
        <Text style={styles.sectionTitle}>Your Stats</Text>
        <View style={styles.statsGrid}>
          <StatBox
            emoji="🔥"
            label="Day Streak"
            value={streak}
            color={Colors.accent}
          />
          <StatBox
            emoji="⚡"
            label="Total FP"
            value={totalFP.toLocaleString()}
            color={Colors.primary}
          />
          <StatBox
            emoji="📅"
            label="Weekly FP"
            value={weeklyFP.toLocaleString()}
            color={Colors.success}
          />
          <StatBox
            emoji="🎓"
            label="Lessons Done"
            value={lessonsCompleted}
            color={Colors.text.primary}
          />
        </View>

        {/* Pro section */}
        {!isPro && (
          <View style={styles.proSection}>
            <View style={styles.proSectionContent}>
              <View style={styles.proSectionText}>
                <Text style={styles.proSectionTitle}>Unlock SpeakFlow Pro</Text>
                <Text style={styles.proSectionSubtitle}>
                  Access all lessons, NVIDIA AI feedback, and advanced scenarios
                </Text>
              </View>
              <TouchableOpacity
                style={styles.upgradeButton}
                onPress={handleUpgrade}
                activeOpacity={0.85}
              >
                <Text style={styles.upgradeButtonText}>Upgrade</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Settings / Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.actionRow} onPress={() => {}}>
            <Text style={styles.actionEmoji}>🔔</Text>
            <Text style={styles.actionLabel}>Notifications</Text>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>

          <View style={styles.separator} />

          <TouchableOpacity style={styles.actionRow} onPress={() => {}}>
            <Text style={styles.actionEmoji}>🌐</Text>
            <Text style={styles.actionLabel}>Language</Text>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>

          <View style={styles.separator} />

          <TouchableOpacity style={styles.actionRow} onPress={() => {}}>
            <Text style={styles.actionEmoji}>❓</Text>
            <Text style={styles.actionLabel}>Help & Support</Text>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={[styles.logoutButton, isLoggingOut && styles.logoutButtonDisabled]}
          onPress={handleLogout}
          disabled={isLoggingOut}
          activeOpacity={0.8}
        >
          {isLoggingOut ? (
            <ActivityIndicator color={Colors.danger} />
          ) : (
            <Text style={styles.logoutText}>Log Out</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.version}>SpeakFlow v1.0.0</Text>

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
    paddingTop: 24,
    paddingBottom: 32,
    gap: 20,
  },
  avatarSection: {
    alignItems: 'center',
    gap: 10,
  },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 10,
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 38,
    fontWeight: '800',
  },
  username: {
    color: Colors.text.primary,
    fontSize: 22,
    fontWeight: '800',
  },
  leagueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: Colors.card,
  },
  leagueEmoji: {
    fontSize: 15,
  },
  leagueLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  proBadge: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
  },
  proBadgeText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    color: Colors.text.primary,
    fontSize: 17,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  proSection: {
    backgroundColor: 'rgba(108, 99, 255, 0.12)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.4)',
    padding: 16,
  },
  proSectionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  proSectionText: {
    flex: 1,
    gap: 4,
  },
  proSectionTitle: {
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  proSectionSubtitle: {
    color: Colors.text.secondary,
    fontSize: 12,
    lineHeight: 17,
  },
  upgradeButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  actionsSection: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  actionEmoji: {
    fontSize: 18,
  },
  actionLabel: {
    flex: 1,
    color: Colors.text.primary,
    fontSize: 15,
    fontWeight: '500',
  },
  actionArrow: {
    color: Colors.text.muted,
    fontSize: 20,
    fontWeight: '300',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginLeft: 48,
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderWidth: 1,
    borderColor: `${Colors.danger}50`,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  logoutButtonDisabled: {
    opacity: 0.6,
  },
  logoutText: {
    color: Colors.danger,
    fontSize: 16,
    fontWeight: '700',
  },
  version: {
    color: Colors.text.muted,
    fontSize: 12,
    textAlign: 'center',
  },
  bottomPad: {
    height: 8,
  },
});
