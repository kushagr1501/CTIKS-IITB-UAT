import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { authorizedRequest } from '@/server/http/authorized-handler';
import { HttpError } from '@/server/http/errors';
import { ensureLocalMediaDirectory, requireLocalMediaAvailable, validateMediaFile } from '@/server/local-media';

export function POST(request: Request) {
  return authorizedRequest(request, 'research.create', async () => {
    requireLocalMediaAvailable();
    if (Number(request.headers.get('content-length') ?? 0) > 8 * 1024 * 1024 + 131072)
      throw new HttpError(413, 'Image is too large.');
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) throw new HttpError(400, 'Choose an image up to 8 MB.');
    const { bytes, extension } = await validateMediaFile(file, 'image');
    const title =
      String(form.get('title') || 'research')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 35) || 'research';
    const name = `research-${title}-${randomUUID().replace(/-/g, '')}.${extension}`;
    await writeFile(path.join(/*turbopackIgnore: true*/ await ensureLocalMediaDirectory(), name), bytes, { flag: 'wx', mode: 0o600 });
    return Response.json({ url: `/api/local-media/${name}` });
  });
}
