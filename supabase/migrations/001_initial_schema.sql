-- SpeakFlow Initial Schema
-- Migration: 001_initial_schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- profiles table
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    streak INT NOT NULL DEFAULT 0,
    streak_shields INT NOT NULL DEFAULT 0,
    total_fp INT NOT NULL DEFAULT 0,
    weekly_fp INT NOT NULL DEFAULT 0,
    league TEXT NOT NULL DEFAULT 'bronze' CHECK (league IN ('bronze', 'silver', 'gold', 'platinum', 'diamond')),
    is_pro BOOLEAN NOT NULL DEFAULT false,
    last_activity_date DATE,
    notification_token TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- lessons table
-- ============================================================
CREATE TABLE IF NOT EXISTS lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scenario TEXT NOT NULL CHECK (scenario IN ('job_interview', 'presentation', 'small_talk', 'email', 'negotiation')),
    level INT NOT NULL CHECK (level BETWEEN 1 AND 5),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    target_phrases TEXT[] NOT NULL DEFAULT '{}',
    conversation_system_prompt TEXT NOT NULL,
    fp_reward INT NOT NULL DEFAULT 10,
    is_pro_only BOOLEAN NOT NULL DEFAULT false,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (scenario, level)
);

-- ============================================================
-- session_results table
-- ============================================================
CREATE TABLE IF NOT EXISTS session_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    pronunciation_score DECIMAL(5, 2) NOT NULL CHECK (pronunciation_score BETWEEN 0 AND 100),
    fluency_score DECIMAL(5, 2) NOT NULL CHECK (fluency_score BETWEEN 0 AND 100),
    fp_earned INT NOT NULL DEFAULT 0,
    niva_feedback TEXT,
    audio_duration_seconds INT,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- league_standings table
-- ============================================================
CREATE TABLE IF NOT EXISTS league_standings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    league TEXT NOT NULL DEFAULT 'bronze',
    weekly_fp INT NOT NULL DEFAULT 0,
    rank INT,
    promoted BOOLEAN NOT NULL DEFAULT false,
    demoted BOOLEAN NOT NULL DEFAULT false,
    UNIQUE (user_id, week_start)
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_profiles_last_activity_date ON profiles(last_activity_date);
CREATE INDEX IF NOT EXISTS idx_session_results_user_completed ON session_results(user_id, completed_at);
CREATE INDEX IF NOT EXISTS idx_league_standings_week_league_fp ON league_standings(week_start, league, weekly_fp DESC);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_standings ENABLE ROW LEVEL SECURITY;

-- profiles policies
CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role has full access to profiles"
    ON profiles FOR ALL
    USING (auth.role() = 'service_role');

-- lessons policies (readable by all authenticated users)
CREATE POLICY "Authenticated users can read free lessons"
    ON lessons FOR SELECT
    USING (
        auth.role() = 'authenticated' AND is_pro_only = false
    );

CREATE POLICY "Pro users can read all lessons"
    ON lessons FOR SELECT
    USING (
        auth.role() = 'authenticated' AND (
            is_pro_only = false OR
            EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_pro = true)
        )
    );

CREATE POLICY "Service role has full access to lessons"
    ON lessons FOR ALL
    USING (auth.role() = 'service_role');

-- session_results policies
CREATE POLICY "Users can view their own session results"
    ON session_results FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own session results"
    ON session_results FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role has full access to session_results"
    ON session_results FOR ALL
    USING (auth.role() = 'service_role');

-- league_standings policies (users can see all standings in their league for competition)
CREATE POLICY "Authenticated users can view league standings"
    ON league_standings FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Service role has full access to league_standings"
    ON league_standings FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================================
-- Function: Auto-create profile on user signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, username, created_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
