-- SpeakFlow Billing + Quota + Async Jobs
-- Migration: 003_billing_quota_and_jobs.sql

-- ============================================================
-- session_results enrichments for quota + recommendations
-- ============================================================
ALTER TABLE session_results
    ADD COLUMN IF NOT EXISTS grammar_feedback TEXT,
    ADD COLUMN IF NOT EXISTS vocabulary_suggestions TEXT;

-- ============================================================
-- subscriptions table
-- ============================================================
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    provider TEXT NOT NULL CHECK (provider IN ('stripe', 'revenuecat', 'airwallex')),
    provider_customer_id TEXT,
    provider_subscription_id TEXT NOT NULL,
    billing_email TEXT,
    plan_code TEXT NOT NULL DEFAULT 'pro',
    status TEXT NOT NULL DEFAULT 'inactive' CHECK (
        status IN ('trialing', 'active', 'past_due', 'canceled', 'expired', 'inactive')
    ),
    current_period_end TIMESTAMPTZ,
    canceled_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (provider, provider_subscription_id)
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_provider_status ON subscriptions(provider, status);

-- ============================================================
-- entitlements table
-- ============================================================
CREATE TABLE IF NOT EXISTS entitlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    entitlement_key TEXT NOT NULL,
    source_provider TEXT NOT NULL CHECK (source_provider IN ('stripe', 'revenuecat', 'airwallex', 'system')),
    source_subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'expired')),
    expires_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, entitlement_key)
);

CREATE INDEX IF NOT EXISTS idx_entitlements_user_key ON entitlements(user_id, entitlement_key);

-- ============================================================
-- provider_references table
-- ============================================================
CREATE TABLE IF NOT EXISTS provider_references (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('stripe', 'revenuecat', 'airwallex')),
    reference_type TEXT NOT NULL,
    reference_value TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (provider, reference_type, reference_value)
);

CREATE INDEX IF NOT EXISTS idx_provider_references_user_id ON provider_references(user_id);

-- ============================================================
-- billing_events table
-- ============================================================
CREATE TABLE IF NOT EXISTS billing_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider TEXT NOT NULL CHECK (provider IN ('stripe', 'revenuecat', 'airwallex')),
    event_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    provider_customer_id TEXT,
    provider_subscription_id TEXT,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'processed' CHECK (status IN ('processed', 'ignored', 'duplicate', 'error')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (provider, event_id)
);

CREATE INDEX IF NOT EXISTS idx_billing_events_user_id ON billing_events(user_id);

-- ============================================================
-- analysis_jobs table
-- ============================================================
CREATE TABLE IF NOT EXISTS analysis_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    job_type TEXT NOT NULL CHECK (job_type IN ('slide', 'document')),
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
    input_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    result JSONB,
    error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analysis_jobs_user_status ON analysis_jobs(user_id, status);

-- ============================================================
-- recommendation caches
-- ============================================================
CREATE TABLE IF NOT EXISTS lesson_embedding_cache (
    lesson_id UUID PRIMARY KEY REFERENCES lessons(id) ON DELETE CASCADE,
    model_name TEXT NOT NULL,
    content_hash TEXT NOT NULL,
    embedding JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_recommendation_profiles (
    user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    model_name TEXT NOT NULL,
    profile_text TEXT NOT NULL,
    profile_hash TEXT NOT NULL,
    embedding JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_embedding_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_recommendation_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
    ON subscriptions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service role has full access to subscriptions"
    ON subscriptions FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Users can view own entitlements"
    ON entitlements FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service role has full access to entitlements"
    ON entitlements FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Users can view own provider references"
    ON provider_references FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service role has full access to provider references"
    ON provider_references FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Users can view own billing events"
    ON billing_events FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service role has full access to billing events"
    ON billing_events FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Users can view own analysis jobs"
    ON analysis_jobs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analysis jobs"
    ON analysis_jobs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role has full access to analysis jobs"
    ON analysis_jobs FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Authenticated users can read lesson embedding cache"
    ON lesson_embedding_cache FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Service role has full access to lesson embedding cache"
    ON lesson_embedding_cache FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Users can view own recommendation profile"
    ON user_recommendation_profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service role has full access to user recommendation profiles"
    ON user_recommendation_profiles FOR ALL
    USING (auth.role() = 'service_role');
