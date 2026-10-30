import assert from 'node:assert/strict';
import { test } from 'node:test';
import { placeFacultyInCategory, replaceFacultyProfile, sortFaculty } from '../src/features/admin/faculty-order';
import type { FacultyCategory, FacultyRecord } from '../src/features/admin/types';

function member(id: string, category: FacultyCategory, displayOrder: number, name: string): FacultyRecord {
  return {
    id,
    category,
    displayOrder,
    name,
    slug: id,
    designation: '',
    department: 'CTIKS',
    interests: '',
    biography: '',
    imageUrl: '',
    websiteUrl: '',
    publicEmail: '',
    visible: true,
    version: 1,
    updatedAt: '2026-10-16T18:50:00.000Z',
    loginEmail: null,
  };
}

const initialFaculty = [
  member('core-0', 'CORE', 0, 'Prof. K. Ramasubramanian'),
  member('core-1', 'CORE', 1, 'Prof. Vijayaraghavan M. Chariar'),
  member('adjunct-0', 'ADJUNCT', 0, 'Adjunct Professor'),
  member('associate-0', 'ASSOCIATE', 0, 'Prof. Ashish Pandey'),
  member('associate-1', 'ASSOCIATE', 1, 'Prof. G. Siva Kumar'),
  member('visiting-0', 'VISITING', 0, 'Visiting Professor'),
];
const ids = (faculty: readonly FacultyRecord[]) => faculty.map((profile) => profile.id);

test('placing a profile shifts existing positions instead of duplicating them', () => {
  const core = initialFaculty.filter((person) => person.category === 'CORE');
  assert.deepEqual(placeFacultyInCategory(core, 'core-0', 1), [
    { id: 'core-1', displayOrder: 0 },
    { id: 'core-0', displayOrder: 1 },
  ]);
  assert.deepEqual(placeFacultyInCategory(core, 'core-new'), [
    { id: 'core-0', displayOrder: 0 },
    { id: 'core-1', displayOrder: 1 },
    { id: 'core-new', displayOrder: 2 },
  ]);
  assert.deepEqual(placeFacultyInCategory(core, 'core-0', 99).map((item) => item.id), ['core-1', 'core-0']);
});

test('hiding and showing any faculty keeps category groups and display positions unchanged', () => {
  let faculty = initialFaculty;
  for (const original of initialFaculty) {
    for (const visible of [false, true, false, true]) {
      const current = faculty.find((profile) => profile.id === original.id)!;
      faculty = replaceFacultyProfile(faculty, { ...current, visible, version: current.version + 1 });
      assert.deepEqual(ids(faculty), ids(initialFaculty));
      assert.equal(faculty.find((profile) => profile.id === original.id)!.visible, visible);
      assert.deepEqual(
        faculty.map(({ id, category, displayOrder }) => ({ id, category, displayOrder })),
        initialFaculty.map(({ id, category, displayOrder }) => ({ id, category, displayOrder })),
      );
    }
  }
  assert.ok(initialFaculty.every((profile) => profile.visible && profile.version === 1));
});

test('initial loads and updates share ordering, including duplicate names and order numbers', () => {
  const faculty = [
    member('visiting', 'VISITING', 0, 'A'),
    member('core-b', 'CORE', 0, 'Same name'),
    member('associate', 'ASSOCIATE', 0, 'A'),
    member('core-z', 'CORE', 1, 'A'),
    member('core-a', 'CORE', 0, 'Same name'),
    member('adjunct', 'ADJUNCT', 9, 'Z'),
  ];
  const expected = ['core-a', 'core-b', 'core-z', 'adjunct', 'associate', 'visiting'];
  assert.deepEqual(ids(sortFaculty(faculty)), expected);
  assert.deepEqual(ids(replaceFacultyProfile(faculty, { ...faculty[1], visible: false })), expected);
  assert.equal(faculty[0].id, 'visiting', 'sorting must not mutate the previous state');
});

test('edits and additions move profiles only according to category, order, and name', () => {
  const moved = replaceFacultyProfile(initialFaculty, { ...initialFaculty[1], displayOrder: 0, name: 'A' });
  assert.deepEqual(ids(moved), ['core-1', 'core-0', 'adjunct-0', 'associate-0', 'associate-1', 'visiting-0']);
  const recategorized = replaceFacultyProfile(initialFaculty, { ...initialFaculty[1], category: 'VISITING' });
  assert.deepEqual(ids(recategorized), [
    'core-0',
    'adjunct-0',
    'associate-0',
    'associate-1',
    'visiting-0',
    'core-1',
  ]);
  const added = replaceFacultyProfile(initialFaculty, member('core-new', 'CORE', 2, 'New Professor'));
  assert.deepEqual(ids(added), [
    'core-0',
    'core-1',
    'core-new',
    'adjunct-0',
    'associate-0',
    'associate-1',
    'visiting-0',
  ]);
});
