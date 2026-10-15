import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { one, withUser } from '../db.js';

const profileUpdateSchema = z.object({
  displayName: z.string().trim().min(1).max(100),
  language: z.enum(['en', 'te', 'ml']).default('en'),
});

export async function meRoutes(app: FastifyInstance) {
  /**
   * GET /v1/me
   * Returns authenticated user profile details
   */
  app.get('/v1/me', { onRequest: [app.authenticate] }, async (request) => {
    return withUser(request.user.sub, async (db) =>
      one(
        db,
        'SELECT id, external_auth_id, email, display_name, language, created_at FROM users WHERE id = $1',
        [request.user.sub]
      )
    );
  });

  /**
   * PUT /v1/me
   * Updates authenticated user profile details
   */
  app.put('/v1/me', { onRequest: [app.authenticate] }, async (request) => {
    const body = profileUpdateSchema.parse(request.body);
    return withUser(request.user.sub, async (db) =>
      one(
        db,
        `INSERT INTO users(id, external_auth_id, email, display_name, language)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT(id) DO UPDATE SET
           display_name = EXCLUDED.display_name,
           language = EXCLUDED.language,
           email = COALESCE(EXCLUDED.email, users.email)
         RETURNING id, display_name, language`,
        [
          request.user.sub,
          request.user.sub,
          request.user.email ?? null,
          body.displayName,
          body.language,
        ]
      )
    );
  });
}
