/**
 * @file /lib/payment-status.ts
 * @description Résolution partagée de l'état de paiement courant.
 *
 * Le contrat backend distingue le statut de la COMMANDE (order.status) du
 * statut de PAIEMENT (payment.status / order.payment_status). Un ancien
 * paiement annulé/échoué/expiré ne doit JAMAIS dominer un paiement plus
 * récent (pending/processing/completed), ni faire passer une commande
 * toujours active en « annulée ».
 */

export interface PaymentLike {
  status?: string | null;
  created_at?: string;
}

export type PaymentState =
  | 'paid'
  | 'processing'
  | 'pending'
  | 'failed'
  | 'unknown';

export type OrderFinalState = 'cancelled' | 'refunded' | null;

export interface PaymentStateResolution {
  /** État du paiement courant (« paid » = confirmé par le backend uniquement). */
  state: PaymentState;
  /** État final non payable de la commande (annulée / remboursée), sinon null. */
  orderFinal: OrderFinalState;
  /** Paiement le plus récent, ou null. */
  currentPayment: PaymentLike | null;
}

/** Statuts de paiement qui confirment définitivement une transaction. */
const PAID_STATUSES = ['paid', 'completed'];

/**
 * Renvoie le paiement le plus récent (tri par created_at, ordre du tableau
 * en secours). C'est le paiement « courant » : les plus anciens ne doivent
 * pas servir à déterminer l'état affiché.
 */
export function getMostRecentPayment(payments: PaymentLike[] | null | undefined): PaymentLike | null {
  const list = Array.isArray(payments) ? [...payments] : [];
  list.sort((a, b) => {
    const aTime = a.created_at ? Date.parse(a.created_at) : 0;
    const bTime = b.created_at ? Date.parse(b.created_at) : 0;
    if (Number.isNaN(aTime)) return bTime ? -1 : 0;
    if (Number.isNaN(bTime)) return aTime ? 1 : 0;
    return aTime - bTime;
  });
  return list[list.length - 1] ?? null;
}

function statusToPaymentState(status: string | null | undefined): PaymentState | null {
  if (!status) return null;
  if (PAID_STATUSES.includes(status)) return 'paid';
  if (status === 'processing') return 'processing';
  if (status === 'pending') return 'pending';
  if (status === 'failed' || status === 'cancelled' || status === 'expired') return 'failed';
  return null;
}

/**
 * Résout l'état de paiement courant avec la priorité suivante :
 * 1. paiement courant (le plus récent) si son statut est explicite ;
 * 2. order.payment_status comme état agrégé de secours.
 *
 * order.status est remonté séparément (orderFinal) : une commande
 * « cancelled » n'est jamais traitée comme un simple échec de paiement, mais
 * un paiement confirmé (paid/completed) n'est jamais reclassé en cancelled.
 */
export function resolvePaymentState(input: {
  orderStatus?: string | null;
  paymentStatus?: string | null;
  payments?: PaymentLike[] | null;
}): PaymentStateResolution {
  const currentPayment = getMostRecentPayment(input.payments);
  const currentStatus = currentPayment?.status ?? null;

  let state: PaymentState = statusToPaymentState(currentStatus) ?? 'unknown';

  if (state === 'unknown') {
    state = statusToPaymentState(input.paymentStatus) ?? 'unknown';
  }

  let orderFinal: OrderFinalState = null;
  if (input.orderStatus === 'cancelled') orderFinal = 'cancelled';
  else if (input.orderStatus === 'refunded') orderFinal = 'refunded';

  return { state, orderFinal, currentPayment };
}

/**
 * Indique si une session de paiement PayTech est réellement en cours
 * (statut `processing` du PAIEMENT — jamais le statut de commande).
 *
 * Un statut `pending` (agrégé ou détaillé) est un *intent* de paiement non
 * encore transmis à PayTech : il ne doit pas verrouiller le paiement
 * (commande nouvellement créée → bouton « Payer » disponible, cf. matrice).
 * Seul `processing` (session PayTech live) bloque le bouton ; la garde
 * anti double-clic/synchronisation reste assurée par les formulaires.
 * Le backend reste l'autorité finale (idempotence de POST /orders/{id}/pay).
 */
export function shouldBlockPayment(input: {
  paymentStatus?: string | null;
  payments?: PaymentLike[] | null;
}): boolean {
  const current = getMostRecentPayment(input.payments);
  if (current?.status === 'processing') return true;

  // Sans enregistrement détaillé, seul un agrégat « processing » indique une
  // session live. Un agrégat « pending » = première tentative disponible.
  if (!current && input.paymentStatus === 'processing') return true;

  return false;
}

