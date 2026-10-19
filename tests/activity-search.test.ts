import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  ACTIVITY_SEARCH_DELAY_MS,
  activitySearchUrl,
  createActivitySearchDebouncer,
  normalizeActivityQuery,
} from '../src/features/activities/search';

test('search waits until typing pauses and submits only the latest value', (context) => {
  context.mock.timers.enable({ apis: ['setTimeout'] });
  const searches: string[] = [];
  const debounce = createActivitySearchDebouncer((value) => searches.push(value));
  debounce.schedule('s');
  context.mock.timers.tick(200);
  debounce.schedule('sc');
  context.mock.timers.tick(200);
  debounce.schedule('science');
  context.mock.timers.tick(ACTIVITY_SEARCH_DELAY_MS - 1);
  assert.deepEqual(searches, []);
  context.mock.timers.tick(1);
  assert.deepEqual(searches, ['science']);
  context.mock.timers.tick(1000);
  assert.deepEqual(searches, ['science']);
});

test('Enter flushes immediately and cleanup prevents a delayed search', (context) => {
  context.mock.timers.enable({ apis: ['setTimeout'] });
  const searches: string[] = [];
  const debounce = createActivitySearchDebouncer((value) => searches.push(value));
  debounce.schedule('old');
  debounce.flush('latest');
  assert.deepEqual(searches, ['latest']);
  context.mock.timers.tick(1000);
  assert.deepEqual(searches, ['latest']);
  debounce.schedule('unmounted');
  debounce.cancel();
  context.mock.timers.tick(1000);
  assert.deepEqual(searches, ['latest']);
});

test('clearing replaces a pending term and resets pagination', (context) => {
  context.mock.timers.enable({ apis: ['setTimeout'] });
  const searches: string[] = [];
  const debounce = createActivitySearchDebouncer((value) => searches.push(activitySearchUrl('/news', value)));
  debounce.schedule('science');
  debounce.schedule('');
  context.mock.timers.tick(ACTIVITY_SEARCH_DELAY_MS);
  assert.deepEqual(searches, ['/news']);
  assert.equal(activitySearchUrl('/news', '  science & art  '), '/news?q=science+%26+art');
  assert.equal(normalizeActivityQuery('x'.repeat(250)).length, 200);
  assert.equal(activitySearchUrl('/activities', '   '), '/activities');
});
