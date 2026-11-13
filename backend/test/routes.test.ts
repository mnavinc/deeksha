import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../src/app.js';
import type { FastifyInstance } from 'fastify';

describe('Enrollments, Groups & Community Route Guards & Validation', () => {
  let app: FastifyInstance;
  let token: string;

  before(async () => {
    app = await buildApp({ logger: false });
    token = app.jwt.sign({
      sub: '11111111-1111-4111-8111-111111111111',
      email: 'swami@example.com',
      name: 'Swami Test',
    });
  });

  after(async () => {
    await app.close();
  });

  it('rejects unauthenticated requests to enrollments, groups, and community routes with 401', async () => {
    const protectedEndpoints = [
      { method: 'GET' as const, url: '/v1/enrollments/active' },
      { method: 'POST' as const, url: '/v1/enrollments' },
      { method: 'GET' as const, url: '/v1/groups' },
      { method: 'POST' as const, url: '/v1/groups' },
      { method: 'POST' as const, url: '/v1/expenses' },
      { method: 'PUT' as const, url: '/v1/profiles/public' },
      { method: 'GET' as const, url: '/v1/guru/me/readiness' },
    ];

    for (const ep of protectedEndpoints) {
      const res = await app.inject({ method: ep.method, url: ep.url });
      assert.equal(res.statusCode, 401, `Expected 401 for ${ep.method} ${ep.url}`);
    }
  });

  it('POST /v1/enrollments rejects invalid deekshaTypeId and invalid date format with 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/enrollments',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        deekshaTypeId: 'invalid_type',
        malaDharanamDate: '13-11-2026',
        durationDays: 41,
        pilgrimageCount: 1,
      },
    });

    assert.equal(res.statusCode, 400);
    const body = JSON.parse(res.body);
    assert.equal(body.error, 'VALIDATION_ERROR');
  });

  it('PUT /v1/enrollments/:id/logs rejects non-UUID enrollment id with 400', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/v1/enrollments/not-a-uuid/logs',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        logDate: '2026-11-13',
        checkpoints: { morning_prayer: true },
        walkingKm: 3,
        saranamCount: 108,
      },
    });

    assert.equal(res.statusCode, 400);
    assert.equal(JSON.parse(res.body).error, 'VALIDATION_ERROR');
  });

  it('POST /v1/expenses rejects mismatched participant sharePaise sum with 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/expenses',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        groupId: '22222222-2222-4222-8222-222222222222',
        category: 'FOOD',
        description: 'Biksha prasadam',
        amountPaise: 50000,
        expenseDate: '2026-11-13',
        participants: [
          { userId: '11111111-1111-4111-8111-111111111111', sharePaise: 20000 },
          { userId: '33333333-3333-4333-8333-333333333333', sharePaise: 20000 },
        ],
      },
    });

    assert.equal(res.statusCode, 400);
    assert.equal(JSON.parse(res.body).error, 'VALIDATION_ERROR');
  });

  it('PUT /v1/profiles/public rejects handles with invalid characters with 400', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/v1/profiles/public',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        handle: 'bad handle!',
        isSearchable: true,
      },
    });

    assert.equal(res.statusCode, 400);
    assert.equal(JSON.parse(res.body).error, 'VALIDATION_ERROR');
  });
});

