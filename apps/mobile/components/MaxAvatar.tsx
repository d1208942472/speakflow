import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';

interface MaxAvatarProps {
  isThinking?: boolean;
  message?: string;
}

function ThinkingDots(): React.JSX.Element {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createPulse = (value: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );

    const anim1 = createPulse(dot1, 0);
    const anim2 = createPulse(dot2, 200);
    const anim3 = createPulse(dot3, 400);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, [dot1, dot2, dot3]);

  const makeDotStyle = (value: Animated.Value) => ({
    opacity: value,
    transform: [
      {
        translateY: value.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -6],
        }),
      },
    ],
  });

  return (
    <View style={dotStyles.container}>
      <Animated.View style={[dotStyles.dot, makeDotStyle(dot1)]} />
      <Animated.View style={[dotStyles.dot, makeDotStyle(dot2)]} />
      <Animated.View style={[dotStyles.dot, makeDotStyle(dot3)]} />
    </View>
  );
}

const dotStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
    height: 20,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.primary,
  },
});

export function MaxAvatar({ isThinking = false, message }: MaxAvatarProps): React.JSX.Element {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isThinking) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isThinking, pulseAnim]);

  return (
    <View style={styles.container}>
      {/* Avatar bubble */}
      <Animated.View
        style={[
          styles.avatarBubble,
          { transform: [{ scale: pulseAnim }] },
          isThinking && styles.avatarBubbleThinking,
        ]}
      >
        <Text style={styles.avatarEmoji}>🤖</Text>
      </Animated.View>

      {/* Max label */}
      <Text style={styles.name}>Max</Text>

      {/* Thinking dots or message */}
      {isThinking ? (
        <ThinkingDots />
      ) : message ? (
        <View style={styles.messageBubble}>
          <Text style={styles.messageText}>{message}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
  },
  avatarBubble: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(108, 99, 255, 0.2)',
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBubbleThinking: {
    borderColor: Colors.accent,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  avatarEmoji: {
    fontSize: 38,
  },
  name: {
    color: Colors.text.secondary,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  messageBubble: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: 280,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.3)',
  },
  messageText: {
    color: Colors.text.primary,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
});
