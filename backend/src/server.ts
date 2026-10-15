import { Server as SocketIOServer } from 'socket.io';
import { z } from 'zod';
import { buildApp, corsOriginHandler } from './app.js';
import { env } from './config.js';
import { pool, withUser } from './db.js';

export const app = await buildApp();

export const io = new SocketIOServer(app.server, {
  cors: { origin: corsOriginHandler, credentials: true },
});

// Socket.IO authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token as string | undefined;
    if (!token) return next(new Error('Authentication required'));
    socket.data.user = await app.jwt.verify<{ sub: string }>(token);
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

// Socket.IO realtime group rooms and messaging
io.on('connection', (socket) => {
  socket.on(
    'group:join',
    async (groupId: string, ack: (result: { ok: boolean }) => void) => {
      try {
        const valid = z.string().uuid().parse(groupId);
        const userId = socket.data.user.sub;
        const allowed = await withUser(
          userId,
          async (db) =>
            (
              await db.query(
                'SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2',
                [valid, userId]
              )
            ).rowCount === 1
        );
        if (!allowed) return ack({ ok: false });
        socket.join(`group:${valid}`);
        ack({ ok: true });
      } catch {
        ack({ ok: false });
      }
    }
  );

  socket.on(
    'group:message',
    async (
      payload: { groupId: string; body: string; type?: 'NOTE' | 'ANNOUNCEMENT' },
      ack: (result: { ok: boolean; message?: unknown }) => void
    ) => {
      try {
        const input = z
          .object({
            groupId: z.string().uuid(),
            body: z.string().trim().min(1).max(4000),
            type: z.enum(['NOTE', 'ANNOUNCEMENT']).default('NOTE'),
          })
          .parse(payload);
        const userId = socket.data.user.sub;
        const message = await withUser(userId, async (db) => {
          const membership = await db.query(
            'SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2',
            [input.groupId, userId]
          );
          if (!membership.rowCount) throw new Error('Not a group member');
          return (
            await db.query(
              `INSERT INTO group_messages (group_id, author_user_id, body, message_type)
               VALUES ($1, $2, $3, $4)
               RETURNING id, group_id, author_user_id, body, message_type, created_at`,
              [input.groupId, userId, input.body, input.type]
            )
          ).rows[0];
        });
        io.to(`group:${input.groupId}`).emit('group:message', message);
        ack({ ok: true, message });
      } catch {
        ack({ ok: false });
      }
    }
  );
});

// Graceful shutdown handling
export const gracefulShutdown = async (signal: string) => {
  app.log.info(`Received ${signal}. Initiating graceful shutdown...`);
  try {
    io.close();
    await app.close();
    await pool.end();
    app.log.info('Server, Socket.IO, and PostgreSQL database pool closed cleanly.');
    process.exit(0);
  } catch (err) {
    app.log.error({ err }, 'Error during graceful shutdown');
    process.exit(1);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

export const start = async () => {
  try {
    const address = await app.listen({ port: env.PORT, host: '0.0.0.0' });
    app.log.info(`🚀 Enterprise Fastify server listening on ${address}`);
    return address;
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

// Start listening if executed directly
if (process.env.NODE_ENV !== 'test') {
  await start();
}
