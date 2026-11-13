-- Migration 007: Seed Test Credentials & Sample Journey Data for Supabase / PostgreSQL
-- Allows immediate testing with test@deeksha.app (OTP: 123456) and kanni@deeksha.app (OTP: 123456)

INSERT INTO users (id, external_auth_id, email, display_name, language)
VALUES
  ('00000000-0000-4000-8000-000000000001', 'email:test@deeksha.app', 'test@deeksha.app', 'Swami Test', 'te'),
  ('00000000-0000-4000-8000-000000000002', 'email:kanni@deeksha.app', 'kanni@deeksha.app', 'Kanni Swami', 'en')
ON CONFLICT (email) DO NOTHING;

-- Seed an active 41-day Ayyappa Deeksha enrollment for test@deeksha.app (if not already enrolled)
INSERT INTO deeksha_enrollments (
  id, user_id, deeksha_type_id, mala_dharanam_date, duration_days, pilgrimage_count, status
)
SELECT
  '00000000-0000-4000-8000-000000000101',
  u.id,
  'ayyappa',
  (CURRENT_DATE - INTERVAL '6 days')::date,
  41,
  1,
  'ACTIVE'
FROM users u
WHERE u.email = 'test@deeksha.app'
  AND NOT EXISTS (
    SELECT 1 FROM deeksha_enrollments e WHERE e.user_id = u.id AND e.status IN ('ACTIVE', 'PAUSED')
  );

-- Seed 3 sample daily logs for the test enrollment
INSERT INTO daily_logs (enrollment_id, log_date, checkpoints, walking_km, saranam_count, notes)
VALUES
  (
    '00000000-0000-4000-8000-000000000101',
    (CURRENT_DATE - INTERVAL '2 days')::date,
    '{"prayer": true, "saranam": true, "vegetarian": true, "noAlcohol": true, "noSmoking": true, "brahmacharyam": true, "walking": true, "eveningPrayer": true}'::jsonb,
    3.5,
    108,
    'Day 5 Mandala Vrutham — Swamiye Saranam Ayyappa'
  ),
  (
    '00000000-0000-4000-8000-000000000101',
    (CURRENT_DATE - INTERVAL '1 day')::date,
    '{"prayer": true, "saranam": true, "vegetarian": true, "noAlcohol": true, "noSmoking": true, "brahmacharyam": true, "walking": true, "eveningPrayer": true}'::jsonb,
    4.2,
    108,
    'Day 6 Mandala Vrutham — Evening Harivarasanam complete'
  )
ON CONFLICT (enrollment_id, log_date) DO NOTHING;

