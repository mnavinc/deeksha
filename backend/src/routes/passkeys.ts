import { randomBytes } from 'node:crypto';
import { type FastifyPluginAsync } from 'fastify';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type AuthenticatorTransport,
} from '@simplewebauthn/server';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { z } from 'zod';
import { env } from '../config.js';
import { pool } from '../db.js';
import { sendWelcomeEmail } from '../emailService.js';
import { enqueueNotification } from '../workers/notificationWorker.js';

const CHALLENGE_TTL_MINUTES = 5;

const GOOGLE_JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
const APPLE_JWKS = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));

function getAllowedOrigins(): string[] {
  return env.RP_ORIGIN.split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}

const registerOptionsSchema = z.object({
  displayName: z.string().trim().min(1).max(100).optional(),
  email: z.string().trim().email().toLowerCase().optional(),
  phone: z
    .string()
    .trim()
    .regex(/^[+\d\s()-]{7,20}$/)
    .optional(),
  friendlyName: z.string().trim().max(80).optional(),
});

const registerVerifySchema = z.object({
  challenge: z.string().min(10),
  response: z.any(),
  friendlyName: z.string().trim().max(80).optional(),
});

const loginVerifySchema = z.object({
  challenge: z.string().min(10),
  response: z.any(),
});

const googleOAuthSchema = z.object({
  idToken: z.string().min(20),
});

const appleOAuthSchema = z.object({
  identityToken: z.string().min(20),
  fullName: z.string().trim().max(100).optional(),
  email: z.string().trim().email().toLowerCase().optional(),
});

