import { Queue, Worker, type Job } from 'bullmq';
import { Redis } from 'ioredis';
import type { Server as SocketIOServer } from 'socket.io';
import { env } from '../config.js';
import { pool } from '../db.js';

export const NOTIFICATION_QUEUE_NAME = 'swamiseva-notifications';

export type NotificationActionType =
  | 'welcome'
  | 'qr_joined'
  | 'checkin_completed'
  | 'journey_update'
  | 'group_member_added'
  | 'group_expense_added'
  | 'group_announcement'
  | 'profile_incomplete_nudge'
  | 'daily_morning_sandhya'
  | 'daily_evening_checkin'
  | 'custom_reminder';

export interface NotificationJobPayload {
  userId?: string;
  targetUserIds?: string[];
  actionType: NotificationActionType;
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
}

let redisConnection: Redis | null = null;
let notificationQueue: Queue<NotificationJobPayload> | null = null;
let notificationWorker: Worker<NotificationJobPayload> | null = null;
let fallbackInterval: ReturnType<typeof setInterval> | null = null;
let lastMorningRunDate = '';
let lastEveningRunDate = '';
let lastNudgeRunSlot = '';
let socketServer: SocketIOServer | null = null;

export function attachNotificationSocketIO(io: SocketIOServer): void {
  socketServer = io;
}

function buildDefaultContent(payload: NotificationJobPayload): {
  title: string;
  body: string;
  category: string;
} {
  const meta = payload.data ?? {};
  switch (payload.actionType) {
    case 'welcome':
      return {
        category: 'welcome',
        title: payload.title ?? '🙏 Welcome to Swamiseva Deeksha Journey!',
        body:
          payload.body ??
          `Swamiye Saranam Ayyappa, ${String(meta.name ?? 'Swami')}! Your sacred Vrutham & Sannidhanam notifications are active.`,
      };
    case 'qr_joined':
      return {
        category: 'sannidhanam_qr',
        title: payload.title ?? 'Swamiye Saranam Ayyappa — Joined Sannidhanam',
        body:
          payload.body ??
          `Welcome to ${String(meta.sannidhanamName ?? 'your Sannidhanam')}! Complete your Name & Phone in Profile to unlock points.`,
      };
    case 'checkin_completed':
      return {
        category: 'deeksha_checkin',
        title: payload.title ?? 'Daily Deeksha Check-in Recorded',
        body:
          payload.body ??
          `Day ${String(meta.day ?? '')} check-in complete (+${String(meta.points ?? 10)} pts). Swamiye Saranam Ayyappa!`,
      };
    case 'journey_update':
      return {
        category: 'journey_update',
        title: payload.title ?? `🗺️ Journey Milestone: ${String(meta.milestone ?? 'Unlocked')}`,
        body:
          payload.body ??
          `You reached ${String(meta.milestone ?? 'a new Yatra checkpoint')} on your Deeksha Journey!`,
      };
    case 'group_member_added':
      return {
        category: 'group_member',
        title: payload.title ?? `👥 New Member in ${String(meta.groupName ?? 'Sannidhanam')}`,
        body:
          payload.body ??
          `${String(meta.memberName ?? 'A Swami')} was added to ${String(meta.groupName ?? 'your Sannidhanam group')}.`,
      };
    case 'group_expense_added':
      return {
        category: 'group_expense',
        title: payload.title ?? `New Expense in ${String(meta.groupName ?? 'Sannidhanam')}`,
        body:
          payload.body ??
          `${String(meta.addedBy ?? 'A member')} added ₹${String(meta.amount ?? 0)}.`,
      };
    case 'group_announcement':
      return {
        category: 'group_announcement',
        title: payload.title ?? `Sannidhanam Update: ${String(meta.groupName ?? 'Group')}`,
        body: payload.body ?? String(meta.message ?? 'New announcement posted.'),
      };
    case 'profile_incomplete_nudge':
      return {
        category: 'profile_nudge',
        title: payload.title ?? 'Complete Your Swamiseva Profile',
        body:
          payload.body ??
          'Add your Name and Phone Number in Profile to earn points and unlock full Sannidhanam features.',
      };
    case 'daily_morning_sandhya':
      return {
        category: 'time_morning',
        title: payload.title ?? 'Morning Sandhya & Sunrise Reminder',
        body:
          payload.body ??
          'Begin your morning bath, Pooja, and Saranam chanting before sunrise.',
      };
    case 'daily_evening_checkin':
      return {
        category: 'time_evening',
        title: payload.title ?? '7:00 PM Deeksha Check-in Reminder',
        body:
          payload.body ??
          'Record your evening prayer, Japamala count, and daily Deeksha checklist.',
      };
    case 'custom_reminder':
    default:
      return {
        category: 'reminder',
        title: payload.title ?? 'Swamiseva Reminder',
        body: payload.body ?? 'Time for your scheduled Deeksha practice.',
      };
  }
}

