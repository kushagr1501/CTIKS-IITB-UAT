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
  studentPhotoStem,
  isOwnedStudentPhotoUrl,
  facultyMediaStem,
  isOwnedFacultyMediaUrl,
  requireLocalMediaAvailable,
  validateMediaFile,
  MAX_PDF_BYTES,
} from '@/server/local-media';
import { HttpError } from '@/server/http/errors';


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
      await writeFile(path.join(/*turbopackIgnore: true*/ directory, name), bytes, { flag: 'wx', mode: 0o600 });
      return name;
    } catch (error) {
      if (!(error && typeof error === 'object' && 'code' in error && error.code === 'EEXIST')) throw error;
    }
  }
  throw new HttpError(409, 'Could not choose a unique filename. Rename the file and try again.');
}

export function POST(request: Request) {
  return authorizedRequest(request, 'faculty.self.update', async (actor) => {
    requireLocalMediaAvailable();
    const faculty = await getOwnFacultyEditor(actor);
    const contentLength = Number(request.headers.get('content-length') ?? 0);
    if (contentLength > MAX_PDF_BYTES + 128 * 1024) throw new HttpError(413, 'The selected file is too large.');
    const form = await request.formData();
    const isProfilePicture = form.get('kind') === 'profile-picture';
    const isStudentPhoto = form.get('kind') === 'student-photo';
    const file = form.get('file');
    if (!(file instanceof File)) throw new HttpError(400, 'Choose a photo or PDF to upload.');
    const requestedStorageName = form.get('storageName');
    if (!isProfilePicture && (typeof requestedStorageName !== 'string' || !requestedStorageName.trim())) {
      throw new HttpError(400, 'The profile section name is required for this upload.');
    }
    const isDocument = !isProfilePicture && !isStudentPhoto;
    if (isDocument && !/^(?:publication|patent)-/i.test(requestedStorageName as string))
      throw new HttpError(400, 'Choose a publication or patent PDF.');
    const { bytes, extension, mime } = await validateMediaFile(file, isDocument ? 'pdf' : 'image');
    const directory = await ensureLocalMediaDirectory();
    const storageName = isProfilePicture
      ? profilePictureStem(faculty.identity.slug)
      : isStudentPhoto
        ? studentPhotoStem(faculty.identity.slug, requestedStorageName as string)
        : facultyMediaStem(faculty.identity.slug, requestedStorageName as string);
    const savedName = await saveWithReadableName(directory, storageName, extension, bytes);
    return Response.json({ url: `/api/local-media/${savedName}`, mimeType: mime });
  });
}

export function DELETE(request: Request) {
  return authorizedRequest(request, 'faculty.self.update', async (actor) => {
    requireLocalMediaAvailable();
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
        (!isOwnedFacultyMediaUrl(faculty.identity.slug, url) &&
          !new RegExp(`^${profilePictureStem(faculty.identity.slug)}(?:-[0-9]+)?$`, 'i').test(stem) &&
          !isOwnedStudentPhotoUrl(faculty.identity.slug, url))
      ) {
        throw new HttpError(403, 'You can only clean up your own files.');
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
        await unlink(path.join(/*turbopackIgnore: true*/ directory, `${stem}.${match[2]}`));
        deleted += 1;
      } catch (error) {
        if (!(error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT')) throw error;
      }
    }
    return Response.json({ deleted });
  });
}
