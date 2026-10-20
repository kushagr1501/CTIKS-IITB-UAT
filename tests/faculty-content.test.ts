import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  academicContentSchema,
  facultyContentRequestSchema,
  type AcademicContent,
} from '../src/features/faculty/profile-schema';
import {
  studentPhotoSchema,
  studentSocialLinksSchema,
  readStudentSocialLinks,
} from '../src/features/faculty/student-schema';

const empty: AcademicContent = {
  name: 'Faculty Member',
  designation: '',
  department: 'Centre for Traditional Indian Knowledge and Skills',
  biography: '',
  imageUrl: '',
  websiteUrl: '',
  publicEmail: '',
  interests: '',
  researchTags: [],
  researchOverview: '',
  officeAddress: '',
  publicPhone: '',
  education: [],
  experience: [],
  courses: [],
  publications: [],
  patents: [],
  students: [],
};
const request = { action: 'publish', profileVersion: 1, draftVersion: null, content: empty };

test('self editing rejects identity, account, review and child ownership fields', () => {
  for (const field of ['facultyId', 'userId', 'role', 'version', 'identity'])
    assert.equal(
      facultyContentRequestSchema.safeParse({ ...request, [field]: 'injected' }).success,
      false,
      field,
    );
  for (const field of [
    'slug',
    'category',
    'visible',
    'displayOrder',
    'publishedAt',
  ])
    assert.equal(academicContentSchema.safeParse({ ...empty, [field]: 'injected' }).success, false, field);
  assert.equal(
    academicContentSchema.safeParse({
      ...empty,
      name: 'Professor Name',
      designation: 'Professor',
      department: 'CTIKS, IIT Bombay',
    }).success,
    true,
    'faculty identity fields are editable through the profile editor',
  );
  for (const field of ['id', 'revisionId', 'facultyId', 'displayOrder'])
    assert.equal(
      academicContentSchema.safeParse({
        ...empty,
        education: [{ title: 'PhD', institution: '', description: '', periodText: '', [field]: 'injected' }],
      }).success,
      false,
      field,
    );
});
test('empty fields and arrays explicitly clear optional content, while stale version syntax is rejected', () => {
  assert.deepEqual(academicContentSchema.parse(empty), empty);
  assert.equal(facultyContentRequestSchema.safeParse({ ...request, profileVersion: 0 }).success, false);
  assert.equal(facultyContentRequestSchema.safeParse({ ...request, draftVersion: -1 }).success, false);
  assert.equal(
    facultyContentRequestSchema.safeParse({ ...request, content: { biography: '' } }).success,
    false,
  );
});
test('profile validation rejects unsafe links, duplicate tags, excessive rows and empty entry titles', () => {
  for (const websiteUrl of ['javascript:alert(1)', 'http://example.com', 'https://user:password@example.com'])
    assert.equal(academicContentSchema.safeParse({ ...empty, websiteUrl }).success, false);
  assert.equal(
    academicContentSchema.safeParse({ ...empty, researchTags: ['Sanskrit', ' sanskrit '] }).success,
    false,
  );
  assert.equal(
    academicContentSchema.safeParse({
      ...empty,
      researchTags: Array.from({ length: 31 }, (_, index) => `Area ${index}`),
    }).success,
    false,
  );
  const row = { title: 'PhD', institution: '', description: '', periodText: '' };
  assert.equal(academicContentSchema.safeParse({ ...empty, education: Array(101).fill(row) }).success, false);
  assert.equal(
    academicContentSchema.safeParse({ ...empty, education: [{ ...row, title: '  ' }] }).success,
    false,
  );
});
test('nullable publication years and student graduation rules preserve explicit clears', () => {
  const student = {
    name: 'Student',
    programme: 'PhD',
    biography: '',
    researchTopic: '',
    supervisionRole: '',
    periodText: '',
    status: 'CURRENT',
    graduationYear: null,
  };
  assert.equal(academicContentSchema.safeParse({ ...empty, students: [student] }).success, true);
  assert.equal(
    academicContentSchema.safeParse({ ...empty, students: [{ ...student, graduationYear: 2025 }] }).success,
    false,
  );
  assert.equal(
    academicContentSchema.safeParse({
      ...empty,
      students: [{ ...student, status: 'GRADUATED', graduationYear: 2025 }],
    }).success,
    true,
  );
});

test('student photos and platform links reject unsafe URLs, duplicates and hidden ownership fields', () => {
  for (const unsafe of [
    'javascript:alert(1)',
    'http://example.com/photo.jpg',
    'https://user:secret@example.com/photo.jpg',
  ])
    assert.equal(studentPhotoSchema.safeParse(unsafe).success, false);
  assert.equal(studentPhotoSchema.safeParse('/assets/student.jpg').success, true);
  assert.equal(studentPhotoSchema.safeParse('').success, true);
  const linkedin = { platform: 'LINKEDIN', url: 'https://www.linkedin.com/in/student/' };
  assert.deepEqual(studentSocialLinksSchema.parse([linkedin]), [linkedin]);
  for (const links of [
    [{ ...linkedin, url: 'javascript:alert(1)' }],
    [{ ...linkedin, url: '' }],
    [{ ...linkedin, platform: 'ADMIN' }],
    [linkedin, linkedin],
    [{ ...linkedin, userId: 'injected' }],
  ])
    assert.equal(studentSocialLinksSchema.safeParse(links).success, false);
  assert.deepEqual(studentSocialLinksSchema.parse([]), []);
  assert.deepEqual(readStudentSocialLinks({ url: 'unsafe' }), []);
});
