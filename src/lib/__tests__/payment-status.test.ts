import { describe, it, expect } from 'vitest';
import {
  getMostRecentPayment,
  resolvePaymentState,
  resolveSuccessPhase,
  resolveCancelPhase,
  shouldBlockPayment,
  isNonPayableOrder,
  allowRetry,
  wasPaymentConfirmed,
  getOrderActions,
  getOrderStatusLabel,
  resolvePaymentDisplayState,
  getPaymentDisplayLabel,
  getPayActionLabel,
  PAYMENT_DISPLAY_TONE,
} from '../payment-status';

const ORDER_PENDING = { orderStatus: 'pending', paymentStatus: 'pending' } as const;

describe('getMostRecentPayment', () => {
  it('retourne le paiement le plus récent via created_at', () => {
    const payments = [
      { status: 'cancelled', created_at: '2026-01-01T10:00:00Z' },
      { status: 'pending', created_at: '2026-01-02T10:00:00Z' },
    ];
    expect(getMostRecentPayment(payments)?.status).toBe('pending');
  });

  it('retombe sur le dernier élément du tableau si les dates manquent', () => {
    const payments = [{ status: 'completed' }, { status: 'pending' }];
    expect(getMostRecentPayment(payments)?.status).toBe('pending');
  });

  it('retourne null si la liste est vide ou absente', () => {
    expect(getMostRecentPayment([])).toBeNull();
    expect(getMostRecentPayment(null)).toBeNull();
  });
});

describe('Test 1 — ancien cancelled + nouveau pending', () => {
  it('→ état pending et jamais failed', () => {
    const res = resolvePaymentState({
      ...ORDER_PENDING,
      payments: [
        { status: 'cancelled', created_at: '2026-01-01T10:00:00Z' },
        { status: 'pending', created_at: '2026-01-02T10:00:00Z' },
      ],
    });
    expect(res.state).toBe('pending');
    expect(res.state).not.toBe('failed');
    expect(res.orderFinal).toBeNull();
    expect(resolveSuccessPhase({
      ...ORDER_PENDING,
      payments: [
        { status: 'cancelled', created_at: '2026-01-01T10:00:00Z' },
        { status: 'pending', created_at: '2026-01-02T10:00:00Z' },
      ],
    })).toBe('pending');
  });
});

describe('Test 2 — ancien cancelled + nouveau processing', () => {
  it('→ état processing (paiement en cours)', () => {
    const res = resolvePaymentState({
      orderStatus: 'pending',
      paymentStatus: 'pending',
      payments: [
        { status: 'cancelled', created_at: '2026-01-01T10:00:00Z' },
        { status: 'processing', created_at: '2026-01-02T10:00:00Z' },
      ],
    });
    expect(res.state).toBe('processing');
    expect(resolveSuccessPhase({
      orderStatus: 'pending',
      paymentStatus: 'pending',
      payments: [
        { status: 'cancelled', created_at: '2026-01-01T10:00:00Z' },
        { status: 'processing', created_at: '2026-01-02T10:00:00Z' },
      ],
    })).toBe('pending');
  });
});

describe('Test 3 — ancien cancelled + nouveau completed', () => {
  it('→ paiement confirmé', () => {
    const res = resolvePaymentState({
      orderStatus: 'pending',
      paymentStatus: 'pending',
      payments: [
        { status: 'cancelled', created_at: '2026-01-01T10:00:00Z' },
        { status: 'completed', created_at: '2026-01-02T10:00:00Z' },
      ],
    });
    expect(res.state).toBe('paid');
    expect(resolveSuccessPhase({
      orderStatus: 'pending',
      paymentStatus: 'pending',
      payments: [
        { status: 'cancelled', created_at: '2026-01-01T10:00:00Z' },
        { status: 'completed', created_at: '2026-01-02T10:00:00Z' },
      ],
    })).toBe('paid');
  });
});

