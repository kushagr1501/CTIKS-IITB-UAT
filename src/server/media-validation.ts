import sharp from 'sharp';
import { HttpError } from '@/server/http/errors';

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_PDF_BYTES = 25 * 1024 * 1024;
const MAX_IMAGE_PIXELS = 20_000_000;

export async function validateMediaFile(file: File, kind: 'image' | 'pdf') {
  const limit = kind === 'image' ? MAX_IMAGE_BYTES : MAX_PDF_BYTES;
  if (!file.size || file.size > limit)
    throw new HttpError(413, `Choose a ${kind === 'image' ? 'photo up to 8 MB' : 'PDF up to 25 MB'}.`);

  const bytes = new Uint8Array(await file.arrayBuffer());
  const jpg = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const png = bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => bytes[index] === byte);
  const webp = bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
  const pdf = bytes.length >= 5 && String.fromCharCode(...bytes.slice(0, 5)) === '%PDF-';
  const extension = kind === 'pdf' && pdf ? 'pdf' : kind === 'image' && jpg ? 'jpg' : kind === 'image' && png ? 'png' : kind === 'image' && webp ? 'webp' : null;
  if (!extension) throw new HttpError(400, kind === 'pdf' ? 'Choose a valid PDF.' : 'Choose a JPEG, PNG, or WebP image.');
  const mime = extension === 'jpg' ? 'image/jpeg' : extension === 'pdf' ? 'application/pdf' : `image/${extension}`;
  if (file.type && file.type !== mime) throw new HttpError(400, 'The file type does not match its contents.');

  if (kind === 'pdf') {
    const tail = new TextDecoder('latin1').decode(bytes.subarray(Math.max(0, bytes.length - 2048)));
    if (!tail.includes('%%EOF')) throw new HttpError(400, 'The PDF appears incomplete.');
  } else {
    try {
      const image = sharp(Buffer.from(bytes), { limitInputPixels: MAX_IMAGE_PIXELS, failOn: 'warning' });
      const metadata = await image.metadata();
      const expected = extension === 'jpg' ? 'jpeg' : extension;
      if (metadata.format !== expected || !metadata.width || !metadata.height ||
          metadata.width * metadata.height > MAX_IMAGE_PIXELS || (metadata.pages ?? 1) !== 1)
        throw new Error('Unsupported image dimensions or format.');
      await image.stats();
    } catch {
      throw new HttpError(400, 'The image is damaged, animated, or exceeds 20 million pixels.');
    }
  }
  return { bytes, extension, mime };
}
