import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { authorizedRequest } from '@/server/http/authorized-handler';
import { HttpError } from '@/server/http/errors';
import { ensureLocalMediaDirectory, requireLocalMediaDevelopment } from '@/server/local-media';

export function POST(request: Request) {
  return authorizedRequest(request, 'activity.create', async () => {
    requireLocalMediaDevelopment();
    if (Number(request.headers.get('content-length') ?? 0) > 25 * 1024 * 1024 + 131072) throw new HttpError(413, 'File is too large.');
    const form = await request.formData();
    const file = form.get('file');
    const kind = form.get('kind');
    if (!(file instanceof File) || (kind !== 'poster' && kind !== 'document')) throw new HttpError(400, 'Choose a file.');
    const limit = kind === 'poster' ? 8 * 1024 * 1024 : 25 * 1024 * 1024;
    if (!file.size || file.size > limit) throw new HttpError(413, 'File exceeds the size limit.');
    const bytes = new Uint8Array(await file.arrayBuffer());
    const pdf = bytes.length >= 5 && String.fromCharCode(...bytes.slice(0, 5)) === '%PDF-';
    const jpg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    const png = bytes.length >= 8 && [137,80,78,71,13,10,26,10].every((b,i) => bytes[i] === b);
    const webp = bytes.length >= 12 && String.fromCharCode(...bytes.slice(0,4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8,12)) === 'WEBP';
    const ext = kind === 'document' && pdf ? 'pdf' : kind === 'poster' && jpg ? 'jpg' : kind === 'poster' && png ? 'png' : kind === 'poster' && webp ? 'webp' : '';
    if (!ext) throw new HttpError(400, kind === 'document' ? 'Choose a PDF.' : 'Choose a JPEG, PNG or WebP image.');
    const title = String(form.get('title') || 'activity').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 35) || 'activity';
    const name = `activity-${title}-${kind}-${randomUUID().slice(0,8)}.${ext}`;
    await writeFile(path.join(await ensureLocalMediaDirectory(), name), bytes, { flag: 'wx', mode: 0o600 });
    return Response.json({ url: `/api/local-media/${name}` });
  });
}
