import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type LeagueTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface UserState {
  userId: string | null;
  username: string | null;
  streak: number;
  streakShields: number;
  totalFP: number;
  weeklyFP: number;
  league: LeagueTier;
  isPro: boolean;
  token: string | null;
  lastActivityDate: string | null;
}

export interface UserActions {
  setUser: (user: Partial<UserState>) => void;
  addFP: (amount: number) => void;
  incrementStreak: () => void;
  consumeShield: () => void;
  logout: () => void;
}

const initialState: UserState = {
  userId: null,
  username: null,
  streak: 0,
  streakShields: 0,
  totalFP: 0,
  weeklyFP: 0,
  league: 'bronze' as LeagueTier,
  isPro: false,
  token: null,
  lastActivityDate: null,
};

export const useUserStore = create<UserState & UserActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      setUser: (user) => set((state) => ({ ...state, ...user })),

      addFP: (amount) =>
        set((state) => ({
          totalFP: state.totalFP + amount,
          weeklyFP: state.weeklyFP + amount,
        })),

      incrementStreak: () => {
        const today = new Date().toISOString().split('T')[0];
        const { lastActivityDate, streak } = get();

        if (lastActivityDate === today) {
          // Already incremented today
          return;
        }

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastActivityDate === yesterdayStr) {
          // Consecutive day
          set({ streak: streak + 1, lastActivityDate: today });
        } else if (lastActivityDate === null) {
          // First activity
          set({ streak: 1, lastActivityDate: today });
        } else {
          // Streak broken — check for shield
          const { streakShields } = get();
          if (streakShields > 0) {
            // Shield protects streak
            set({ streakShields: streakShields - 1, lastActivityDate: today });
          } else {
            // Reset streak
            set({ streak: 1, lastActivityDate: today });
          }
        }
      },

      consumeShield: () =>
        set((state) => ({
          streakShields: Math.max(0, state.streakShields - 1),
        })),

      logout: () => set({ ...initialState }),
    }),
    {
      name: 'speakflow-user-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