export const passkeyRoutes: FastifyPluginAsync = async (app) => {
  /**
   * GET /v1/auth/passkey/web
   * Self-contained WebAuthn Passkey handoff page for Android Chrome Custom Tabs & iOS ASWebAuthenticationSession.
   */
  app.get('/v1/auth/passkey/web', async (request, reply) => {
    const q = request.query as Record<string, string | undefined>;
    const mode = q.mode === 'register' ? 'register' : 'login';
    const displayName = (q.displayName ?? 'Swami').slice(0, 100);
    const email = (q.email ?? '').slice(0, 120);
    const phone = (q.phone ?? '').slice(0, 20);
    const rawRedirect = q.redirectUri ?? 'deekshajourney://auth';
    const allowedRedirect =
      rawRedirect.startsWith('deekshajourney://') ||
      rawRedirect.startsWith('https://deeksha-sigma.vercel.app') ||
      rawRedirect.startsWith('http://localhost:')
        ? rawRedirect
        : 'deekshajourney://auth';

    const nonce = randomBytes(16).toString('base64');
    const configJson = JSON.stringify({
      mode,
      displayName,
      email,
      phone,
      redirectUri: allowedRedirect,
    }).replaceAll('<', '\\u003c');

    reply.header(
      'Content-Security-Policy',
      `default-src 'self'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline'; connect-src 'self';`
    );
    reply.type('text/html; charset=utf-8');
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Swamiseva Passkey</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0B1410; color: #F9FAFB; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }
    .card { max-width: 380px; width: 100%; background: #13221B; border: 1.5px solid #F7931E; border-radius: 20px; padding: 24px; text-align: center; }
    h1 { font-size: 20px; margin: 8px 0; color: #F7931E; }
    p { font-size: 13px; color: #D1D5DB; line-height: 1.5; }
    button { width: 100%; background: #F7931E; color: #0D1117; border: 0; border-radius: 12px; padding: 14px; font-size: 15px; font-weight: 800; cursor: pointer; margin-top: 14px; }
    #status { margin-top: 12px; font-size: 13px; color: #93C5FD; word-break: break-word; }
  </style>
</head>
<body>
  <div class="card">
    <div style="font-size: 40px;">🛕</div>
    <h1>${mode === 'register' ? 'Create Passkey' : 'Sign in with Passkey'}</h1>
    <p>Use your device biometrics (Fingerprint / Face ID) synced with Google Password Manager or Apple iCloud Keychain.</p>
    <button id="actionBtn">${mode === 'register' ? 'Continue & Create Passkey' : 'Verify with Biometrics'}</button>
    <div id="status">Tap the button above to launch the OS Passkey prompt.</div>
  </div>
  <script nonce="${nonce}">
    const cfg = ${configJson};
    const statusEl = document.getElementById('status');
    const b64uToBuf = (b64u) => {
      const pad = '='.repeat((4 - (b64u.length % 4)) % 4);
      const b64 = (b64u + pad).replace(/-/g, '+').replace(/_/g, '/');
      const raw = atob(b64);
      const buf = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; i++) buf[i] = raw.charCodeAt(i);
      return buf.buffer;
    };
    const bufToB64u = (buf) => {
      const bytes = new Uint8Array(buf);
      let bin = '';
      for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
      return btoa(bin).replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=+$/, '');
    };
    async function runPasskey() {
      try {
        if (!window.PublicKeyCredential) {
          statusEl.textContent = 'WebAuthn Passkeys are not supported in this browser.';
          return;
        }
        statusEl.textContent = 'Preparing secure challenge...';
        if (cfg.mode === 'register') {
          const optRes = await fetch('/v1/auth/passkey/register/options', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              displayName: cfg.displayName,
              ...(cfg.email ? { email: cfg.email } : {}),
              ...(cfg.phone ? { phone: cfg.phone } : {}),
            }),
          });
          const options = await optRes.json();
          if (!optRes.ok) throw new Error(options.message || 'Failed to get options');
          const publicKey = {
            ...options,
            challenge: b64uToBuf(options.challenge),
            user: { ...options.user, id: b64uToBuf(options.user.id) },
            excludeCredentials: (options.excludeCredentials || []).map((c) => ({ ...c, id: b64uToBuf(c.id) })),
          };
          const cred = await navigator.credentials.create({ publicKey });
          const responsePayload = {
            id: cred.id,
            rawId: bufToB64u(cred.rawId),
            type: cred.type,
            clientExtensionResults: cred.getClientExtensionResults(),
            response: {
              attestationObject: bufToB64u(cred.response.attestationObject),
              clientDataJSON: bufToB64u(cred.response.clientDataJSON),
              transports: cred.response.getTransports ? cred.response.getTransports() : [],
            },
          };
          const vRes = await fetch('/v1/auth/passkey/register/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ challenge: options.challenge, response: responsePayload }),
          });
          const data = await vRes.json();
          if (!vRes.ok) throw new Error(data.message || 'Verification failed');
          const qs = new URLSearchParams({ token: data.token, id: data.user.id, name: data.user.name || 'Swami', email: data.user.email || '', phone: data.user.phone || '' });
          window.location.href = cfg.redirectUri + (cfg.redirectUri.includes('?') ? '&' : '?') + qs.toString();
        } else {
          const optRes = await fetch('/v1/auth/passkey/login/options', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
          });
          const options = await optRes.json();
          if (!optRes.ok) throw new Error(options.message || 'Failed to get options');
          const publicKey = {
            ...options,
            challenge: b64uToBuf(options.challenge),
            allowCredentials: (options.allowCredentials || []).map((c) => ({ ...c, id: b64uToBuf(c.id) })),
          };
          const cred = await navigator.credentials.get({ publicKey });
          const responsePayload = {
            id: cred.id,
            rawId: bufToB64u(cred.rawId),
            type: cred.type,
            clientExtensionResults: cred.getClientExtensionResults(),
            response: {
              authenticatorData: bufToB64u(cred.response.authenticatorData),
              clientDataJSON: bufToB64u(cred.response.clientDataJSON),
              signature: bufToB64u(cred.response.signature),
              userHandle: cred.response.userHandle ? bufToB64u(cred.response.userHandle) : undefined,
            },
          };
          const vRes = await fetch('/v1/auth/passkey/login/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ challenge: options.challenge, response: responsePayload }),
          });
          const data = await vRes.json();
          if (!vRes.ok) throw new Error(data.message || 'Verification failed');
          const qs = new URLSearchParams({ token: data.token, id: data.user.id, name: data.user.name || 'Swami', email: data.user.email || '', phone: data.user.phone || '' });
          window.location.href = cfg.redirectUri + (cfg.redirectUri.includes('?') ? '&' : '?') + qs.toString();
        }
      } catch (err) {
        statusEl.textContent = (err && err.message) ? err.message : 'Passkey prompt cancelled or failed.';
      }
    }
    document.getElementById('actionBtn').addEventListener('click', runPasskey);
  </script>
