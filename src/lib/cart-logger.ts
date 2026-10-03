const IS_PROD = process.env.NODE_ENV === 'production';
let enabled = !IS_PROD;

export function setCartLogging(on: boolean) {
  enabled = on;
}

export function cartLog(action: string, detail?: string) {
  if (!enabled) return;
  console.log(`[CART] ${action}${detail ? ` — ${detail}` : ''}`);
}

export function cartWarn(action: string, detail?: string) {
  if (!enabled) return;
  console.warn(`[CART] ${action}${detail ? ` — ${detail}` : ''}`);
}

export function cartError(action: string, detail?: string) {
  if (!enabled) return;
  console.error(`[CART] ${action}${detail ? ` — ${detail}` : ''}`);
}
