import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  localMediaDirectory,
  localMediaExtensions,
  localMediaIdPattern,
  localMediaNamePattern,
  requireLocalMediaDevelopment,
} from '@/server/local-media';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireLocalMediaDevelopment();
    const { id: fileId } = await params;
    const match =
      /^([0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})(?:\.(jpg|png|webp|pdf))?$/i.exec(
        fileId,
      );
    const namedMatch = /^([a-z0-9][a-z0-9-]{0,79})\.(jpg|png|webp|pdf)$/i.exec(fileId);
    if (
      (!match || !localMediaIdPattern.test(match[1])) &&
      (!namedMatch || !localMediaNamePattern.test(namedMatch[1]))
    ) {
      return new Response('Not found.', { status: 404 });
    }
    const id = match?.[1] ?? namedMatch?.[1];
    const requestedExtension = match?.[2] ?? namedMatch?.[2];
    if (!id) return new Response('Not found.', { status: 404 });
    const directory = localMediaDirectory();
    const extensions = requestedExtension ? [requestedExtension] : localMediaExtensions;
    for (const extension of extensions) {
      try {
        const bytes = await readFile(path.join(directory, `${id}.${extension}`));
        const contentType =
          extension === 'pdf' ? 'application/pdf' : extension === 'jpg' ? 'image/jpeg' : `image/${extension}`;
        return new Response(bytes, {
          headers: {
            'content-type': contentType,
            'content-disposition': 'inline',
            'x-content-type-options': 'nosniff',
            'cache-control': 'no-store',
          },
        });
      } catch (error) {
        if (!(error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT')) throw error;
      }
    }
    return new Response('Not found.', { status: 404 });
  } catch {
    return new Response('Not found.', { status: 404 });
  }
}
