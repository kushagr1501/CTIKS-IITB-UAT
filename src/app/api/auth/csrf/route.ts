import { NextResponse } from 'next/server';
import { getEnvironment } from '@/server/env';
import { createCsrfToken } from '@/server/auth/csrf-token';
import { csrfCookieName } from '@/server/auth/csrf';
import { errorResponse } from '@/server/http/errors';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const token = createCsrfToken(getEnvironment().BETTER_AUTH_SECRET);
    const response = NextResponse.json({ token }, { headers: { 'Cache-Control': 'no-store' } });
    response.cookies.set(csrfCookieName(), token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 3600,
    });
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
