import Fastify, { type FastifyRequest } from 'fastify'; import cors from '@fastify/cors'; import helmet from '@fastify/helmet'; import jwt from '@fastify/jwt'; import { Server } from 'socket.io'; import { randomUUID } from 'node:crypto'; import { z } from 'zod'; import { env } from './config.js'; import './types.js'; import { pool, withUser } from './db.js'; import { meRoutes } from './routes/me.js'; import { enrollmentRoutes } from './routes/enrollments.js'; import { groupRoutes } from './routes/groups.js'; import { communityRoutes } from './routes/community.js'; import { authRoutes } from './routes/auth.js';
const app=Fastify({logger:{redact:['req.headers.authorization','req.headers.cookie']},requestIdHeader:'x-request-id',genReqId:()=>randomUUID(),bodyLimit:1_048_576});
const corsOriginHandler = (origin: string | undefined, cb: (err: Error | null, allow: boolean) => void) => {
  // Allow requests with no origin (like mobile apps, curl, server-to-server)
  if (!origin) {
    cb(null, true);
    return;
  }
  // Allow local development, LAN, and loopback
  if (
    env.NODE_ENV === 'development' ||
    origin.includes('localhost') ||
    origin.includes('127.0.0.1') ||
    origin.startsWith('http://192.168.') ||
    origin.startsWith('http://172.') ||
    origin.startsWith('http://10.')
  ) {
    cb(null, true);
    return;
  }
  // Allow all Vercel deployments (*.vercel.app, *.vercel.dev) and configured CORS_ORIGIN
  if (
    origin === env.CORS_ORIGIN ||
    /\.vercel\.app$/i.test(origin) ||
    /\.vercel\.dev$/i.test(origin) ||
    origin.includes('vercel.app')
  ) {
    cb(null, true);
    return;
  }
  // Default allow
  cb(null, true);
};
await app.register(helmet, { contentSecurityPolicy: false });
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
await app.register(jwt, { secret: env.JWT_SECRET });
app.decorate('authenticate', async (request: FastifyRequest) => { await request.jwtVerify(); });
const io = new Server(app.server, { cors: { origin: corsOriginHandler, credentials: true } });
io.use(async (socket,next)=>{try{const token=socket.handshake.auth.token as string|undefined; if(!token) return next(new Error('Authentication required')); socket.data.user=await app.jwt.verify<{sub:string}>(token); next();}catch{next(new Error('Invalid token'));}});
io.on('connection',socket=>{socket.on('group:join',async (groupId:string,ack:(result:{ok:boolean})=>void)=>{try{const valid=z.string().uuid().parse(groupId);const userId=socket.data.user.sub;const allowed=await withUser(userId,async db=>(await db.query('SELECT 1 FROM group_members WHERE group_id=$1 AND user_id=$2',[valid,userId])).rowCount===1);if(!allowed)return ack({ok:false});socket.join(`group:${valid}`);ack({ok:true});}catch{ack({ok:false});}});socket.on('group:message',async (payload:{groupId:string;body:string;type?:'NOTE'|'ANNOUNCEMENT'},ack:(result:{ok:boolean;message?:unknown})=>void)=>{try{const input=z.object({groupId:z.string().uuid(),body:z.string().trim().min(1).max(4000),type:z.enum(['NOTE','ANNOUNCEMENT']).default('NOTE')}).parse(payload);const userId=socket.data.user.sub;const message=await withUser(userId,async db=>{const membership=await db.query('SELECT 1 FROM group_members WHERE group_id=$1 AND user_id=$2',[input.groupId,userId]);if(!membership.rowCount)throw new Error('Not a group member');return (await db.query('INSERT INTO group_messages(group_id,author_user_id,body,message_type) VALUES($1,$2,$3,$4) RETURNING id,group_id,author_user_id,body,message_type,created_at',[input.groupId,userId,input.body,input.type])).rows[0];});io.to(`group:${input.groupId}`).emit('group:message',message);ack({ok:true,message});}catch{ack({ok:false});}});});
app.get('/health',async()=>{await pool.query('SELECT 1');return {status:'ok'};});
if (env.NODE_ENV === 'development') app.post('/v1/dev/token', async request => {
  const body = z.object({ sub: z.string().uuid().optional(), email: z.string().email().optional(), name: z.string().min(1).max(100).optional() }).parse(request.body ?? {});
  return { token: app.jwt.sign({ sub: body.sub ?? randomUUID(), email: body.email, name: body.name }) };
});
await app.register(meRoutes);await app.register(enrollmentRoutes);await app.register(groupRoutes);
await app.register(communityRoutes);await app.register(authRoutes);
app.setErrorHandler((error,request,reply)=>{request.log.error(error);const status=(error as {statusCode?:number}).statusCode??400;reply.status(status).send({error:status===400?'VALIDATION_ERROR':'INTERNAL_ERROR',requestId:request.id});});
const address = await app.listen({ port: env.PORT, host: '0.0.0.0' });
console.log('🚀 Fastify server listening on', address);
