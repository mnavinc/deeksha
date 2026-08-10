-- Enterprise identity, authorization, public discovery and Guru recognition.
-- This migration deliberately makes Guru and Sadguru approval a reviewed process,
-- never a points-only or automatic spiritual classification.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

ALTER TABLE users
  ADD COLUMN identity_status text NOT NULL DEFAULT 'UNVERIFIED' CHECK (identity_status IN ('UNVERIFIED','PENDING','VERIFIED','REJECTED')),
  ADD COLUMN identity_verified_at timestamptz,
  ADD COLUMN suspended_at timestamptz,
  ADD COLUMN deleted_at timestamptz,
  ADD COLUMN last_login_at timestamptz;
CREATE INDEX users_active_email_idx ON users(email) WHERE is_active AND suspended_at IS NULL AND deleted_at IS NULL;

CREATE TABLE roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code text UNIQUE NOT NULL,
  display_name text NOT NULL, description text NOT NULL, is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code text UNIQUE NOT NULL, description text NOT NULL
);
CREATE TABLE role_permissions (
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY(role_id, permission_id)
);
CREATE TABLE role_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id), role_id uuid NOT NULL REFERENCES roles(id),
  scope_type text NOT NULL CHECK(scope_type IN ('GLOBAL','GROUP','TEMPLE','COMMUNITY')),
  scope_id uuid, granted_by uuid REFERENCES users(id), expires_at timestamptz, revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((scope_type='GLOBAL' AND scope_id IS NULL) OR (scope_type<>'GLOBAL' AND scope_id IS NOT NULL))
);
CREATE UNIQUE INDEX active_role_assignments_idx ON role_assignments(user_id, role_id, scope_type, scope_id) NULLS NOT DISTINCT WHERE revoked_at IS NULL;
CREATE INDEX role_assignments_subject_idx ON role_assignments(user_id, scope_type) WHERE revoked_at IS NULL;

INSERT INTO permissions(code,description) VALUES
  ('profile.read.public','Search and view public profiles'), ('profile.update.self','Update own private profile'),
  ('group.create','Create pilgrimage groups'), ('group.manage','Manage group members and settings'),
  ('group.expense.manage','Create and manage group expenses'), ('group.journey.manage','Mark group journeys complete'),
  ('guru.apply','Apply for Guru Swamy review'), ('guru.verify','Submit a community verification'),
  ('guru.review','Review Guru applications and levels'), ('sadguru.nominate','Nominate a Guru Level 5 for Sadguru review'),
  ('temple.verify','Verify temple or community records'), ('platform.admin','Administer platform')
ON CONFLICT (code) DO NOTHING;
INSERT INTO roles(code,display_name,description,is_system) VALUES
  ('MEMBER','Member','Standard verified devotee',true), ('GROUP_ADMIN','Group administrator','Owns and administers a group',true),
  ('EXPENSE_MANAGER','Expense manager','Manages group financial records',true), ('GURU_REVIEWER','Guru reviewer','Reviews evidence and community verification',true),
  ('TEMPLE_PARTNER','Temple partner','Verified temple/community representative',true), ('PLATFORM_ADMIN','Platform administrator','Restricted platform operations',true)
ON CONFLICT (code) DO NOTHING;
INSERT INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r JOIN permissions p ON
  (r.code='MEMBER' AND p.code IN ('profile.read.public','profile.update.self','guru.apply','guru.verify')) OR
  (r.code='GROUP_ADMIN' AND p.code IN ('group.manage','group.expense.manage','group.journey.manage')) OR
  (r.code='EXPENSE_MANAGER' AND p.code='group.expense.manage') OR
  (r.code='GURU_REVIEWER' AND p.code='guru.review') OR
  (r.code='TEMPLE_PARTNER' AND p.code IN ('temple.verify','guru.review')) OR
  (r.code='PLATFORM_ADMIN' AND p.code='platform.admin')
ON CONFLICT DO NOTHING;

CREATE TABLE user_profiles (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  public_handle citext UNIQUE, bio text CHECK(char_length(bio) <= 500), city text CHECK(char_length(city) <= 100), state text CHECK(char_length(state) <= 100),
  avatar_url text, is_searchable boolean NOT NULL DEFAULT false, show_journey_stats boolean NOT NULL DEFAULT true,
  show_mentor_stats boolean NOT NULL DEFAULT true, search_document tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(public_handle::text,'')), 'A') || setweight(to_tsvector('simple', coalesce(city,'')), 'C') || setweight(to_tsvector('simple', coalesce(state,'')), 'C')
  ) STORED,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX user_profiles_search_idx ON user_profiles USING gin(search_document);
