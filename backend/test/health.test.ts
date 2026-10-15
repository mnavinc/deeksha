import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../src/app.js';
import type { FastifyInstance } from 'fastify';

describe('Health and Readiness Probes', () => {
  let app: FastifyInstance;

  before(async () => {
    app = await buildApp({ logger: false });
  });

  after(async () => {
    await app.close();
  });

  it('GET /health returns 200 with service metadata and uptime', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    assert.equal(response.statusCode, 200);
    const body = JSON.parse(response.body);
    assert.equal(body.status, 'ok');
    assert.equal(body.service, 'deeksha-journey-api');
    assert.ok(typeof body.uptime === 'number');
    assert.ok(body.timestamp);
    assert.ok(body.node);
  });

  it('Responses contain x-request-id header for distributed tracing', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    assert.ok(response.headers['x-request-id']);
  });
});
