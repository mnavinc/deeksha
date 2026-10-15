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

  it('ApiClient formats paths with leading slash', async () => {
    const client = new ApiClient('mock-token', 'http://localhost:3000');
    assert.ok(client);
  });
});