CREATE INDEX user_profiles_handle_trgm_idx ON user_profiles USING gin((public_handle::text) gin_trgm_ops) WHERE is_searchable;
CREATE TRIGGER profiles_touch BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TABLE journey_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id), enrollment_id uuid UNIQUE REFERENCES deeksha_enrollments(id),
  deeksha_type_id text NOT NULL REFERENCES deeksha_types(id), temple_id uuid REFERENCES temples(id), completed_on date NOT NULL,
  completion_status text NOT NULL CHECK(completion_status IN ('SELF_REPORTED','GROUP_CONFIRMED','TEMPLE_CONFIRMED','PLATFORM_VERIFIED')),
  verified_by uuid REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX journey_completion_user_idx ON journey_completions(user_id, completed_on DESC);
CREATE INDEX journey_completion_verified_idx ON journey_completions(user_id, completion_status) WHERE completion_status IN ('GROUP_CONFIRMED','TEMPLE_CONFIRMED','PLATFORM_VERIFIED');

CREATE TABLE mentorship_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), mentor_user_id uuid NOT NULL REFERENCES users(id), mentee_user_id uuid NOT NULL REFERENCES users(id),
  group_id uuid REFERENCES pilgrimage_groups(id), started_at timestamptz NOT NULL DEFAULT now(), completed_at timestamptz,
  status text NOT NULL CHECK(status IN ('REQUESTED','ACTIVE','COMPLETED','CANCELLED')), confirmed_by_mentee_at timestamptz,
  CHECK(mentor_user_id <> mentee_user_id)
);
CREATE UNIQUE INDEX active_mentorship_idx ON mentorship_relationships(mentor_user_id,mentee_user_id) WHERE status IN ('REQUESTED','ACTIVE');
CREATE INDEX mentorship_mentor_idx ON mentorship_relationships(mentor_user_id,status,completed_at DESC);

CREATE TABLE group_journeys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), group_id uuid NOT NULL REFERENCES pilgrimage_groups(id) ON DELETE CASCADE,
  deeksha_type_id text REFERENCES deeksha_types(id), temple_id uuid REFERENCES temples(id), title text NOT NULL,
  started_on date NOT NULL, completed_on date, status text NOT NULL CHECK(status IN ('PLANNED','ACTIVE','COMPLETED','CANCELLED')),
  verified_by uuid REFERENCES users(id), created_by uuid NOT NULL REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX group_journeys_group_idx ON group_journeys(group_id,started_on DESC);
CREATE TABLE group_journey_members (
  group_journey_id uuid NOT NULL REFERENCES group_journeys(id) ON DELETE CASCADE, user_id uuid NOT NULL REFERENCES users(id),
  is_kanni_swamy boolean NOT NULL DEFAULT false, completed_at timestamptz, PRIMARY KEY(group_journey_id,user_id)
);
CREATE INDEX group_journey_members_user_idx ON group_journey_members(user_id,completed_at DESC);

CREATE TABLE seva_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id), group_id uuid REFERENCES pilgrimage_groups(id), temple_id uuid REFERENCES temples(id),
  contribution_type text NOT NULL CHECK(contribution_type IN ('TEMPLE_SERVICE','GROUP_SERVICE','COMMUNITY_SERVICE','SAFETY_SUPPORT','CONTENT_CONTRIBUTION')),
  description text NOT NULL CHECK(char_length(description) <= 1000), occurred_on date NOT NULL,
  verification_status text NOT NULL DEFAULT 'PENDING' CHECK(verification_status IN ('PENDING','VERIFIED','REJECTED')),
  verified_by uuid REFERENCES users(id), verified_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX seva_user_verified_idx ON seva_contributions(user_id,verification_status,occurred_on DESC);

CREATE TABLE progression_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id),
  dimension text NOT NULL CHECK(dimension IN ('JOURNEY','MENTORSHIP','SEVA')), event_type text NOT NULL,
  points integer NOT NULL DEFAULT 0 CHECK(points >= 0), source_type text NOT NULL, source_id uuid, evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  verified_at timestamptz, verified_by uuid REFERENCES users(id), occurred_at timestamptz NOT NULL DEFAULT now(), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX progression_user_dimension_idx ON progression_events(user_id,dimension,occurred_at DESC);