describe('Test 4 — commande annulée dans success', () => {
  it('→ commande annulée, aucun retry', () => {
    const res = resolvePaymentState({
      orderStatus: 'cancelled',
      paymentStatus: 'pending',
      payments: [{ status: 'cancelled', created_at: '2026-01-01T10:00:00Z' }],
    });
    expect(res.orderFinal).toBe('cancelled');
    expect(resolveSuccessPhase({
      orderStatus: 'cancelled',
      paymentStatus: 'pending',
      payments: [{ status: 'cancelled', created_at: '2026-01-01T10:00:00Z' }],
    })).toBe('order_cancelled');
    expect(allowRetry({
      orderStatus: 'cancelled',
      paymentStatus: 'pending',
      payments: [{ status: 'cancelled', created_at: '2026-01-01T10:00:00Z' }],
    })).toBe(false);
  });
});

describe('Test 5 — commande annulée dans finalize', () => {
  it('→ commande non payable (isNonPayableOrder) et retry interdit', () => {
    expect(isNonPayableOrder('cancelled')).toBe(true);
    expect(isNonPayableOrder('refunded')).toBe(true);
    expect(isNonPayableOrder('pending')).toBe(false);
    expect(allowRetry({
      orderStatus: 'cancelled',
      paymentStatus: 'pending',
      payments: [],
    })).toBe(false);
  });
});

describe('Test 6 — commande annulée dans cancel', () => {
  it('→ affichage commande annulée, pas de bouton retry', () => {
    expect(resolveCancelPhase({
      orderStatus: 'cancelled',
      paymentStatus: 'cancelled',
      payments: [{ status: 'cancelled', created_at: '2026-01-01T10:00:00Z' }],
    })).toBe('order_cancelled');
    expect(allowRetry({
      orderStatus: 'cancelled',
      paymentStatus: 'cancelled',
      payments: [{ status: 'cancelled', created_at: '2026-01-01T10:00:00Z' }],
    })).toBe(false);
  });
});

describe('Test 7 — paiement annulé + commande active', () => {
  it('→ commande non annulée, retry autorisé', () => {
    const res = resolvePaymentState({
      orderStatus: 'pending',
      paymentStatus: 'cancelled',
      payments: [{ status: 'cancelled', created_at: '2026-01-01T10:00:00Z' }],
    });
    expect(res.state).toBe('failed');
    expect(res.orderFinal).toBeNull();
    expect(allowRetry({
      orderStatus: 'pending',
      paymentStatus: 'cancelled',
      payments: [{ status: 'cancelled', created_at: '2026-01-01T10:00:00Z' }],
    })).toBe(true);
  });
});

describe('Test 8 — paiement pending (intent non transmis à PayTech)', () => {
  it('→ bouton Payer DISPONIBLE : pending ne bloque PAS (matrice §15 ligne 1)', () => {
    expect(shouldBlockPayment({ paymentStatus: 'pending', payments: [] })).toBe(false);
    expect(shouldBlockPayment({
      paymentStatus: 'pending',
      payments: [{ status: 'cancelled', created_at: '2026-01-01T10:00:00Z' }],
    })).toBe(false);
    expect(shouldBlockPayment({
      paymentStatus: 'cancelled',
      payments: [{ status: 'pending', created_at: '2026-01-01T10:00:00Z' }],
    })).toBe(false);
  });
});

describe('Test 9 — paiement processing (session PayTech live)', () => {
  it('→ bouton Payer indisponible (shouldBlockPayment)', () => {
    expect(shouldBlockPayment({ paymentStatus: 'processing', payments: [] })).toBe(true);
    expect(shouldBlockPayment({
      paymentStatus: 'cancelled',
      payments: [{ status: 'processing', created_at: '2026-01-01T10:00:00Z' }],
    })).toBe(true);
  });
});

