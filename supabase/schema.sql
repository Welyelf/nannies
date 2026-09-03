-- House of Nannies — Database Schema
-- Run this in Supabase SQL Editor to set up the database

-- 1. Candidates table
CREATE TABLE IF NOT EXISTS candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  headline text NOT NULL,
  bio text NOT NULL,
  experience_years integer NOT NULL DEFAULT 0,
  specialties text[] DEFAULT '{}',
  certifications text[] DEFAULT '{}',
  hourly_rate text,
  photo_url text,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'shared', 'viewed', 'deposit_paid', 'placed', 'archived')),
  deposit_paid boolean NOT NULL DEFAULT false,
  deposit_paid_at timestamptz,
  stripe_payment_intent_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Profile tokens table
CREATE TABLE IF NOT EXISTS profile_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  revoked boolean NOT NULL DEFAULT false,
  revoked_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  opened_at timestamptz,
  last_opened_at timestamptz,
  opened_count integer NOT NULL DEFAULT 0,
  notification_sent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Webhook events table (idempotency log)
CREATE TABLE IF NOT EXISTS webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id text UNIQUE NOT NULL,
  event_type text NOT NULL,
  candidate_id uuid REFERENCES candidates(id),
  processed boolean NOT NULL DEFAULT true,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER candidates_updated_at
  BEFORE UPDATE ON candidates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 5. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profile_tokens_token ON profile_tokens(token);
CREATE INDEX IF NOT EXISTS idx_profile_tokens_candidate ON profile_tokens(candidate_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_stripe_id ON webhook_events(stripe_event_id);
