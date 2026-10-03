const CSRF_COOKIE = 'csrf_token';
const CSRF_HEADER = 'X-CSRF-Token';

function generateCsrfToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function getCsrfToken(): string {
  if (typeof document === 'undefined') return '';

  const existing = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${CSRF_COOKIE}=`));
  if (existing) {
    return existing.split('=')[1];
  }

  const token = generateCsrfToken();
  document.cookie = `${CSRF_COOKIE}=${token}; Path=/; SameSite=Lax; max-age=86400`;
  return token;
}

export function getCsrfHeader(): Record<string, string> {
  const token = getCsrfToken();
  if (!token) return {};
  return { [CSRF_HEADER]: token };
}

export { CSRF_HEADER };
