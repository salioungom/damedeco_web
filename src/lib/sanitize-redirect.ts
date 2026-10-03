const SAFE_PATHS = [
  '/',
  '/shop',
  '/cart',
  '/account',
  '/favorites',
  '/checkout',
  '/contact',
  '/about',
  '/dashboard',
  '/dashboards',
  '/categories',
  '/shipping',
  '/security',
  '/users',
  '/settings',
];

export function sanitizeRedirect(redirect: string | null | undefined): string | null {
  if (!redirect) return null;

  // Only allow relative paths that start with / and do not contain protocol
  if (redirect.includes('://') || redirect.startsWith('//')) {
    return null;
  }

  // Must start with /
  if (!redirect.startsWith('/')) {
    return null;
  }

  // Must not contain backslashes or null bytes
  if (redirect.includes('\\') || redirect.includes('\0')) {
    return null;
  }

  return redirect;
}
