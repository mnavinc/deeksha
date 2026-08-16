CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

DO $$ BEGIN CREATE TYPE member_role AS ENUM ('GROUP_ADMIN', 'EXPENSE_MANAGER', 'MEMBER'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE deeksha_status AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE expense_split AS ENUM ('EQUAL', 'EXACT', 'PERCENTAGE', 'SHARES', 'SELECTED'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE settlement_status AS ENUM ('PENDING', 'SETTLED', 'VOID'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE verification_status AS ENUM ('UNVERIFIED', 'COMMUNITY_VERIFIED', 'PARTNER_VERIFIED', 'OFFICIALLY_VERIFIED'); EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_auth_id text UNIQUE NOT NULL,
  email citext UNIQUE,
  display_name text NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 100),
  language char(2) NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'te', 'ml')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS deeksha_types (
  id text PRIMARY KEY, display_name text NOT NULL, deity_name text NOT NULL,
  tradition_scope text NOT NULL CHECK (tradition_scope IN ('OFFICIAL','REGIONAL','TEMPLE_SPECIFIC')),
  rules jsonb NOT NULL DEFAULT '{}'::jsonb, is_active boolean NOT NULL DEFAULT true
);
CREATE TABLE IF NOT EXISTS temples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, deity text NOT NULL,
  address text NOT NULL, district text, state text NOT NULL, latitude numeric(9,6), longitude numeric(9,6),
  website text, verification verification_status NOT NULL DEFAULT 'UNVERIFIED', metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS temples_location_idx ON temples (state, deity);
CREATE TABLE IF NOT EXISTS deeksha_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id),
  deeksha_type_id text NOT NULL REFERENCES deeksha_types(id), temple_id uuid REFERENCES temples(id),
  mala_dharanam_date date NOT NULL, duration_days smallint NOT NULL CHECK (duration_days BETWEEN 1 AND 365),
  target_yatra_date date, pilgrimage_count smallint NOT NULL CHECK (pilgrimage_count > 0),
  status deeksha_status NOT NULL DEFAULT 'ACTIVE', version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS one_active_enrollment_per_user ON deeksha_enrollments(user_id) WHERE status IN ('ACTIVE','PAUSED');
CREATE TABLE IF NOT EXISTS daily_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), enrollment_id uuid NOT NULL REFERENCES deeksha_enrollments(id) ON DELETE CASCADE,
  log_date date NOT NULL, checkpoints jsonb NOT NULL DEFAULT '{}'::jsonb, walking_km numeric(5,2) NOT NULL DEFAULT 0 CHECK(walking_km >= 0),
  saranam_count integer NOT NULL DEFAULT 0 CHECK(saranam_count >= 0), notes text, version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(enrollment_id, log_date)
);
CREATE TABLE IF NOT EXISTS pilgrimage_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL CHECK(char_length(name) BETWEEN 1 AND 120), season text NOT NULL,
  route text, created_by uuid NOT NULL REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS group_members (
  group_id uuid NOT NULL REFERENCES pilgrimage_groups(id) ON DELETE CASCADE, user_id uuid NOT NULL REFERENCES users(id),
  role member_role NOT NULL DEFAULT 'MEMBER', joined_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(group_id,user_id)
);
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), group_id uuid REFERENCES pilgrimage_groups(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES users(id), payer_user_id uuid NOT NULL REFERENCES users(id), category text NOT NULL,
  description text NOT NULL, amount_paise bigint NOT NULL CHECK(amount_paise > 0), expense_date date NOT NULL,
  split_type expense_split NOT NULL DEFAULT 'EQUAL', receipt_url text, is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS expenses_group_idx ON expenses(group_id, expense_date DESC) WHERE NOT is_deleted;
CREATE TABLE IF NOT EXISTS expense_participants (
  expense_id uuid NOT NULL REFERENCES expenses(id) ON DELETE CASCADE, user_id uuid NOT NULL REFERENCES users(id),
  share_paise bigint NOT NULL CHECK(share_paise >= 0), settled_paise bigint NOT NULL DEFAULT 0 CHECK(settled_paise >= 0), PRIMARY KEY(expense_id,user_id)
);
CREATE TABLE IF NOT EXISTS settlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), group_id uuid NOT NULL REFERENCES pilgrimage_groups(id), from_user_id uuid NOT NULL REFERENCES users(id), to_user_id uuid NOT NULL REFERENCES users(id),
  amount_paise bigint NOT NULL CHECK(amount_paise > 0), payment_method text NOT NULL, status settlement_status NOT NULL DEFAULT 'PENDING', settled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), CHECK(from_user_id <> to_user_id)
);
CREATE TABLE IF NOT EXISTS audit_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, actor_user_id uuid REFERENCES users(id), entity_type text NOT NULL, entity_id uuid,
  action text NOT NULL, before_value jsonb, after_value jsonb, request_id uuid, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_events_entity_idx ON audit_events(entity_type, entity_id, created_at DESC);

CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
DROP TRIGGER IF EXISTS users_touch ON users; CREATE TRIGGER users_touch BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
DROP TRIGGER IF EXISTS temples_touch ON temples; CREATE TRIGGER temples_touch BEFORE UPDATE ON temples FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
DROP TRIGGER IF EXISTS enrollment_touch ON deeksha_enrollments; CREATE TRIGGER enrollment_touch BEFORE UPDATE ON deeksha_enrollments FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
DROP TRIGGER IF EXISTS daily_log_touch ON daily_logs; CREATE TRIGGER daily_log_touch BEFORE UPDATE ON daily_logs FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
DROP TRIGGER IF EXISTS groups_touch ON pilgrimage_groups; CREATE TRIGGER groups_touch BEFORE UPDATE ON pilgrimage_groups FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
DROP TRIGGER IF EXISTS expenses_touch ON expenses; CREATE TRIGGER expenses_touch BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

ALTER TABLE users ENABLE ROW LEVEL SECURITY; ALTER TABLE deeksha_enrollments ENABLE ROW LEVEL SECURITY; ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pilgrimage_groups ENABLE ROW LEVEL SECURITY; ALTER TABLE group_members ENABLE ROW LEVEL SECURITY; ALTER TABLE expenses ENABLE ROW LEVEL SECURITY; ALTER TABLE expense_participants ENABLE ROW LEVEL SECURITY; ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION app_user_id() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT NULLIF(current_setting('app.user_id', true), '')::uuid $$;
DROP POLICY IF EXISTS own_user ON users; CREATE POLICY own_user ON users USING (id = app_user_id()) WITH CHECK (id = app_user_id());
DROP POLICY IF EXISTS own_enrollment ON deeksha_enrollments; CREATE POLICY own_enrollment ON deeksha_enrollments USING (user_id = app_user_id()) WITH CHECK (user_id = app_user_id());
DROP POLICY IF EXISTS own_logs ON daily_logs; CREATE POLICY own_logs ON daily_logs USING (EXISTS (SELECT 1 FROM deeksha_enrollments e WHERE e.id = enrollment_id AND e.user_id = app_user_id())) WITH CHECK (EXISTS (SELECT 1 FROM deeksha_enrollments e WHERE e.id = enrollment_id AND e.user_id = app_user_id()));
DROP POLICY IF EXISTS group_visible ON pilgrimage_groups; CREATE POLICY group_visible ON pilgrimage_groups USING (created_by=app_user_id() OR EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id=id AND gm.user_id=app_user_id())) WITH CHECK (created_by=app_user_id());
DROP POLICY IF EXISTS group_member_visible ON group_members; CREATE POLICY group_member_visible ON group_members USING (EXISTS (SELECT 1 FROM pilgrimage_groups g WHERE g.id=group_id AND (g.created_by=app_user_id() OR EXISTS (SELECT 1 FROM group_members mine WHERE mine.group_id=g.id AND mine.user_id=app_user_id())))) WITH CHECK (user_id=app_user_id() AND EXISTS (SELECT 1 FROM pilgrimage_groups g WHERE g.id=group_id AND g.created_by=app_user_id()));
DROP POLICY IF EXISTS group_expense_visible ON expenses; CREATE POLICY group_expense_visible ON expenses USING ((group_id IS NULL AND created_by=app_user_id()) OR EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id=expenses.group_id AND gm.user_id=app_user_id())) WITH CHECK ((group_id IS NULL AND created_by=app_user_id()) OR EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id=expenses.group_id AND gm.user_id=app_user_id()));
DROP POLICY IF EXISTS expense_participant_visible ON expense_participants; CREATE POLICY expense_participant_visible ON expense_participants USING (EXISTS (SELECT 1 FROM expenses e WHERE e.id=expense_id AND (e.created_by=app_user_id() OR EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id=e.group_id AND gm.user_id=app_user_id()))));
DROP POLICY IF EXISTS settlement_visible ON settlements; CREATE POLICY settlement_visible ON settlements USING (EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id=settlements.group_id AND gm.user_id=app_user_id()));

INSERT INTO deeksha_types(id,display_name,deity_name,tradition_scope,rules) VALUES
('ayyappa','Ayyappa Deeksha','Sri Ayyappa / Dharma Sastha','OFFICIAL','{"durationOptions":[41],"irumudi":true,"eighteenSteps":true}'),
('bhavani','Bhavani Deeksha','Sri Kanaka Durga','REGIONAL','{"durationOptions":[21,41]}'),
('govinda','Govinda Mala','Sri Venkateswara','REGIONAL','{"durationOptions":[21,41]}'),
('shiva','Shiva Deeksha','Lord Shiva','REGIONAL','{"durationOptions":[11,21,41]}'),
('hanuman','Hanuman Deeksha','Lord Hanuman','REGIONAL','{"durationOptions":[11,21,41]}'),
('nookambika','Nookambika Mala','Sri Nookambika Ammavaru','TEMPLE_SPECIFIC','{"requiresLocalConfirmation":true}')
ON CONFLICT (id) DO NOTHING;
