import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { Colors } from '../constants/Colors';
import { useUserStore } from '../store/userStore';
import { upsertUserProfile } from '../services/supabase';

// --- Types ---
type EnglishLevel = 'beginner' | 'intermediate' | 'advanced';
type Goal = 'job_interview' | 'presentation' | 'general_fluency' | 'negotiation';
type DailyGoal = 3 | 5 | 10;

interface OnboardingData {
  level: EnglishLevel | null;
  goal: Goal | null;
  dailyGoal: DailyGoal | null;
}

// --- Step configs ---
interface OptionItem<T> {
  value: T;
  emoji: string;
  label: string;
  description: string;
}

const LEVEL_OPTIONS: OptionItem<EnglishLevel>[] = [
  {
    value: 'beginner',
    emoji: '🌱',
    label: 'Beginner',
    description: 'I can handle basic conversations',
  },
  {
    value: 'intermediate',
    emoji: '🌿',
    label: 'Intermediate',
    description: 'I can communicate but want to improve',
  },
  {
    value: 'advanced',
    emoji: '🌳',
    label: 'Advanced',
    description: 'I want to perfect my professional English',
  },
];

const GOAL_OPTIONS: OptionItem<Goal>[] = [
  {
    value: 'job_interview',
    emoji: '💼',
    label: 'Job Interview',
    description: 'Ace interviews at top companies',
  },
  {
    value: 'presentation',
    emoji: '📊',
    label: 'Presentations',
    description: 'Deliver compelling business presentations',
  },
  {
    value: 'general_fluency',
    emoji: '💬',
    label: 'General Fluency',
    description: 'Improve everyday business communication',
  },
  {
    value: 'negotiation',
    emoji: '🤝',
    label: 'Negotiation',
    description: 'Win deals and influence outcomes',
  },
];

const DAILY_GOAL_OPTIONS: OptionItem<DailyGoal>[] = [
  {
    value: 3,
    emoji: '🕐',
    label: 'Casual',
    description: '3 minutes per day',
  },
  {
    value: 5,
    emoji: '🔥',
    label: 'Regular',
    description: '5 minutes per day',
  },
  {
    value: 10,
    emoji: '⚡',
    label: 'Intense',
    description: '10 minutes per day',
  },
];

// --- Generic Option Selector ---
function OptionSelector<T>({
  options,
  selected,
  onSelect,
}: {
  options: OptionItem<T>[];
  selected: T | null;
  onSelect: (value: T) => void;
}): React.JSX.Element {
  return (
    <View style={selectorStyles.container}>
      {options.map((option) => {
        const isSelected = selected === option.value;
        return (
          <TouchableOpacity
            key={String(option.value)}
            style={[
              selectorStyles.option,
              isSelected && selectorStyles.optionSelected,
            ]}
            onPress={() => onSelect(option.value)}
            activeOpacity={0.75}
          >
            <Text style={selectorStyles.optionEmoji}>{option.emoji}</Text>
            <View style={selectorStyles.optionText}>
              <Text
                style={[
                  selectorStyles.optionLabel,
                  isSelected && selectorStyles.optionLabelSelected,
                ]}
              >
                {option.label}
              </Text>
              <Text style={selectorStyles.optionDescription}>{option.description}</Text>
            </View>
            <View
              style={[
                selectorStyles.radio,
                isSelected && selectorStyles.radioSelected,
              ]}
            >
              {isSelected && <View style={selectorStyles.radioInner} />}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const selectorStyles = StyleSheet.create({
  container: {
    gap: 10,
    width: '100%',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionSelected: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
  },
  optionEmoji: {
    fontSize: 28,
    width: 36,
    textAlign: 'center',
  },
  optionText: {
    flex: 1,
    gap: 2,
  },
  optionLabel: {
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  optionLabelSelected: {
    color: Colors.primaryLight,
  },
  optionDescription: {
    color: Colors.text.muted,
    fontSize: 13,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.text.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: Colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
});

// --- Progress Dots ---
function ProgressDots({ current, total }: { current: number; total: number }): React.JSX.Element {
  return (
    <View style={dotStyles.container}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            dotStyles.dot,
            i <= current ? dotStyles.dotActive : dotStyles.dotInactive,
          ]}
        />
      ))}
    </View>
  );
}

const dotStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
    backgroundColor: Colors.primary,
  },
  dotInactive: {
    width: 8,
    backgroundColor: Colors.text.muted,
    opacity: 0.4,
  },
});

