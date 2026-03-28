import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Colors } from '../constants/Colors';

export interface Lesson {
  id: string;
  title: string;
  scenario: string;
  level: number;
  fpReward: number;
  isProOnly: boolean;
  canAccess?: boolean;
}

export interface LessonCardProps {
  lesson: Lesson;
  isCompleted?: boolean;
  onPress: () => void;
}

const SCENARIO_EMOJIS: Record<string, string> = {
  'Job Interview': '💼',
  'Presentations': '📊',
  'Small Talk': '☕',
  'Email Writing': '📧',
  'Negotiation': '🤝',
};

function LevelDots({ level, max = 5 }: { level: number; max?: number }): React.JSX.Element {
  return (
    <View style={levelStyles.row}>
      {Array.from({ length: max }).map((_, i) => (
        <View
          key={i}
          style={[
            levelStyles.dot,
            i < level ? levelStyles.dotFilled : levelStyles.dotEmpty,
          ]}
        />
      ))}
    </View>
  );
}

const levelStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 3,
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotFilled: {
    backgroundColor: Colors.primary,
  },
  dotEmpty: {
    backgroundColor: Colors.text.muted,
    opacity: 0.4,
  },
});

export function LessonCard({
  lesson,
  isCompleted = false,
  onPress,
}: LessonCardProps): React.JSX.Element {
  const isLocked = lesson.canAccess === false;
  const emoji = SCENARIO_EMOJIS[lesson.scenario] ?? '📝';

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isCompleted && styles.cardCompleted,
        isLocked && styles.cardLocked,
      ]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {/* Emoji */}
      <View style={styles.emojiContainer}>
        <Text style={styles.emoji}>{emoji}</Text>
        {isLocked && (
          <View style={styles.lockOverlay}>
            <Text style={styles.lockIcon}>🔒</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text
          style={[styles.title, isLocked && styles.titleLocked]}
          numberOfLines={2}
        >
          {lesson.title}
        </Text>

        <Text style={styles.scenario}>{lesson.scenario}</Text>

        <View style={styles.footer}>
          <LevelDots level={lesson.level} />
          <View style={styles.fpBadge}>
            <Text style={styles.fpText}>⚡ {lesson.fpReward} FP</Text>
          </View>
        </View>
      </View>

      {isCompleted && (
        <View style={styles.completedBadge}>
          <Text style={styles.completedCheck}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.2)',
    gap: 12,
  },
  cardCompleted: {
    borderColor: `${Colors.success}50`,
    backgroundColor: `${Colors.success}10`,
  },
  cardLocked: {
    opacity: 0.65,
  },
  emojiContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(108, 99, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  emoji: {
    fontSize: 26,
  },
  lockOverlay: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 1,
  },
  lockIcon: {
    fontSize: 13,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: Colors.text.primary,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  titleLocked: {
    color: Colors.text.secondary,
  },
  scenario: {
    color: Colors.text.muted,
    fontSize: 12,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  fpBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  fpText: {
    color: Colors.accent,
    fontSize: 11,
    fontWeight: '700',
  },
  completedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedCheck: {
    color: '#000',
    fontSize: 14,
    fontWeight: '800',
  },
});
