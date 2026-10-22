import { unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Prisma } from '@/generated/prisma/client';
import { authorizedRequest } from '@/server/http/authorized-handler';
import { getOwnFacultyEditor } from '@/server/faculty/editor';
import { getDatabase } from '@/server/database/client';
import { readJson } from '@/server/http/body';
import {
  ensureLocalMediaDirectory,
  localMediaDirectory,
  localMediaNamePattern,
  profilePictureStem,
  requireLocalMediaDevelopment,
} from '@/server/local-media';
import { HttpError } from '@/server/http/errors';

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_PDF_BYTES = 25 * 1024 * 1024;

function readableFileStem(fileName: string) {
  const baseName = fileName.replace(/\\/g, '/').split('/').pop()?.replace(/\.[^.]*$/, '') ?? '';
  const stem = baseName
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 74)
    .replace(/-+$/g, '');
  const safeStem = stem || 'upload';
  return /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(safeStem) ? `file-${safeStem}` : safeStem;
}

async function saveWithReadableName(directory: string, storageName: string, extension: string, bytes: Uint8Array) {
  const stem = readableFileStem(storageName);
  for (let suffix = 1; suffix <= 10000; suffix += 1) {
    const name = `${stem}${suffix === 1 ? '' : `-${suffix}`}.${extension}`;
    try {
      await writeFile(path.join(directory, name), bytes, { flag: 'wx', mode: 0o600 });
      return name;
    } catch (error) {
      if (!(error && typeof error === 'object' && 'code' in error && error.code === 'EEXIST')) throw error;
    }
  }
  throw new HttpError(409, 'Could not choose a unique filename. Rename the file and try again.');
}

function detectFile(bytes: Uint8Array): { extension: 'jpg' | 'png' | 'webp' | 'pdf'; mime: string } | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
    return { extension: 'jpg', mime: 'image/jpeg' };
  if (bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => bytes[index] === byte))
    return { extension: 'png', mime: 'image/png' };
  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
    String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
  )
    return { extension: 'webp', mime: 'image/webp' };
  if (String.fromCharCode(...bytes.slice(0, 5)) === '%PDF-')
    return { extension: 'pdf', mime: 'application/pdf' };
  return null;
}

export function POST(request: Request) {
  return authorizedRequest(request, 'faculty.self.update', async (actor) => {
    requireLocalMediaDevelopment();
    const faculty = await getOwnFacultyEditor(actor);
    const contentLength = Number(request.headers.get('content-length') ?? 0);
    if (contentLength > MAX_PDF_BYTES + 128 * 1024) throw new HttpError(413, 'The selected file is too large.');
    const form = await request.formData();
    const isProfilePicture = form.get('kind') === 'profile-picture';
    if (!isProfilePicture && faculty.identity.slug !== 'vijayaraghavan-m-chariar') {
      throw new HttpError(403, 'Other local uploads are currently enabled only for Prof. VJ.');
    }
    const file = form.get('file');
    if (!(file instanceof File)) throw new HttpError(400, 'Choose a photo or PDF to upload.');
    const requestedStorageName = form.get('storageName');
    if (!isProfilePicture && (typeof requestedStorageName !== 'string' || !requestedStorageName.trim())) {
      throw new HttpError(400, 'The profile section name is required for this upload.');
    }
    if (file.size > MAX_PDF_BYTES) throw new HttpError(413, 'The selected file exceeds the 25 MB limit.');
    const bytes = new Uint8Array(await file.arrayBuffer());
    const detected = detectFile(bytes);
    if (!detected) throw new HttpError(400, 'Use a JPEG, PNG, WebP, or PDF file.');
    if (isProfilePicture && detected.extension === 'pdf') {
      throw new HttpError(400, 'Choose a JPEG, PNG, or WebP profile picture.');
    }
    const maxBytes = detected.extension === 'pdf' ? MAX_PDF_BYTES : MAX_IMAGE_BYTES;
    if (bytes.byteLength > maxBytes) {
      throw new HttpError(
        413,
        `This file exceeds the ${detected.extension === 'pdf' ? '25 MB' : '8 MB'} limit.`,
      );
    }
    const directory = await ensureLocalMediaDirectory();
    const storageName = isProfilePicture
      ? profilePictureStem(faculty.identity.slug)
      : requestedStorageName as string;
    const savedName = await saveWithReadableName(directory, storageName, detected.extension, bytes);
    return Response.json({ url: `/api/local-media/${savedName}`, mimeType: detected.mime });
  });
}

export function DELETE(request: Request) {
  return authorizedRequest(request, 'faculty.self.update', async (actor) => {
    requireLocalMediaDevelopment();
    const faculty = await getOwnFacultyEditor(actor);
    const body = await readJson(request, 16_384);
    if (
      !body ||
      typeof body !== 'object' ||
      !('urls' in body) ||
      !Array.isArray(body.urls) ||
      body.urls.length > 100
    ) {
      throw new HttpError(400, 'Provide a list of local media URLs to clean up.');
    }
    const urls = [...new Set(body.urls)];
    if (urls.some((url) => typeof url !== 'string')) throw new HttpError(400, 'Invalid local media URL.');

    const directory = localMediaDirectory();
    const database = getDatabase();
    let deleted = 0;
    for (const url of urls as string[]) {
      const match = /^\/api\/local-media\/([a-z0-9][a-z0-9-]{0,79})\.(jpg|png|webp|pdf)$/i.exec(url);
      if (!match || !localMediaNamePattern.test(match[1])) throw new HttpError(400, 'Invalid local media URL.');
      const [, stem] = match;
      if (
        faculty.identity.slug !== 'vijayaraghavan-m-chariar' &&
        (match[2].toLowerCase() === 'pdf' ||
          !new RegExp(`^${profilePictureStem(faculty.identity.slug)}(?:-[0-9]+)?$`, 'i').test(stem))
      ) {
        throw new HttpError(403, 'You can only clean up your own profile pictures.');
      }
      const referenced = await database.$queryRaw<{ used: boolean }[]>(Prisma.sql`
        SELECT EXISTS (
          SELECT 1 FROM "faculty_profiles" WHERE "imageUrl" = ${url}
          UNION ALL SELECT 1 FROM "faculty_profile_revisions" WHERE "imageUrl" = ${url}
          UNION ALL SELECT 1 FROM "faculty_publications" WHERE "url" = ${url}
          UNION ALL SELECT 1 FROM "faculty_patents" WHERE "url" = ${url}
          UNION ALL SELECT 1 FROM "faculty_students" WHERE "imageUrl" = ${url}
        ) AS "used"
      `);
      if (referenced[0]?.used) continue;
      try {
        await unlink(path.join(directory, `${stem}.${match[2]}`));
        deleted += 1;
      } catch (error) {
        if (!(error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT')) throw error;
      }
    }
    return Response.json({ deleted });
  });
}
