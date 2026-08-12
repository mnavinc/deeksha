CREATE TABLE user_follows (
  follower_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, followed_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(follower_user_id,followed_user_id), CHECK(follower_user_id<>followed_user_id)
);
CREATE INDEX user_follows_followed_idx ON user_follows(followed_user_id,created_at DESC);
CREATE TABLE profile_recommendations (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, recommended_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason text NOT NULL CHECK(reason IN ('SAME_TRADITION','NEARBY','MUTUAL_GROUP','GURU_MATCH','COMMUNITY_MATCH')),
  score numeric(6,3) NOT NULL DEFAULT 0, generated_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz,
  PRIMARY KEY(user_id,recommended_user_id), CHECK(user_id<>recommended_user_id)
);
CREATE TABLE group_membership_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), group_id uuid NOT NULL REFERENCES pilgrimage_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id), requested_by uuid NOT NULL REFERENCES users(id), status text NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','APPROVED','REJECTED','CANCELLED')),
  reviewed_by uuid REFERENCES users(id), reviewed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(group_id,user_id)
);
CREATE TABLE group_guru_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), group_id uuid NOT NULL UNIQUE REFERENCES pilgrimage_groups(id) ON DELETE CASCADE,
  guru_user_id uuid NOT NULL REFERENCES users(id), status text NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','APPROVED','REJECTED','REVOKED')),
  proposed_by uuid NOT NULL REFERENCES users(id), approved_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE group_guru_votes (
  assignment_id uuid NOT NULL REFERENCES group_guru_assignments(id) ON DELETE CASCADE, voter_user_id uuid NOT NULL REFERENCES users(id),
  vote text NOT NULL CHECK(vote IN ('APPROVE','REJECT')), created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(assignment_id,voter_user_id)
);
CREATE INDEX group_guru_votes_assignment_idx ON group_guru_votes(assignment_id,vote);
CREATE OR REPLACE FUNCTION refresh_group_guru_status() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE needed integer; approved integer; rejected integer;
BEGIN
  SELECT count(*) INTO needed FROM group_members gm JOIN group_guru_assignments a ON a.group_id=gm.group_id WHERE a.id=NEW.assignment_id AND gm.user_id<>a.guru_user_id;
  SELECT count(*) FILTER(WHERE vote='APPROVE'), count(*) FILTER(WHERE vote='REJECT') INTO approved,rejected FROM group_guru_votes WHERE assignment_id=NEW.assignment_id;
  UPDATE group_guru_assignments SET status=CASE WHEN rejected>0 THEN 'REJECTED' WHEN needed>0 AND approved=needed THEN 'APPROVED' ELSE 'PENDING' END, approved_at=CASE WHEN needed>0 AND approved=needed THEN now() ELSE NULL END WHERE id=NEW.assignment_id;
  RETURN NEW;
END $$;
CREATE TRIGGER group_guru_vote_status AFTER INSERT OR UPDATE ON group_guru_votes FOR EACH ROW EXECUTE FUNCTION refresh_group_guru_status();
CREATE TABLE group_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), group_id uuid NOT NULL REFERENCES pilgrimage_groups(id) ON DELETE CASCADE,
  author_user_id uuid NOT NULL REFERENCES users(id), body text NOT NULL CHECK(char_length(body) BETWEEN 1 AND 4000),
  message_type text NOT NULL DEFAULT 'NOTE' CHECK(message_type IN ('NOTE','ANNOUNCEMENT','SYSTEM')),
  reply_to_id uuid REFERENCES group_messages(id), created_at timestamptz NOT NULL DEFAULT now(), edited_at timestamptz, deleted_at timestamptz
);
CREATE INDEX group_messages_timeline_idx ON group_messages(group_id,created_at DESC) WHERE deleted_at IS NULL;
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, type text NOT NULL,
  title text NOT NULL, body text NOT NULL, data jsonb NOT NULL DEFAULT '{}'::jsonb, read_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notifications_inbox_idx ON notifications(user_id,created_at DESC) WHERE read_at IS NULL;
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY; ALTER TABLE profile_recommendations ENABLE ROW LEVEL SECURITY; ALTER TABLE group_membership_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_guru_assignments ENABLE ROW LEVEL SECURITY; ALTER TABLE group_guru_votes ENABLE ROW LEVEL SECURITY; ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY; ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY follows_owner ON user_follows FOR ALL USING(follower_user_id=app_user_id()) WITH CHECK(follower_user_id=app_user_id());
CREATE POLICY recommendations_owner ON profile_recommendations FOR SELECT USING(user_id=app_user_id());
CREATE POLICY membership_request_visible ON group_membership_requests FOR SELECT USING(user_id=app_user_id() OR EXISTS(SELECT 1 FROM pilgrimage_groups g WHERE g.id=group_id AND g.created_by=app_user_id()));
CREATE POLICY messages_member_read ON group_messages FOR SELECT USING(EXISTS(SELECT 1 FROM group_members gm WHERE gm.group_id=group_id AND gm.user_id=app_user_id()));
CREATE POLICY messages_member_send ON group_messages FOR INSERT WITH CHECK(author_user_id=app_user_id() AND EXISTS(SELECT 1 FROM group_members gm WHERE gm.group_id=group_id AND gm.user_id=app_user_id()));
CREATE POLICY notifications_owner ON notifications FOR SELECT USING(user_id=app_user_id());
