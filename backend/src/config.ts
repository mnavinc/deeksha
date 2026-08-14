import { config } from 'dotenv';
import { resolve } from 'node:path';
import { z } from 'zod';

// Local development keeps one shared .env at the repository root. Production
// platforms inject these values directly and are not overridden by this file.
config({ path: resolve(process.cwd(), '../.env'), override: false });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  CORS_ORIGIN: z.string().url(),

  // SMTP Email Settings (Gmail or any custom SMTP server)
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.coerce.number().int().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().default('DeekshaOrg <noreply@deeksha.app>'),
});

export const env = envSchema.parse(process.env);
