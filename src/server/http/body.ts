import { HttpError } from './errors';

export async function readJson(request: Request, maximumBytes = 32_768): Promise<unknown> {
  if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') {
    throw new HttpError(415, 'A JSON request is required.');
  }
  const declaredLength = Number(request.headers.get('content-length'));
  if (declaredLength > maximumBytes) throw new HttpError(413, 'The request is too large.');
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, 'A request body is required.');
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maximumBytes) {
      await reader.cancel();
      throw new HttpError(413, 'The request is too large.');
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new HttpError(400, 'The JSON request is invalid.');
  }
}
