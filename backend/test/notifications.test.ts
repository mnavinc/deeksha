import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../src/app.js';
import type { FastifyInstance } from 'fastify';

describe('Notifications & BullMQ Worker Route Guards & Validation', () => {
  let app: FastifyInstance;

  before(async () => {
    app = await buildApp({ logger: false });
  });

  after(async () => {
    await app.close();
  });

  it('rejects unauthenticated requests to notification endpoints with 401', async () => {
    const endpoints = [
      { method: 'GET' as const, url: '/v1/notifications' },
      { method: 'POST' as const, url: '/v1/notifications/push-token', payload: { token: 'ExponentPushToken[abc123456789]', platform: 'android' } },
      { method: 'POST' as const, url: '/v1/notifications/trigger', payload: { actionType: 'checkin_completed' } },
      { method: 'POST' as const, url: '/v1/notifications/read-all' },
    ];

    for (const ep of endpoints) {
      const res = await app.inject(ep);
      assert.equal(res.statusCode, 401, `${ep.method} ${ep.url} should require auth`);
    }
  });

  it('POST /v1/notifications/push-token rejects invalid platform with 400 VALIDATION_ERROR', async () => {
    const token = app.jwt.sign({ sub: '11111111-1111-4111-8111-111111111111' });
    const res = await app.inject({
      method: 'POST',
      url: '/v1/notifications/push-token',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        token: 'ExponentPushToken[validtoken123]',
        platform: 'windows-phone',
      },
    });

    assert.equal(res.statusCode, 400);
    const body = JSON.parse(res.body);
    assert.equal(body.error, 'VALIDATION_ERROR');
  });

  it('POST /v1/notifications/trigger rejects unknown actionType with 400 VALIDATION_ERROR', async () => {
    const token = app.jwt.sign({ sub: '11111111-1111-4111-8111-111111111111' });
    const res = await app.inject({
      method: 'POST',
      url: '/v1/notifications/trigger',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        actionType: 'unknown_action',
        delaySeconds: 10,
      },
    });

    assert.equal(res.statusCode, 400);
    const body = JSON.parse(res.body);
    assert.equal(body.error, 'VALIDATION_ERROR');
  });

  it('POST /v1/notifications/trigger accepts valid actionType and returns ok (queued=false without Redis in test)', async () => {
    const token = app.jwt.sign({ sub: '11111111-1111-4111-8111-111111111111' });
    const res = await app.inject({
      method: 'POST',
      url: '/v1/notifications/trigger',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        actionType: 'checkin_completed',
        delaySeconds: 60,
        data: { day: 5, points: 25 },
      },
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.ok, true);
    assert.equal(body.queued, false);
    assert.equal(body.jobId, null);
  });
});
