import { cartLog, cartWarn } from './cart-logger';

interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  label?: string;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: RetryOptions = {},
): Promise<T> {
  const { maxAttempts = 3, baseDelayMs = 500, maxDelayMs = 5000, label = 'operation' } = opts;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      if (attempt > 1) {
        cartLog(`Retry ${label}`, `attempt ${attempt}/${maxAttempts}`);
      }
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts) {
        const delay = Math.min(baseDelayMs * Math.pow(2, attempt - 1), maxDelayMs);
        cartWarn(`${label} failed`, `retrying in ${delay}ms (attempt ${attempt}/${maxAttempts})`);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  cartWarn(`${label} failed`, `all ${maxAttempts} attempts exhausted`);
  throw lastError;
}
