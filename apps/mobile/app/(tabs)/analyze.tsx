/**
 * Analyze tab — NVIDIA Vision slide & document analysis (Pro-only)
 *
 * Uses meta/llama-3.2-11b-vision-instruct to analyze presentation slides
 * and business documents, generating targeted English coaching context.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { useSlideAnalyzer } from '../../hooks/useSlideAnalyzer';
import { useUserStore } from '../../store/userStore';

type AnalyzeTab = 'slide' | 'document';
type CoachingFocus = 'presentation' | 'email' | 'document' | 'general';

const COACHING_FOCUS_OPTIONS: { key: CoachingFocus; label: string; emoji: string }[] = [
  { key: 'presentation', label: 'Presentation', emoji: '📊' },
  { key: 'email', label: 'Email Writing', emoji: '✉️' },
  { key: 'document', label: 'Document Review', emoji: '📄' },
  { key: 'general', label: 'General', emoji: '💼' },
];

export default function AnalyzeScreen(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<AnalyzeTab>('slide');
  const [coachingFocus, setCoachingFocus] = useState<CoachingFocus>('presentation');
  const isPro = useUserStore((s) => s.isPro);
  const {
    phase,
    slideResult,
    documentResult,
    selectedImageUri,
    error,
    analyzeSlide,
    analyzeDocument,
    reset,
  } = useSlideAnalyzer();

  const isLoading = phase === 'picking' || phase === 'uploading';

  const handleAnalyze = async () => {
    if (!isPro) {
      Alert.alert(
        'Pro Feature',
        'Slide and document analysis is available with SpeakFlow Pro. Upgrade to unlock AI-powered coaching from your real business materials.',
        [{ text: 'OK' }],
      );
      return;
    }
    if (activeTab === 'slide') {
      await analyzeSlide(coachingFocus);
    } else {
      await analyzeDocument();
    }
  };

  const scoreColor = (score: number) => {
    if (score >= 85) return Colors.success;
    if (score >= 70) return Colors.nvidia;
    if (score >= 50) return Colors.accent;
    return Colors.danger;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerBadge}>
          <Text style={styles.nvidiaBadge}>⚡ NVIDIA Vision 11B</Text>
        </View>
        <Text style={styles.title}>AI Slide Analyzer</Text>
        <Text style={styles.subtitle}>
          Upload your slides or documents — Max coaches you with real business English
        </Text>
        {!isPro && (
          <View style={styles.proBadge}>
            <Text style={styles.proBadgeText}>🔒 Pro Feature</Text>
          </View>
        )}
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabSwitcher}>
        {(['slide', 'document'] as AnalyzeTab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => { setActiveTab(tab); reset(); }}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab === 'slide' ? '📊 Slides' : '📄 Documents'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Coaching Focus (slide mode only) */}
      {activeTab === 'slide' && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Coaching Focus</Text>
          <View style={styles.focusGrid}>
            {COACHING_FOCUS_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[styles.focusChip, coachingFocus === opt.key && styles.activeFocusChip]}
                onPress={() => setCoachingFocus(opt.key)}
              >
                <Text style={styles.focusEmoji}>{opt.emoji}</Text>
                <Text style={[styles.focusLabel, coachingFocus === opt.key && styles.activeFocusLabel]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Upload Button */}
      {phase === 'idle' && (
        <TouchableOpacity
          style={[styles.uploadButton, !isPro && styles.uploadButtonLocked]}
          onPress={handleAnalyze}
          activeOpacity={0.85}
        >
          <Text style={styles.uploadIcon}>{isPro ? '📸' : '🔒'}</Text>
          <Text style={styles.uploadText}>
            {isPro
              ? `Upload ${activeTab === 'slide' ? 'Slide' : 'Document'}`
              : 'Upgrade to Pro to Unlock'}
          </Text>
          {isPro && (
            <Text style={styles.uploadSubtext}>
              JPEG, PNG or WebP · Max 10MB
            </Text>
          )}
        </TouchableOpacity>
      )}

      {/* Loading State */}
      {isLoading && (
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color={Colors.nvidia} />
          <Text style={styles.loadingTitle}>
            {phase === 'picking' ? 'Selecting image...' : 'Analyzing with NVIDIA Vision...'}
          </Text>
          {phase === 'uploading' && (
            <Text style={styles.loadingSubtext}>Llama 3.2 Vision 11B is reading your content</Text>
          )}
        </View>
      )}

      {/* Error State */}
      {phase === 'error' && error && (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>
            {error === 'UPGRADE_REQUIRED' ? '🔒 Pro Required' : '⚠️ Analysis Failed'}
          </Text>
          <Text style={styles.errorText}>
            {error === 'UPGRADE_REQUIRED'
              ? 'Slide analysis requires SpeakFlow Pro.'
              : error}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={reset}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Selected Image Preview */}
      {selectedImageUri && phase === 'done' && (
        <View style={styles.imagePreview}>
          <Image source={{ uri: selectedImageUri }} style={styles.previewImage} resizeMode="cover" />
        </View>
      )}

      {/* Slide Analysis Results */}
      {phase === 'done' && slideResult && activeTab === 'slide' && (
        <View style={styles.resultsContainer}>
          {/* Summary */}
          <View style={styles.resultCard}>
            <Text style={styles.resultCardTitle}>📋 Slide Summary</Text>
            <Text style={styles.resultText}>{slideResult.slide_summary}</Text>
          </View>

          {/* Key Vocabulary */}
          {slideResult.key_vocabulary.length > 0 && (
            <View style={styles.resultCard}>
              <Text style={styles.resultCardTitle}>📖 Key Business Vocabulary</Text>
              <View style={styles.tagGrid}>
                {slideResult.key_vocabulary.map((word, i) => (
                  <View key={i} style={styles.vocabTag}>
                    <Text style={styles.vocabTagText}>{word}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Suggested Phrases */}
          {slideResult.suggested_phrases.length > 0 && (
            <View style={styles.resultCard}>
              <Text style={styles.resultCardTitle}>💬 Phrases to Practice</Text>
              {slideResult.suggested_phrases.map((phrase, i) => (
                <View key={i} style={styles.phraseRow}>
                  <Text style={styles.phraseBullet}>›</Text>
                  <Text style={styles.phraseText}>{phrase}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Practice Questions */}
          {slideResult.practice_questions.length > 0 && (
            <View style={styles.resultCard}>
              <Text style={styles.resultCardTitle}>🎯 Practice Questions</Text>
              {slideResult.practice_questions.map((q, i) => (
                <View key={i} style={styles.questionRow}>
                  <Text style={styles.questionNumber}>{i + 1}.</Text>
                  <Text style={styles.questionText}>{q}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Analyze Another Button */}
          <TouchableOpacity style={styles.analyzeAnotherButton} onPress={reset}>
            <Text style={styles.analyzeAnotherText}>📸 Analyze Another Slide</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Document Analysis Results */}
      {phase === 'done' && documentResult && activeTab === 'document' && (
        <View style={styles.resultsContainer}>
          {/* Score */}
          <View style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>English Quality Score</Text>
            <Text style={[styles.scoreValue, { color: scoreColor(documentResult.language_score) }]}>
              {documentResult.language_score}
            </Text>
            <Text style={styles.scoreSubtext}>/ 100</Text>
            <View style={styles.docTypeBadge}>
              <Text style={styles.docTypeText}>{documentResult.document_type.toUpperCase()}</Text>
            </View>
          </View>

          {/* Strengths */}
          {documentResult.strengths.length > 0 && (
            <View style={styles.resultCard}>
              <Text style={styles.resultCardTitle}>✅ Strengths</Text>
              {documentResult.strengths.map((s, i) => (
                <View key={i} style={styles.phraseRow}>
                  <Text style={[styles.phraseBullet, { color: Colors.success }]}>✓</Text>
                  <Text style={styles.phraseText}>{s}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Improvements */}
          {documentResult.improvements.length > 0 && (
            <View style={styles.resultCard}>
              <Text style={styles.resultCardTitle}>💡 Suggested Improvements</Text>
              {documentResult.improvements.map((imp, i) => (
                <View key={i} style={styles.phraseRow}>
                  <Text style={[styles.phraseBullet, { color: Colors.accent }]}>›</Text>
                  <Text style={styles.phraseText}>{imp}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Rewritten Excerpt */}
          {documentResult.rewritten_excerpt ? (
            <View style={[styles.resultCard, styles.rewriteCard]}>
              <Text style={styles.resultCardTitle}>✏️ Improved Version</Text>
              <Text style={styles.rewriteText}>{documentResult.rewritten_excerpt}</Text>
            </View>
          ) : null}

          <TouchableOpacity style={styles.analyzeAnotherButton} onPress={reset}>
            <Text style={styles.analyzeAnotherText}>📸 Analyze Another Document</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* How It Works (idle state only) */}
      {phase === 'idle' && (
        <View style={styles.howItWorksCard}>
          <Text style={styles.howItWorksTitle}>How It Works</Text>
          {[
            { emoji: '📸', text: 'Upload a slide or document photo' },
            { emoji: '🤖', text: 'NVIDIA Vision 11B analyzes the content' },
            { emoji: '💬', text: 'Max gives you targeted English coaching' },
            { emoji: '🎯', text: 'Practice phrases specific to your work' },
          ].map((item, i) => (
            <View key={i} style={styles.howItWorksRow}>
              <Text style={styles.howItWorksEmoji}>{item.emoji}</Text>
              <Text style={styles.howItWorksText}>{item.text}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 40 },

  header: { alignItems: 'center', marginBottom: 24 },
  headerBadge: {
    backgroundColor: 'rgba(118, 185, 0, 0.15)',
    borderWidth: 1,
    borderColor: Colors.nvidia,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 12,
  },
  nvidiaBadge: { color: Colors.nvidia, fontSize: 11, fontWeight: '700' },
  title: { color: Colors.text.primary, fontSize: 26, fontWeight: '800', marginBottom: 8 },
  subtitle: {
    color: Colors.text.secondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  proBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderWidth: 1,
    borderColor: Colors.accent,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 4,
  },
  proBadgeText: { color: Colors.accent, fontSize: 12, fontWeight: '700' },

  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  activeTab: { backgroundColor: Colors.primary },
  tabText: { color: Colors.text.muted, fontSize: 13, fontWeight: '600' },
  activeTabText: { color: '#FFFFFF' },

  section: { marginBottom: 20 },
  sectionLabel: { color: Colors.text.secondary, fontSize: 12, fontWeight: '700', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  focusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  focusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.3)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 5,
  },
  activeFocusChip: { backgroundColor: 'rgba(108, 99, 255, 0.2)', borderColor: Colors.primary },
  focusEmoji: { fontSize: 14 },
  focusLabel: { color: Colors.text.secondary, fontSize: 12, fontWeight: '600' },
  activeFocusLabel: { color: Colors.primary },

  uploadButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  uploadButtonLocked: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.accent },
  uploadIcon: { fontSize: 32, marginBottom: 8 },
  uploadText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  uploadSubtext: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 4 },

  loadingCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
  },
  loadingTitle: { color: Colors.text.primary, fontSize: 16, fontWeight: '700', marginTop: 16 },
  loadingSubtext: { color: Colors.text.muted, fontSize: 13, marginTop: 6, textAlign: 'center' },

  errorCard: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderWidth: 1,
    borderColor: Colors.danger,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  errorTitle: { color: Colors.danger, fontSize: 16, fontWeight: '700', marginBottom: 8 },
  errorText: { color: Colors.text.secondary, fontSize: 13, textAlign: 'center' },
  retryButton: {
    marginTop: 16,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  retryText: { color: '#FFFFFF', fontWeight: '700' },

  imagePreview: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.3)',
  },
  previewImage: { width: '100%', height: 200 },

  resultsContainer: { gap: 16 },
  resultCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.2)',
  },
  resultCardTitle: { color: Colors.text.primary, fontSize: 14, fontWeight: '800', marginBottom: 12 },
  resultText: { color: Colors.text.secondary, fontSize: 14, lineHeight: 22 },

  tagGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  vocabTag: {
    backgroundColor: 'rgba(108, 99, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.4)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  vocabTagText: { color: Colors.primary, fontSize: 12, fontWeight: '600' },

  phraseRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  phraseBullet: { color: Colors.primary, fontSize: 16, fontWeight: '700', marginTop: 1 },
  phraseText: { flex: 1, color: Colors.text.secondary, fontSize: 13, lineHeight: 20 },

  questionRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  questionNumber: { color: Colors.primary, fontSize: 13, fontWeight: '700', width: 20 },
  questionText: { flex: 1, color: Colors.text.secondary, fontSize: 13, lineHeight: 20 },

  scoreCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.2)',
  },
  scoreLabel: { color: Colors.text.muted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  scoreValue: { fontSize: 64, fontWeight: '900', lineHeight: 72 },
  scoreSubtext: { color: Colors.text.muted, fontSize: 16, marginBottom: 12 },
  docTypeBadge: {
    backgroundColor: 'rgba(108, 99, 255, 0.15)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  docTypeText: { color: Colors.primary, fontSize: 11, fontWeight: '700' },

  rewriteCard: { borderColor: 'rgba(78, 205, 196, 0.3)' },
  rewriteText: { color: Colors.text.primary, fontSize: 13, lineHeight: 22, fontStyle: 'italic' },

  analyzeAnotherButton: {
    backgroundColor: 'rgba(108, 99, 255, 0.15)',
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  analyzeAnotherText: { color: Colors.primary, fontSize: 15, fontWeight: '700' },

  howItWorksCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    marginTop: 24,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.2)',
  },
  howItWorksTitle: { color: Colors.text.primary, fontSize: 14, fontWeight: '800', marginBottom: 16 },
  howItWorksRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  howItWorksEmoji: { fontSize: 20, width: 28 },
  howItWorksText: { flex: 1, color: Colors.text.secondary, fontSize: 13, lineHeight: 19 },
});