</body>
</html>`;
  });

  /**
   * POST /v1/auth/passkey/register/options
   * Generates a WebAuthn registration challenge (platform authenticator / synced Passkey).
   */
  app.post(
    '/v1/auth/passkey/register/options',
    { config: { rateLimit: { max: 15, timeWindow: '10 minutes' } } },
    async (request, reply) => {
      const body = registerOptionsSchema.parse(request.body ?? {});

      let userId: string | null = null;
      let userName = body.email ?? body.phone ?? 'swami@deeksha.app';
      let displayName = body.displayName ?? 'Swami';
      let excludeCredentials: { id: string; transports?: AuthenticatorTransport[] }[] = [];

      // If Bearer token is present, attach passkey to the authenticated user
      if (request.headers.authorization?.startsWith('Bearer ')) {
        try {
          await request.jwtVerify();
          userId = request.user.sub;
          const uRes = await pool.query(
            'SELECT email, phone, display_name FROM users WHERE id = $1 LIMIT 1',
            [userId]
          );
          if (uRes.rows[0]) {
            userName = uRes.rows[0].email ?? uRes.rows[0].phone ?? userId;
            displayName = uRes.rows[0].display_name ?? displayName;
          }
          const credsRes = await pool.query(
            'SELECT credential_id, transports FROM user_passkeys WHERE user_id = $1',
            [userId]
          );
          excludeCredentials = credsRes.rows.map((row) => ({
            id: row.credential_id as string,
            transports: (row.transports ?? []) as AuthenticatorTransport[],
          }));
        } catch {
          // Ignore invalid/expired token and proceed as new registration
        }
      }

      const options = await generateRegistrationOptions({
        rpName: env.RP_NAME,
        rpID: env.RP_ID,
        userName,
        userDisplayName: displayName,
        attestationType: 'none',
        excludeCredentials,
        authenticatorSelection: {
          residentKey: 'required',
          requireResidentKey: true,
          userVerification: 'required',
        },
      });

      const expiresAt = new Date(Date.now() + CHALLENGE_TTL_MINUTES * 60 * 1000);
      await pool.query("DELETE FROM webauthn_challenges WHERE expires_at < now()");
      await pool.query(
        `INSERT INTO webauthn_challenges (challenge, user_id, type, pending_profile, expires_at)
         VALUES ($1, $2, 'registration', $3, $4)`,
        [
          options.challenge,
          userId,
          JSON.stringify({
            displayName,
            email: body.email ?? null,
            phone: body.phone ?? null,
            friendlyName: body.friendlyName ?? 'Device Passkey',
          }),
          expiresAt,
        ]
      );

      return reply.status(200).send(options);
    }
  );

  /**
   * POST /v1/auth/passkey/register/verify
   * Verifies WebAuthn registration attestation, stores public key, issues JWT.
   */
  app.post(
    '/v1/auth/passkey/register/verify',
    { config: { rateLimit: { max: 15, timeWindow: '10 minutes' } } },
    async (request, reply) => {
      const { challenge, response, friendlyName } = registerVerifySchema.parse(request.body);

      const chRes = await pool.query(
        `DELETE FROM webauthn_challenges
         WHERE challenge = $1 AND type = 'registration' AND expires_at > now()
         RETURNING user_id, pending_profile`,
        [challenge]
      );

      if (!chRes.rows.length) {
        return reply.status(400).send({
          error: 'INVALID_CHALLENGE',
          message: 'Passkey registration challenge expired or invalid.',
        });
      }

      const { user_id: existingUserId, pending_profile: pendingProfile } = chRes.rows[0];

      const verification = await verifyRegistrationResponse({
        response,
        expectedChallenge: challenge,
        expectedOrigin: getAllowedOrigins(),
        expectedRPID: env.RP_ID,
        requireUserVerification: true,
      });

      if (!verification.verified || !verification.registrationInfo) {
        return reply.status(400).send({
          error: 'PASSKEY_VERIFICATION_FAILED',
          message: 'Passkey cryptographic verification failed.',
        });
      }

      const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;
      const publicKeyB64 = Buffer.from(credential.publicKey).toString('base64url');
      const transports = response?.response?.transports ?? [];

      let userId: string = existingUserId;
      let isNewUser = false;

      if (!userId) {
        const displayName = (pendingProfile?.displayName as string) || 'Swami';
        const email = (pendingProfile?.email as string) || null;
        const phone = (pendingProfile?.phone as string) || null;
        const externalAuthId = `passkey:${credential.id}`;

        const userRes = await pool.query(
          `INSERT INTO users (external_auth_id, email, phone, display_name, auth_provider, accepted_terms_at)
           VALUES ($1, $2, $3, $4, 'passkey', now())
           ON CONFLICT (email) DO UPDATE SET
             phone = COALESCE(EXCLUDED.phone, users.phone),
             display_name = COALESCE(EXCLUDED.display_name, users.display_name)
           RETURNING id, email, phone, display_name AS name, created_at`,
          [externalAuthId, email, phone, displayName]
        );
        userId = userRes.rows[0].id;
        isNewUser = true;
      }

      await pool.query(
        `INSERT INTO user_passkeys (user_id, credential_id, public_key, counter, device_type, backed_up, transports, friendly_name)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          userId,
          credential.id,
          publicKeyB64,
          credential.counter,
          credentialDeviceType,
          credentialBackedUp,
          Array.isArray(transports) ? transports : [],
          friendlyName ?? pendingProfile?.friendlyName ?? 'Synced Passkey',
        ]
      );

      const userRow = (
        await pool.query(
          'SELECT id, email, phone, display_name AS name, created_at FROM users WHERE id = $1 LIMIT 1',
          [userId]
        )
      ).rows[0];

      if (isNewUser && userRow?.email) {
        void sendWelcomeEmail(userRow.email, userRow.name);
      }
      if (isNewUser && userRow?.id) {
        void enqueueNotification({
          userId: userRow.id,
          actionType: 'welcome',
          data: { name: userRow.name },
        });
      }

      const token = await app.jwt.sign(
        { sub: userRow.id, email: userRow.email, name: userRow.name },
        { expiresIn: '30d' }
      );

      return reply.status(200).send({
        ok: true,
        token,
        user: {
          id: userRow.id,
          email: userRow.email,
          phone: userRow.phone,
          name: userRow.name,
          createdAt: userRow.created_at,
        },
      });
    }
  );

  /**
   * POST /v1/auth/passkey/login/options
   * Generates a discoverable WebAuthn authentication challenge (instant biometric login).
   */
  app.post(
    '/v1/auth/passkey/login/options',
    { config: { rateLimit: { max: 20, timeWindow: '10 minutes' } } },
    async (_request, reply) => {
      const options = await generateAuthenticationOptions({
        rpID: env.RP_ID,
        userVerification: 'required',
      });

      const expiresAt = new Date(Date.now() + CHALLENGE_TTL_MINUTES * 60 * 1000);
      await pool.query("DELETE FROM webauthn_challenges WHERE expires_at < now()");
      await pool.query(
        `INSERT INTO webauthn_challenges (challenge, type, expires_at)
         VALUES ($1, 'authentication', $2)`,
        [options.challenge, expiresAt]
      );

      return reply.status(200).send(options);
    }
  );

  /**
   * POST /v1/auth/passkey/login/verify
   * Verifies WebAuthn assertion signature & counter, issues JWT.
   */
  app.post(
    '/v1/auth/passkey/login/verify',
    { config: { rateLimit: { max: 20, timeWindow: '10 minutes' } } },
    async (request, reply) => {
      const { challenge, response } = loginVerifySchema.parse(request.body);

      const chRes = await pool.query(
        `DELETE FROM webauthn_challenges
         WHERE challenge = $1 AND type = 'authentication' AND expires_at > now()
         RETURNING id`,
        [challenge]
      );

      if (!chRes.rows.length) {
        return reply.status(400).send({
          error: 'INVALID_CHALLENGE',
          message: 'Passkey login challenge expired or invalid.',
        });
      }

      const credentialId = response?.id as string | undefined;
      if (!credentialId) {
        return reply.status(400).send({
          error: 'MISSING_CREDENTIAL',
          message: 'Missing passkey credential ID.',
        });
      }

      const credRes = await pool.query(
        `SELECT id, user_id, credential_id, public_key, counter, transports
         FROM user_passkeys WHERE credential_id = $1 LIMIT 1`,
        [credentialId]
      );

      if (!credRes.rows.length) {
        return reply.status(404).send({
          error: 'PASSKEY_NOT_FOUND',
          message: 'No matching Passkey registered on this server.',
        });
      }

      const stored = credRes.rows[0];
      const verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge: challenge,
        expectedOrigin: getAllowedOrigins(),
        expectedRPID: env.RP_ID,
        requireUserVerification: true,
        credential: {
          id: stored.credential_id,
          publicKey: new Uint8Array(Buffer.from(stored.public_key, 'base64url')),
          counter: Number(stored.counter ?? 0),
          transports: (stored.transports ?? []) as AuthenticatorTransport[],
        },
      });

      if (!verification.verified) {
        return reply.status(401).send({
          error: 'PASSKEY_AUTH_FAILED',
          message: 'Passkey biometric signature could not be verified.',
        });
      }

      await pool.query(
        `UPDATE user_passkeys SET counter = $1, last_used_at = now() WHERE id = $2`,
        [verification.authenticationInfo.newCounter, stored.id]
      );

      const userRow = (
        await pool.query(
          'SELECT id, email, phone, display_name AS name, created_at FROM users WHERE id = $1 LIMIT 1',
          [stored.user_id]
        )
      ).rows[0];

      const token = await app.jwt.sign(
        { sub: userRow.id, email: userRow.email, name: userRow.name },
        { expiresIn: '30d' }
      );

      return reply.status(200).send({
        ok: true,
        token,
        user: {
          id: userRow.id,
          email: userRow.email,
          phone: userRow.phone,
          name: userRow.name,
          createdAt: userRow.created_at,
        },
      });
    }
  );

  /**
   * GET /v1/auth/passkeys — List passkeys for the signed-in user
   */
  app.get('/v1/auth/passkeys', { onRequest: [app.authenticate] }, async (request) => {
    const res = await pool.query(
      `SELECT id, credential_id, device_type, backed_up, friendly_name, created_at, last_used_at
       FROM user_passkeys WHERE user_id = $1 ORDER BY created_at DESC`,
      [request.user.sub]
    );
    return { passkeys: res.rows };
  });

  /**
   * DELETE /v1/auth/passkeys/:id — Remove a registered passkey
   */
  app.delete('/v1/auth/passkeys/:id', { onRequest: [app.authenticate] }, async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const res = await pool.query(
      'DELETE FROM user_passkeys WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, request.user.sub]
    );
    if (!res.rowCount) {
      return reply.status(404).send({ error: 'NOT_FOUND', message: 'Passkey not found.' });
    }
    return { ok: true, id };
  });

  /**
   * POST /v1/auth/oauth/google
   * Cryptographically verifies Google ID token via Google JWKS and issues JWT.
   */
  app.post(
    '/v1/auth/oauth/google',
    { config: { rateLimit: { max: 20, timeWindow: '10 minutes' } } },
    async (request, reply) => {
      const { idToken } = googleOAuthSchema.parse(request.body);

      const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
        issuer: ['https://accounts.google.com', 'accounts.google.com'],
        ...(env.GOOGLE_CLIENT_ID ? { audience: env.GOOGLE_CLIENT_ID } : {}),
      });

      const sub = payload.sub;
      const email = typeof payload.email === 'string' ? payload.email.toLowerCase() : null;
      const emailVerified = Boolean(payload.email_verified);
      const displayName =
        (typeof payload.name === 'string' && payload.name.trim()) ||
        (email ? email.split('@')[0] : 'Swami');

      if (!sub) {
        return reply.status(401).send({ error: 'INVALID_GOOGLE_TOKEN', message: 'Missing Google subject.' });
      }

      const existingOAuth = await pool.query(
        `SELECT user_id FROM oauth_accounts WHERE provider = 'google' AND provider_subject = $1 LIMIT 1`,
        [sub]
      );

      let userId: string | null = existingOAuth.rows[0]?.user_id ?? null;
      let isNewUser = false;

      if (!userId && email) {
        const byEmail = await pool.query('SELECT id FROM users WHERE email = $1 LIMIT 1', [email]);
        userId = byEmail.rows[0]?.id ?? null;
      }

      if (!userId) {
        const inserted = await pool.query(
          `INSERT INTO users (external_auth_id, email, display_name, email_verified, auth_provider, accepted_terms_at)
           VALUES ($1, $2, $3, $4, 'google', now())
           RETURNING id`,
          [`google:${sub}`, email, displayName, emailVerified]
        );
        userId = inserted.rows[0].id;
        isNewUser = true;
      }

      await pool.query(
        `INSERT INTO oauth_accounts (user_id, provider, provider_subject, email)
         VALUES ($1, 'google', $2, $3)
         ON CONFLICT (provider, provider_subject) DO UPDATE SET email = COALESCE(EXCLUDED.email, oauth_accounts.email)`,
        [userId, sub, email]
      );

      const userRow = (
        await pool.query(
          'SELECT id, email, phone, display_name AS name, created_at FROM users WHERE id = $1 LIMIT 1',
          [userId]
        )
      ).rows[0];

      if (isNewUser && userRow?.email) {
        void sendWelcomeEmail(userRow.email, userRow.name);
      }
      if (isNewUser && userRow?.id) {
        void enqueueNotification({
          userId: userRow.id,
          actionType: 'welcome',
          data: { name: userRow.name },
        });
      }

      const token = await app.jwt.sign(
        { sub: userRow.id, email: userRow.email, name: userRow.name },
        { expiresIn: '30d' }
      );

      return reply.status(200).send({
        ok: true,
        provider: 'google',
        token,
        user: {
          id: userRow.id,
          email: userRow.email,
          phone: userRow.phone,
          name: userRow.name,
          createdAt: userRow.created_at,
        },
      });
    }
  );

  /**
   * POST /v1/auth/oauth/apple
   * Cryptographically verifies Apple Identity Token via Apple JWKS and issues JWT.
   */
  app.post(
    '/v1/auth/oauth/apple',
    { config: { rateLimit: { max: 20, timeWindow: '10 minutes' } } },
    async (request, reply) => {
      const { identityToken, fullName, email: bodyEmail } = appleOAuthSchema.parse(request.body);

      const { payload } = await jwtVerify(identityToken, APPLE_JWKS, {
        issuer: 'https://appleid.apple.com',
        ...(env.APPLE_CLIENT_ID ? { audience: env.APPLE_CLIENT_ID } : {}),
      });

      const sub = payload.sub;
      const tokenEmail = typeof payload.email === 'string' ? payload.email.toLowerCase() : null;
      const email = tokenEmail ?? bodyEmail ?? null;
      const displayName = fullName?.trim() || (email ? email.split('@')[0] : 'Swami');

      if (!sub) {
        return reply.status(401).send({ error: 'INVALID_APPLE_TOKEN', message: 'Missing Apple subject.' });
      }

      const existingOAuth = await pool.query(
        `SELECT user_id FROM oauth_accounts WHERE provider = 'apple' AND provider_subject = $1 LIMIT 1`,
        [sub]
      );

      let userId: string | null = existingOAuth.rows[0]?.user_id ?? null;
      let isNewUser = false;

      if (!userId && email) {
        const byEmail = await pool.query('SELECT id FROM users WHERE email = $1 LIMIT 1', [email]);
        userId = byEmail.rows[0]?.id ?? null;
      }

      if (!userId) {
        const inserted = await pool.query(
          `INSERT INTO users (external_auth_id, email, display_name, email_verified, auth_provider, accepted_terms_at)
           VALUES ($1, $2, $3, true, 'apple', now())
           RETURNING id`,
          [`apple:${sub}`, email, displayName]
        );
        userId = inserted.rows[0].id;
        isNewUser = true;
      }

      await pool.query(
        `INSERT INTO oauth_accounts (user_id, provider, provider_subject, email)
         VALUES ($1, 'apple', $2, $3)
         ON CONFLICT (provider, provider_subject) DO UPDATE SET email = COALESCE(EXCLUDED.email, oauth_accounts.email)`,
        [userId, sub, email]
      );

      const userRow = (
        await pool.query(
          'SELECT id, email, phone, display_name AS name, created_at FROM users WHERE id = $1 LIMIT 1',
          [userId]
        )
      ).rows[0];

      if (isNewUser && userRow?.email) {
        void sendWelcomeEmail(userRow.email, userRow.name);
      }
      if (isNewUser && userRow?.id) {
        void enqueueNotification({
          userId: userRow.id,
          actionType: 'welcome',
          data: { name: userRow.name },
        });
      }

      const token = await app.jwt.sign(
        { sub: userRow.id, email: userRow.email, name: userRow.name },
        { expiresIn: '30d' }
      );

      return reply.status(200).send({
        ok: true,
        provider: 'apple',
        token,
        user: {
          id: userRow.id,
          email: userRow.email,
          phone: userRow.phone,
          name: userRow.name,
          createdAt: userRow.created_at,
        },
      });
    }
  );
};
