import { ZodError } from 'zod';

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function errorResponse(error: unknown) {
  const headers = { 'Cache-Control': 'no-store' };
  if (error instanceof HttpError)
    return Response.json({ error: error.message }, { status: error.status, headers });
  if (error instanceof ZodError) {
    return Response.json(
      { error: 'Please check the submitted fields.', fields: error.flatten().fieldErrors },
      { status: 400, headers },
    );
  }
  const code = error && typeof error === 'object' && 'code' in error ? error.code : undefined;
  if (code === 'P2002')
    return Response.json({ error: 'This value is already in use.' }, { status: 409, headers });
  // Log neither request bodies nor database exceptions, which can contain secrets.
  console.error('Backend request failed:', error instanceof Error ? error.constructor.name : 'UnknownError');
  return Response.json(
    { error: 'The operation could not be completed. Please try again.' },
    { status: 500, headers },
  );
}
