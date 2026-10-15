import Fastify, {
  type FastifyInstance,
  type FastifyRequest,
  type FastifyReply,
  type FastifyServerOptions,
} from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { env } from './config.js';
import './types.js';
import { pool } from './db.js';
import { meRoutes } from './routes/me.js';
import { enrollmentRoutes } from './routes/enrollments.js';
import { groupRoutes } from './routes/groups.js';
import { communityRoutes } from './routes/community.js';
import { authRoutes } from './routes/auth.js';

export function corsOriginHandler(
  origin: string | undefined,
  cb: (err: Error | null, allow: boolean) => void
) {
  // Allow requests with no origin (native mobile apps, cURL, server-to-server)
  if (!origin) {
    cb(null, true);
    return;
  }

  // Non-production allows localhost, loopback, and local network development
  if (
    env.NODE_ENV !== 'production' &&
    (origin.includes('localhost') ||
      origin.includes('127.0.0.1') ||
      origin.startsWith('http://192.168.') ||
      origin.startsWith('http://172.') ||
      origin.startsWith('http://10.'))
  ) {
    cb(null, true);
    return;
  }

  // Support multiple comma-separated configured origins
  const configuredOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());
  if (configuredOrigins.includes(origin) || configuredOrigins.includes('*')) {
    cb(null, true);
    return;
  }

  // Allow preview deployments on vercel
  if (/\.vercel\.app$/i.test(origin) || /\.vercel\.dev$/i.test(origin)) {
    cb(null, true);
    return;
  }

  // Reject unauthorized origins in production
  if (env.NODE_ENV === 'production') {
    cb(new Error('CORS origin not permitted'), false);
    return;
  }

  cb(null, true);
}

export async function buildApp(opts: FastifyServerOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({
    logger:
      opts.logger ??
      (env.NODE_ENV === 'test'
        ? false
        : {
            level: env.NODE_ENV === 'production' ? 'info' : 'debug',
            redact: ['req.headers.authorization', 'req.headers.cookie'],
          }),
    requestIdHeader: 'x-request-id',
    genReqId: () => randomUUID(),
    bodyLimit: 1_048_576, // 1MB body limit
    ...opts,
  });

  // Security headers
  await app.register(helmet, {
    contentSecurityPolicy: env.NODE_ENV === 'production',
  });

  // CORS configuration
  await app.register(cors, {
    origin: corsOriginHandler,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-request-id',
      'x-user-id',
      'Accept',
      'Origin',
      'X-Requested-With',
    ],
    exposedHeaders: ['x-request-id'],
    maxAge: 86400,
  });

  // Global rate limiting
  await app.register(rateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_WINDOW_MS,
    allowList: (req) => req.url === '/health' || req.url === '/ready',
    errorResponseBuilder: (req, context) => ({
      statusCode: 429,
      error: 'TOO_MANY_REQUESTS',
      message: `Rate limit exceeded, retry in ${context.after}`,
      requestId: req.id,
    }),
  });

  // JWT Authentication
  await app.register(jwt, { secret: env.JWT_SECRET });

  app.decorate('authenticate', async (request: FastifyRequest) => {
    await request.jwtVerify();
  });

  // Liveness probe
  app.get('/health', async () => {
    return {
      status: 'ok',
      service: 'deeksha-journey-api',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      node: process.version,
    };
  });

  // Readiness probe
  app.get('/ready', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      await pool.query('SELECT 1');
      return {
        status: 'ready',
        database: 'connected',
        pool: {
          total: pool.totalCount,
          idle: pool.idleCount,
          waiting: pool.waitingCount,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      app.log.error({ err }, 'Readiness probe failed — database disconnected');
      return reply.status(503).send({
        status: 'unavailable',
        database: 'disconnected',
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Development-only token generator
  if (env.NODE_ENV === 'development') {
    app.post('/v1/dev/token', async (request) => {
      const body = z
        .object({
          sub: z.string().uuid().optional(),
          email: z.string().email().optional(),
          name: z.string().min(1).max(100).optional(),
        })
        .parse(request.body ?? {});
      return {
        token: app.jwt.sign({
          sub: body.sub ?? randomUUID(),
          email: body.email,
          name: body.name,
        }),
      };
    });
  }

  // Echo x-request-id on all responses for distributed tracing
  app.addHook('onSend', async (request, reply) => {
    reply.header('x-request-id', request.id);
  });

  // Global standardized error handler
  app.setErrorHandler((error, request, reply) => {
    request.log.error(error);

    if (error instanceof z.ZodError || (error as { name?: string }).name === 'ZodError') {
      const issues = (error as { issues?: unknown[] }).issues ?? [];
      return reply.status(400).send({
        error: 'VALIDATION_ERROR',
        details: issues,
        requestId: request.id,
      });
    }

    const errObj = error as { statusCode?: number; message?: string };
    const statusCode = errObj.statusCode || 500;
    const message =
      statusCode < 500 && errObj.message
        ? errObj.message
        : 'An unexpected internal server error occurred.';

    return reply.status(statusCode).send({
      error:
        statusCode === 400
          ? 'VALIDATION_ERROR'
          : statusCode === 429
          ? 'TOO_MANY_REQUESTS'
          : 'INTERNAL_ERROR',
      message,
      requestId: request.id,
    });
  });

  // Register domain route plugins
  await app.register(meRoutes);
  await app.register(enrollmentRoutes);
  await app.register(groupRoutes);
  await app.register(communityRoutes);
  await app.register(authRoutes);

  return app;
}
