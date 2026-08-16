-- ============================================================================
-- DEEKSHA JOURNEY — COMPLETE MASTER DATABASE SCHEMA (ALL-IN-ONE MIGRATION)
-- PostgreSQL 14+ | Extensions: pgcrypto, citext, pg_trgm
-- Includes: Authentication, RBAC, Deeksha Cycles, Sannidhanam (Groups),
--           Expense Splitting, Realtime Messages, Store, Donations & OTPs
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EXTENSIONS
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ----------------------------------------------------------------------------
-- 2. ENUM TYPES
-- ----------------------------------------------------------------------------
DO $$ BEGIN CREATE TYPE member_role AS ENUM ('GROUP_ADMIN', 'EXPENSE_MANAGER', 'MEMBER'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE deeksha_status AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE expense_split AS ENUM ('EQUAL', 'EXACT', 'PERCENTAGE', 'SHARES', 'SELECTED'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE settlement_status AS ENUM ('PENDING', 'SETTLED', 'VOID'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE verification_status AS ENUM ('UNVERIFIED', 'COMMUNITY_VERIFIED', 'PARTNER_VERIFIED', 'OFFICIALLY_VERIFIED'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE store_vendor_type AS ENUM ('AMAZON', 'INSTAMART', 'BLINKIT', 'DEEKSHA_POINTS'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE order_status AS ENUM ('PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'FAILED'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ----------------------------------------------------------------------------
-- 3. CORE IDENTITY & USERS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_auth_id text UNIQUE NOT NULL,
  email citext UNIQUE,
  display_name text NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 100),
  language char(2) NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'te', 'ml')),
  identity_status text NOT NULL DEFAULT 'UNVERIFIED' CHECK (identity_status IN ('UNVERIFIED','PENDING','VERIFIED','REJECTED')),
  identity_verified_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  suspended_at timestamptz,
  deleted_at timestamptz,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
DO $$ BEGIN EXECUTE 'CREATE INDEX IF NOT EXISTS users_active_email_idx ON users(email) WHERE is_active AND suspended_at IS NULL AND deleted_at IS NULL'; EXCEPTION WHEN others THEN null; END $$;

-- ----------------------------------------------------------------------------
-- 4. ENTERPRISE RBAC & PERMISSIONS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  display_name text NOT NULL,
  description text NOT NULL,
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  description text NOT NULL
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY(role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS role_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  scope_type text NOT NULL CHECK(scope_type IN ('GLOBAL','GROUP','TEMPLE','COMMUNITY')),
  scope_id uuid,
  granted_by uuid,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((scope_type='GLOBAL' AND scope_id IS NULL) OR (scope_type<>'GLOBAL' AND scope_id IS NOT NULL))
);
DO $$ BEGIN EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS active_role_assignments_idx ON role_assignments(user_id, role_id, scope_type, scope_id) NULLS NOT DISTINCT WHERE revoked_at IS NULL'; EXCEPTION WHEN others THEN null; END $$;

-- ----------------------------------------------------------------------------
-- 5. DEEKSHA TYPES & TEMPLES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS deeksha_types (
  id text PRIMARY KEY,
  display_name text NOT NULL,
  deity_name text NOT NULL,
  tradition_scope text NOT NULL CHECK (tradition_scope IN ('OFFICIAL','REGIONAL','TEMPLE_SPECIFIC')),
  rules jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS temples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  deity text NOT NULL,
  address text NOT NULL,
  district text,
  state text NOT NULL,
  latitude numeric(9,6),
  longitude numeric(9,6),
  website text,
  verification verification_status NOT NULL DEFAULT 'UNVERIFIED',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
DO $$ BEGIN EXECUTE 'CREATE INDEX IF NOT EXISTS temples_location_idx ON temples (state, deity)'; EXCEPTION WHEN others THEN null; END $$;

-- ----------------------------------------------------------------------------
-- 6. DEEKSHA ENROLLMENTS & DAILY LOGS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS deeksha_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  deeksha_type_id text NOT NULL,
  temple_id uuid,
  mala_dharanam_date date NOT NULL,
  duration_days smallint NOT NULL CHECK (duration_days BETWEEN 1 AND 365),
  target_yatra_date date,
  pilgrimage_count smallint NOT NULL CHECK (pilgrimage_count > 0),
  status deeksha_status NOT NULL DEFAULT 'ACTIVE',
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
DO $$ BEGIN EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS one_active_enrollment_per_user ON deeksha_enrollments(user_id) WHERE status IN (''ACTIVE'',''PAUSED'')'; EXCEPTION WHEN others THEN null; END $$;

CREATE TABLE IF NOT EXISTS daily_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL,
  log_date date NOT NULL,
  checkpoints jsonb NOT NULL DEFAULT '{}'::jsonb,
  walking_km numeric(5,2) NOT NULL DEFAULT 0 CHECK(walking_km >= 0),
  saranam_count integer NOT NULL DEFAULT 0 CHECK(saranam_count >= 0),
  notes text,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(enrollment_id, log_date)
);

-- ----------------------------------------------------------------------------
-- 7. PILGRIMAGE GROUPS (SANNIDHANAM) & GOVERNANCE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pilgrimage_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK(char_length(name) BETWEEN 1 AND 120),
  season text NOT NULL,
  route text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS group_members (
  group_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role member_role NOT NULL DEFAULT 'MEMBER',
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(group_id, user_id)
);

CREATE TABLE IF NOT EXISTS group_membership_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL,
  user_id uuid NOT NULL,
  requested_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','APPROVED','REJECTED','CANCELLED')),
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

CREATE TABLE IF NOT EXISTS group_guru_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL UNIQUE,
  guru_user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','APPROVED','REJECTED','REVOKED')),
  proposed_by uuid NOT NULL,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS group_guru_votes (
  assignment_id uuid NOT NULL,
  voter_user_id uuid NOT NULL,
  vote text NOT NULL CHECK(vote IN ('APPROVE','REJECT')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(assignment_id, voter_user_id)
);
DO $$ BEGIN EXECUTE 'CREATE INDEX IF NOT EXISTS group_guru_votes_assignment_idx ON group_guru_votes(assignment_id, vote)'; EXCEPTION WHEN others THEN null; END $$;

CREATE TABLE IF NOT EXISTS group_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL,
  author_user_id uuid NOT NULL,
  body text NOT NULL CHECK(char_length(body) BETWEEN 1 AND 4000),
  message_type text NOT NULL DEFAULT 'NOTE' CHECK(message_type IN ('NOTE','ANNOUNCEMENT','SYSTEM')),
  reply_to_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  edited_at timestamptz,
  deleted_at timestamptz
);
DO $$ BEGIN EXECUTE 'CREATE INDEX IF NOT EXISTS group_messages_timeline_idx ON group_messages(group_id, created_at DESC) WHERE deleted_at IS NULL'; EXCEPTION WHEN others THEN null; END $$;

-- ----------------------------------------------------------------------------
-- 8. EXPENSES & SETTLEMENTS (SPLITWISE-STYLE)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid,
  created_by uuid NOT NULL,
  payer_user_id uuid NOT NULL,
  category text NOT NULL,
  description text NOT NULL,
  amount_paise bigint NOT NULL CHECK(amount_paise > 0),
  expense_date date NOT NULL,
  split_type expense_split NOT NULL DEFAULT 'EQUAL',
  receipt_url text,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
DO $$ BEGIN EXECUTE 'CREATE INDEX IF NOT EXISTS expenses_group_idx ON expenses(group_id, expense_date DESC) WHERE NOT is_deleted'; EXCEPTION WHEN others THEN null; END $$;

CREATE TABLE IF NOT EXISTS expense_participants (
  expense_id uuid NOT NULL,
  user_id uuid NOT NULL,
  share_paise bigint NOT NULL CHECK(share_paise >= 0),
  settled_paise bigint NOT NULL DEFAULT 0 CHECK(settled_paise >= 0),
  PRIMARY KEY(expense_id, user_id)
);

CREATE TABLE IF NOT EXISTS settlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL,
  from_user_id uuid NOT NULL,
  to_user_id uuid NOT NULL,
  amount_paise bigint NOT NULL CHECK(amount_paise > 0),
  payment_method text NOT NULL,
  status settlement_status NOT NULL DEFAULT 'PENDING',
  settled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK(from_user_id <> to_user_id)
);

-- ----------------------------------------------------------------------------
-- 9. SOCIAL CONNECTIONS & NOTIFICATIONS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_follows (
  follower_user_id uuid NOT NULL,
  followed_user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(follower_user_id, followed_user_id),
  CHECK(follower_user_id <> followed_user_id)
);
DO $$ BEGIN EXECUTE 'CREATE INDEX IF NOT EXISTS user_follows_followed_idx ON user_follows(followed_user_id, created_at DESC)'; EXCEPTION WHEN others THEN null; END $$;

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
DO $$ BEGIN EXECUTE 'CREATE INDEX IF NOT EXISTS notifications_inbox_idx ON notifications(user_id, created_at DESC) WHERE read_at IS NULL'; EXCEPTION WHEN others THEN null; END $$;

-- ----------------------------------------------------------------------------
-- 10. POOJA STORE, DONATIONS & COMPLIANCE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS store_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('buy', 'points', 'donate')),
  price_inr numeric(10,2),
  points_cost integer,
  vendor store_vendor_type NOT NULL DEFAULT 'DEEKSHA_POINTS',
  affiliate_url text,
  image_emoji text NOT NULL DEFAULT '📿',
  description text NOT NULL,
  health_tags text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS store_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  product_id uuid,
  points_spent integer NOT NULL DEFAULT 0,
  amount_paid_inr numeric(10,2) NOT NULL DEFAULT 0.00,
  razorpay_order_id text,
  razorpay_payment_id text,
  status order_status NOT NULL DEFAULT 'PENDING',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS devotional_donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  cause_id text NOT NULL,
  amount_inr numeric(10,2) NOT NULL,
  donor_name text NOT NULL DEFAULT 'Swami Devotee',
  razorpay_payment_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS compliance_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action_type text NOT NULL,
  ip_address text,
  user_agent text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_user_id uuid,
  entity_type text NOT NULL,
  entity_id uuid,
  action text NOT NULL,
  before_value jsonb,
  after_value jsonb,
  request_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
DO $$ BEGIN EXECUTE 'CREATE INDEX IF NOT EXISTS audit_events_entity_idx ON audit_events(entity_type, entity_id, created_at DESC)'; EXCEPTION WHEN others THEN null; END $$;

-- ----------------------------------------------------------------------------
-- 11. EMAIL OTP AUTHENTICATION & DAILY CHECK-IN TRACKER
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS email_otp_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,
  otp_code varchar(6) NOT NULL,
  is_verified boolean NOT NULL DEFAULT false,
  attempts integer NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
DO $$ BEGIN EXECUTE 'CREATE INDEX IF NOT EXISTS email_otp_identifier_idx ON email_otp_codes(identifier, expires_at DESC)'; EXCEPTION WHEN others THEN null; END $$;

CREATE TABLE IF NOT EXISTS daily_checkin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  enrollment_id uuid,
  checkin_date date NOT NULL DEFAULT CURRENT_DATE,
  checkpoints_completed jsonb NOT NULL DEFAULT '{}'::jsonb,
  saranam_count integer NOT NULL DEFAULT 18,
  points_awarded integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, checkin_date)
);
DO $$ BEGIN EXECUTE 'CREATE INDEX IF NOT EXISTS daily_checkin_user_date_idx ON daily_checkin_logs(user_id, checkin_date DESC)'; EXCEPTION WHEN others THEN null; END $$;

