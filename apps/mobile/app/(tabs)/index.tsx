import React, { useMemo, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { StreakBanner } from '../../components/StreakBanner';
import { LessonCard, type Lesson } from '../../components/LessonCard';
import { useUserStore } from '../../store/userStore';
import { apiGet } from '../../services/api';
import { useRecommendations } from '../../hooks/useRecommendations';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

// Fallback lessons for offline / API unavailable
const FALLBACK_LESSONS: Lesson[] = [
  { id: 'interview-001', title: 'Tell me about yourself', scenario: 'Job Interview', level: 1, fpReward: 20, isProOnly: false },
  { id: 'interview-002', title: 'Strengths and weaknesses', scenario: 'Job Interview', level: 2, fpReward: 25, isProOnly: false },
  { id: 'presentation-001', title: 'Opening a presentation', scenario: 'Presentations', level: 1, fpReward: 20, isProOnly: false },
  { id: 'smalltalk-001', title: 'Breaking the ice', scenario: 'Small Talk', level: 1, fpReward: 15, isProOnly: false },
];

interface ApiLessonsResponse {
  lessons: Array<{
    id: string;
    scenario: string;
    level: number;
    title: string;
    fp_reward: number;
    is_pro_only: boolean;
  }>;
}

function useApiLessons(): { lessons: Lesson[]; isLoading: boolean } {
  const token = useUserStore((s) => s.token);
  const [lessons, setLessons] = useState<Lesson[]>(FALLBACK_LESSONS);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    setIsLoading(true);
    apiGet<ApiLessonsResponse>('/lessons/', token)
      .then((data) => {
        const mapped: Lesson[] = data.lessons.map((l) => ({
          id: l.id,
          title: l.title,
          scenario: l.scenario,
          level: l.level as 1 | 2 | 3 | 4 | 5,
          fpReward: l.fp_reward,
          isProOnly: l.is_pro_only,
        }));
        if (mapped.length > 0) setLessons(mapped);
      })
      .catch(() => {
        // Keep fallback data on error — no-op
      })
      .finally(() => setIsLoading(false));
  }, [token]);

  return { lessons, isLoading };
}

interface ScenarioCard {
  emoji: string;
  label: string;
  scenario: string;
  color: string;
}

const SCENARIO_CARDS: ScenarioCard[] = [
  { emoji: '💼', label: 'Job Interview', scenario: 'Job Interview', color: '#6C63FF' },
  { emoji: '📊', label: 'Presentations', scenario: 'Presentations', color: '#4ECDC4' },
  { emoji: '☕', label: 'Small Talk', scenario: 'Small Talk', color: '#FF8C42' },
  { emoji: '📧', label: 'Email Writing', scenario: 'Email Writing', color: '#A8E063' },
  { emoji: '🤝', label: 'Negotiation', scenario: 'Negotiation', color: '#FFD700' },
];