CREATE INDEX progression_verified_idx ON progression_events(user_id,dimension) WHERE verified_at IS NOT NULL;
CREATE UNIQUE INDEX progression_source_dedupe_idx ON progression_events(user_id,dimension,source_type,source_id) WHERE source_id IS NOT NULL;

CREATE TABLE platform_tier_definitions (
  code text PRIMARY KEY, display_name text NOT NULL, minimum_journey_xp integer NOT NULL DEFAULT 0,
  minimum_mentorship_xp integer NOT NULL DEFAULT 0, minimum_seva_xp integer NOT NULL DEFAULT 0, sort_order smallint UNIQUE NOT NULL
);
INSERT INTO platform_tier_definitions VALUES
  ('SADHAKA','Sadhaka',0,0,0,1), ('ANUSHASAKA','Anushasaka',500,0,0,2), ('SEVAK','Sevak',1200,100,100,3), ('GUIDE_CANDIDATE','Guide Candidate',2500,300,300,4)
ON CONFLICT (code) DO NOTHING;

CREATE TABLE guru_credentials (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'NONE' CHECK(status IN ('NONE','APPLIED','UNDER_REVIEW','VERIFIED','SUSPENDED','REVOKED')),
  guru_level smallint NOT NULL DEFAULT 0 CHECK(guru_level BETWEEN 0 AND 5),
  mentor_training_completed_at timestamptz, verified_at timestamptz, verified_by uuid REFERENCES users(id),
  sadguru_status text NOT NULL DEFAULT 'NONE' CHECK(sadguru_status IN ('NONE','NOMINATED','UNDER_REVIEW','RECOGNIZED','DECLINED','REVOKED')),
  sadguru_recognized_at timestamptz, sadguru_recognized_by uuid REFERENCES users(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE guru_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), guru_user_id uuid NOT NULL REFERENCES users(id), verifier_user_id uuid NOT NULL REFERENCES users(id),
  status text NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','ACCEPTED','REJECTED','REVOKED')), statement text CHECK(char_length(statement) <= 1000),
  created_at timestamptz NOT NULL DEFAULT now(), decided_at timestamptz,
  CHECK(guru_user_id <> verifier_user_id), UNIQUE(guru_user_id, verifier_user_id)
);
CREATE INDEX guru_verification_target_idx ON guru_verifications(guru_user_id,status) WHERE status='ACCEPTED';
CREATE TABLE guru_review_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), guru_user_id uuid NOT NULL REFERENCES users(id), reviewer_user_id uuid NOT NULL REFERENCES users(id),
  decision_type text NOT NULL CHECK(decision_type IN ('GURU_APPROVAL','LEVEL_CHANGE','SADGURU_NOMINATION','SADGURU_RECOGNITION','SUSPENSION','REVOCATION')),
  proposed_level smallint CHECK(proposed_level BETWEEN 0 AND 5), decision text NOT NULL CHECK(decision IN ('APPROVED','DECLINED','REVOKED')),
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb, rationale text NOT NULL CHECK(char_length(rationale) BETWEEN 20 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX guru_reviews_target_idx ON guru_review_decisions(guru_user_id,created_at DESC);

CREATE VIEW user_progress_summary WITH (security_invoker=true) AS
SELECT u.id AS user_id,
  coalesce((SELECT sum(p.points) FROM progression_events p WHERE p.user_id=u.id AND p.dimension='JOURNEY' AND p.verified_at IS NOT NULL),0)::int AS journey_xp,
  coalesce((SELECT sum(p.points) FROM progression_events p WHERE p.user_id=u.id AND p.dimension='MENTORSHIP' AND p.verified_at IS NOT NULL),0)::int AS mentorship_xp,
  coalesce((SELECT sum(p.points) FROM progression_events p WHERE p.user_id=u.id AND p.dimension='SEVA' AND p.verified_at IS NOT NULL),0)::int AS seva_xp,
  (SELECT count(*) FROM journey_completions jc WHERE jc.user_id=u.id AND jc.completion_status IN ('GROUP_CONFIRMED','TEMPLE_CONFIRMED','PLATFORM_VERIFIED'))::int AS verified_journeys,
  (SELECT count(*) FROM mentorship_relationships mr WHERE mr.mentor_user_id=u.id AND mr.status='COMPLETED')::int AS mentees_completed
FROM users u;
CREATE VIEW guru_readiness WITH (security_invoker=true) AS
SELECT g.user_id, g.status, g.guru_level, g.sadguru_status, s.verified_journeys, s.mentees_completed,
  (SELECT count(*) FROM guru_verifications v JOIN users verifier ON verifier.id=v.verifier_user_id WHERE v.guru_user_id=g.user_id AND v.status='ACCEPTED' AND verifier.identity_status='VERIFIED' AND verifier.suspended_at IS NULL) AS accepted_verified_endorsements,
  (SELECT count(*) FROM group_journeys gj JOIN pilgrimage_groups pg ON pg.id=gj.group_id WHERE pg.created_by=g.user_id AND gj.status='COMPLETED') AS completed_group_journeys,
  (SELECT count(DISTINCT jc.deeksha_type_id) FROM journey_completions jc WHERE jc.user_id=g.user_id AND jc.completion_status IN ('GROUP_CONFIRMED','TEMPLE_CONFIRMED','PLATFORM_VERIFIED')) AS traditions_completed,
  s.journey_xp, s.mentorship_xp, s.seva_xp
FROM guru_credentials g JOIN user_progress_summary s ON s.user_id=g.user_id;

-- Progression policy is data, rather than a hard-coded points ladder.
CREATE TABLE guru_level_requirements (
  level smallint PRIMARY KEY CHECK(level BETWEEN 1 AND 5), title text NOT NULL,
  minimum_verified_journeys smallint NOT NULL, minimum_completed_group_journeys smallint NOT NULL,
  minimum_mentored_swamis smallint NOT NULL, minimum_endorsements smallint NOT NULL,
  requires_training boolean NOT NULL DEFAULT false, requires_partner_review boolean NOT NULL DEFAULT false, policy_notes text NOT NULL
);
INSERT INTO guru_level_requirements VALUES
  (1,'Guide',18,0,0,5,true,false,'Community-verified Guide; enables group guidance after reviewed approval.'),
  (2,'Mentor',18,2,3,8,true,false,'Requires successful group journeys, mentoring record and reviewed approval.'),
  (3,'Senior Mentor',18,5,12,15,true,false,'Requires strong cross-tradition and community record with no unresolved violations.'),
  (4,'Community Guru',18,10,30,30,true,true,'Requires larger community coordination and verified temple/community partnership where applicable.'),
  (5,'Master Guide',18,20,75,50,true,true,'Requires long-term service, extensive mentorship and formal recognition.');

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY; ALTER TABLE journey_completions ENABLE ROW LEVEL SECURITY; ALTER TABLE mentorship_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE seva_contributions ENABLE ROW LEVEL SECURITY; ALTER TABLE progression_events ENABLE ROW LEVEL SECURITY; ALTER TABLE guru_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE guru_verifications ENABLE ROW LEVEL SECURITY; ALTER TABLE guru_review_decisions ENABLE ROW LEVEL SECURITY; ALTER TABLE role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_journeys ENABLE ROW LEVEL SECURITY; ALTER TABLE group_journey_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY profile_discovery ON user_profiles FOR SELECT USING (is_searchable OR user_id=app_user_id());
CREATE POLICY profile_update_self ON user_profiles FOR ALL USING (user_id=app_user_id()) WITH CHECK (user_id=app_user_id());
CREATE POLICY completion_self ON journey_completions FOR ALL USING (user_id=app_user_id()) WITH CHECK (user_id=app_user_id());
CREATE POLICY mentorship_participant ON mentorship_relationships FOR SELECT USING (mentor_user_id=app_user_id() OR mentee_user_id=app_user_id());
CREATE POLICY seva_owner ON seva_contributions FOR ALL USING (user_id=app_user_id()) WITH CHECK (user_id=app_user_id());
CREATE POLICY progression_owner ON progression_events FOR SELECT USING (user_id=app_user_id());
CREATE POLICY guru_public_read ON guru_credentials FOR SELECT USING (true);
CREATE POLICY guru_verification_participant ON guru_verifications FOR SELECT USING (guru_user_id=app_user_id() OR verifier_user_id=app_user_id());
CREATE POLICY guru_verification_submit ON guru_verifications FOR INSERT WITH CHECK (verifier_user_id=app_user_id());
CREATE POLICY role_assignment_self ON role_assignments FOR SELECT USING (user_id=app_user_id());
CREATE POLICY role_assignment_group_admin_create ON role_assignments FOR INSERT WITH CHECK (
  user_id=app_user_id() AND granted_by=app_user_id() AND scope_type='GROUP'
  AND role_id=(SELECT id FROM roles WHERE code='GROUP_ADMIN')
  AND EXISTS (SELECT 1 FROM pilgrimage_groups g WHERE g.id=scope_id AND g.created_by=app_user_id())
);
CREATE POLICY group_journey_visible ON group_journeys FOR SELECT USING (EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id=group_id AND gm.user_id=app_user_id()));
CREATE POLICY group_journey_members_visible ON group_journey_members FOR SELECT USING (EXISTS (SELECT 1 FROM group_journeys gj JOIN group_members gm ON gm.group_id=gj.group_id WHERE gj.id=group_journey_id AND gm.user_id=app_user_id()));