/**
 * Indique si la commande est dans un état final non payable
 * (annulée ou remboursée). Aucune règle métier supplémentaire n'est inventée.
 */
export function isNonPayableOrder(orderStatus?: string | null): boolean {
  return orderStatus === 'cancelled' || orderStatus === 'refunded';
}

/** Phases affichables par /checkout/success. */
export type SuccessPhase = 'paid' | 'pending' | 'failed' | 'error' | 'order_cancelled' | 'order_refunded';

/**
 * Décision d'affichage de /checkout/success.
 *
 * Une commande annulée/remboursée n'est jamais réduite à un « échec de
 * paiement » ; un ancien paiement annulé/échoué/expiré ne domine jamais un
 * paiement plus récent (pending/processing/completed). Tout statut non
 * confirmé par le backend reste « en cours de vérification » (jamais
 * « échoué » sans confirmation).
 */
export function resolveSuccessPhase(input: {
  orderStatus?: string | null;
  paymentStatus?: string | null;
  payments?: PaymentLike[] | null;
}): SuccessPhase {
  const { state, orderFinal } = resolvePaymentState(input);

  if (orderFinal) return orderFinal === 'refunded' ? 'order_refunded' : 'order_cancelled';
  if (state === 'paid') return 'paid';
  if (state === 'processing' || state === 'pending') return 'pending';
  if (state === 'failed') return 'failed';
  return 'pending';
}

/**
 * Vrai si le paiement a été définitivement confirmé par le backend
 * (paid/completed), indépendamment de l'état de la commande. Permet de ne
 * jamais reclasser un paiement payé en annulé.
 */
export function wasPaymentConfirmed(input: {
  paymentStatus?: string | null;
  payments?: PaymentLike[] | null;
}): boolean {
  return resolvePaymentState({ paymentStatus: input.paymentStatus, payments: input.payments }).state === 'paid';
}

/** Phases affichables par /checkout/cancel. */
export type CancelPhase = 'paid' | 'cancelled' | 'pending' | 'order_cancelled' | 'order_refunded';

/**
 * Décision d'affichage de /checkout/cancel. Une commande annulée est affichée
 * comme telle ; une annulation de paiement (sale_canceled) laisse la commande
 * active et le retry possible.
 */
export function resolveCancelPhase(input: {
  orderStatus?: string | null;
  paymentStatus?: string | null;
  payments?: PaymentLike[] | null;
}): CancelPhase {
  const { state, orderFinal } = resolvePaymentState(input);

  if (orderFinal) return orderFinal === 'refunded' ? 'order_refunded' : 'order_cancelled';
  if (state === 'paid') return 'paid';
  if (state === 'processing' || state === 'pending') return 'pending';
  return 'cancelled';
}

/**
 * Autorise-t-on un nouveau paiement (retry) depuis les pages de sortie ?
 *
 * Interdit si la commande est annulée/remboursée OU si le paiement est déjà
 * confirmé. Un paiement annulé/échoué/expiré avec commande active reste
 * réessayable.
 */
export function allowRetry(input: {
  orderStatus?: string | null;
  paymentStatus?: string | null;
  payments?: PaymentLike[] | null;
}): boolean {
  const { state, orderFinal } = resolvePaymentState(input);
  if (orderFinal) return false;
  if (state === 'paid') return false;
  return true;
}

/**
 * État métier combiné COMMANDE + PAIEMENT, unique source pour l'affichage
 * client et les actions offertes.
 *
 * `pending` ne signifie jamais automatiquement « impayé » : une commande
 * `pending` + paiement confirmé est une commande PAYÉE en attente de
 * traitement (businessState = 'paid'). `confirmed` est legacy uniquement.
 */
export type OrderBusinessState =
  | 'pending' // commande active non payée (paiement en attente / à réessayer)
  | 'payment_processing' // session PayTech live (paiement en cours)
  | 'paid' // payée, commande encore « pending » (attente de traitement admin)
  | 'preparing' // order.status = processing
  | 'shipped' // order.status = shipped
  | 'delivered' // order.status = delivered
  | 'confirmed' // legacy uniquement (anciennes commandes)
  | 'cancelled' // order.status = cancelled (état final)
  | 'refunded'; // order.status = refunded (état final, legacy/futur)