-- ----------------------------------------------------------------------------
-- 12. TRIGGERS & FUNCTIONS
-- ----------------------------------------------------------------------------
DO $$ BEGIN
  CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS trigger LANGUAGE plpgsql AS $f$
  BEGIN
    NEW.updated_at = now();
    RETURN NEW;
  END;
  $f$;
EXCEPTION WHEN others THEN null;
END $$;

DO $$ BEGIN
  EXECUTE 'DROP TRIGGER IF EXISTS users_touch ON users';
  EXECUTE 'CREATE TRIGGER users_touch BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION touch_updated_at()';
EXCEPTION WHEN others THEN null;
END $$;

DO $$ BEGIN
  EXECUTE 'DROP TRIGGER IF EXISTS temples_touch ON temples';
  EXECUTE 'CREATE TRIGGER temples_touch BEFORE UPDATE ON temples FOR EACH ROW EXECUTE FUNCTION touch_updated_at()';
EXCEPTION WHEN others THEN null;
END $$;

DO $$ BEGIN
  EXECUTE 'DROP TRIGGER IF EXISTS enrollment_touch ON deeksha_enrollments';
  EXECUTE 'CREATE TRIGGER enrollment_touch BEFORE UPDATE ON deeksha_enrollments FOR EACH ROW EXECUTE FUNCTION touch_updated_at()';
