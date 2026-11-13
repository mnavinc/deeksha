-- 008_qr_invites_and_action_logs.sql
-- Viral QR Sannidhanam invite tracking and user action logs (zero-PII safe metadata)

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS joined_sannidhanam_id TEXT,
  ADD COLUMN IF NOT EXISTS referrer_id TEXT,
  ADD COLUMN IF NOT EXISTS joined_date DATE;

CREATE TABLE IF NOT EXISTS user_action_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action_name TEXT NOT NULL,
  sannidhanam_id TEXT,
  referrer_id TEXT,
  joined_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  event_tags TEXT[] NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_action_logs_user_id ON user_action_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_user_action_logs_sannidhanam ON user_action_logs (sannidhanam_id);
CREATE INDEX IF NOT EXISTS idx_user_action_logs_event_tags ON user_action_logs USING GIN (event_tags);