describe('Matrice §15 — getOrderActions (règle centralisée)', () => {
  it('ligne 1 : pending + pending → commande payable, annulable', () => {
    const a = getOrderActions({ orderStatus: 'pending', paymentStatus: 'pending' });
    expect(a.businessState).toBe('pending');
    expect(a.canPay).toBe(true);
    expect(a.canCancel).toBe(true);
    expect(a.canModify).toBe(true);
    expect(a.canConfirmDelivery).toBe(false);
    expect(getOrderStatusLabel({ orderStatus: 'pending', paymentStatus: 'pending' })).toBe('En attente');
  });

  it('pending + pending, session PayTech live (processing) → bloque, « Paiement en cours »', () => {
    const a = getOrderActions({
      orderStatus: 'pending',
      paymentStatus: 'pending',
      payments: [{ status: 'processing', created_at: '2026-01-02T10:00:00Z' }],
    });
    expect(a.canPay).toBe(false);
    expect(a.isPaymentProcessing).toBe(true);
    expect(a.businessState).toBe('payment_processing');
    expect(a.canCancel).toBe(true);
    expect(getOrderStatusLabel({
      orderStatus: 'pending',
      paymentStatus: 'pending',
      payments: [{ status: 'processing', created_at: '2026-01-02T10:00:00Z' }],
    })).toBe('Paiement en cours');
  });

  it('§3 — pending + PAID NE signifie PAS impayé : payée, en attente de traitement', () => {
    const a = getOrderActions({
      orderStatus: 'pending',
      paymentStatus: 'paid',
      payments: [{ status: 'completed', created_at: '2026-01-02T10:00:00Z' }],
    });
    expect(a.isPaid).toBe(true);
    expect(a.canPay).toBe(false);
    expect(a.canCancel).toBe(false);
    expect(a.canModify).toBe(false);
    expect(a.businessState).toBe('paid');
    expect(getOrderStatusLabel({ orderStatus: 'pending', paymentStatus: 'paid' })).toBe('En attente de traitement');
  });

  it('PayTech annulé (pending + cancelled) → commande active, retry possible', () => {
    const a = getOrderActions({
      orderStatus: 'pending',
      paymentStatus: 'cancelled',
      payments: [{ status: 'cancelled', created_at: '2026-01-01T10:00:00Z' }],
    });
    expect(a.canPay).toBe(true);
    expect(a.paymentState).toBe('failed');
    expect(a.businessState).toBe('pending');
  });

  it('processing → en préparation, jamais payable ni confirmable livraison ; annulable si NON payée', () => {
    const paid = getOrderActions({ orderStatus: 'processing', paymentStatus: 'paid' });
    expect(paid.businessState).toBe('preparing');
    expect(paid.canPay).toBe(false);
    // Une commande PAYÉE n'est pas annulable sans workflow de remboursement.
    expect(paid.canCancel).toBe(false);
    expect(paid.canConfirmDelivery).toBe(false);
    const unpaid = getOrderActions({ orderStatus: 'processing', paymentStatus: 'pending' });
    expect(unpaid.businessState).toBe('preparing');
    expect(unpaid.canCancel).toBe(true);
    expect(getOrderStatusLabel({ orderStatus: 'processing', paymentStatus: 'paid' })).toBe('En préparation');
  });

  it('shipped + paid → confirmer la réception, plus d’annulation', () => {
    const a = getOrderActions({ orderStatus: 'shipped', paymentStatus: 'paid' });
    expect(a.businessState).toBe('shipped');
    expect(a.canConfirmDelivery).toBe(true);
    expect(a.canCancel).toBe(false);
    expect(a.canPay).toBe(false);
    expect(getOrderStatusLabel({ orderStatus: 'shipped', paymentStatus: 'paid' })).toBe('Expédiée');
  });

  it('shipped non payé → pas de confirmation de réception', () => {
    const a = getOrderActions({ orderStatus: 'shipped', paymentStatus: 'pending' });
    expect(a.canConfirmDelivery).toBe(false);
  });

  it('§6 — cancelled + paid + completed : « Annulée », jamais « Remboursée », non remboursable via UI', () => {
    const a = getOrderActions({
      orderStatus: 'cancelled',
      paymentStatus: 'paid',
      payments: [{ status: 'completed', created_at: '2026-01-02T10:00:00Z' }],
    });
    expect(a.businessState).toBe('cancelled');
    expect(a.isPaid).toBe(true);
    expect(a.canPay).toBe(false);
    expect(a.canCancel).toBe(false);
    expect(a.canConfirmDelivery).toBe(false);
    expect(getOrderStatusLabel({ orderStatus: 'cancelled', paymentStatus: 'paid' })).toBe('Annulée');
  });

  it('confirmed (legacy) : état affiché seul, jamais de transition active', () => {
    const a = getOrderActions({ orderStatus: 'confirmed', paymentStatus: 'pending' });
    expect(a.businessState).toBe('confirmed');
    expect(a.canPay).toBe(false);
    expect(a.canCancel).toBe(false);
    expect(a.canModify).toBe(false);
    expect(getOrderStatusLabel({ orderStatus: 'confirmed', paymentStatus: 'processing' })).toBe('Confirmée');
  });

  it('refunded (legacy/futur) : état terminal affiché, aucune action', () => {
    const a = getOrderActions({ orderStatus: 'refunded', paymentStatus: 'paid' });
    expect(a.businessState).toBe('refunded');
    expect(a.canPay).toBe(false);
    expect(a.canCancel).toBe(false);
    expect(a.canConfirmDelivery).toBe(false);
    expect(getOrderStatusLabel({ orderStatus: 'refunded', paymentStatus: 'pending' })).toBe('Remboursée');
  });

  it('delivered → livrée, aucune action', () => {
    const a = getOrderActions({ orderStatus: 'delivered', paymentStatus: 'paid' });
    expect(a.businessState).toBe('delivered');
    expect(a.canConfirmDelivery).toBe(false);
    expect(a.canCancel).toBe(false);
    expect(getOrderStatusLabel({ orderStatus: 'delivered', paymentStatus: 'paid' })).toBe('Livrée');
  });
});

