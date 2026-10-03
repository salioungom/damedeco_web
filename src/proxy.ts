import { NextRequest, NextResponse } from 'next/server';

const CSRF_COOKIE = 'csrf_token';
const CSRF_HEADER = 'X-CSRF-Token';

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
    return payload;
  } catch {
    return null;
  }
}

function isTokenExpired(payload: Record<string, unknown>): boolean {
  const exp = payload.exp;
  if (typeof exp !== 'number') return false;
  return Date.now() > exp * 1000;
}

function verifyCsrfToken(request: NextRequest): boolean {
  const method = request.method.toUpperCase();
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) return true;

  const cookieToken = request.cookies.get(CSRF_COOKIE)?.value;
  const headerToken = request.headers.get(CSRF_HEADER);

  if (!cookieToken || !headerToken) return false;
  return cookieToken === headerToken;
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  return response;
}

export function proxy(request: NextRequest) {
  const accessToken = request.cookies.get('accessToken')?.value;
  const refreshToken = request.cookies.get('refreshToken')?.value;

  if (!accessToken && !refreshToken) {
    return addSecurityHeaders(NextResponse.next());
  }

  if (!verifyCsrfToken(request)) {
    return NextResponse.json({ detail: 'CSRF token missing or invalid' }, { status: 403 });
  }

  const effectiveToken = accessToken || refreshToken;
  if (effectiveToken) {
    const payload = decodeJwtPayload(effectiveToken);
    if (payload && !isTokenExpired(payload)) {
      return addSecurityHeaders(NextResponse.next());
    }
  }

  return addSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/categories/:path*',
    '/shipping/:path*',
    '/security/:path*',
    '/dashboards/:path*',
    '/users/:path*',
    '/settings/:path*',
  ],
};
