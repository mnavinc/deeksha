import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { one, withUser } from '../db.js';

const groupInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  season: z.string().trim().min(1).max(80),
  route: z.string().trim().max(200).optional(),
});

const expenseInputSchema = z
  .object({
    groupId: z.string().uuid(),
    category: z.string().trim().min(1).max(60),
    description: z.string().trim().min(1).max(500),
    amountPaise: z.number().int().positive(),
    expenseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
    splitType: z.enum(['EQUAL', 'EXACT', 'PERCENTAGE', 'SHARES', 'SELECTED']).default('EQUAL'),
    participants: z
      .array(
        z.object({
          userId: z.string().uuid(),
          sharePaise: z.number().int().min(0),
        })
      )
      .min(1),
  })
  .superRefine((v, ctx) => {
    const totalShares = v.participants.reduce((sum, p) => sum + p.sharePaise, 0);
    if (totalShares !== v.amountPaise) {
      ctx.addIssue({
        code: 'custom',
        message: `Participant shares (${totalShares}) must equal total amountPaise (${v.amountPaise})`,
      });
    }
  });

export async function groupRoutes(app: FastifyInstance) {
  /**
   * GET /v1/groups
   * Lists pilgrimage groups the authenticated user belongs to
   */
  app.get('/v1/groups', { onRequest: [app.authenticate] }, async (request) => {
    return withUser(request.user.sub, async (db) => {
      const result = await db.query(
        `SELECT g.*, json_agg(
           json_build_object(
             'userId', m.user_id,
             'role', m.role,
             'name', u.display_name
           )
         ) AS members
         FROM pilgrimage_groups g
         JOIN group_members m ON m.group_id = g.id
         JOIN users u ON u.id = m.user_id
         GROUP BY g.id
         ORDER BY g.created_at DESC`
      );
      return result.rows;
    });
  });

  /**
   * POST /v1/groups
   * Creates a new pilgrimage group with the caller as GROUP_ADMIN
   */
  app.post('/v1/groups', { onRequest: [app.authenticate] }, async (request) => {
    const body = groupInputSchema.parse(request.body);
    return withUser(request.user.sub, async (db) => {
      const group = await one<{ id: string; name: string; season: string; route: string | null }>(
        db,
        `INSERT INTO pilgrimage_groups (name, season, route, created_by)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, season, route`,
        [body.name, body.season, body.route ?? null, request.user.sub]
      );

      await db.query(
        `INSERT INTO group_members (group_id, user_id, role)
         VALUES ($1, $2, 'GROUP_ADMIN')`,
        [group.id, request.user.sub]
      );

      await db.query(
        `INSERT INTO role_assignments (user_id, role_id, scope_type, scope_id, granted_by)
         SELECT $1, id, 'GROUP', $2, $1 FROM roles WHERE code = 'GROUP_ADMIN'`,
        [request.user.sub, group.id]
      );

      return group;
    });
  });

  /**
   * POST /v1/expenses
   * Logs a shared expense with automated split calculation and audit event logging
   */
  app.post('/v1/expenses', { onRequest: [app.authenticate] }, async (request) => {
    const body = expenseInputSchema.parse(request.body);
    return withUser(request.user.sub, async (db) => {
      const expense = await one<{ id: string; group_id: string; amount_paise: string }>(
        db,
        `INSERT INTO expenses (
           group_id, created_by, payer_user_id, category, description,
           amount_paise, expense_date, split_type
         ) VALUES ($1, $2, $2, $3, $4, $5, $6, $7)
         RETURNING id, group_id, amount_paise`,
        [
          body.groupId,
          request.user.sub,
          body.category,
          body.description,
          body.amountPaise,
          body.expenseDate,
          body.splitType,
        ]
      );

      for (const participant of body.participants) {
        await db.query(
          `INSERT INTO expense_participants (expense_id, user_id, share_paise)
           VALUES ($1, $2, $3)`,
          [expense.id, participant.userId, participant.sharePaise]
        );
      }

      await db.query(
        `INSERT INTO audit_events (actor_user_id, entity_type, entity_id, action, after_value)
         VALUES ($1, 'expense', $2, 'created', $3)`,
        [request.user.sub, expense.id, JSON.stringify(body)]
      );

      return expense;
    });
  });
}