/** Actions offertes au client pour une commande — règle unique et déterministe. */
export interface OrderActions {
  businessState: OrderBusinessState;
  paymentState: PaymentState;
  orderFinal: OrderFinalState;
  isPaid: boolean;
  isPaymentProcessing: boolean;
  canPay: boolean;
  canCancel: boolean;
  canModify: boolean;
  canConfirmDelivery: boolean;
}

/**
 * Décision centralisée des actions client (mes commandes / détail / finalize).
 *
 * Le backend reste l'autorité finale : le frontend n'invente aucune règle,
 * il n'expose que ce que la machine backend autorise.
 *  - canPay : commande active « pending », non payée, sans session PayTech live.
 *  - canCancel : commande active non payée (« pending » ou « processing »).
 *  - canModify : commande active « pending » NON payée uniquement.
 *  - canConfirmDelivery : commande « shipped » et paiement confirmé.
 */
export function getOrderActions(input: {
  orderStatus?: string | null;
  paymentStatus?: string | null;
  payments?: PaymentLike[] | null;
}): OrderActions {
  const { state, orderFinal } = resolvePaymentState(input);
  const status = input.orderStatus;

  const cancelled = orderFinal === 'cancelled' || status === 'cancelled';
  const refunded = orderFinal === 'refunded' || status === 'refunded';
  const isPaid = state === 'paid';
  const isPaymentProcessing = state === 'processing';

  const canPay = status === 'pending' && !cancelled && !refunded && !isPaid && !isPaymentProcessing;
  // canCancel : commande active non payée (pending/processing). Une commande
  // PAYÉE n'est pas annulable sans workflow de remboursement dédié.
  const canCancel = !cancelled && !refunded && !isPaid && (status === 'pending' || status === 'processing');
  // canModify : commande active NON payée uniquement (modifier une commande
  // payée altérerait le montant validé par PayTech).
  const canModify = status === 'pending' && !cancelled && !refunded && !isPaid;
  const canConfirmDelivery = status === 'shipped' && !cancelled && !refunded && isPaid;

  let businessState: OrderBusinessState;
  if (cancelled) businessState = 'cancelled';
  else if (refunded) businessState = 'refunded';
  else if (status === 'delivered') businessState = 'delivered';
  else if (status === 'shipped') businessState = 'shipped';
  else if (status === 'processing') businessState = 'preparing';
  else if (status === 'confirmed') businessState = 'confirmed';
  else if (isPaid) businessState = 'paid';
  else if (isPaymentProcessing) businessState = 'payment_processing';
  else businessState = 'pending';

  return {
    businessState,
    paymentState: state,
    orderFinal,
    isPaid,
    isPaymentProcessing,
    canPay,
    canCancel,
    canModify,
    canConfirmDelivery,
  };
}

/** Libellé client du statut, tenant compte de l'état de paiement (§3/§4). */
export function getOrderStatusLabel(input: {
  orderStatus?: string | null;
  paymentStatus?: string | null;
  payments?: PaymentLike[] | null;
}): string {
  switch (getOrderActions(input).businessState) {
    case 'pending':
      return 'En attente';
    case 'payment_processing':
      return 'Paiement en cours';
    case 'paid':
      return 'En attente de traitement';
    case 'preparing':
      return 'En préparation';
    case 'shipped':
      return 'Expédiée';
    case 'delivered':
      return 'Livrée';
    case 'confirmed':
      return 'Confirmée';
    case 'cancelled':
      return 'Annulée';
    case 'refunded':
      return 'Remboursée';
  }
}

/**
 * État de PAIEMENT AFFICHÉ, résolu par le frontend — source de vérité unique
 * pour la carte de commande (mes commandes) ET la page détail.
 *
 * Trois informations distinctes sont combinées (jamais mélangées) :
 *  - order.status        → cycle logistique (jamais un substitut de paiement) ;
 *  - order.payment_status → état financier agrégé (back-end) ;
 *  - Payment.status       → état technique de la tentative la plus récente.
 *
 * Priorité des sources de la donnée financière :
 *  - `payment_status = refunded` → vérité financière terminale ;
 *  - `payment_status = paid`     → paiement confirmé, jamais reclassé
 *    (un paiement confirmé reste payé même si une tentative plus récente a
 *    échoué/été annulée) ;
 *  - sinon Payment.status (le plus récent) ;
 *  - sinon payment_status agrégé.
 *
 * Le frontend n'invente JAMAIS de paiement : une commande `delivered` dont la
 * donnée financière n'est pas confirmée est affichée en anomalie « À vérifier »
 * (et non « Payé »).
 */
