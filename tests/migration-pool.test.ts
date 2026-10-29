import assert from 'node:assert/strict';
import { test } from 'node:test';
import pg from 'pg';
import { applyTestMigrations } from '../scripts/integration/migrations';

test('a failed migration closes its pool and preserves the original error', async (context) => {
  const failure = new Error('Injected migration failure');
  let queriedPool: pg.Pool | undefined;
  const closedPools: pg.Pool[] = [];
  // Stub before constructing the pool, so this test never opens a database connection.
  context.mock.method(pg.Pool.prototype, 'query', async function (this: pg.Pool) {
    queriedPool = this;
    throw failure;
  });
  context.mock.method(pg.Pool.prototype, 'end', async function (this: pg.Pool) {
    closedPools.push(this);
  });

  await assert.rejects(
    applyTestMigrations('postgresql://unused:unused@127.0.0.1:1/unused', 'ctiks_test_failure'),
    (error) => error === failure,
  );
  assert.ok(queriedPool, 'the migration query must have been attempted');
  assert.deepEqual(closedPools, [queriedPool], 'close the same pool exactly once');
});