export default function LearnTab(): React.JSX.Element {
  const router = useRouter();
  const username = useUserStore((s) => s.username);
  const greeting = useMemo(() => getGreeting(), []);
  const { lessons, isLoading: lessonsLoading } = useApiLessons();
  const { recommendations, loading: recLoading } = useRecommendations(3);

  const firstLessonByScenario = useMemo(() => {
    const map: Record<string, string> = {};
    for (const lesson of lessons) {
      if (!map[lesson.scenario]) {
        map[lesson.scenario] = lesson.id;
      }
    }
    return map;
  }, [lessons]);

  const handleScenarioPress = (scenario: string): void => {
    const lessonId = firstLessonByScenario[scenario];
    if (lessonId) {
      router.push(`/lesson/${lessonId}`);
    }
  };

  const handleDailyChallenge = (): void => {
    // Navigate to today's daily challenge lesson
    router.push('/lesson/interview-001');
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting */}
        <View style={styles.header}>
          <Text style={styles.greeting}>
            {greeting}, {username ?? 'there'} 👋
          </Text>
          <Text style={styles.subheading}>Ready to practice today?</Text>
        </View>

        {/* Streak Banner */}
        <StreakBanner />

        {/* AI Recommendations (NVIDIA NIM Embeddings) */}
        {(recLoading || recommendations.length > 0) && (
          <View>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>✨ Recommended for You</Text>
              <Text style={styles.sectionBadge}>AI-Powered</Text>
            </View>
            {recLoading ? (
              <ActivityIndicator color={Colors.primary} style={{ marginVertical: 8 }} />
            ) : (
              recommendations.map((rec) => (
                <TouchableOpacity
                  key={rec.id}
                  style={styles.recCard}
                  onPress={() => router.push(`/lesson/${rec.id}`)}
                  activeOpacity={0.8}
                >
                  <View style={styles.recCardTop}>
                    <Text style={styles.recTitle}>{rec.title}</Text>
                    {rec.isProOnly && (
                      <View style={styles.recProBadge}>
                        <Text style={styles.recProText}>PRO</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.recReason}>{rec.reason}</Text>
                  <View style={styles.recMeta}>
                    <Text style={styles.recMetaText}>
                      Level {rec.level} · ⚡ {rec.fpReward} FP
                    </Text>
                    <Text style={styles.recScore}>
                      {Math.round(rec.relevanceScore * 100)}% match
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* Daily Challenge CTA */}
        <TouchableOpacity
          style={styles.dailyChallenge}
          onPress={handleDailyChallenge}
          activeOpacity={0.85}
        >
          <View style={styles.dailyChallengeContent}>
            <View style={styles.dailyChallengeLeft}>
              <View style={styles.doubleXPBadge}>
                <Text style={styles.doubleXPText}>2× FP</Text>
              </View>
              <Text style={styles.dailyChallengeTitle}>Daily Challenge</Text>
              <Text style={styles.dailyChallengeSubtitle}>
                Complete today's challenge to earn bonus FP
              </Text>
            </View>
            <Text style={styles.dailyChallengeEmoji}>🎯</Text>
          </View>
        </TouchableOpacity>

        {/* Scenarios grid */}
        <Text style={styles.sectionTitle}>Practice Scenarios</Text>
        <View style={styles.scenarioGrid}>
          {SCENARIO_CARDS.map((card) => (
            <TouchableOpacity
              key={card.scenario}
              style={[styles.scenarioCard, { borderColor: `${card.color}40` }]}
              onPress={() => handleScenarioPress(card.scenario)}
              activeOpacity={0.75}
            >
              <View
                style={[
                  styles.scenarioIconBg,
                  { backgroundColor: `${card.color}20` },
                ]}
              >
                <Text style={styles.scenarioEmoji}>{card.emoji}</Text>
              </View>
              <Text style={styles.scenarioLabel}>{card.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* All lessons list */}
        <Text style={styles.sectionTitle}>All Lessons</Text>
        {lessonsLoading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginVertical: 16 }} />
        ) : (
          lessons.map((lesson) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              onPress={() => router.push(`/lesson/${lesson.id}`)}
            />
          ))
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
  header: {
    gap: 4,
  },
  greeting: {
    color: Colors.text.primary,
    fontSize: 24,
    fontWeight: '800',
  },
  subheading: {
    color: Colors.text.secondary,
    fontSize: 15,
  },
  dailyChallenge: {
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: Colors.primary,
    // Gradient-like layering effect using shadow
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  dailyChallengeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  dailyChallengeLeft: {
    flex: 1,
    gap: 5,
  },
  doubleXPBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  doubleXPText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  dailyChallengeTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },
  dailyChallengeSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    lineHeight: 18,
  },
  dailyChallengeEmoji: {
    fontSize: 46,
  },
  sectionTitle: {
    color: Colors.text.primary,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  scenarioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  scenarioCard: {
    width: '47%',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
  },
  scenarioIconBg: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scenarioEmoji: {
    fontSize: 26,
  },
  scenarioLabel: {
    color: Colors.text.primary,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  bottomPad: {
    height: 20,
  },
  // AI Recommendation cards
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionBadge: {
    color: Colors.primaryLight,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    backgroundColor: 'rgba(108, 99, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  recCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.2)',
    gap: 6,
  },
  recCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  recTitle: {
    color: Colors.text.primary,
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  recProBadge: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  recProText: {
    color: '#000',
    fontSize: 9,
    fontWeight: '800',
  },
  recReason: {
    color: Colors.text.secondary,
    fontSize: 12,
    lineHeight: 17,
  },
  recMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recMetaText: {
    color: Colors.text.muted,
    fontSize: 11,
  },
  recScore: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
});
