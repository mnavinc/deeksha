import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { one, withUser } from '../db.js';

const publicProfileSchema = z.object({
  handle: z
    .string()
    .trim()
    .min(3)
    .max(40)
    .regex(/^[a-z0-9_]+$/i, 'Handle can only contain alphanumeric characters and underscores'),
  bio: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  avatarUrl: z.string().url().optional(),
  isSearchable: z.boolean().default(false),
  showJourneyStats: z.boolean().default(true),
  showMentorStats: z.boolean().default(true),
});

const endorsementSchema = z.object({
  statement: z.string().trim().min(20).max(1000),
});

export async function communityRoutes(app: FastifyInstance) {
  /**
   * GET /v1/profiles/search
   * Searches public devotee profiles matching query term
   */
  app.get('/v1/profiles/search', { onRequest: [app.authenticate] }, async (request) => {
    const q = z.string().max(100).catch('').parse((request.query as { q?: string }).q);
    const limit = z
      .coerce
      .number()
      .int()
      .min(1)
      .max(50)
      .catch(20)
      .parse((request.query as { limit?: string }).limit);

    return withUser(request.user.sub, async (db) => {
      const result = await db.query('SELECT * FROM search_public_profiles($1, $2)', [q, limit]);
      return result.rows;
    });
  });

  /**
   * PUT /v1/profiles/public
   * Creates or updates devotee's searchable public spiritual profile
   */
  app.put('/v1/profiles/public', { onRequest: [app.authenticate] }, async (request) => {
    const body = publicProfileSchema.parse(request.body);
    return withUser(request.user.sub, async (db) =>
      one(
        db,
        `INSERT INTO user_profiles(
           user_id, public_handle, bio, city, state, avatar_url,
           is_searchable, show_journey_stats, show_mentor_stats
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (user_id) DO UPDATE SET
           public_handle = EXCLUDED.public_handle,
           bio = EXCLUDED.bio,
           city = EXCLUDED.city,
           state = EXCLUDED.state,
           avatar_url = EXCLUDED.avatar_url,
           is_searchable = EXCLUDED.is_searchable,
           show_journey_stats = EXCLUDED.show_journey_stats,
           show_mentor_stats = EXCLUDED.show_mentor_stats
         RETURNING *`,
        [
          request.user.sub,
          body.handle,
          body.bio ?? null,
          body.city ?? null,
          body.state ?? null,
          body.avatarUrl ?? null,
          body.isSearchable,
          body.showJourneyStats,
          body.showMentorStats,
        ]
      )
    );
  });

  /**
   * POST /v1/guru/application
   * Initiates Guru Swamy credential review process
   */
  app.post('/v1/guru/application', { onRequest: [app.authenticate] }, async (request) => {
    return withUser(request.user.sub, async (db) =>
      one(
        db,
        `INSERT INTO guru_credentials (user_id, status)
         VALUES ($1, 'APPLIED')
         ON CONFLICT (user_id) DO UPDATE SET
           status = CASE
             WHEN guru_credentials.status IN ('NONE', 'REVOKED') THEN 'APPLIED'
             ELSE guru_credentials.status
           END
         RETURNING user_id, status, guru_level, sadguru_status`,
        [request.user.sub]
      )
    );
  });

  /**
   * POST /v1/guru/:userId/endorsements
   * Submits a community endorsement/verification for a prospective Guru
   */
  app.post('/v1/guru/:userId/endorsements', { onRequest: [app.authenticate] }, async (request) => {
    const targetUserId = z.string().uuid().parse((request.params as { userId: string }).userId);
    const body = endorsementSchema.parse(request.body);

    return withUser(request.user.sub, async (db) =>
      one(
        db,
        `INSERT INTO guru_verifications (guru_user_id, verifier_user_id, status, statement)
         VALUES ($1, $2, 'ACCEPTED', $3)
         ON CONFLICT (guru_user_id, verifier_user_id) DO UPDATE SET
           status = 'ACCEPTED',
           statement = EXCLUDED.statement,
           decided_at = now()
         RETURNING id, guru_user_id, verifier_user_id, status, decided_at`,
        [targetUserId, request.user.sub, body.statement]
      )
    );
  });

  /**
   * GET /v1/guru/me/readiness
   * Queries Guru readiness status view
   */
  app.get('/v1/guru/me/readiness', { onRequest: [app.authenticate] }, async (request) => {
    return withUser(request.user.sub, async (db) =>
      one(db, 'SELECT * FROM guru_readiness WHERE user_id = $1', [request.user.sub])
    );
  });
}
