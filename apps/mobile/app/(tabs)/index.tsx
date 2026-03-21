import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { StreakBanner } from '../../components/StreakBanner';
import { LessonCard, type Lesson } from '../../components/LessonCard';
import { useUserStore } from '../../store/userStore';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

// Static lesson catalogue — in production this would come from the API
const LESSONS: Lesson[] = [
  {
    id: 'interview-001',
    title: 'Tell me about yourself',
    scenario: 'Job Interview',
    level: 1,
    fpReward: 20,
    isProOnly: false,
  },
  {
    id: 'interview-002',
    title: 'Strengths and weaknesses',
    scenario: 'Job Interview',
    level: 2,
    fpReward: 25,
    isProOnly: false,
  },
  {
    id: 'presentation-001',
    title: 'Opening a presentation',
    scenario: 'Presentations',
    level: 1,
    fpReward: 20,
    isProOnly: false,
  },
  {
    id: 'presentation-002',
    title: 'Handling Q&A',
    scenario: 'Presentations',
    level: 3,
    fpReward: 30,
    isProOnly: true,
  },
  {
    id: 'smalltalk-001',
    title: 'Breaking the ice',
    scenario: 'Small Talk',
    level: 1,
    fpReward: 15,
    isProOnly: false,
  },
  {
    id: 'email-001',
    title: 'Writing a follow-up email',
    scenario: 'Email Writing',
    level: 2,
    fpReward: 20,
    isProOnly: true,
  },
  {
    id: 'negotiation-001',
    title: 'Stating your position',
    scenario: 'Negotiation',
    level: 3,
    fpReward: 35,
    isProOnly: true,
  },
];

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

  const firstLessonByScenario = useMemo(() => {
    const map: Record<string, string> = {};
    for (const lesson of LESSONS) {
      if (!map[lesson.scenario]) {
        map[lesson.scenario] = lesson.id;
      }
    }
    return map;
  }, []);

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
        {LESSONS.map((lesson) => (
          <LessonCard
            key={lesson.id}
            lesson={lesson}
            onPress={() => router.push(`/lesson/${lesson.id}`)}
          />
        ))}

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
});