describe('Test 10 — paiement completed', () => {
  it('→ paiement confirmé', () => {
    expect(resolveSuccessPhase({
      orderStatus: 'pending',
      paymentStatus: 'completed',
      payments: [],
    })).toBe('paid');
    expect(resolveSuccessPhase({
      orderStatus: 'pending',
      paymentStatus: 'pending',
      payments: [{ status: 'completed', created_at: '2026-01-01T10:00:00Z' }],
    })).toBe('paid');
  });
});

describe('Règles métier complémentaires', () => {
  it('commande cancelled + payment completed : le paiement n’est pas reclassé en cancelled', () => {
    const res = resolvePaymentState({
      orderStatus: 'cancelled',
      paymentStatus: 'paid',
      payments: [{ status: 'completed', created_at: '2026-01-01T10:00:00Z' }],
    });
    expect(res.state).toBe('paid');
    expect(res.orderFinal).toBe('cancelled');
    expect(wasPaymentConfirmed({
      paymentStatus: 'paid',
      payments: [{ status: 'completed', created_at: '2026-01-01T10:00:00Z' }],
    })).toBe(true);
  });

  it('order.status=cancelled + order.payment_status=paid : paid conservé', () => {
    expect(wasPaymentConfirmed({ paymentStatus: 'paid', payments: [] })).toBe(true);
  });

  it('sale_canceled → Payment cancelled + Order active : retry autorisé, commande non annulée', () => {
    expect(allowRetry({
      orderStatus: 'active',
      paymentStatus: 'cancelled',
      payments: [{ status: 'cancelled', created_at: '2026-01-01T10:00:00Z' }],
    })).toBe(true);
    expect(isNonPayableOrder('active')).toBe(false);
    expect(resolveCancelPhase({
      orderStatus: 'active',
      paymentStatus: 'cancelled',
      payments: [{ status: 'cancelled', created_at: '2026-01-01T10:00:00Z' }],
    })).toBe('cancelled');
  });

  it('timeout/résultat inconnu → jamais « failed » sur success', () => {
    expect(resolveSuccessPhase({ orderStatus: 'pending' }) === 'failed').toBe(false);
    expect(resolveSuccessPhase({ orderStatus: 'pending', paymentStatus: 'pending', payments: [] })).toBe('pending');
  });

  it('order.payment_status pending est le fallback quand aucun paiement détaillé', () => {
    expect(resolvePaymentState({ orderStatus: 'pending', paymentStatus: 'pending' }).state).toBe('pending');
    expect(resolvePaymentState({ orderStatus: 'pending', paymentStatus: 'paid' }).state).toBe('paid');
  });
});

