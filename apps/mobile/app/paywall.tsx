import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';
import { useUserStore } from '../store/userStore';
import { getOfferings, purchasePackage, restorePurchases } from '../services/purchases';
import type { PurchasesPackage } from '../services/purchases';

const FEATURES = [
  { emoji: '🎙️', text: 'Unlimited speaking sessions with NVIDIA AI' },
  { emoji: '📊', text: 'Advanced pronunciation analytics' },
  { emoji: '💼', text: 'All 50+ professional scenarios' },
  { emoji: '🏆', text: 'Priority league placement' },
  { emoji: '🛡️', text: '3 streak shields per month' },
  { emoji: '🤖', text: 'Personalized AI coaching from Max' },
];

const ANNUAL_URL = 'https://speakflow.app/subscribe/annual';

export default function PaywallScreen(): React.JSX.Element {
  const router = useRouter();
  const setUser = useUserStore((s) => s.setUser);

  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [isLoadingPackages, setIsLoadingPackages] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [selectedPackageIndex, setSelectedPackageIndex] = useState(0);

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async (): Promise<void> => {
    setIsLoadingPackages(true);
    const pkgs = await getOfferings();
    setPackages(pkgs);
    setIsLoadingPackages(false);
  };

  const handlePurchase = async (pkg: PurchasesPackage): Promise<void> => {
    setIsPurchasing(true);
    const success = await purchasePackage(pkg);
    setIsPurchasing(false);

    if (success) {
      setUser({ isPro: true });
      Alert.alert(
        'Welcome to Pro!',
        'Thank you for subscribing. Enjoy unlimited access to all SpeakFlow features.',
        [{ text: 'Start Learning', onPress: () => router.replace('/(tabs)') }]
      );
    }
  };

  const handleAnnualPress = async (): Promise<void> => {
    // Annual plan — open web for App Store compliance fallback
    const canOpen = await Linking.canOpenURL(ANNUAL_URL);
    if (canOpen) {
      await Linking.openURL(ANNUAL_URL);
    }
  };

  const handleRestore = async (): Promise<void> => {
    setIsRestoring(true);
    const hasPro = await restorePurchases();
    setIsRestoring(false);

    if (hasPro) {
      setUser({ isPro: true });
      Alert.alert('Restored!', 'Your Pro subscription has been restored.', [
        { text: 'Continue', onPress: () => router.back() },
      ]);
    } else {
      Alert.alert('No Active Subscription', 'No previous subscription was found for this account.');
    }
  };

  // Derive monthly package (first package) for display
  const monthlyPackage = packages[0] ?? null;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.proBadge}>
            <Text style={styles.proBadgeText}>⚡ SPEAKFLOW PRO</Text>
          </View>
          <Text style={styles.headline}>Speak Business English{'\n'}Like a Native</Text>
          <Text style={styles.subheadline}>
            Join 10,000+ professionals who landed their dream jobs with SpeakFlow
          </Text>
        </View>

        {/* Features list */}
        <View style={styles.featuresList}>
          {FEATURES.map((feature, idx) => (
            <View key={idx} style={styles.featureRow}>
              <Text style={styles.featureEmoji}>{feature.emoji}</Text>
              <Text style={styles.featureText}>{feature.text}</Text>
              <Text style={styles.checkmark}>✓</Text>
            </View>
          ))}
        </View>

        {/* Packages */}
        {isLoadingPackages ? (
          <ActivityIndicator color={Colors.primary} size="large" style={{ marginVertical: 24 }} />
        ) : (
          <View style={styles.packagesContainer}>
            {/* Monthly Plan */}
            <TouchableOpacity
              style={[
                styles.packageCard,
                selectedPackageIndex === 0 && styles.packageCardSelected,
              ]}
              onPress={() => setSelectedPackageIndex(0)}
              activeOpacity={0.8}
            >
              <View style={styles.packageInfo}>
                <Text style={styles.packageTitle}>Monthly Plan</Text>
                <Text style={styles.packagePrice}>
                  {monthlyPackage?.product.priceString ?? '$12.99'}/mo
                </Text>
                <Text style={styles.packageTrial}>7-day free trial</Text>
              </View>
              <View
                style={[
                  styles.radioOuter,
                  selectedPackageIndex === 0 && styles.radioOuterSelected,
                ]}
              >
                {selectedPackageIndex === 0 && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>

            {/* Annual Plan — best value */}
            <TouchableOpacity
              style={[
                styles.packageCard,
                selectedPackageIndex === 1 && styles.packageCardSelected,
                styles.packageCardAnnual,
              ]}
              onPress={() => setSelectedPackageIndex(1)}
              activeOpacity={0.8}
            >
              <View style={styles.bestValueBadge}>
                <Text style={styles.bestValueText}>BEST VALUE</Text>
              </View>
              <View style={styles.packageInfo}>
                <Text style={styles.packageTitle}>Annual Plan</Text>
                <View style={styles.annualPriceRow}>
                  <Text style={styles.packagePrice}>$79.99/yr</Text>
                  <Text style={styles.packagePriceNote}> ($6.67/mo)</Text>
                </View>
                <Text style={styles.packageTrial}>Save 49% vs monthly</Text>
              </View>
              <View
                style={[
                  styles.radioOuter,
                  selectedPackageIndex === 1 && styles.radioOuterSelected,
                ]}
              >
                {selectedPackageIndex === 1 && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* CTA Button */}
        <TouchableOpacity
          style={[styles.ctaButton, isPurchasing && styles.ctaButtonDisabled]}
          onPress={async () => {
            if (selectedPackageIndex === 1) {
              await handleAnnualPress();
            } else if (monthlyPackage) {
              await handlePurchase(monthlyPackage);
            } else {
              // No packages loaded — open web
              await Linking.openURL('https://speakflow.app/subscribe');
            }
          }}
          disabled={isPurchasing}
          activeOpacity={0.85}
        >
          {isPurchasing ? (
            <ActivityIndicator color="#000" />
          ) : (
            <>
              <Text style={styles.ctaButtonText}>
                {selectedPackageIndex === 0
                  ? 'Start Free Trial'
                  : 'Get Annual Plan'}
              </Text>
              <Text style={styles.ctaButtonSub}>
                {selectedPackageIndex === 0
                  ? 'Then $12.99/month • Cancel anytime'
                  : '$79.99/year • Cancel anytime'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Restore */}
        <TouchableOpacity
          onPress={handleRestore}
          disabled={isRestoring}
          style={styles.restoreButton}
        >
          {isRestoring ? (
            <ActivityIndicator color={Colors.text.muted} size="small" />
          ) : (
            <Text style={styles.restoreText}>Restore Purchases</Text>
          )}
        </TouchableOpacity>

        {/* Legal */}
        <Text style={styles.legal}>
          Subscription automatically renews unless cancelled at least 24 hours before the end of
          the current period. Manage subscriptions in your App Store account settings.
          {'\n\n'}
          <Text
            style={styles.legalLink}
            onPress={() => Linking.openURL('https://speakflow.app/terms')}
          >
            Terms of Service
          </Text>
          {'  '}
          <Text
            style={styles.legalLink}
            onPress={() => Linking.openURL('https://speakflow.app/privacy')}
          >
            Privacy Policy
          </Text>
        </Text>

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
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    gap: 20,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    gap: 10,
  },
  proBadge: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  proBadgeText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  headline: {
    color: Colors.text.primary,
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 35,
  },
  subheadline: {
    color: Colors.text.secondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  featuresList: {
    width: '100%',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.2)',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureEmoji: {
    fontSize: 20,
    width: 26,
    textAlign: 'center',
  },
  featureText: {
    flex: 1,
    color: Colors.text.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  checkmark: {
    color: Colors.success,
    fontSize: 16,
    fontWeight: '800',
  },
  packagesContainer: {
    width: '100%',
    gap: 12,
  },
  packageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 12,
  },
  packageCardSelected: {
    borderColor: Colors.primary,
  },
  packageCardAnnual: {
    position: 'relative',
    paddingTop: 24,
  },
  bestValueBadge: {
    position: 'absolute',
    top: -1,
    left: 16,
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  bestValueText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  packageInfo: {
    flex: 1,
    gap: 3,
  },
  packageTitle: {
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  packagePrice: {
    color: Colors.text.primary,
    fontSize: 20,
    fontWeight: '800',
  },
  annualPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  packagePriceNote: {
    color: Colors.text.secondary,
    fontSize: 13,
    fontWeight: '500',
  },
  packageTrial: {
    color: Colors.success,
    fontSize: 12,
    fontWeight: '600',
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.text.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: Colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  ctaButton: {
    backgroundColor: Colors.accent,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    width: '100%',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
    gap: 4,
  },
  ctaButtonDisabled: {
    opacity: 0.6,
  },
  ctaButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '800',
  },
  ctaButtonSub: {
    color: 'rgba(0,0,0,0.6)',
    fontSize: 12,
    fontWeight: '500',
  },
  restoreButton: {
    paddingVertical: 10,
  },
  restoreText: {
    color: Colors.text.muted,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  legal: {
    color: Colors.text.muted,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
  legalLink: {
    color: Colors.primaryLight,
    textDecorationLine: 'underline',
  },
  bottomPad: {
    height: 16,
  },
});
