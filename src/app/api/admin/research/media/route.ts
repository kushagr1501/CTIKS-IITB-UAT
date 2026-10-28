import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { authorizedRequest } from '@/server/http/authorized-handler';
import { HttpError } from '@/server/http/errors';
import { ensureLocalMediaDirectory, requireLocalMediaDevelopment } from '@/server/local-media';

export function POST(request: Request) {
  return authorizedRequest(request, 'research.create', async () => {
    requireLocalMediaDevelopment();
    if (Number(request.headers.get('content-length') ?? 0) > 8 * 1024 * 1024 + 131072)
      throw new HttpError(413, 'Image is too large.');
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File) || !file.size || file.size > 8 * 1024 * 1024)
      throw new HttpError(400, 'Choose an image up to 8 MB.');
    const bytes = new Uint8Array(await file.arrayBuffer());
    const jpg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    const png =
      bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => bytes[index] === byte);
    const webp =
      bytes.length >= 12 &&
      String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
      String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
    const extension = jpg ? 'jpg' : png ? 'png' : webp ? 'webp' : null;
    if (!extension) throw new HttpError(400, 'Choose a JPEG, PNG, or WebP image.');
    const title =
      String(form.get('title') || 'research')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 35) || 'research';
    const name = `research-${title}-${randomUUID().slice(0, 8)}.${extension}`;
    await writeFile(path.join(await ensureLocalMediaDirectory(), name), bytes, { flag: 'wx', mode: 0o600 });
    return Response.json({ url: `/api/local-media/${name}` });
  });
}
