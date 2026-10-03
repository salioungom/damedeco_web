import { describe, it, expect } from 'vitest';
import { ApiErrorHandler } from '../error-handler';

// Les erreurs ré-émises par l'intercepteur api.ts sont de simples Error
// enrichies de .status et .code (pas des erreurs Axios).
function interceptedError(status: number | undefined, code?: string, message = 'Erreur API') {
  const err = new Error(message) as Error & { status?: number; code?: string };
  if (typeof status === 'number') err.status = status;
  if (code) err.code = code;
  return err;
}

describe('ApiErrorHandler.classifyError', () => {
  it('reconnait un 403 sur une erreur interceptée', () => {
    const e = ApiErrorHandler.classifyError(interceptedError(403));
    expect(e.status).toBe(403);
    expect(e.isClientError).toBe(true);
    expect(e.isServerError).toBe(false);
  });

  it('reconnait un 404 sur une erreur interceptée', () => {
    const e = ApiErrorHandler.classifyError(interceptedError(404));
    expect(e.status).toBe(404);
    expect(e.isClientError).toBe(true);
  });

  it('reconnait un timeout (ECONNABORTED) sur une erreur interceptée', () => {
    const e = ApiErrorHandler.classifyError(interceptedError(undefined, 'ECONNABORTED'));
    expect(e.isTimeout).toBe(true);
    expect(e.isNetworkError).toBe(true);
    expect(e.isClientError).toBe(false);
    expect(e.isServerError).toBe(false);
  });

  it('reconnait une erreur réseau (ERR_NETWORK) mais pas un timeout', () => {
    const e = ApiErrorHandler.classifyError(interceptedError(undefined, 'ERR_NETWORK'));
    expect(e.isNetworkError).toBe(true);
    expect(e.isTimeout).toBe(false);
  });
});

describe('ApiErrorHandler.getOrderError', () => {
  it('renvoie le message 403 distinct', () => {
    expect(ApiErrorHandler.getOrderError(interceptedError(403))).toBe(
      "Vous n'avez pas accès à cette commande."
    );
  });

  it('renvoie le message 404 distinct', () => {
    expect(ApiErrorHandler.getOrderError(interceptedError(404))).toBe('Commande introuvable.');
  });

  it('renvoie « résultat inconnu » (≠ échec) pour un timeout en phase pay', () => {
    const msg = ApiErrorHandler.getOrderError(interceptedError(undefined, 'ECONNABORTED'), 'pay');
    expect(msg).toContain('résultat est inconnu');
    expect(msg.toLowerCase()).not.toContain('échoué');
    expect(msg.toLowerCase()).not.toContain('failed');
  });

  it('renvoie « résultat inconnu » pour une erreur réseau en phase check', () => {
    const msg = ApiErrorHandler.getOrderError(interceptedError(undefined, 'ERR_NETWORK'), 'check');
    expect(msg).toContain('inconnu');
  });

  it('informe de vérifier la commande avant de retenter (phase pay)', () => {
    const msg = ApiErrorHandler.getOrderError(interceptedError(undefined, 'ECONNABORTED'), 'pay');
    expect(msg.toLowerCase()).toContain('vérifiez');
    expect(msg).toContain('statut');
  });

  it('reste prioritaire sur le 403 même avec un autre message', () => {
    expect(ApiErrorHandler.getOrderError(interceptedError(403, undefined, 'other'))).toBe(
      "Vous n'avez pas accès à cette commande."
    );
  });

  it('retombe sur le message original pour les erreurs métier', () => {
    const msg = ApiErrorHandler.getOrderError(interceptedError(422, undefined, 'Stock insuffisant'));
    expect(msg).toBe('Stock insuffisant');
  });
});