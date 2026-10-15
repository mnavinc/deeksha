import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../src/app.js';
import type { FastifyInstance } from 'fastify';

describe('Auth Route Input Validation & Security', () => {
  let app: FastifyInstance;

  before(async () => {
    app = await buildApp({ logger: false });
  });

  after(async () => {
    await app.close();
  });

  it('POST /v1/auth/otp/send rejects invalid email format with 400 VALIDATION_ERROR', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/v1/auth/otp/send',
      payload: { identifier: 'not-an-email' },
    });

    assert.equal(response.statusCode, 400);
    const body = JSON.parse(response.body);
    assert.equal(body.error, 'VALIDATION_ERROR');
    assert.ok(Array.isArray(body.details));
    assert.ok(body.requestId);
  });

  it('POST /v1/auth/otp/send rejects missing identifier with 400 VALIDATION_ERROR', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/v1/auth/otp/send',
      payload: {},
    });

    assert.equal(response.statusCode, 400);
    const body = JSON.parse(response.body);
    assert.equal(body.error, 'VALIDATION_ERROR');
  });

  it('POST /v1/auth/otp/verify rejects invalid OTP length with 400 VALIDATION_ERROR', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/v1/auth/otp/verify',
      payload: {
        identifier: 'devotee@example.com',
        otp: '123', // < 6 digits
      },
    });

    assert.equal(response.statusCode, 400);
    const body = JSON.parse(response.body);
    assert.equal(body.error, 'VALIDATION_ERROR');
  });

  it('POST /v1/auth/otp/verify rejects missing otp code with 400 VALIDATION_ERROR', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/v1/auth/otp/verify',
      payload: {
        identifier: 'devotee@example.com',
      },
    });

    assert.equal(response.statusCode, 400);
    const body = JSON.parse(response.body);
    assert.equal(body.error, 'VALIDATION_ERROR');
  });
});
