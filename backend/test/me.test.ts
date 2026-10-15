import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../src/app.js';
import type { FastifyInstance } from 'fastify';

describe('Me Route Authentication Guard', () => {
  let app: FastifyInstance;

  before(async () => {
    app = await buildApp({ logger: false });
  });

  after(async () => {
    await app.close();
  });

  it('GET /v1/me rejects unauthenticated request with 401', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/v1/me',
    });

    assert.equal(response.statusCode, 401);
    const body = JSON.parse(response.body);
    assert.ok(body.error);
    assert.ok(response.headers['x-request-id']);
  });

  it('PUT /v1/me rejects unauthenticated request with 401', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: '/v1/me',
      payload: { displayName: 'Devotee', language: 'te' },
    });

    assert.equal(response.statusCode, 401);
    const body = JSON.parse(response.body);
    assert.ok(body.error);
  });
});