async function sendExpoPushMessages(
  tokens: string[],
  title: string,
  body: string,
  data: Record<string, unknown>
): Promise<boolean> {
  const expoTokens = tokens.filter(
    (t) => t.startsWith('ExponentPushToken[') || t.startsWith('ExpoPushToken[')
  );
  if (expoTokens.length === 0) return false;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (env.EXPO_ACCESS_TOKEN) {
    headers.Authorization = `Bearer ${env.EXPO_ACCESS_TOKEN}`;
  }

  const messages = expoTokens.map((to) => ({
    to,
    sound: 'default',
    title,
    body,
    data,
  }));

  const res = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers,
    body: JSON.stringify(messages),
  });
  return res.ok;
}

async function dispatchToUsers(
  userIds: string[],
  category: string,
  title: string,
  body: string,
  data: Record<string, unknown>
): Promise<number> {
  if (userIds.length === 0) return 0;

  let delivered = 0;
  for (const uid of userIds) {
    const tokenRows = await pool.query<{ token: string }>(
      'SELECT token FROM user_push_tokens WHERE user_id = $1',
      [uid]
    );
    const tokens = tokenRows.rows.map((r) => r.token);
    const hasPush = tokens.length > 0;

    let pushSent = false;
    if (hasPush) {
      try {
        pushSent = await sendExpoPushMessages(tokens, title, body, data);
      } catch {
        pushSent = false;
      }
    }

    const channel = pushSent ? 'both' : 'in_app';
    const inserted = await pool.query(
      `INSERT INTO app_notifications (user_id, category, title, body, data, channel, status, sent_at)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6, 'sent', now())
       RETURNING id, user_id, category, title, body, data, channel, status, sent_at, read_at, created_at`,
      [uid, category, title, body, JSON.stringify(data), channel]
    );

    const record = inserted.rows[0];
    if (socketServer && record) {
      socketServer.to(`user:${uid}`).emit('notification:new', record);
    }
    delivered += 1;
  }
  return delivered;
}

async function resolveTimeBasedRecipients(actionType: NotificationActionType): Promise<string[]> {
  if (actionType === 'profile_incomplete_nudge') {
    const res = await pool.query<{ id: string }>(
      `SELECT id FROM users
       WHERE (display_name IS NULL OR trim(display_name) = '' OR display_name = 'Swami')
          OR (phone IS NULL OR trim(phone) = '')
       LIMIT 500`
    );
    return res.rows.map((r) => r.id);
  }

  if (actionType === 'daily_morning_sandhya' || actionType === 'daily_evening_checkin') {
    const res = await pool.query<{ user_id: string }>(
      `SELECT DISTINCT user_id FROM deeksha_enrollments WHERE status = 'ACTIVE' LIMIT 1000`
    );
    return res.rows.map((r) => r.user_id);
  }

  return [];
}

export async function processNotificationJob(job: Job<NotificationJobPayload>): Promise<number> {
  const payload = job.data;
  const { title, body, category } = buildDefaultContent(payload);
  const data = payload.data ?? {};

  let recipients: string[] = [];
  if (payload.targetUserIds && payload.targetUserIds.length > 0) {
    recipients = Array.from(new Set(payload.targetUserIds));
  } else if (payload.userId) {
    recipients = [payload.userId];
  } else {
    recipients = await resolveTimeBasedRecipients(payload.actionType);
  }

  return dispatchToUsers(recipients, category, title, body, {
    ...data,
    actionType: payload.actionType,
  });
}

function startInProcessFallbackScheduler(): void {
  if (fallbackInterval || env.NODE_ENV === 'test') return;
  fallbackInterval = setInterval(() => {
    const now = new Date();
    const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
    const dateKey = ist.toISOString().slice(0, 10);
    const hour = ist.getUTCHours();
    const minute = ist.getUTCMinutes();

    if (hour === 6 && minute === 0 && lastMorningRunDate !== dateKey) {
      lastMorningRunDate = dateKey;
      void dispatchPayloadInProcess({ actionType: 'daily_morning_sandhya' });
    }
    if (hour === 19 && minute === 0 && lastEveningRunDate !== dateKey) {
      lastEveningRunDate = dateKey;
      void dispatchPayloadInProcess({ actionType: 'daily_evening_checkin' });
    }
    const nudgeSlot = `${dateKey}-${Math.floor(hour / 6)}`;
    if (hour % 6 === 0 && minute === 0 && lastNudgeRunSlot !== nudgeSlot) {
      lastNudgeRunSlot = nudgeSlot;
      void dispatchPayloadInProcess({ actionType: 'profile_incomplete_nudge' });
    }
  }, 60_000);
  (fallbackInterval as { unref?: () => void })?.unref?.();
}

