import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { supabase } from '../services/supabase';
import { apiGet } from '../services/api';
import { initPurchases } from '../services/purchases';
import { useUserStore } from '../store/userStore';
import { Colors } from '../constants/Colors';
import type { Session } from '@supabase/supabase-js';
import type { LeagueTier } from '../store/userStore';

interface ApiProfile {
  id: string;
  username: string | null;
  streak: number;
  streak_shields: number;
  total_fp: number;
  weekly_fp: number;
  league: LeagueTier;
  is_pro: boolean;
  last_activity_date: string | null;
  created_at: string;
}

async function syncProfileFromApi(token: string, setUser: (u: Partial<ReturnType<typeof useUserStore.getState>>) => void): Promise<void> {
  try {
    const profile = await apiGet<ApiProfile>('/users/me', token);
    setUser({
      username: profile.username ?? undefined,
      streak: profile.streak,
      streakShields: profile.streak_shields,
      totalFP: profile.total_fp,
      weeklyFP: profile.weekly_fp,
      league: profile.league,
      isPro: profile.is_pro,
      lastActivityDate: profile.last_activity_date,
    });
  } catch (e) {
    // Non-fatal: offline or API unavailable — store has last known values
    console.warn('[Layout] Profile sync failed:', e);
  }
}

export default function RootLayout(): React.JSX.Element {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const router = useRouter();
  const segments = useSegments();
  const setUser = useUserStore((s) => s.setUser);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      setSession(s);
      if (s) {
        setUser({
          userId: s.user.id,
          token: s.access_token,
          username: s.user.user_metadata?.username ?? s.user.email?.split('@')[0] ?? 'User',
        });
        // Sync authoritative profile data (streak, FP, league, isPro) from API
        await syncProfileFromApi(s.access_token, setUser);
        // Initialize RevenueCat with authenticated user ID
        await initPurchases(s.user.id);
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        if (newSession) {
          setUser({
            userId: newSession.user.id,
            token: newSession.access_token,
            username:
              newSession.user.user_metadata?.username ??
              newSession.user.email?.split('@')[0] ??
              'User',
          });
          // Sync profile on each new session (login, token refresh)
          await syncProfileFromApi(newSession.access_token, setUser);
          await initPurchases(newSession.user.id);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [setUser]);

  // Route guard
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [session, segments, isLoading, router]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.text.primary,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="lesson/[id]"
        options={{
          headerShown: true,
          title: 'Speaking Session',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="paywall"
        options={{
          headerShown: true,
          title: 'SpeakFlow Pro',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="onboarding"
        options={{ headerShown: false, gestureEnabled: false }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