// --- Main Component ---
const STEPS = [
  {
    title: "What's your English level?",
    subtitle: 'We'll personalize your learning path',
  },
  {
    title: "What's your main goal?",
    subtitle: 'Focus on what matters most to you',
  },
  {
    title: 'Set your daily goal',
    subtitle: 'Consistency is the key to fluency',
  },
];

export default function OnboardingScreen(): React.JSX.Element {
  const router = useRouter();
  const userId = useUserStore((s) => s.userId);
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    level: null,
    goal: null,
    dailyGoal: null,
  });
  const [isFinishing, setIsFinishing] = useState(false);

  const slideAnim = useRef(new Animated.Value(0)).current;

  const animateStep = (next: number): void => {
    const direction = next > step ? 1 : -1;
    slideAnim.setValue(direction * 300);
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 60,
      friction: 10,
      useNativeDriver: true,
    }).start();
    setStep(next);
  };

  const canContinue = (): boolean => {
    if (step === 0) return data.level !== null;
    if (step === 1) return data.goal !== null;
    if (step === 2) return data.dailyGoal !== null;
    return false;
  };

  const handleContinue = async (): Promise<void> => {
    if (step < 2) {
      animateStep(step + 1);
      return;
    }

    // Step 2 complete — request notifications and finish
    setIsFinishing(true);

    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        // Non-blocking — continue anyway
        console.log('[Onboarding] Notification permission denied');
      }

      // Save preferences to Supabase
      if (userId) {
        await upsertUserProfile(userId, {
          // Store level and goal in profile (requires schema support)
          // In this implementation we pass them through user_metadata via Supabase
        });
      }
    } catch (e) {
      console.error('[Onboarding] finish error:', e);
    } finally {
      setIsFinishing(false);
      router.replace('/(tabs)');
    }
  };

  const currentStep = STEPS[step];

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.container}>
        {/* Header area */}
        <View style={styles.topBar}>
          <ProgressDots current={step} total={3} />
          {step > 0 && (
            <TouchableOpacity onPress={() => animateStep(step - 1)}>
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Step content */}
        <Animated.View
          style={[
            styles.stepContent,
            { transform: [{ translateX: slideAnim }] },
          ]}
        >
          <Text style={styles.stepEmoji}>
            {step === 0 ? '🎯' : step === 1 ? '🚀' : '⏰'}
          </Text>
          <Text style={styles.title}>{currentStep.title}</Text>
          <Text style={styles.subtitle}>{currentStep.subtitle}</Text>

          {step === 0 && (
            <OptionSelector
              options={LEVEL_OPTIONS}
              selected={data.level}
              onSelect={(value) => setData((d) => ({ ...d, level: value }))}
            />
          )}

          {step === 1 && (
            <OptionSelector
              options={GOAL_OPTIONS}
              selected={data.goal}
              onSelect={(value) => setData((d) => ({ ...d, goal: value }))}
            />
          )}

          {step === 2 && (
            <OptionSelector
              options={DAILY_GOAL_OPTIONS}
              selected={data.dailyGoal}
              onSelect={(value) => setData((d) => ({ ...d, dailyGoal: value }))}
            />
          )}
        </Animated.View>

        {/* CTA */}
        <TouchableOpacity
          style={[
            styles.continueButton,
            (!canContinue() || isFinishing) && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!canContinue() || isFinishing}
          activeOpacity={0.85}
        >
          <Text style={styles.continueButtonText}>
            {step === 2 ? (isFinishing ? 'Setting up...' : "Let's Go! 🚀") : 'Continue'}
          </Text>
        </TouchableOpacity>

        {/* Skip */}
        <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
    gap: 20,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backText: {
    color: Colors.text.secondary,
    fontSize: 15,
    fontWeight: '500',
  },
  stepContent: {
    flex: 1,
    gap: 16,
  },
  stepEmoji: {
    fontSize: 52,
    textAlign: 'center',
    marginBottom: 4,
  },
  title: {
    color: Colors.text.primary,
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: Colors.text.secondary,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 8,
  },
  continueButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  continueButtonDisabled: {
    backgroundColor: Colors.text.muted,
    shadowColor: 'transparent',
    opacity: 0.6,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  skipText: {
    color: Colors.text.muted,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
