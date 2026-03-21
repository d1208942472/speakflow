import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';

interface ScoreRingProps {
  score: number | null;
  size?: number;
}

function getScoreColor(score: number): string {
  if (score >= 80) return Colors.success;
  if (score >= 60) return Colors.accent;
  return Colors.danger;
}

function getScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent!';
  if (score >= 80) return 'Great!';
  if (score >= 70) return 'Good';
  if (score >= 60) return 'Fair';
  return 'Keep Practicing';
}

export function ScoreRing({ score, size = 140 }: ScoreRingProps): React.JSX.Element {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const displayScore = score ?? 0;
  const color = score !== null ? getScoreColor(displayScore) : Colors.text.muted;
  const label = score !== null ? getScoreLabel(displayScore) : '';

  useEffect(() => {
    if (score !== null) {
      Animated.timing(animatedValue, {
        toValue: displayScore / 100,
        duration: 1200,
        useNativeDriver: false,
      }).start();
    } else {
      animatedValue.setValue(0);
    }
  }, [score, displayScore, animatedValue]);

  const strokeWidth = size * 0.08;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // We render the ring using a View-based approach with transforms for RN compatibility
  const ringProgress = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Background ring */}
      <View
        style={[
          styles.ringBackground,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: 'rgba(255,255,255,0.1)',
          },
        ]}
      />

      {/* Animated progress ring — uses rotation trick for a simple arc */}
      <Animated.View
        style={[
          styles.ringForeground,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: color,
            borderTopColor: 'transparent',
            borderRightColor: 'transparent',
            transform: [
              {
                rotate: animatedValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['-130deg', '230deg'],
                }),
              },
            ],
          },
        ]}
      />

      {/* Score text overlay */}
      <View style={styles.scoreOverlay}>
        {score !== null ? (
          <>
            <Text style={[styles.scoreNumber, { color }]}>{displayScore}</Text>
            <Text style={[styles.scoreLabel, { color }]}>{label}</Text>
          </>
        ) : (
          <Text style={styles.scorePlaceholder}>—</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  ringBackground: {
    position: 'absolute',
  },
  ringForeground: {
    position: 'absolute',
  },
  scoreOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: {
    fontSize: 36,
    fontWeight: '800',
    lineHeight: 40,
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  scorePlaceholder: {
    fontSize: 32,
    color: Colors.text.muted,
    fontWeight: '300',
  },
});
