import { randomBytes, randomUUID } from 'node:crypto';
import { mkdir, writeFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { z } from 'zod';
import { setupDatabase } from './database';
import { hashPassword } from '../src/server/auth/passwords';
import { CORE_FACULTY, ASSOCIATE_FACULTY } from '../src/features/people/content';

const database = setupDatabase();
const email = z
  .email()
  .parse(process.env.ADMIN_EMAIL ?? 'admin@ctiks.local')
  .toLowerCase();

function slugify(name: string) {
  return name
    .replace(/^Prof\.\s*/i, '')
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

try {
  const existing = await database.user.findFirst({ where: { role: 'ADMIN' } });
  let adminId = existing?.id;
  if (!existing) {
    const credentialsFile = resolve(
      process.env.ADMIN_CREDENTIALS_FILE ?? '.private/admin-credentials.txt',
    );
    try {
      await access(credentialsFile);
      throw new Error('A credential file already exists; inspect setup before creating another admin.');
    } catch (error) {
      if (!(error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT')) throw error;
    }
    const password = randomBytes(24).toString('base64url');
    adminId = randomUUID();
    const passwordHash = await hashPassword(password);
    await database.$transaction(async (transaction) => {
      await transaction.user.create({
        data: {
          id: adminId!,
          name: 'CTIKS Administrator',
          email,
          role: 'ADMIN',
          accounts: {
            create: {
              id: randomUUID(),
              password: passwordHash,
            },
          },
        },
      });
      await transaction.auditEvent.create({
        data: {
          actorId: adminId,
          actorEmail: email,
          actorName: 'CTIKS Administrator',
          action: 'ADMIN_PROVISIONED',
        },
      });
    });
    await mkdir(resolve('.private'), { recursive: true });
    await writeFile(
      credentialsFile,
      `Login: http://127.0.0.1:3000/login\nEmail: ${email}\nPassword: ${password}\n\nStore this password safely. You can change it on /admin/security. This file is ignored by Git.\n`,
      { mode: 0o600 },
    );
    console.log(`Admin created. Credentials saved to ${credentialsFile}; password omitted from logs.`);
  } else console.log('An admin already exists; its credentials were not changed.');

  const faculty = [
    ...CORE_FACULTY.map((person, index) => ({ ...person, category: 'CORE' as const, displayOrder: index })),
    ...ASSOCIATE_FACULTY.map((person, index) => ({
      ...person,
      role: '',
      category: 'ASSOCIATE' as const,
      displayOrder: index,
    })),
  ];
  const result = await database.$transaction(async (transaction) => {
    const alreadyImported = await transaction.auditEvent.findFirst({
      where: { action: { in: ['FACULTY_IMPORTED', 'FACULTY_DELETED'] } },
      select: { id: true },
    });
    if (alreadyImported) return { count: 0 };
    const imported = await transaction.facultyProfile.createMany({
      skipDuplicates: true,
      data: faculty.map((person) => ({
        slug: slugify(person.name),
        name: person.name,
        category: person.category,
        designation: person.role,
        department: person.department,
        interests: person.tags,
        imageUrl: person.image ?? '',
        websiteUrl: person.website ?? '',
        displayOrder: person.displayOrder,
        visible: true,
      })),
    });
    if (imported.count)
      await transaction.auditEvent.create({
        data: {
          actorId: adminId,
          actorEmail: existing?.email ?? email,
          actorName: existing?.name ?? 'CTIKS Administrator',
          action: 'FACULTY_IMPORTED',
          details: { count: imported.count },
        },
      });
    return imported;
  });
  console.log(`Imported ${result.count} faculty profiles. Existing records were preserved.`);
} finally {
  await database.$disconnect();
}
