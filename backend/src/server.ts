import Fastify, { type FastifyRequest } from 'fastify'; import cors from '@fastify/cors'; import helmet from '@fastify/helmet'; import jwt from '@fastify/jwt'; import { randomUUID } from 'node:crypto'; import { z } from 'zod'; import { env } from './config.js'; import './types.js'; import { pool } from './db.js'; import { meRoutes } from './routes/me.js'; import { enrollmentRoutes } from './routes/enrollments.js'; import { groupRoutes } from './routes/groups.js'; import { communityRoutes } from './routes/community.js';
const app=Fastify({logger:{redact:['req.headers.authorization','req.headers.cookie']},requestIdHeader:'x-request-id',genReqId:()=>randomUUID(),bodyLimit:1_048_576});
await app.register(helmet,{contentSecurityPolicy:false}); await app.register(cors,{origin:env.CORS_ORIGIN,credentials:true}); await app.register(jwt,{secret:env.JWT_SECRET});
app.decorate('authenticate',async (request: FastifyRequest) => { await request.jwtVerify(); });
app.get('/health',async()=>{await pool.query('SELECT 1');return {status:'ok'};});
if (env.NODE_ENV === 'development') app.post('/v1/dev/token', async request => {
  const body = z.object({ sub: z.string().uuid().optional(), email: z.string().email().optional(), name: z.string().min(1).max(100).optional() }).parse(request.body ?? {});
  return { token: app.jwt.sign({ sub: body.sub ?? randomUUID(), email: body.email, name: body.name }) };
});
await app.register(meRoutes);await app.register(enrollmentRoutes);await app.register(groupRoutes);
await app.register(communityRoutes);
app.setErrorHandler((error,request,reply)=>{request.log.error(error);const status=(error as {statusCode?:number}).statusCode??400;reply.status(status).send({error:status===400?'VALIDATION_ERROR':'INTERNAL_ERROR',requestId:request.id});});
const close=async()=>{await app.close();await pool.end();};process.on('SIGTERM',close);process.on('SIGINT',close);
await app.listen({port:env.PORT,host:'0.0.0.0'});
