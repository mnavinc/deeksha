-- Migration 006: Email/SMS OTP Verification Codes & Daily Check-in Tracking
-- DeekshaOrg Production Database Schema

-- Table for storing temporary OTP codes for Email and Phone authentication
CREATE TABLE email_otp_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL, -- Email address or phone number
  otp_code varchar(6) NOT NULL,
  is_verified boolean NOT NULL DEFAULT false,
  attempts integer NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Table for tracking daily check-ins and gamification history
CREATE TABLE daily_checkin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  enrollment_id uuid REFERENCES deeksha_enrollments(id) ON DELETE CASCADE,
  checkin_date date NOT NULL DEFAULT CURRENT_DATE,
  checkpoints_completed jsonb NOT NULL DEFAULT '{}'::jsonb,
  saranam_count integer NOT NULL DEFAULT 18,
  points_awarded integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, checkin_date)
);

-- Indexes for quick lookup
CREATE INDEX email_otp_identifier_idx ON email_otp_codes(identifier, expires_at DESC);
CREATE INDEX daily_checkin_user_date_idx ON daily_checkin_logs(user_id, checkin_date DESC);
