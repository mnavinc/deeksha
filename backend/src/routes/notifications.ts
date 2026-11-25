import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { withUser } from '../db.js';
import {
  enqueueNotification,
  type NotificationActionType,
} from '../workers/notificationWorker.js';

const pushTokenSchema = z.object({
  token: z.string().trim().min(10).max(512),
  platform: z.enum(['android', 'ios', 'web']),
  deviceId: z.string().trim().max(128).optional(),
});

const triggerSchema = z.object({
  actionType: z.enum([
    'welcome',
    'qr_joined',
    'checkin_completed',
    'journey_update',
    'group_member_added',
    'group_expense_added',
    'group_announcement',
    'profile_incomplete_nudge',
    'daily_morning_sandhya',
    'daily_evening_checkin',
    'custom_reminder',
  ]),
  title: z.string().trim().min(1).max(160).optional(),
  body: z.string().trim().min(1).max(500).optional(),
  delaySeconds: z.number().int().min(0).max(7 * 24 * 3600).default(0),
  data: z.record(z.unknown()).optional(),
});

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(30),
  unreadOnly: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
});

const idParamSchema = z.object({
  id: z.string().uuid(),
});

export async function notificationRoutes(app: FastifyInstance) {
  /**
   * POST /v1/notifications/push-token
   * Registers or refreshes an Expo / Web push token for the authenticated user.
   */
  app.post(
    '/v1/notifications/push-token',
    { onRequest: [app.authenticate] },
    async (request) => {
      const userId = request.user.sub;
      const body = pushTokenSchema.parse(request.body);

      const saved = await withUser(userId, async (db) => {
        const res = await db.query(
          `INSERT INTO user_push_tokens (user_id, token, platform, device_id, updated_at)
           VALUES ($1, $2, $3, $4, now())
           ON CONFLICT (user_id, token) DO UPDATE
           SET platform = EXCLUDED.platform,
               device_id = COALESCE(EXCLUDED.device_id, user_push_tokens.device_id),
               updated_at = now()
           RETURNING id, platform, device_id, created_at, updated_at`,
          [userId, body.token, body.platform, body.deviceId ?? null]
        );
        return res.rows[0];
      });

      return { ok: true, pushToken: saved };
    }
  );

  /**
   * GET /v1/notifications
   * Returns persisted notifications and unread count for the authenticated user.
   */
  app.get(
    '/v1/notifications',
    { onRequest: [app.authenticate] },
    async (request) => {
      const userId = request.user.sub;
      const query = listQuerySchema.parse(request.query);

      return withUser(userId, async (db) => {
        const filterSql = query.unreadOnly ? 'AND read_at IS NULL' : '';
        const listRes = await db.query(
          `SELECT id, category, title, body, data, channel, status, scheduled_for, sent_at, read_at, created_at
           FROM app_notifications
           WHERE user_id = $1 ${filterSql}
           ORDER BY created_at DESC
           LIMIT $2`,
          [userId, query.limit]
        );
        const countRes = await db.query<{ count: string }>(
          `SELECT COUNT(*)::text AS count
           FROM app_notifications
           WHERE user_id = $1 AND read_at IS NULL`,
          [userId]
        );

        return {
          notifications: listRes.rows,
          unreadCount: Number(countRes.rows[0]?.count ?? 0),
        };
      });
    }
  );

  /**
   * PATCH /v1/notifications/:id/read
   * Marks a single notification as read.
   */
  app.patch(
    '/v1/notifications/:id/read',
    { onRequest: [app.authenticate] },
    async (request, reply) => {
      const userId = request.user.sub;
      const { id } = idParamSchema.parse(request.params);

      const updated = await withUser(userId, async (db) => {
        const res = await db.query(
          `UPDATE app_notifications
           SET read_at = COALESCE(read_at, now())
           WHERE id = $1 AND user_id = $2
           RETURNING id, read_at`,
          [id, userId]
        );
        return res.rows[0] ?? null;
      });

      if (!updated) {
        return reply.status(404).send({
          error: 'NOT_FOUND',
          message: 'Notification not found',
          requestId: request.id,
        });
      }

      return { ok: true, notification: updated };
    }
  );

  /**
   * POST /v1/notifications/read-all
   * Marks all unread notifications for the user as read.
   */
  app.post(
    '/v1/notifications/read-all',
    { onRequest: [app.authenticate] },
    async (request) => {
      const userId = request.user.sub;

      const updatedCount = await withUser(userId, async (db) => {
        const res = await db.query(
          `UPDATE app_notifications
           SET read_at = now()
           WHERE user_id = $1 AND read_at IS NULL`,
          [userId]
        );
        return res.rowCount ?? 0;
      });

      return { ok: true, updatedCount };
    }
  );

  /**
   * POST /v1/notifications/trigger
   * Enqueues an action-based or delayed time-based notification in BullMQ.
   */
  app.post(
    '/v1/notifications/trigger',
    { onRequest: [app.authenticate] },
    async (request) => {
      const userId = request.user.sub;
      const body = triggerSchema.parse(request.body);

      const result = await enqueueNotification(
        {
          userId,
          actionType: body.actionType as NotificationActionType,
          title: body.title,
          body: body.body,
          data: body.data,
        },
        {
          delayMs: body.delaySeconds > 0 ? body.delaySeconds * 1000 : undefined,
        }
      );

      return {
        ok: true,
        queued: result.queued,
        jobId: result.jobId ?? null,
      };
    }
  );
}
