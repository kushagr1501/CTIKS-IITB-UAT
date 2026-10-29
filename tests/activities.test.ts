import assert from 'node:assert/strict';
import { test } from 'node:test';
import { activityCreateSchema, activityUpdateSchema } from '../src/server/activities/schema';
import { eventSchedule, fromIndiaInputs, toIndiaInputs } from '../src/features/activities/dates';

const entry = {
  title: 'CTIKS seminar',
  description: 'A research seminar.',
  sections: ['EVENT'],
  imageUrl: '',
  eventStartAt: '2027-01-12T04:30:00.000Z',
  eventEndAt: '2027-01-12T11:00:00.000Z',
  venue: '',
  registrationUrl: '',
  visible: true,
};

test('activity dates round trip in IST independent of host timezone', () => {
  const utc = fromIndiaInputs('2027-01-12', '00:15');
  assert.equal(utc, '2027-01-11T18:45:00.000Z');
  assert.deepEqual(toIndiaInputs(utc), { date: '2027-01-12', time: '00:15' });
  assert.equal(fromIndiaInputs('', ''), null);
  assert.equal(fromIndiaInputs('2027-01-12', ''), '2027-01-11T18:30:00.000Z');
  assert.equal(fromIndiaInputs('2027-01-12', '', true), '2027-01-12T18:29:59.999Z');
  assert.deepEqual(toIndiaInputs(fromIndiaInputs('2027-01-12', ''), false), { date: '2027-01-12', time: '' });
  assert.equal(eventSchedule(fromIndiaInputs('2027-01-12', ''), fromIndiaInputs('2027-01-12', '', true), false)?.time, '');
  assert.throws(() => fromIndiaInputs('', '10:00'), /date/);
  assert.equal(eventSchedule(null, null), null);
  const schedule = eventSchedule(entry.eventStartAt, entry.eventEndAt)!;
  assert.match(schedule.time, /10:00 AM.*4:30 PM.*IST/);
  assert.match(eventSchedule(entry.eventStartAt, '2027-01-13T11:00:00Z')!.date, /12.*13/);
});

test('activity validation rejects bad ranges and unsafe links while accepting explicit clears', () => {
  assert.equal(activityCreateSchema.safeParse(entry).success, true);
  assert.equal(
    activityCreateSchema.safeParse({ ...entry, sections: ['NEWS', 'ANNOUNCEMENT'] }).success,
    true,
  );
  for (const changes of [
    { eventEndAt: entry.eventStartAt },
    { eventEndAt: null, eventHasTime: true },
    { eventEndAt: '2027-01-11T00:00:00Z' },
    { eventStartAt: null },
    { eventStartAt: '2027-01-12T10:00:00' },
    { eventStartAt: '2027-02-30T10:00:00Z' },
    { registrationUrl: 'javascript:alert(1)' },
    { registrationUrl: 'https://user:secret@example.com/' },
    { imageUrl: '//example.com/test.jpg' },
    { sections: [] },
    { sections: ['EVENT', 'EVENT'] },
    { title: ' ' },
    { description: ' ' },
    { createdAt: '2027-01-01T00:00:00Z' },
  ])
    assert.equal(
      activityCreateSchema.safeParse({ ...entry, ...changes }).success,
      false,
      JSON.stringify(changes),
    );
  assert.equal(activityCreateSchema.safeParse({ ...entry, eventHasTime: false, eventStartAt: fromIndiaInputs('2027-01-12', ''), eventEndAt: fromIndiaInputs('2027-01-12', '', true) }).success, true);
  const cleared = {
    ...entry,
    eventStartAt: null,
    eventEndAt: null,
    imageUrl: '',
    venue: '',
    registrationUrl: '',
    version: 1,
  };
  assert.equal(activityUpdateSchema.safeParse(cleared).success, true);
  assert.equal(activityUpdateSchema.safeParse({ ...cleared, version: 0 }).success, false);
});

test('retired campus updates cannot be selected or submitted', () => {
  assert.equal(activityCreateSchema.safeParse({ ...entry, sections: ['CAMPUS_UPDATE'] }).success, false);
  assert.equal(
    activityCreateSchema.safeParse({ ...entry, sections: ['NEWS', 'ANNOUNCEMENT', 'EVENT', 'CAMPUS_UPDATE'] })
      .success,
    false,
  );
  assert.equal(
    activityCreateSchema.safeParse({ ...entry, sections: ['CAMPUS_UPDATE', 'CAMPUS_UPDATE'] }).success,
    false,
  );
});

test('activity links accept custom labels, a neutral default, and explicit clearing', () => {
  for (const linkLabel of ['Register', 'More info', 'View notification', 'Apply now', '']) {
    const result = activityUpdateSchema.parse({ ...entry, version: 1, linkLabel });
    assert.equal(result.linkLabel, linkLabel);
  }
  assert.equal(activityCreateSchema.parse(entry).linkLabel, '');
  assert.equal(activityCreateSchema.parse({ ...entry, linkLabel: '  More info  ' }).linkLabel, 'More info');
  assert.equal(activityCreateSchema.safeParse({ ...entry, linkLabel: 'x'.repeat(61) }).success, false);
  assert.equal(activityCreateSchema.safeParse({ ...entry, linkLabel: 'More\u0000info' }).success, false);
});
