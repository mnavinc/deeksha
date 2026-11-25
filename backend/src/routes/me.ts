import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { one, withUser } from '../db.js';

const profileUpdateSchema = z.object({
  displayName: z.string().trim().min(1).max(100),
  language: z.enum(['en', 'te', 'ml']).default('en'),
  email: z.string().trim().email().toLowerCase().optional().nullable(),
  phone: z
    .string()
    .trim()
    .regex(/^[+\d\s()-]{7,20}$/, 'Invalid phone number')
    .optional()
    .nullable(),
  newsletterSubscribed: z.boolean().optional(),
  acceptedTerms: z.boolean().optional(),
});

export async function meRoutes(app: FastifyInstance) {
  /**
   * GET /v1/me
   * Returns authenticated user profile details (including mobile & email profile info)
   */
  app.get('/v1/me', { onRequest: [app.authenticate] }, async (request) => {
    return withUser(request.user.sub, async (db) =>
      one(
        db,
        `SELECT id, external_auth_id, email, phone, display_name, language,
                auth_provider, email_verified, newsletter_subscribed, accepted_terms_at, created_at
         FROM users WHERE id = $1`,
        [request.user.sub]
      )
    );
  });

  /**
   * PUT /v1/me
   * Updates authenticated user profile details (name, language, email, phone, newsletter)
   */
  app.put('/v1/me', { onRequest: [app.authenticate] }, async (request) => {
    const body = profileUpdateSchema.parse(request.body);
    return withUser(request.user.sub, async (db) =>
      one(
        db,
        `INSERT INTO users(id, external_auth_id, email, phone, display_name, language, newsletter_subscribed, accepted_terms_at)
         VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, false), CASE WHEN $8 THEN now() ELSE NULL END)
         ON CONFLICT(id) DO UPDATE SET
           display_name = EXCLUDED.display_name,
           language = EXCLUDED.language,
           email = COALESCE(EXCLUDED.email, users.email),
           phone = COALESCE(EXCLUDED.phone, users.phone),
           newsletter_subscribed = COALESCE($7, users.newsletter_subscribed),
           accepted_terms_at = COALESCE(users.accepted_terms_at, EXCLUDED.accepted_terms_at)
         RETURNING id, email, phone, display_name, language, newsletter_subscribed, accepted_terms_at`,
        [
          request.user.sub,
          request.user.sub,
          body.email ?? request.user.email ?? null,
          body.phone ?? null,
          body.displayName,
          body.language,
          body.newsletterSubscribed ?? null,
          Boolean(body.acceptedTerms),
        ]
      )
    );
  });
}
