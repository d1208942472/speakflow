import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { ScoreRing } from '../../components/ScoreRing';
import { MaxAvatar } from '../../components/MaxAvatar';
import { useRecording } from '../../hooks/useRecording';
import { useSpeakingSession } from '../../hooks/useSpeakingSession';
import { useTTS } from '../../hooks/useTTS';
import { useVoiceChat } from '../../hooks/useVoiceChat';
import { useUserStore } from '../../store/userStore';
import { apiGet } from '../../services/api';

// --- Lesson data fetched from API ---
interface LessonData {
  id: string;
  title: string;
  scenario: string;
  targetPhrase: string;
  systemPrompt: string;
  level: number;
  fpReward: number;
  isProOnly: boolean;
  instructions: string;
}

const SCENARIO_DISPLAY: Record<string, string> = {
  job_interview: 'Job Interview',
  presentation: 'Presentations',
  small_talk: 'Small Talk',
  email: 'Email Writing',
  negotiation: 'Negotiation',
};

interface ApiLessonResponse {
  id: string;
  scenario: string;
  level: number;
  title: string;
  description: string;
  target_phrases: string[];
  conversation_system_prompt: string;
  fp_reward: number;
  is_pro_only: boolean;
}

function mapApiLesson(data: ApiLessonResponse): LessonData {
  return {
    id: data.id,
    title: data.title,
    scenario: SCENARIO_DISPLAY[data.scenario] ?? data.scenario,
    targetPhrase: data.target_phrases?.[0] ?? 'Speak naturally and clearly.',
    systemPrompt: data.conversation_system_prompt,
    level: data.level,
    fpReward: data.fp_reward,
    isProOnly: data.is_pro_only,
    instructions: data.description,
  };
}

// --- Waveform Visualization ---
function Waveform({ isActive }: { isActive: boolean }): React.JSX.Element {
  const bars = Array.from({ length: 20 });
  const animations = useRef(bars.map(() => new Animated.Value(0.2))).current;

  useEffect(() => {
    if (isActive) {
      const animList = animations.map((anim, i) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(i * 60),
            Animated.timing(anim, {
              toValue: 0.2 + Math.random() * 0.8,
              duration: 300 + Math.random() * 200,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0.2,
              duration: 300,
              useNativeDriver: true,
            }),
          ])
        )
      );
      animList.forEach((a) => a.start());
      return () => animList.forEach((a) => a.stop());
    } else {
      animations.forEach((anim) => {
        Animated.timing(anim, {
          toValue: 0.2,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    }
  }, [isActive, animations]);

  return (
    <View style={waveStyles.container}>
      {animations.map((anim, i) => (
        <Animated.View
          key={i}
          style={[
            waveStyles.bar,
            {
              transform: [{ scaleY: anim }],
              backgroundColor: isActive ? Colors.primary : Colors.text.muted,
            },
          ]}
        />
      ))}
    </View>
  );
}

const waveStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    gap: 3,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  bar: {
    width: 4,
    height: 40,
    borderRadius: 3,
  },
});

// --- FP Celebration ---
function FPCelebration({ fp }: { fp: number }): React.JSX.Element {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [scaleAnim, opacityAnim]);

  return (
    <Animated.View
      style={[
        celebStyles.container,
        {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <Text style={celebStyles.emoji}>🎉</Text>
      <Text style={celebStyles.fpText}>+{fp} FP</Text>
      <Text style={celebStyles.label}>Earned!</Text>
    </Animated.View>
  );
}

const celebStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.accent,
    paddingHorizontal: 32,
    paddingVertical: 20,
    gap: 6,
  },
  emoji: {
    fontSize: 44,
  },
  fpText: {
    color: Colors.accent,
    fontSize: 36,
    fontWeight: '800',
  },
  label: {
    color: Colors.text.secondary,
    fontSize: 16,
    fontWeight: '600',
  },
});

