import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../src/app.js';
import type { FastifyInstance } from 'fastify';

describe('CORS and Request Hardening', () => {
  let app: FastifyInstance;

  before(async () => {
    app = await buildApp({ logger: false });
  });

  after(async () => {
    await app.close();
  });

  it('Preflight OPTIONS request returns correct CORS headers', async () => {
    const response = await app.inject({
      method: 'OPTIONS',
      url: '/v1/me',
      headers: {
        Origin: 'http://localhost:8081',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Authorization',
      },
    });

    assert.equal(response.statusCode, 204);
    assert.equal(response.headers['access-control-allow-origin'], 'http://localhost:8081');
    assert.equal(response.headers['access-control-allow-credentials'], 'true');
    assert.ok(response.headers['access-control-allow-methods']);
  });
});