async function dispatchPayloadInProcess(payload: NotificationJobPayload): Promise<number> {
  try {
    return await processNotificationJob({ data: payload } as Job<NotificationJobPayload>);
  } catch (err) {
    console.warn('[Notifications] In-process dispatch error:', err);
    return 0;
  }
}

export async function initNotificationWorker(): Promise<{ enabled: boolean; mode: 'bullmq' | 'in_process' | 'disabled' }> {
  if (env.NODE_ENV === 'test') {
    return { enabled: false, mode: 'disabled' };
  }
  const redisUrl = env.REDIS_URL?.trim();
  const isLocalRedisInProd =
    env.NODE_ENV === 'production' &&
    Boolean(redisUrl && /localhost|127\.0\.0\.1|::1/i.test(redisUrl));

  if (!redisUrl || isLocalRedisInProd) {
    console.info('[Notifications] No remote REDIS_URL configured; using lightweight in-process scheduler.');
    startInProcessFallbackScheduler();
    return { enabled: true, mode: 'in_process' };
  }
  if (notificationQueue && notificationWorker) {
    return { enabled: true, mode: 'bullmq' };
  }

  try {
    const client = new Redis(redisUrl, {
      lazyConnect: true,
      connectTimeout: 3000,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      retryStrategy: (times) => (times > 2 ? null : Math.min(times * 500, 1500)),
    });
    client.on('error', (err) => {
      console.warn('[BullMQ Redis]', err.message);
    });
    await client.connect();
    await client.ping();
    redisConnection = client;

    notificationQueue = new Queue<NotificationJobPayload>(NOTIFICATION_QUEUE_NAME, {
      connection: redisConnection,
      prefix: env.BULLMQ_PREFIX,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 200,
      },
    });

    notificationWorker = new Worker<NotificationJobPayload>(
      NOTIFICATION_QUEUE_NAME,
      processNotificationJob,
      {
        connection: redisConnection.duplicate(),
        prefix: env.BULLMQ_PREFIX,
        concurrency: 5,
      }
    );
    notificationWorker.on('error', (err) => {
      console.warn('[BullMQ Worker]', err.message);
    });

    // Register recurring time-based BullMQ cron jobs
    await notificationQueue.upsertJobScheduler(
      'daily-morning-sandhya',
      { pattern: '0 6 * * *' },
      {
        name: 'daily-morning-sandhya',
        data: { actionType: 'daily_morning_sandhya' },
      }
    );

    await notificationQueue.upsertJobScheduler(
      'daily-evening-checkin',
      { pattern: '0 19 * * *' },
      {
        name: 'daily-evening-checkin',
        data: { actionType: 'daily_evening_checkin' },
      }
    );

    await notificationQueue.upsertJobScheduler(
      'profile-incomplete-nudge',
      { pattern: '0 */6 * * *' },
      {
        name: 'profile-incomplete-nudge',
        data: { actionType: 'profile_incomplete_nudge' },
      }
    );

    return { enabled: true, mode: 'bullmq' };
  } catch (err) {
    console.warn('[BullMQ] Redis unavailable, falling back to in-process notification scheduler:', err instanceof Error ? err.message : err);
    await closeNotificationWorker().catch(() => {});
    startInProcessFallbackScheduler();
    return { enabled: true, mode: 'in_process' };
  }
}

export async function enqueueNotification(
  payload: NotificationJobPayload,
  opts?: { delayMs?: number; jobId?: string }
): Promise<{ queued: boolean; jobId?: string }> {
  if (!notificationQueue) {
    if (env.NODE_ENV !== 'test') {
      if (opts?.delayMs && opts.delayMs > 0) {
        const t = setTimeout(() => void dispatchPayloadInProcess(payload), opts.delayMs);
        (t as { unref?: () => void })?.unref?.();
      } else {
        setImmediate(() => void dispatchPayloadInProcess(payload));
      }
    }
    return { queued: false };
  }
  const job = await notificationQueue.add(payload.actionType, payload, {
    delay: opts?.delayMs,
    jobId: opts?.jobId,
  });
  return { queued: true, jobId: job.id };
}

export async function closeNotificationWorker(): Promise<void> {
  if (fallbackInterval) {
    clearInterval(fallbackInterval);
    fallbackInterval = null;
  }
  await notificationWorker?.close();
  await notificationQueue?.close();
  if (redisConnection) {
    redisConnection.disconnect();
  }
  notificationWorker = null;
  notificationQueue = null;
  redisConnection = null;
}