// --- Main Component ---
export default function LessonScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const isPro = useUserStore((s) => s.isPro);
  const token = useUserStore((s) => s.token);

  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [lessonLoading, setLessonLoading] = useState(true);
  const [lessonError, setLessonError] = useState<string | null>(null);

  const fetchLesson = useCallback(async () => {
    if (!id || !token) return;
    setLessonLoading(true);
    setLessonError(null);
    try {
      const data = await apiGet<ApiLessonResponse>(`/lessons/${id}`, token);
      setLesson(mapApiLesson(data));
    } catch (e) {
      setLessonError('Could not load lesson. Please try again.');
    } finally {
      setLessonLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    fetchLesson();
  }, [fetchLesson]);

  // Update header title once lesson is loaded
  useEffect(() => {
    if (lesson) {
      navigation.setOptions({ title: lesson.scenario });
    }
  }, [navigation, lesson]);

  // Show loading state while fetching lesson
  if (lessonLoading) {
    return (
      <View style={[styles.screen, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={Colors.primary} size="large" />
        <Text style={{ color: Colors.text.secondary, marginTop: 12 }}>Loading lesson...</Text>
      </View>
    );
  }

  if (lessonError || !lesson) {
    return (
      <View style={[styles.screen, { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }]}>
        <Text style={{ color: Colors.danger, fontSize: 16, textAlign: 'center', marginBottom: 16 }}>
          {lessonError ?? 'Lesson not found'}
        </Text>
        <TouchableOpacity onPress={fetchLesson} style={{ backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Paywall check
  const isLocked = lesson.isProOnly && !isPro;

  // Voice Chat mode (Pro only — speech-to-speech with Max)
  const [voiceChatMode, setVoiceChatMode] = useState(false);

  const {
    recordingState,
    audioUri,
    startRecording,
    stopRecording,
    reset: resetRecording,
  } = useRecording();

  const { state: session, startSession, submitRecording, resetSession } =
    useSpeakingSession(lesson.id, lesson.targetPhrase, lesson.systemPrompt);

  const { speak, stop: stopTTS, isSpeaking: ttsPlaying } = useTTS();

  // Voice Chat hook for Pro speech-to-speech mode
  const {
    phase: vcPhase,
    conversationHistory: vcHistory,
    lastResult: vcLastResult,
    startTurn: vcStartTurn,
    endTurn: vcEndTurn,
    resetConversation: vcReset,
    isProRequired: vcProRequired,
  } = useVoiceChat(lesson.id);

  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Auto-play Max's voice when AI response arrives
  const lastAiResponse = useRef<string>('');
  useEffect(() => {
    if (
      session.aiResponse &&
      session.aiResponse !== lastAiResponse.current &&
      !session.isLoading
    ) {
      lastAiResponse.current = session.aiResponse;
      speak(session.aiResponse);
    }
  }, [session.aiResponse, session.isLoading, speak]);

  // Auto-submit when recording finishes
  useEffect(() => {
    if (recordingState === 'done' && audioUri && !hasSubmitted) {
      setHasSubmitted(true);
      submitRecording(audioUri);
    }
  }, [recordingState, audioUri, hasSubmitted, submitRecording]);

  const handleStartPress = (): void => {
    if (isLocked) {
      router.push('/paywall');
      return;
    }
    startSession();
  };

  const handleMicPress = async (): Promise<void> => {
    if (recordingState === 'idle' || recordingState === 'done') {
      setHasSubmitted(false);
      resetRecording();
      await startRecording();
    } else if (recordingState === 'recording') {
      await stopRecording();
    }
  };

  const handleContinue = (): void => {
    router.replace('/(tabs)');
  };

  const handleRetry = (): void => {
    stopTTS();
    resetSession();
    resetRecording();
    vcReset();
    setHasSubmitted(false);
    lastAiResponse.current = '';
  };

  // --- Phase: Intro ---
  if (session.phase === 'intro') {
    return (
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.introHeader}>
            <View style={styles.scenarioBadge}>
              <Text style={styles.scenarioText}>{lesson.scenario}</Text>
            </View>
            <Text style={styles.lessonTitle}>{lesson.title}</Text>
          </View>

          <MaxAvatar
            message="Hi! I'm Max, your AI coach. I'll listen to your English and give you feedback. Ready to practice?"
          />

          <View style={styles.phraseCard}>
            <Text style={styles.phraseLabel}>Target Phrase</Text>
            <Text style={styles.phraseText}>&ldquo;{lesson.targetPhrase}&rdquo;</Text>
          </View>

          <View style={styles.instructionsCard}>
            <Text style={styles.instructionsLabel}>Your Goal</Text>
            <Text style={styles.instructionsText}>{lesson.instructions}</Text>
          </View>

          <View style={styles.fpBadgeRow}>
            <Text style={styles.fpBadgeText}>⚡ Earn up to {lesson.fpReward} FP</Text>
            {lesson.isProOnly && (
              <View style={styles.proTag}>
                <Text style={styles.proTagText}>PRO</Text>
              </View>
            )}
          </View>

          {/* Voice Chat mode toggle for Pro users */}
          {isPro && !isLocked && (
            <View style={styles.modeToggleRow}>
              <TouchableOpacity
                onPress={() => setVoiceChatMode(false)}
                style={[styles.modeToggleBtn, !voiceChatMode && styles.modeToggleActive]}
              >
                <Text style={[styles.modeToggleText, !voiceChatMode && styles.modeToggleTextActive]}>
                  📝 Standard
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setVoiceChatMode(true)}
                style={[styles.modeToggleBtn, voiceChatMode && styles.modeToggleActive]}
              >
                <Text style={[styles.modeToggleText, voiceChatMode && styles.modeToggleTextActive]}>
                  🎙 Voice Chat
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={[styles.startButton, isLocked && styles.startButtonLocked]}
            onPress={handleStartPress}
            activeOpacity={0.85}
          >
            <Text style={styles.startButtonText}>
              {isLocked ? '🔒 Unlock with Pro' : voiceChatMode ? '🎙 Start Voice Chat' : '🎙️ Start Speaking'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // --- Phase: Recording ---
  if (session.phase === 'recording') {
    const isRecording = recordingState === 'recording';
    const isProcessing = recordingState === 'processing' || session.isLoading;

    return (
      <View style={styles.screen}>
        <View style={styles.recordingContainer}>
          <Text style={styles.recordingTitle}>
            {isProcessing ? 'Analyzing your speech...' : 'Say the phrase below'}
          </Text>

          <View style={styles.phraseCardSmall}>
            <Text style={styles.phraseTextSmall}>&ldquo;{lesson.targetPhrase}&rdquo;</Text>
          </View>

          <Waveform isActive={isRecording} />

          {isProcessing ? (
            <View style={styles.processingContainer}>
              <ActivityIndicator color={Colors.primary} size="large" />
              <Text style={styles.processingText}>Max is listening...</Text>
            </View>
          ) : (
            <Pressable
              onPress={handleMicPress}
              style={({ pressed }) => [
                styles.micButton,
                isRecording && styles.micButtonRecording,
                pressed && styles.micButtonPressed,
              ]}
            >
              <Text style={styles.micEmoji}>
                {isRecording ? '⏹' : '🎙️'}
              </Text>
              <Text style={styles.micLabel}>
                {isRecording ? 'Tap to stop' : 'Tap to speak'}
              </Text>
            </Pressable>
          )}

          {session.error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{session.error}</Text>
              <TouchableOpacity onPress={handleRetry} style={styles.retryBtn}>
                <Text style={styles.retryBtnText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  }

  // --- Phase: Scored ---
  if (session.phase === 'scored') {
    return (
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.phaseTitle}>Pronunciation Score</Text>

          <View style={styles.scoreSection}>
            <ScoreRing score={session.pronunciationScore} size={160} />
          </View>

          <MaxAvatar
            message={session.aiResponse || 'Great effort! Keep practicing to improve your fluency.'}
          />
          {ttsPlaying && (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: -8, marginBottom: 4 }}>
              <Text style={{ color: Colors.primary, fontSize: 12 }}>🔊 Max is speaking...</Text>
            </View>
          )}

          {session.grammarFeedback ? (
            <View style={styles.feedbackCard}>
              <Text style={styles.feedbackLabel}>Grammar Feedback</Text>
              <Text style={styles.feedbackText}>{session.grammarFeedback}</Text>
            </View>
          ) : null}

          <View style={styles.fpEarnedRow}>
            <Text style={styles.fpEarnedText}>+{session.fpEarned} FP earned this turn</Text>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.retryButtonSecondary}
              onPress={handleRetry}
              activeOpacity={0.8}
            >
              <Text style={styles.retryButtonSecondaryText}>Try Again</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.continueButton}
              onPress={() => {
                resetRecording();
                setHasSubmitted(false);
                // Move to next conversation turn
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.continueButtonText}>Continue →</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // --- Phase: Complete ---
  if (session.phase === 'complete') {
    return (
      <View style={styles.screen}>
        <View style={styles.completeContainer}>
          <Text style={styles.completeTitle}>Session Complete!</Text>
          <Text style={styles.completeSubtitle}>
            Excellent work, {useUserStore.getState().username}!
          </Text>

          <FPCelebration fp={session.fpEarned} />

          <MaxAvatar
            message="Fantastic session! Your pronunciation is improving. Come back tomorrow to keep your streak going!"
          />

          {session.pronunciationScore !== null && (
            <View style={styles.finalScoreRow}>
              <Text style={styles.finalScoreLabel}>Final Pronunciation Score</Text>
              <ScoreRing score={session.pronunciationScore} size={100} />
            </View>
          )}

          <TouchableOpacity
            style={styles.doneButton}
            onPress={handleContinue}
            activeOpacity={0.85}
          >
            <Text style={styles.doneButtonText}>Continue Learning</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // --- Voice Chat Mode (Pro) ---
  if (voiceChatMode && session.phase === 'conversation') {
    const vcIsRecording = vcPhase === 'recording';
    const vcIsProcessing = vcPhase === 'processing';
    const vcIsPlaying = vcPhase === 'playing';
    const vcIsError = vcPhase === 'error';

    return (
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.container}>
          {/* Header */}
          <View style={styles.vcHeader}>
            <View style={styles.vcBadge}>
              <Text style={styles.vcBadgeText}>🎙 Voice Chat · Pro</Text>
            </View>
            <Text style={styles.vcSubtitle}>Speak naturally — Max will respond with his voice</Text>
          </View>

          {/* Max avatar showing playing state */}
          <MaxAvatar
            isThinking={vcIsProcessing}
            message={
              vcIsPlaying
                ? '🔊 Speaking...'
                : vcLastResult
                ? vcLastResult.aiResponseText
                : 'Press the mic and speak. I\'ll respond with my voice!'
            }
          />

          {/* Conversation history (last 4 exchanges) */}
          {vcHistory.length > 0 && (
            <View style={styles.conversationHistory}>
              {vcHistory.slice(-4).map((msg, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.chatBubble,
                    msg.role === 'user' ? styles.chatBubbleUser : styles.chatBubbleAI,
                  ]}
                >
                  <Text
                    style={[
                      styles.chatText,
                      msg.role === 'user' ? styles.chatTextUser : styles.chatTextAI,
                    ]}
                  >
                    {msg.content}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Score from last turn */}
          {vcLastResult && (
            <View style={styles.vcScoreRow}>
              <Text style={styles.vcScoreText}>
                Score: {vcLastResult.overallScore}/100  ·  +{Math.round(vcLastResult.fpMultiplier * 10)} FP
              </Text>
            </View>
          )}

          <Waveform isActive={vcIsRecording} />

          {/* Mic control */}
          {vcIsProcessing || vcIsPlaying ? (
            <View style={styles.processingContainer}>
              <ActivityIndicator color={Colors.primary} size="large" />
              <Text style={styles.processingText}>
                {vcIsProcessing ? 'Max is listening...' : '🔊 Max is speaking...'}
              </Text>
            </View>
          ) : (
            <Pressable
              onPress={async () => {
                if (vcIsRecording) {
                  await vcEndTurn();
                } else {
                  await vcStartTurn();
                }
              }}
              style={({ pressed }) => [
                styles.micButton,
                vcIsRecording && styles.micButtonRecording,
                pressed && styles.micButtonPressed,
              ]}
            >
              <Text style={styles.micEmoji}>{vcIsRecording ? '⏹' : '🎙️'}</Text>
              <Text style={styles.micLabel}>
                {vcIsRecording ? 'Tap to send' : 'Tap to speak'}
              </Text>
            </Pressable>
          )}

          {/* Pro paywall fallback */}
          {vcProRequired && (
            <TouchableOpacity
              onPress={() => router.push('/subscribe')}
              style={styles.vcPaywallBtn}
            >
              <Text style={styles.vcPaywallText}>Upgrade to Pro for Voice Chat →</Text>
            </TouchableOpacity>
          )}

          {vcIsError && !vcProRequired && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>Connection error — please try again</Text>
            </View>
          )}

          {/* Exit to standard mode */}
          <TouchableOpacity onPress={handleRetry} style={styles.vcExitBtn}>
            <Text style={styles.vcExitText}>Switch to Standard Mode</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // --- Phase: Conversation ---
  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.phaseTitle}>Conversation</Text>

        <MaxAvatar
          isThinking={session.isLoading}
          message={session.isLoading ? undefined : session.aiResponse}
        />

        {/* Conversation history */}
        <View style={styles.conversationHistory}>
          {session.conversationHistory.slice(-4).map((msg, idx) => (
            <View
              key={idx}
              style={[
                styles.chatBubble,
                msg.role === 'user' ? styles.chatBubbleUser : styles.chatBubbleAI,
              ]}
            >
              <Text
                style={[
                  styles.chatText,
                  msg.role === 'user' ? styles.chatTextUser : styles.chatTextAI,
                ]}
              >
                {msg.content}
              </Text>
            </View>
          ))}
        </View>

        <Waveform isActive={recordingState === 'recording'} />

        {session.isLoading ? (
          <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: 16 }} />
        ) : (
          <Pressable
            onPress={handleMicPress}
            style={({ pressed }) => [
              styles.micButton,
              recordingState === 'recording' && styles.micButtonRecording,
              pressed && styles.micButtonPressed,
            ]}
          >
            <Text style={styles.micEmoji}>
              {recordingState === 'recording' ? '⏹' : '🎙️'}
            </Text>
            <Text style={styles.micLabel}>
              {recordingState === 'recording' ? 'Tap to stop' : 'Respond to Max'}
            </Text>
          </Pressable>
        )}

        {session.error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{session.error}</Text>
          </View>
        )}
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
    paddingTop: 20,
    paddingBottom: 40,
    gap: 20,
    alignItems: 'center',
  },
  introHeader: {
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  scenarioBadge: {
    backgroundColor: 'rgba(108, 99, 255, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.4)',
  },
  scenarioText: {
    color: Colors.primaryLight,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  lessonTitle: {
    color: Colors.text.primary,
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 32,
  },
  phraseCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.3)',
    gap: 8,
  },
  phraseLabel: {
    color: Colors.text.muted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  phraseText: {
    color: Colors.text.primary,
    fontSize: 16,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  phraseCardSmall: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.3)',
  },
  phraseTextSmall: {
    color: Colors.text.primary,
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  instructionsCard: {
    backgroundColor: 'rgba(78, 205, 196, 0.08)',
    borderRadius: 14,
    padding: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: `${Colors.success}30`,
    gap: 6,
  },
  instructionsLabel: {
    color: Colors.success,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  instructionsText: {
    color: Colors.text.secondary,
    fontSize: 14,
    lineHeight: 20,
  },
  fpBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  fpBadgeText: {
    color: Colors.accent,
    fontSize: 15,
    fontWeight: '700',
  },
  proTag: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  proTagText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  startButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
    width: '100%',
    alignItems: 'center',
  },
  startButtonLocked: {
    backgroundColor: Colors.text.muted,
    shadowColor: 'transparent',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  // Recording phase
  recordingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 28,
  },
  recordingTitle: {
    color: Colors.text.primary,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  micButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  micButtonRecording: {
    backgroundColor: Colors.danger,
    shadowColor: Colors.danger,
  },
  micButtonPressed: {
    transform: [{ scale: 0.94 }],
  },
  micEmoji: {
    fontSize: 40,
  },
  micLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 11,
    fontWeight: '600',
  },
  processingContainer: {
    alignItems: 'center',
    gap: 12,
  },
  processingText: {
    color: Colors.text.secondary,
    fontSize: 15,
  },
  errorBox: {
    backgroundColor: 'rgba(255, 107, 107, 0.12)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: `${Colors.danger}40`,
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  errorText: {
    color: Colors.danger,
    fontSize: 14,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: Colors.danger,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 10,
  },
  retryBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  // Scored phase
  phaseTitle: {
    color: Colors.text.primary,
    fontSize: 20,
    fontWeight: '800',
  },
  scoreSection: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  feedbackCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    width: '100%',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.2)',
  },
  feedbackLabel: {
    color: Colors.text.muted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  feedbackText: {
    color: Colors.text.secondary,
    fontSize: 14,
    lineHeight: 20,
  },
  fpEarnedRow: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: `${Colors.accent}40`,
  },
  fpEarnedText: {
    color: Colors.accent,
    fontSize: 14,
    fontWeight: '700',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  retryButtonSecondary: {
    flex: 1,
    backgroundColor: Colors.card,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.3)',
  },
  retryButtonSecondaryText: {
    color: Colors.text.secondary,
    fontSize: 15,
    fontWeight: '600',
  },
  continueButton: {
    flex: 2,
    backgroundColor: Colors.primary,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  // Complete phase
  completeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 24,
  },
  completeTitle: {
    color: Colors.text.primary,
    fontSize: 28,
    fontWeight: '800',
  },
  completeSubtitle: {
    color: Colors.text.secondary,
    fontSize: 16,
    marginTop: -16,
  },
  finalScoreRow: {
    alignItems: 'center',
    gap: 10,
  },
  finalScoreLabel: {
    color: Colors.text.secondary,
    fontSize: 14,
    fontWeight: '600',
  },
  doneButton: {
    backgroundColor: Colors.success,
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 16,
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  doneButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '800',
  },
  // Conversation phase
  conversationHistory: {
    width: '100%',
    gap: 10,
  },
  chatBubble: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 16,
  },
  chatBubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  chatBubbleAI: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.card,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.2)',
  },
  chatText: {
    fontSize: 14,
    lineHeight: 20,
  },
  chatTextUser: {
    color: '#fff',
  },
  chatTextAI: {
    color: Colors.text.primary,
  },
  // Mode toggle (Standard / Voice Chat)
  modeToggleRow: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.2)',
    overflow: 'hidden',
    width: '100%',
  },
  modeToggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  modeToggleActive: {
    backgroundColor: Colors.primary,
  },
  modeToggleText: {
    color: Colors.text.secondary,
    fontSize: 13,
    fontWeight: '600',
  },
  modeToggleTextActive: {
    color: '#fff',
  },
  // Voice Chat phase
  vcHeader: {
    alignItems: 'center',
    gap: 6,
    width: '100%',
  },
  vcBadge: {
    backgroundColor: 'rgba(108, 99, 255, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.4)',
  },
  vcBadgeText: {
    color: Colors.primaryLight,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  vcSubtitle: {
    color: Colors.text.muted,
    fontSize: 13,
    textAlign: 'center',
  },
  vcScoreRow: {
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: `${Colors.accent}30`,
  },
  vcScoreText: {
    color: Colors.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  vcPaywallBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  vcPaywallText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  vcExitBtn: {
    paddingVertical: 8,
  },
  vcExitText: {
    color: Colors.text.muted,
    fontSize: 12,
    textDecorationLine: 'underline',
  },
});
