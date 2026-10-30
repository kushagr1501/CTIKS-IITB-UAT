import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { authorizedRequest } from '@/server/http/authorized-handler';
import { HttpError } from '@/server/http/errors';
import { ensureLocalMediaDirectory, MAX_IMAGE_BYTES, requireLocalMediaAvailable, validateMediaFile } from '@/server/local-media';

export function POST(request: Request) {
  return authorizedRequest(request, 'faculty.update', async () => {
    requireLocalMediaAvailable();
    if (Number(request.headers.get('content-length') ?? 0) > MAX_IMAGE_BYTES + 131072)
      throw new HttpError(413, 'Photo is too large.');
    const form = await request.formData();
    const file = form.get('file');
    const slug = form.get('slug');
    if (!(file instanceof File)) throw new HttpError(400, 'Choose a photo.');
    if (typeof slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 180)
      throw new HttpError(400, 'Save a valid profile identifier before uploading.');
    const { bytes, extension } = await validateMediaFile(file, 'image');
    const name = `faculty-${slug.slice(0, 35).replace(/-+$/g, '')}-${randomUUID().replace(/-/g, '')}.${extension}`;
    await writeFile(path.join(/*turbopackIgnore: true*/ await ensureLocalMediaDirectory(), name), bytes, { flag: 'wx', mode: 0o600 });
    return Response.json({ url: `/api/local-media/${name}` });
  });
}
