import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { config } from 'dotenv';
import { z } from 'zod';

const localEnv = resolve(process.cwd(), '.env');
const parentEnv = resolve(process.cwd(), '../.env');
const exampleEnv = resolve(process.cwd(), '../.env.example');

if (existsSync(localEnv)) {
  config({ path: localEnv, override: false });
} else if (existsSync(parentEnv)) {
  config({ path: parentEnv, override: false });
} else if (existsSync(exampleEnv)) {
  config({ path: exampleEnv, override: false });
}

const isTest =
  process.env.NODE_ENV === 'test' ||
  process.argv.some((arg) => arg.includes('test') || arg.includes('--test'));

if (isTest && !process.env.NODE_ENV) {
  process.env.NODE_ENV = 'test';
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default(isTest ? 'test' : 'development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z
    .string()
    .default(isTest ? 'postgresql://postgres:postgres@localhost:5432/deeksha_test' : '')
    .refine((val) => isTest || val.length > 0, { message: 'DATABASE_URL is required' }),
  DATABASE_SSL: z.enum(['true', 'false', 'require']).optional(),
  DATABASE_SSL_REJECT_UNAUTHORIZED: z.coerce.boolean().default(false),
  JWT_SECRET: z
    .string()
    .default(
      isTest
        ? 'test-jwt-secret-at-least-32-chars-long-security-key'
        : 'replace-with-a-secure-32-character-minimum-secret-key'
    )
    .refine((val) => val.length >= 32, {
      message: 'JWT_SECRET must be at least 32 characters for enterprise security',
    }),
  CORS_ORIGIN: z.string().default('http://localhost:8081'),

  // Rate Limiting
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(120),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),

  // SMTP Email Settings
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.coerce.number().int().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().default('DeekshaOrg <noreply@deeksha.app>'),
});

export const env = envSchema.parse(process.env);
export type EnvConfig = z.infer<typeof envSchema>;