EXCEPTION WHEN others THEN null;
END $$;

DO $$ BEGIN
  EXECUTE 'DROP TRIGGER IF EXISTS daily_log_touch ON daily_logs';
  EXECUTE 'CREATE TRIGGER daily_log_touch BEFORE UPDATE ON daily_logs FOR EACH ROW EXECUTE FUNCTION touch_updated_at()';
EXCEPTION WHEN others THEN null;
END $$;

DO $$ BEGIN
  EXECUTE 'DROP TRIGGER IF EXISTS groups_touch ON pilgrimage_groups';
  EXECUTE 'CREATE TRIGGER groups_touch BEFORE UPDATE ON pilgrimage_groups FOR EACH ROW EXECUTE FUNCTION touch_updated_at()';
EXCEPTION WHEN others THEN null;
END $$;

DO $$ BEGIN
  EXECUTE 'DROP TRIGGER IF EXISTS expenses_touch ON expenses';
  EXECUTE 'CREATE TRIGGER expenses_touch BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION touch_updated_at()';
EXCEPTION WHEN others THEN null;
END $$;

DO $$ BEGIN
  CREATE OR REPLACE FUNCTION refresh_group_guru_status() RETURNS trigger LANGUAGE plpgsql AS $f$
  DECLARE
    needed integer;
    approved integer;
    rejected integer;
  BEGIN
    SELECT count(*) INTO needed FROM group_members gm JOIN group_guru_assignments a ON a.group_id=gm.group_id WHERE a.id=NEW.assignment_id AND gm.user_id<>a.guru_user_id;
    SELECT count(*) FILTER(WHERE vote='APPROVE'), count(*) FILTER(WHERE vote='REJECT') INTO approved, rejected FROM group_guru_votes WHERE assignment_id=NEW.assignment_id;
    UPDATE group_guru_assignments
    SET status = CASE WHEN rejected > 0 THEN 'REJECTED' WHEN needed > 0 AND approved = needed THEN 'APPROVED' ELSE 'PENDING' END,
        approved_at = CASE WHEN needed > 0 AND approved = needed THEN now() ELSE NULL END
    WHERE id = NEW.assignment_id;
    RETURN NEW;
  END;
  $f$;
