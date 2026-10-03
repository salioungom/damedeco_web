/**
 * Contrat de livraison et de paiement partagé avec le backend.
 *
 * Gateway de paiement : PayTech (PAYMENT_GATEWAY).
 * Moyens de paiement : wave | orange_money | card.
 * Modes de livraison : home_delivery | store_pickup.
 *
 * Règles de frais de livraison (source de vérité backend) :
 * - store_pickup : toujours 0.
 * - home_delivery : subtotal < 25000 -> 1500 FCFA ; subtotal >= 25000 -> 0.
 *   Le montant est indépendant du moyen de paiement.
 */

export type DeliveryMode = 'home_delivery' | 'store_pickup';

export type PaymentMethod = 'wave' | 'orange_money' | 'card';

export type PaymentGateway = 'paytech';

export const PAYMENT_GATEWAY: PaymentGateway = 'paytech';

export const PAYMENT_METHODS: ReadonlyArray<{ value: PaymentMethod; label: string }> = [
  { value: 'wave', label: 'Wave' },
  { value: 'orange_money', label: 'Orange Money' },
  { value: 'card', label: 'Carte bancaire' },
];

/** Seuil à partir duquel la livraison à domicile devient gratuite (FCFA). */
export const FREE_SHIPPING_THRESHOLD = 25000;

/** Frais de livraison à domicile sous le seuil de gratuité (FCFA). */
export const STANDARD_SHIPPING_COST = 1500;

/**
 * Estimation frontend des frais de livraison.
 *
 * Le backend reste l'autorité pour le montant final facturé. Cette fonction ne
 * sert qu'à l'affichage avant création de commande (UX) et ne doit jamais être
 * envoyée au backend ni utilisée pour remplacer une valeur retournée par celui-ci.
 */
export function computeDeliveryFee(mode: DeliveryMode, subtotal: number): number {
  if (mode === 'store_pickup') return 0;
  if (subtotal >= FREE_SHIPPING_THRESHOLD) return 0;
  return STANDARD_SHIPPING_COST;
}

/** Libellé français d'un moyen de paiement renvoyé par le backend. */
export function getPaymentMethodLabel(method?: string | null): string {
  switch (method) {
    case 'wave':
      return 'Wave';
    case 'orange_money':
      return 'Orange Money';
    case 'card':
      return 'Carte bancaire';
    default:
      return method || 'En attente';
  }
}

/** Adresse de livraison conforme au schéma backend ShippingAddress. */
export interface ShippingAddress {
  first_name: string;
  last_name: string;
  phone: string;
  address: string;
}