describe('Matrice §12 — resolvePaymentDisplayState (état de paiement AFFICHÉ)', () => {
  it('pending + pending + Payment pending → En attente (impatient, jamais « échoué »)', () => {
    expect(resolvePaymentDisplayState({
      orderStatus: 'pending',
      paymentStatus: 'pending',
      payments: [{ status: 'pending', created_at: '2026-01-01T10:00:00Z' }],
    })).toBe('unpaid');
    expect(getPaymentDisplayLabel('unpaid')).toBe('En attente');
  });

  it('pending + pending + Payment processing → Paiement en cours', () => {
    expect(resolvePaymentDisplayState({
      orderStatus: 'pending',
      paymentStatus: 'pending',
      payments: [{ status: 'processing', created_at: '2026-01-01T10:00:00Z' }],
    })).toBe('payment_processing');
  });

  it('pending + pending + Payment failed → Paiement échoué', () => {
    expect(resolvePaymentDisplayState({
      orderStatus: 'pending',
      paymentStatus: 'pending',
      payments: [{ status: 'failed', created_at: '2026-01-01T10:00:00Z' }],
    })).toBe('payment_failed');
  });

  it('pending + pending + Payment cancelled → Paiement annulé (retry possible)', () => {
    expect(resolvePaymentDisplayState({
      orderStatus: 'pending',
      paymentStatus: 'pending',
      payments: [{ status: 'cancelled', created_at: '2026-01-01T10:00:00Z' }],
    })).toBe('payment_cancelled');
    expect(getPayActionLabel('payment_cancelled')).toBe('Payer à nouveau');
  });

  it('pending + paid + completed → Payé, même si order.status = pending', () => {
    expect(resolvePaymentDisplayState({
      orderStatus: 'pending',
      paymentStatus: 'paid',
      payments: [{ status: 'completed', created_at: '2026-01-01T10:00:00Z' }],
    })).toBe('paid');
    expect(getPaymentDisplayLabel('paid')).toBe('Payé');
  });

  it('processing + paid → Payé', () => {
    expect(resolvePaymentDisplayState({ orderStatus: 'processing', paymentStatus: 'paid' })).toBe('paid');
  });

  it('shipped + paid → Payé', () => {
    expect(resolvePaymentDisplayState({ orderStatus: 'shipped', paymentStatus: 'paid' })).toBe('paid');
  });

  it('delivered + paid + completed → Payé (cas attendu livré)', () => {
    expect(resolvePaymentDisplayState({
      orderStatus: 'delivered',
      paymentStatus: 'paid',
      payments: [{ status: 'completed', created_at: '2026-01-01T10:00:00Z' }],
    })).toBe('paid');
  });

  it('cancelled + cancelled + Payment cancelled → Paiement annulé, aucune action', () => {
    expect(resolvePaymentDisplayState({
      orderStatus: 'cancelled',
      paymentStatus: 'cancelled',
      payments: [{ status: 'cancelled', created_at: '2026-01-01T10:00:00Z' }],
    })).toBe('payment_cancelled');
    const a = getOrderActions({
      orderStatus: 'cancelled',
      paymentStatus: 'cancelled',
      payments: [{ status: 'cancelled', created_at: '2026-01-01T10:00:00Z' }],
    });
    expect(a.canPay).toBe(false);
    expect(a.canCancel).toBe(false);
  });

  it('cancelled + paid + completed → Payé (annulation APRÈS paiement, jamais Remboursée)', () => {
    expect(resolvePaymentDisplayState({
      orderStatus: 'cancelled',
      paymentStatus: 'paid',
      payments: [{ status: 'completed', created_at: '2026-01-01T10:00:00Z' }],
    })).toBe('paid');
  });

  it('ANOMALIE — delivered + payment_status pending → « À vérifier », jamais « Payé » inventé', () => {
    expect(resolvePaymentDisplayState({ orderStatus: 'delivered', paymentStatus: 'pending' })).toBe('anomaly');
    expect(getPaymentDisplayLabel('anomaly')).toBe('À vérifier');
    expect(getPayActionLabel('anomaly')).toBe('Payer la commande');
    const a = getOrderActions({ orderStatus: 'delivered', paymentStatus: 'pending' });
    expect(a.canPay).toBe(false);
    expect(a.canConfirmDelivery).toBe(false);
  });

  it('ANOMALIE/HISTORIQUE — cancelled + payment_status pending : « En attente » mais aucune action de paiement', () => {
    expect(resolvePaymentDisplayState({ orderStatus: 'cancelled', paymentStatus: 'pending' })).toBe('unpaid');
    expect(getPaymentDisplayLabel('unpaid')).toBe('En attente');
    // Même combinaison passant par les paiements détaillés.
    expect(resolvePaymentDisplayState({
      orderStatus: 'cancelled',
      paymentStatus: 'pending',
      payments: [{ status: 'pending', created_at: '2026-01-01T10:00:00Z' }],
    })).toBe('unpaid');
    const a = getOrderActions({ orderStatus: 'cancelled', paymentStatus: 'pending' });
    expect(a.businessState).toBe('cancelled');
    expect(a.canPay).toBe(false);
    expect(a.canCancel).toBe(false);
    expect(a.canModify).toBe(false);
  });

  it('refunded → Paiement remboursé, jamais déclenché depuis cancelled', () => {
    expect(resolvePaymentDisplayState({ orderStatus: 'delivered', paymentStatus: 'refunded' })).toBe('refunded');
    expect(getPaymentDisplayLabel('refunded')).toBe('Remboursé');
    expect(resolvePaymentDisplayState({
      orderStatus: 'cancelled',
      paymentStatus: 'pending',
      payments: [{ status: 'refunded', created_at: '2026-01-01T10:00:00Z' }],
    })).toBe('refunded');
  });

  it('agrégat paid ne recule jamais devant une tentative plus récente failed/cancelled', () => {
    expect(resolvePaymentDisplayState({
      orderStatus: 'pending',
      paymentStatus: 'paid',
      payments: [{ status: 'cancelled', created_at: '2026-01-02T10:00:00Z' }],
    })).toBe('paid');
    expect(resolvePaymentDisplayState({
      orderStatus: 'pending',
      paymentStatus: 'paid',
      payments: [
        { status: 'completed', created_at: '2026-01-01T10:00:00Z' },
        { status: 'failed', created_at: '2026-01-02T10:00:00Z' },
      ],
    })).toBe('paid');
  });

  it('paiement détaillé le plus récent domine l’agrégat quand il est explicite', () => {
    expect(resolvePaymentDisplayState({
      orderStatus: 'pending',
      paymentStatus: 'cancelled',
      payments: [{ status: 'processing', created_at: '2026-01-02T10:00:00Z' }],
    })).toBe('payment_processing');
  });
});

describe('getPayActionLabel — libellé du bouton Payer', () => {
  it('Distingue retry (failed) vs payer à nouveau (cancelled)', () => {
    expect(getPayActionLabel('payment_failed')).toBe('Réessayer le paiement');
    expect(getPayActionLabel('payment_cancelled')).toBe('Payer à nouveau');
    expect(getPayActionLabel('unpaid')).toBe('Payer la commande');
    expect(getPayActionLabel('paid')).toBe('Payer la commande');
    expect(getPayActionLabel(undefined)).toBe('Payer la commande');
  });
});

describe('PAYMENT_DISPLAY_TONE — teinte de chip par état résolu', () => {
  it('fournit une teinte pour chaque état de paiement affiché', () => {
    expect(PAYMENT_DISPLAY_TONE.paid).toBe('success');
    expect(PAYMENT_DISPLAY_TONE.anomaly).toBe('warning');
    expect(PAYMENT_DISPLAY_TONE.unpaid).toBe('warning');
    expect(PAYMENT_DISPLAY_TONE.refunded).toBe('secondary');
  });
});