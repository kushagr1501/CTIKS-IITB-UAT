import assert from 'node:assert/strict';
import { test } from 'node:test';
import sharp from 'sharp';
import { validateMediaFile } from '../src/server/media-validation';
import { HttpError } from '../src/server/http/errors';

const file = (bytes: Uint8Array, name: string, type: string) => new File([bytes], name, { type });
const rejectsWith = (status: number) => (error: unknown) => error instanceof HttpError && error.status === status;

test('accepts a decoded JPEG and rejects mismatched or damaged images', async () => {
  const jpeg = await sharp({ create: { width: 8, height: 8, channels: 3, background: 'red' } }).jpeg().toBuffer();
  assert.equal((await validateMediaFile(file(jpeg, 'portrait.jpg', 'image/jpeg'), 'image')).extension, 'jpg');
  await assert.rejects(validateMediaFile(file(jpeg, 'portrait.png', 'image/png'), 'image'), rejectsWith(400));
  await assert.rejects(validateMediaFile(file(jpeg.subarray(0, 12), 'broken.jpg', 'image/jpeg'), 'image'), rejectsWith(400));
});

test('rejects files over the byte limit and PDFs without an end marker', async () => {
  await assert.rejects(validateMediaFile(file(new Uint8Array(8 * 1024 * 1024 + 1), 'large.jpg', 'image/jpeg'), 'image'), rejectsWith(413));
  await assert.rejects(validateMediaFile(file(new TextEncoder().encode('%PDF-1.7\n'), 'broken.pdf', 'application/pdf'), 'pdf'), rejectsWith(400));
  assert.equal((await validateMediaFile(file(new TextEncoder().encode('%PDF-1.7\n%%EOF\n'), 'document.pdf', 'application/pdf'), 'pdf')).extension, 'pdf');
});
