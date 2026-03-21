export interface User {
  id: string;
  email: string;
  username: string;
  streak: number;
  streakShields: number;
  totalFP: number;
  weeklyFP: number;
  league: 'bronze' | 'silver' | 'gold' | 'diamond';
  isPro: boolean;
  createdAt: string;
}

export interface Lesson {
  id: string;
  scenario: 'job_interview' | 'presentation' | 'small_talk' | 'email' | 'negotiation';
  level: 1 | 2 | 3 | 4 | 5;
  title: string;
  targetPhrases: string[];
  conversationPrompt: string;
  fpReward: number;
  isProOnly: boolean;
}

export interface SessionResult {
  lessonId: string;
  userId: string;
  pronunciationScore: number;
  fluencyScore: number;
  fpEarned: number;
  nivaFeedback: string;
  completedAt: string;
}

export interface GamificationResult {
  fpEarned: number;
  newTotalFP: number;
  newWeeklyFP: number;
  streakUpdated: boolean;
  newStreak: number;
  streakBroken: boolean;
  shieldConsumed: boolean;
  leagueRank: number;
  levelUpMessage?: string;
}
