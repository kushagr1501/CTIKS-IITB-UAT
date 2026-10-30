import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { authorizedRequest } from '@/server/http/authorized-handler';
import { HttpError } from '@/server/http/errors';
import { ensureLocalMediaDirectory, requireLocalMediaAvailable, validateMediaFile } from '@/server/local-media';

export function POST(request: Request) {
  return authorizedRequest(request, 'activity.create', async () => {
    requireLocalMediaAvailable();
    if (Number(request.headers.get('content-length') ?? 0) > 25 * 1024 * 1024 + 131072) throw new HttpError(413, 'File is too large.');
    const form = await request.formData();
    const file = form.get('file');
    const kind = form.get('kind');
    if (!(file instanceof File) || (kind !== 'poster' && kind !== 'document')) throw new HttpError(400, 'Choose a file.');
    const { bytes, extension } = await validateMediaFile(file, kind === 'poster' ? 'image' : 'pdf');
    const title = String(form.get('title') || 'activity').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 27) || 'activity';
    const name = `activity-${title}-${kind}-${randomUUID().replace(/-/g, '')}.${extension}`;
    await writeFile(path.join(/*turbopackIgnore: true*/ await ensureLocalMediaDirectory(), name), bytes, { flag: 'wx', mode: 0o600 });
    return Response.json({ url: `/api/local-media/${name}` });
  });
}
