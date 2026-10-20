import { ZodError } from 'zod';

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

function validationHint(error: unknown) {
  if (!(error instanceof Error) || error.name !== 'PrismaClientValidationError') return undefined;
  // Prisma's full validation message includes the submitted create/update object,
  // so expose only recognized, value-free field/type diagnostics in local dev.
  const message = error.message.replace(/\s+/g, ' ');
  const hints: string[] = [];
  for (const match of message.matchAll(
    /Argument `([A-Za-z0-9_]+)`: Invalid value provided\. Expected ([A-Za-z0-9_ |]+), provided \(?([A-Za-z0-9_]+)\)?\./g,
  )) {
    hints.push(`${match[1]} expected ${match[2].trim()}, received ${match[3]}`);
  }
  for (const match of message.matchAll(/Argument `([A-Za-z0-9_]+)` is missing\./g)) {
    hints.push(`${match[1]} is missing`);
  }
  for (const match of message.matchAll(/Unknown argument `([A-Za-z0-9_]+)`\./g)) {
    hints.push(`unknown argument ${match[1]}`);
  }
  if (!hints.length) {
    const typeMismatch = message.match(
      /Expected ([A-Za-z0-9_ |]+), provided \(?([A-Za-z0-9_]+)\)?\./,
    );
    if (typeMismatch) hints.push(`expected ${typeMismatch[1].trim()}, received ${typeMismatch[2]}`);
  }
  return hints.length ? hints.slice(0, 3).join('; ') : undefined;
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
  // Keep diagnostics limited to the error class and stable code. Never log request
  // bodies, SQL, connection details, or database exception messages.
  const errorName = error instanceof Error ? error.name : 'UnknownError';
  const errorCode =
    error && typeof error === 'object' && 'code' in error && typeof error.code === 'string'
      ? error.code
      : undefined;
  const hint = validationHint(error);
  const diagnostic = [errorCode ? `${errorName} (${errorCode})` : errorName, hint]
    .filter(Boolean)
    .join(': ');
  console.error('Backend request failed:', diagnostic);
  return Response.json(
    {
      error: 'The operation could not be completed. Please try again.',
      ...(process.env.NODE_ENV === 'development' ? { diagnostic } : {}),
    },
    { status: 500, headers },
  );
}