export type PaymentDisplayState =
  | 'unpaid' // en attente (aucune confirmation, intent non transmis à PayTech)
  | 'payment_processing' // session PayTech live (Payment.status = processing)
  | 'paid' // confirmé : Payment paid/completed OU agrégat paid
  | 'payment_failed' // Payment ou agrégat failed / expired
  | 'payment_cancelled' // Payment/agrégat cancelled (retry possible si commande active)
  | 'refunded' // vérité financière explicite (compatibilité/futur)
  | 'anomaly'; // livrée sans paiement confirmé → « À vérifier » (pas de preuve inventée)

function isUnconfirmedPayment(state: PaymentDisplayState): boolean {
  return (
    state === 'unpaid' ||
    state === 'payment_processing' ||
    state === 'payment_failed' ||
    state === 'payment_cancelled'
  );
}

export function resolvePaymentDisplayState(input: {
  orderStatus?: string | null;
  paymentStatus?: string | null;
  payments?: PaymentLike[] | null;
}): PaymentDisplayState {
  const current = getMostRecentPayment(input.payments);
  const aggregate = input.paymentStatus ?? null;

  // 1) Remboursement : vérité financière explicite, jamais reclassée ni déduite
  //    de l'état de la commande (jamais `cancelled => refunded`).
  if (aggregate === 'refunded' || current?.status === 'refunded') return 'refunded';

  // 2) Agrégat « paid » : paiement confirmé par le back-end — ne jamais reclasser.
  if (aggregate === 'paid') return 'paid';

  // 3) Payment.status le plus récent (donnée détaillée).
  const currentStatus = current?.status;
  if (currentStatus === 'paid' || currentStatus === 'completed') return 'paid';
  if (currentStatus === 'processing') return 'payment_processing';
  if (currentStatus === 'pending') return 'unpaid';
  if (currentStatus === 'failed' || currentStatus === 'expired') return 'payment_failed';
  if (currentStatus === 'cancelled') return 'payment_cancelled';

  // 4) Fallback : agrégat order.payment_status (jamais order.status en substitut).
  let state: PaymentDisplayState;
  switch (aggregate) {
    case 'processing':
      state = 'payment_processing';
      break;
    case 'failed':
      state = 'payment_failed';
      break;
    case 'cancelled':
      state = 'payment_cancelled';
      break;
    case 'paid':
    case 'completed':
      state = 'paid';
      break;
    default:
      // pending / inconnu → « En attente » (une commande nouvellement créée est
      // en attente de paiement, pas encore en échec).
      state = 'unpaid';
  }

  // 5) Anomalie contrôlée : une commande LIVRÉE avec paiement non confirmé est
  //    affichée « À vérifier » (règle d'affichage §6) — on ne fabrique pas une
  //    preuve de paiement. Une commande `cancelled` + paiement en attente reste
  //    « Annulée / En attente » (anomalie/historique, aucune action de paiement).
  if (input.orderStatus === 'delivered' && isUnconfirmedPayment(state)) return 'anomaly';

  return state;
}

/** Libellé client de l'état de paiement résolu (source de vérité commune). */
export function getPaymentDisplayLabel(state: PaymentDisplayState): string {
  switch (state) {
    case 'unpaid':
      return 'En attente';
    case 'payment_processing':
      return 'En cours';
    case 'paid':
      return 'Payé';
    case 'payment_failed':
      return 'Échoué';
    case 'payment_cancelled':
      return 'Annulé';
    case 'refunded':
      return 'Remboursé';
    case 'anomaly':
      return 'À vérifier';
    default:
      return state;
  }
}

/** Teinte de chip de l'état de paiement résolu (donnée pure, partagée). */
export type PaymentTone = 'success' | 'warning' | 'info' | 'error' | 'secondary' | 'default';

export const PAYMENT_DISPLAY_TONE: Record<PaymentDisplayState, PaymentTone> = {
  unpaid: 'warning',
  payment_processing: 'info',
  paid: 'success',
  payment_failed: 'error',
  payment_cancelled: 'default',
  refunded: 'secondary',
  anomaly: 'warning',
};

/**
 * Libellé du bouton de paiement selon l'état financier résolu.
 *  - Payment cancelled (sale_canceled) → « Payer à nouveau » ;
 *  - Payment failed/expired            → « Réessayer le paiement » ;
 *  - sinon (nouvelle commande)         → « Payer la commande ».
 */
export function getPayActionLabel(state: PaymentDisplayState | undefined): string {
  switch (state) {
    case 'payment_cancelled':
      return 'Payer à nouveau';
    case 'payment_failed':
      return 'Réessayer le paiement';
    default:
      return 'Payer la commande';
  }
}