import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { one, withUser } from '../db.js';

const enrollmentCreateSchema = z.object({
  deekshaTypeId: z.enum([
    'ayyappa',
    'bhavani',
    'govinda',
    'shiva',
    'hanuman',
    'nookambika',
  ]),
  templeId: z.string().uuid().optional(),
  malaDharanamDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  durationDays: z.number().int().min(1).max(365),
  targetYatraDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD')
    .optional(),
  pilgrimageCount: z.number().int().positive(),
});

const dailyLogSchema = z.object({
  logDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  checkpoints: z.record(z.string(), z.boolean()),
  walkingKm: z.number().min(0).max(200).default(0),
  saranamCount: z.number().int().min(0).max(10000).default(0),
  notes: z.string().max(2000).optional(),
  version: z.number().int().positive().optional(),
});

export async function enrollmentRoutes(app: FastifyInstance) {
  /**
   * GET /v1/enrollments/active
   * Retrieves the current user's active or paused enrollment
   */
  app.get('/v1/enrollments/active', { onRequest: [app.authenticate] }, async (request) => {
    return withUser(request.user.sub, async (db) => {
      const result = await db.query(
        `SELECT e.*, t.display_name, t.rules
         FROM deeksha_enrollments e
         JOIN deeksha_types t ON t.id = e.deeksha_type_id
         WHERE e.user_id = $1 AND e.status IN ('ACTIVE', 'PAUSED')`,
        [request.user.sub]
      );
      return result.rows[0] ?? null;
    });
  });

  /**
   * POST /v1/enrollments
   * Creates a new deeksha enrollment for the current user
   */
  app.post('/v1/enrollments', { onRequest: [app.authenticate] }, async (request) => {
    const body = enrollmentCreateSchema.parse(request.body);
    return withUser(request.user.sub, async (db) =>
      one(
        db,
        `INSERT INTO deeksha_enrollments(
           user_id, deeksha_type_id, temple_id, mala_dharanam_date,
           duration_days, target_yatra_date, pilgrimage_count
         ) VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          request.user.sub,
          body.deekshaTypeId,
          body.templeId ?? null,
          body.malaDharanamDate,
          body.durationDays,
          body.targetYatraDate ?? null,
          body.pilgrimageCount,
        ]
      )
    );
  });

  /**
   * PUT /v1/enrollments/:id/logs
   * Upserts a daily check-in log with optimistic concurrency support
   */
  app.put('/v1/enrollments/:id/logs', { onRequest: [app.authenticate] }, async (request) => {
    const id = z.string().uuid().parse((request.params as { id: string }).id);
    const body = dailyLogSchema.parse(request.body);

    return withUser(request.user.sub, async (db) =>
      one(
        db,
        `INSERT INTO daily_logs(
           enrollment_id, log_date, checkpoints, walking_km, saranam_count, notes
         ) VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (enrollment_id, log_date) DO UPDATE SET
           checkpoints = EXCLUDED.checkpoints,
           walking_km = EXCLUDED.walking_km,
           saranam_count = EXCLUDED.saranam_count,
           notes = EXCLUDED.notes,
           version = daily_logs.version + 1
         WHERE daily_logs.version = $7 OR $7 IS NULL
         RETURNING *`,
        [
          id,
          body.logDate,
          body.checkpoints,
          body.walkingKm,
          body.saranamCount,
          body.notes ?? null,
          body.version ?? null,
        ]
      )
    );
  });
}