CREATE OR REPLACE FUNCTION has_permission(subject_user_id uuid, permission_code text, requested_scope_type text DEFAULT 'GLOBAL', requested_scope_id uuid DEFAULT NULL)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.role_assignments ra JOIN public.roles r ON r.id=ra.role_id JOIN public.role_permissions rp ON rp.role_id=r.id JOIN public.permissions p ON p.id=rp.permission_id
    WHERE ra.user_id=subject_user_id AND ra.revoked_at IS NULL AND (ra.expires_at IS NULL OR ra.expires_at>now()) AND p.code=permission_code
      AND (ra.scope_type='GLOBAL' OR (ra.scope_type=requested_scope_type AND ra.scope_id IS NOT DISTINCT FROM requested_scope_id))
  )
$$;
REVOKE ALL ON FUNCTION has_permission(uuid,text,text,uuid) FROM PUBLIC;

CREATE OR REPLACE FUNCTION search_public_profiles(search_term text, page_size integer DEFAULT 20)
RETURNS TABLE(user_id uuid, public_handle citext, display_name text, city text, state text, avatar_url text, guru_level smallint, sadguru_status text, journey_xp integer, mentorship_xp integer, seva_xp integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public AS $$
  SELECT p.user_id, p.public_handle, u.display_name, p.city, p.state, p.avatar_url, coalesce(g.guru_level,0), coalesce(g.sadguru_status,'NONE'), coalesce(s.journey_xp,0), coalesce(s.mentorship_xp,0), coalesce(s.seva_xp,0)
  FROM public.user_profiles p JOIN public.users u ON u.id=p.user_id
  LEFT JOIN public.guru_credentials g ON g.user_id=p.user_id LEFT JOIN public.user_progress_summary s ON s.user_id=p.user_id
  WHERE p.is_searchable AND u.is_active AND u.suspended_at IS NULL AND u.deleted_at IS NULL
    AND (coalesce(search_term,'')='' OR p.search_document @@ websearch_to_tsquery('simple',search_term) OR p.public_handle::text % search_term)
  ORDER BY CASE WHEN p.public_handle::text ILIKE search_term || '%' THEN 0 ELSE 1 END, ts_rank(p.search_document,websearch_to_tsquery('simple',coalesce(search_term,''))) DESC, p.public_handle
  LIMIT LEAST(GREATEST(page_size,1),50)
$$;
REVOKE ALL ON FUNCTION search_public_profiles(text,integer) FROM PUBLIC;

CREATE OR REPLACE FUNCTION reject_unverified_guru_endorsement() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status='ACCEPTED' AND NOT EXISTS (SELECT 1 FROM users WHERE id=NEW.verifier_user_id AND identity_status='VERIFIED' AND suspended_at IS NULL AND deleted_at IS NULL) THEN
    RAISE EXCEPTION 'Only an active identity-verified individual can endorse a Guru Swamy';
  END IF;
  IF NEW.status IN ('ACCEPTED','REJECTED') THEN NEW.decided_at=now(); END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER guru_verification_guard BEFORE INSERT OR UPDATE ON guru_verifications FOR EACH ROW EXECUTE FUNCTION reject_unverified_guru_endorsement();
