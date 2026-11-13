import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ApiClient, ApiError, getBaseApiUrl } from '../services/api';

describe('ApiClient & Network Resilience', () => {
  it('getBaseApiUrl returns a clean string without trailing slashes', () => {
    const url = getBaseApiUrl();
    assert.ok(typeof url === 'string');
    assert.ok(url.length > 0);
    assert.equal(url.endsWith('/'), false);
  });

  it('ApiError preserves status, code, and message', () => {
    const error = new ApiError(400, 'VALIDATION_ERROR', 'Invalid email address', { field: 'email' });
    assert.equal(error.status, 400);
    assert.equal(error.code, 'VALIDATION_ERROR');
    assert.equal(error.message, 'Invalid email address');
    assert.deepEqual(error.details, { field: 'email' });
  });

  it('ApiClient injects Bearer token and parses JSON responses', async () => {
    const originalFetch = globalThis.fetch;
    let capturedAuth: string | undefined;

    globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      capturedAuth = (init?.headers as Record<string, string>)?.Authorization;
      return new Response(JSON.stringify({ id: 'u-1', display_name: 'Swami', language: 'te' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }) as typeof fetch;

    try {
      const client = new ApiClient('jwt-secret-token', 'http://localhost:3000');
      const me = await client.getMe();
      assert.equal(capturedAuth, 'Bearer jwt-secret-token');
      assert.equal(me.id, 'u-1');
      assert.equal(me.display_name, 'Swami');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('ApiClient retries transient 503 GET errors and succeeds', async () => {
    const originalFetch = globalThis.fetch;
    let calls = 0;

    globalThis.fetch = (async () => {
      calls += 1;
      if (calls === 1) {
        return new Response(JSON.stringify({ error: 'UNAVAILABLE', message: 'Busy' }), {
          status: 503,
          headers: { 'content-type': 'application/json' },
        });
      }
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }) as typeof fetch;

    try {
      const client = new ApiClient('jwt-secret-token', 'http://localhost:3000');
      const groups = await client.getGroups();
      assert.equal(calls, 2);
      assert.deepEqual(groups, []);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
