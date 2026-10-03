import { describe, it, expect, vi } from 'vitest';
import { withRetry } from '../retry';

describe('withRetry', () => {
  it('succeeds on first attempt', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const result = await withRetry(fn, { maxAttempts: 3, label: 'test' });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on failure and succeeds', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail1'))
      .mockResolvedValue('ok');
    const result = await withRetry(fn, { maxAttempts: 3, baseDelayMs: 10, label: 'test' });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('throws after all attempts exhausted', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('always fails'));
    await expect(
      withRetry(fn, { maxAttempts: 2, baseDelayMs: 10, label: 'test' })
    ).rejects.toThrow('always fails');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('respects maxAttempts = 1 (no retry)', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('fail'));
    await expect(
      withRetry(fn, { maxAttempts: 1, baseDelayMs: 10, label: 'test' })
    ).rejects.toThrow('fail');
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
