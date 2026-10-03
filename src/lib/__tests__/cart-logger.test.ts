import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cartLog, cartWarn, cartError, setCartLogging } from '../cart-logger';

describe('cart-logger', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('logs when enabled', () => {
    setCartLogging(true);
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    cartLog('Test action', 'detail');
    expect(spy).toHaveBeenCalledWith('[CART] Test action — detail');
  });

  it('suppresses logs when disabled', () => {
    setCartLogging(false);
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    cartLog('Test action');
    expect(spy).not.toHaveBeenCalled();
  });

  it('warns when enabled', () => {
    setCartLogging(true);
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    cartWarn('Warning', 'detail');
    expect(spy).toHaveBeenCalledWith('[CART] Warning — detail');
  });

  it('error when enabled', () => {
    setCartLogging(true);
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    cartError('Error', 'detail');
    expect(spy).toHaveBeenCalledWith('[CART] Error — detail');
  });
});