EXCEPTION WHEN others THEN null;
END $$;

DO $$ BEGIN
  EXECUTE 'DROP TRIGGER IF EXISTS group_guru_vote_status ON group_guru_votes';
  EXECUTE 'CREATE TRIGGER group_guru_vote_status AFTER INSERT OR UPDATE ON group_guru_votes FOR EACH ROW EXECUTE FUNCTION refresh_group_guru_status()';
EXCEPTION WHEN others THEN null;
END $$;

-- ----------------------------------------------------------------------------
-- 13. SEED DATA (Deeksha Types, Store Items, Default Permissions)
-- ----------------------------------------------------------------------------
INSERT INTO deeksha_types(id, display_name, deity_name, tradition_scope, rules) VALUES
('ayyappa', 'Ayyappa Deeksha', 'Sri Ayyappa / Dharma Sastha', 'OFFICIAL', '{"durationOptions":[41],"irumudi":true,"eighteenSteps":true,"commonSaranam":"Swamiye Saranam Ayyappa"}'),
('bhavani', 'Bhavani Deeksha', 'Sri Kanaka Durga', 'REGIONAL', '{"durationOptions":[21,41],"irumudi":true,"commonSaranam":"Jai Bhavani Jai Jai Bhavani"}'),
('govinda', 'Govinda Mala', 'Sri Venkateswara', 'REGIONAL', '{"durationOptions":[21,41],"commonSaranam":"Govinda Govinda"}'),
('shiva', 'Shiva Deeksha', 'Lord Shiva', 'REGIONAL', '{"durationOptions":[11,21,41],"commonSaranam":"Om Namah Shivaya"}'),
('hanuman', 'Hanuman Deeksha', 'Lord Hanuman', 'REGIONAL', '{"durationOptions":[11,21,41],"commonSaranam":"Jai Hanuman"}'),
('nookambika', 'Nookambika Mala', 'Sri Nookambika Ammavaru', 'TEMPLE_SPECIFIC', '{"requiresLocalConfirmation":true,"commonSaranam":"Jai Nookambika Amma"}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO store_products(id, name, category, price_inr, points_cost, vendor, image_emoji, description, health_tags) VALUES
('11111111-1111-1111-1111-111111111111', 'Original Tulsi Mala (108 Beads)', 'buy', 299.00, NULL, 'AMAZON', '📿', 'Sacred natural Tulsi wood chanting and wearing mala.', ARRAY['Organic', 'Natural Wood']),
('22222222-2222-2222-2222-222222222222', 'Pure Cow Ghee for Irumudi (500ml)', 'buy', 450.00, NULL, 'INSTAMART', '🥥', 'A2 Desi Cow Bilona Ghee specially packaged for Irumudi Munmudi.', ARRAY['A2 Pure', 'Zero Preservatives']),
('33333333-3333-3333-3333-333333333333', 'Devotional Vibhuti & Sandal Paste Kit', 'points', NULL, 250, 'DEEKSHA_POINTS', '✨', 'Redeem with 250 discipline points earned from daily vrutham check-ins.', ARRAY['Pure Herbal', 'Direct Prasad']),
('44444444-4444-4444-4444-444444444444', 'Sabarimala Annadhanam Meal Token', 'donate', 100.00, NULL, 'DEEKSHA_POINTS', '🍛', 'Donate a hot nutritious sattvic meal for walking pilgrims at Pamba.', ARRAY['Charity', 'Annadhanam'])
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 14. SCHEMA MIGRATIONS REGISTER
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS schema_migrations(
  name text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO schema_migrations (name) VALUES
  ('001_initial.sql'),
  ('002_enterprise_identity_rbac_progression.sql'),
  ('003_runtime_role_grants.sql'),
  ('004_social_realtime_group_governance.sql'),
  ('005_store_orders_donations_compliance.sql'),
  ('006_email_otp_and_daily_checkin_logs.sql')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- SCHEMA SETUP COMPLETE
-- ============================================================================
