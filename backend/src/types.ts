import '@fastify/jwt';
import 'fastify';
import type { FastifyRequest } from 'fastify';
declare module '@fastify/jwt' { interface FastifyJWT { user: { sub: string; email?: string; name?: string }; } }
declare module 'fastify' { interface FastifyInstance { authenticate: (request: FastifyRequest) => Promise<void>; } }
