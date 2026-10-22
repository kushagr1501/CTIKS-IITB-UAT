import 'server-only';
import { createHash } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { HttpError } from '@/server/http/errors';

export const localMediaIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const localMediaNamePattern = /^[a-z0-9][a-z0-9-]{0,79}$/i;
export const localMediaExtensions = ['jpg', 'png', 'webp', 'pdf'] as const;
export type LocalMediaExtension = (typeof localMediaExtensions)[number];

export function profilePictureStem(slug: string) {
  const fullName = `prof-${slug}-profile-picture`;
  if (fullName.length <= 74) return fullName;
  const digest = createHash('sha256').update(slug).digest('hex').slice(0, 8);
  return `prof-${slug.slice(0, 40).replace(/-+$/g, '')}-${digest}-profile-picture`;
}

function studentPhotoPrefix(slug: string) {
  const digest = createHash('sha256').update(slug).digest('hex').slice(0, 8);
  return `prof-${slug.slice(0, 24).replace(/-+$/g, '')}-${digest}-student-`;
}

export function studentPhotoStem(slug: string, storageName: string) {
  const prefix = studentPhotoPrefix(slug);
  const name = storageName
    .replace(/^student-/i, '')
    .replace(/-photo$/i, '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const available = 74 - prefix.length - '-photo'.length;
  return `${prefix}${name.slice(0, available).replace(/-+$/g, '') || 'unnamed'}-photo`;
}

export function isOwnedStudentPhotoUrl(slug: string, url: string) {
  return new RegExp(
    `^/api/local-media/${studentPhotoPrefix(slug)}[a-z0-9][a-z0-9-]*-photo(?:-[0-9]+)?\\.(?:jpg|png|webp)$`,
    'i',
  ).test(url);
}

export function requireLocalMediaDevelopment() {
  if (process.env.NODE_ENV !== 'development') throw new HttpError(404, 'Not found.');
  let databaseUrl: URL;
  try {
    databaseUrl = new URL(process.env.DATABASE_URL ?? '');
  } catch {
    throw new HttpError(404, 'Local media uploads require a local PostgreSQL database.');
  }
  if (!['localhost', '127.0.0.1', '[::1]'].includes(databaseUrl.hostname)) {
    throw new HttpError(404, 'Local media uploads require a local PostgreSQL database.');
  }
}

export function localMediaDirectory() {
  const configured = process.env.CTIKS_LOCAL_MEDIA_DIR;
  const directory = path.resolve(configured || path.resolve(process.cwd(), '..', 'ctiks-local-media'));
  const projectDirectory = path.resolve(process.cwd());
  if (directory === projectDirectory || directory.startsWith(`${projectDirectory}${path.sep}`)) {
    throw new HttpError(500, 'Local media must be stored outside the project directory.');
  }
  return directory;
}

export async function ensureLocalMediaDirectory() {
  const directory = localMediaDirectory();
  await mkdir(directory, { recursive: true });
  return directory;
}
