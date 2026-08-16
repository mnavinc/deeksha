/**
 * auth.ts — OTP-based Email Authentication Routes
 * POST /v1/auth/otp/send    — generate 6-digit OTP, store in DB, send email
 * POST /v1/auth/otp/verify  — verify OTP, issue JWT, return/create user profile
 * POST /v1/auth/forgot      — same as otp/send (reuses the same flow)
 */
import { randomInt } from 'node:crypto';
import { type FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { pool } from '../db.js';
import { sendOtpEmail } from '../emailService.js';

const OTP_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 5;

function generateOtp(): string {
  return String(randomInt(100000, 999999));
}

export const authRoutes: FastifyPluginAsync = async (app) => {
  /**
   * POST /v1/auth/otp/send
   * Body: { identifier: string (email) }
   * Generates a 6-digit OTP, stores it in email_otp_codes table, sends email.
   */
  app.post('/v1/auth/otp/send', async (request, reply) => {
    const { identifier } = z.object({
      identifier: z.string().email('Please enter a valid email address').toLowerCase().trim(),
    }).parse(request.body);

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Invalidate any existing unused OTPs for this identifier
    await pool.query(
      `UPDATE email_otp_codes SET is_verified = true WHERE identifier = $1 AND is_verified = false`,
      [identifier]
    );

    // Insert new OTP
    await pool.query(
      `INSERT INTO email_otp_codes (identifier, otp_code, expires_at) VALUES ($1, $2, $3)`,
      [identifier, otp, expiresAt]
    );

    // Lookup user name if exists (for personalised email)
    const userResult = await pool.query(
      `SELECT display_name AS name FROM users WHERE email = $1 LIMIT 1`,
      [identifier]
    );
    const name = userResult.rows[0]?.name;

    // Send email (non-blocking — we don't fail the request if email fails)
    const emailSent = await sendOtpEmail(identifier, otp, name);

    request.log.info({ identifier, emailSent }, '[Auth] OTP sent');

    return reply.status(200).send({
      ok: true,
      message: emailSent
        ? `OTP sent to ${identifier}. Check your inbox (also spam folder).`
        : `OTP generated. Email delivery pending — check inbox or try again.`,
    });
  });

  /**
   * POST /v1/auth/otp/verify
   * Body: { identifier: string, otp: string, name?: string }
   * Verifies OTP, creates or returns existing user, issues JWT.
   */
  app.post('/v1/auth/otp/verify', async (request, reply) => {
    const { identifier, otp, name } = z.object({
      identifier: z.string().email().toLowerCase().trim(),
      otp: z.string().length(6, 'OTP must be 6 digits'),
      name: z.string().min(1).max(100).optional(),
    }).parse(request.body);

    // Find valid unexpired OTP
    const otpResult = await pool.query(
      `SELECT id, attempts FROM email_otp_codes
       WHERE identifier = $1 AND otp_code = $2 AND is_verified = false AND expires_at > now()
       ORDER BY created_at DESC LIMIT 1`,
      [identifier, otp]
    );

    if (!otpResult.rows.length) {
      // Check if there's an OTP but attempts exceeded
      const expiredResult = await pool.query(
        `SELECT attempts FROM email_otp_codes WHERE identifier = $1 AND is_verified = false ORDER BY created_at DESC LIMIT 1`,
        [identifier]
      );
      const attempts = expiredResult.rows[0]?.attempts ?? 0;
      if (attempts >= MAX_ATTEMPTS) {
        return reply.status(429).send({ error: 'TOO_MANY_ATTEMPTS', message: 'Too many failed attempts. Please request a new OTP.' });
      }
      // Increment attempts
      await pool.query(
        `UPDATE email_otp_codes SET attempts = attempts + 1 WHERE identifier = $1 AND is_verified = false`,
        [identifier]
      );
      return reply.status(400).send({ error: 'INVALID_OTP', message: 'Invalid or expired OTP. Please try again.' });
    }

    const { id: otpId } = otpResult.rows[0];

    // Mark OTP as verified
    await pool.query(`UPDATE email_otp_codes SET is_verified = true WHERE id = $1`, [otpId]);

    // Upsert user
    const displayName = name?.trim() || identifier.split('@')[0];
    const externalAuthId = `email:${identifier}`;
    const userResult = await pool.query(
      `INSERT INTO users (external_auth_id, email, display_name)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE SET display_name = COALESCE(EXCLUDED.display_name, users.display_name)
       RETURNING id, email, display_name AS name, created_at`,
      [externalAuthId, identifier, displayName]
    );
    const user = userResult.rows[0];

    // Issue JWT
    const token = await app.jwt.sign(
      { sub: user.id, email: user.email, name: user.name },
      { expiresIn: '30d' }
    );

    request.log.info({ userId: user.id, identifier }, '[Auth] OTP verified, JWT issued');

    return reply.status(200).send({
      ok: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.created_at,
      },
    });
  });

  /**
   * POST /v1/auth/forgot — alias for otp/send (password reset uses same OTP flow)
   */
  app.post('/v1/auth/forgot', async (request, reply) => {
    return app.inject({
      method: 'POST',
      url: '/v1/auth/otp/send',
      payload: request.body as Record<string, unknown>,
      headers: request.headers as Record<string, string>,
    }).then((res) => {
      reply.status(res.statusCode).send(JSON.parse(res.body));
    });
  });
};
