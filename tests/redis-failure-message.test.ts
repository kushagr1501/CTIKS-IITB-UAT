import assert from 'node:assert/strict';
import { test } from 'node:test';
import { safeRedisFailureMessage } from '../src/server/redis/failure-message';

test('Redis diagnostics retain safe messages and redact connection and unknown details', () => {
  assert.equal(safeRedisFailureMessage(new Error('Command timed out')), 'Command timed out');
  assert.equal(
    safeRedisFailureMessage(new Error('connect ECONNREFUSED redis://user:password@example.test:6379')),
    'connect ECONNREFUSED [details redacted]',
  );
  assert.equal(safeRedisFailureMessage(new Error('password=secret token=abc')), '[error message redacted]');
  assert.equal(safeRedisFailureMessage('secret'), '[error message redacted]');
});
