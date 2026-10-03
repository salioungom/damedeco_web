/**
 * @file /services/invoice.service.ts
 * @description Service dédié à la gestion des factures (Invoice) avec API v1.
 * @version 1.0.0
 * @author DameDéco Team
 */

import api from '@/lib/api';
import { formatFcfa } from '@/lib/format';
import OrderService from '@/services/order.service';

// ─── Types (contrat API v1, section 2) ──────────────────────────────────────

export interface InvoiceCustomer {
  full_name?: string;
  email?: string | null;
  phone?: string | null;
  [key: string]: unknown;
}

export interface InvoiceItem {
  product_id: number | string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  [key: string]: unknown;
}

export interface InvoicePayment {
  status?: string | null;
  method?: string | null;
  transaction_reference?: string | null;
  paid_amount?: number;
  paid_at?: string | null;
  amount_remaining?: number;
  [key: string]: unknown;
}

/**
 * Facture renvoyée par le backend. Les totaux / statuts ne sont jamais
 * recalculés côté frontend : le backend reste l'autorité finale.
 */
export interface Invoice {
  id: number | string;
  order_id: number | string;
  order_number?: string | null;
  invoice_number: string;
  status: string;
  currency?: string;
  issued_at?: string | null;
  created_at?: string;
  updated_at?: string;
  customer?: InvoiceCustomer | null;
  items?: InvoiceItem[];
  subtotal?: number;
  delivery_fee?: number;
  discount_amount?: number;
  tax_amount?: number;
  total?: number;
  payment?: InvoicePayment | null;
  view_url?: string | null;
  [key: string]: unknown;
}

interface InvoiceServiceError extends Error {
  status?: number;
  response?: unknown;
  config?: unknown;
  cause?: unknown;
}

// ─── Helpers privés (gestion d'erreur) ─────────────────────────────────────

/**
 * Les endpoints PDF renvoient une réponse binaire : en cas d'erreur (ex. 404),
 * le corps d'erreur est un Blob que l'intercepteur api.ts ne sait pas
 * déchiffrer (message « {} »). Cette fonction relit le Blob et récupère le
 * vrai `detail` JSON du backend. Retourne null si impossible.
 */
function readBlobError(error: unknown): Promise<Error | null> {
  const data = (error as InvoiceServiceError | null)?.response as
    | { data?: unknown }
    | undefined;
  const blob = data?.data as unknown;
  if (!blob || typeof (blob as Blob).text !== 'function') {
    return Promise.resolve(null);
  }
  try {
    return (blob as Blob)
      .text()
      .then((text) => {
        if (!text) return null;
        let parsed: unknown;
        try {
          parsed = JSON.parse(text);
        } catch {
          return new Error(text.slice(0, 300));
        }
        if (parsed && typeof parsed === 'object') {
          const record = parsed as Record<string, unknown>;
          if (Array.isArray(record.detail)) {
            const detail = (record.detail as Array<{ msg?: string; message?: string }>)
              .map((d) => d?.msg ?? d?.message ?? JSON.stringify(d))
              .join(', ');
            return new Error(detail);
          }
          const message =
            record.detail ?? record.message ?? record.error ?? undefined;
          if (typeof message === 'string' && message.trim()) {
            return new Error(message);
          }
        }
        return new Error(text.slice(0, 300));
      })
      .catch(() => null);
  } catch {
    return Promise.resolve(null);
  }
}

/**
 * Normalise une erreur du service en conservant son statut HTTP d'origine
 * (posé par l'intercepteur api.ts). Pour les erreurs binaires (PDF), le vrai
 * message backend est extrait du Blob avant de renvoyer.
 */
async function normalizeError(error: unknown, fallback: string): Promise<Error> {
  const source = error as InvoiceServiceError | null;
  const blobRead = await readBlobError(error);

  // Erreur JSON déjà exploitable (message + statut fournis par l'intercepteur).
  if (!blobRead && source instanceof Error && typeof source.status === 'number') {
    return source;
  }

  const out: InvoiceServiceError = new Error(blobRead?.message || source?.message || fallback);
  if (error instanceof Error) out.cause = error;
  else if (source?.cause) out.cause = source.cause;
  if (typeof source?.status === 'number') out.status = source.status;
  if (source?.response !== undefined) out.response = source.response;
  if (source?.config !== undefined) out.config = source.config;
  return out;
}

// ─── Aides pures exportées (testables, réutilisables côté UI) ──────────────

/** Nom de fichier PDF d'une facture, sans caractères problématiques. */
export function getInvoicePdfFileName(invoiceNumber: string | null | undefined): string {
  const base = (invoiceNumber || 'facture').replace(/[^\w.-]+/g, '_');
  return `${base}.pdf`;
}

/** Libellé français du statut d'une facture (affichage admin). */
export function getInvoiceStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: 'Brouillon',
    issued: 'Émise',
    sent: 'Envoyée',
    paid: 'Payée',
    overdue: 'En retard',
    void: 'Annulée',
  };
  return labels[status] || status;
}

/** Numéro de téléphone normalisé pour wa.me (international, sans '+'). */
export function normalizeInvoicePhone(phone: string | null | undefined): string {
  if (!phone) return '';
  return phone.replace(/^\+/, '').replace(/[\s().-]/g, '');
}

/**
 * Badge d'affichage du statut de paiement d'une facture.
 * Trois classes métier, chacune avec un libellé explicite et une tonalité
 * (l'accessibilité ne repose jamais sur la couleur seule) :
 *  - En attente (orange)  → pending / processing
 *  - Payé (vert)          → paid / completed
 *  - Échoué (rouge)       → failed / cancelled / expired
 * Retourne null pour un statut absent ou inconnu (aucun badge à afficher).
 */
export function getInvoicePaymentBadge(status?: string | null): {
  label: string;
  tone: 'success' | 'warning' | 'error';
} | null {
  switch (status) {
    case 'paid':
    case 'completed':
      return { label: 'Payé', tone: 'success' };
    case 'pending':
    case 'processing':
      return { label: 'En attente', tone: 'warning' };
    case 'failed':
    case 'cancelled':
    case 'expired':
      return { label: 'Échoué', tone: 'error' };
    default:
      return null;
  }
}

/**
 * Libellé lisible du moyen de paiement (ex. "PayTech"). Le backend peut
 * renvoyer des variantes brutes (paytech, pay_tech, "PayTech", ...) : on
 * normalise avant de mapper, et on retombe sur la valeur brute sinon.
 */
export function getInvoicePaymentMethodLabel(method?: string | null): string {
  if (!method) return '—';
  const normalized = method.trim().toLowerCase().replace(/[\s_.-]+/g, '');
  if (normalized === 'paytech' || normalized === 'pt') return 'PayTech';
  return method.trim();
}

/**
 * Seul un lien PUBLIC de consultation peut être partagé au client.
 * Le `view_url` technique du backend (ex. "/api/v1/invoices/123") ne doit
 * jamais être affiché à l'utilisateur : on le neutralise ici.
 */
export function getPublicInvoiceViewUrl(invoice: Pick<Invoice, 'view_url'>): string | null {
  const url = invoice.view_url;
  if (typeof url !== 'string' || !url.trim()) return null;
  const trimmed = url.trim();
  if (trimmed.includes('/api/')) return null;
  if (!/^https?:\/\//i.test(trimmed)) return null;
  return trimmed;
}

/**
 * Message WhatsApp prérempli d'une facture, URL-encodé par l'appelant.
 * Le lien public (`view_url`) n'est ajouté que s'il est fourni par le backend
 * ET qu'il s'agit d'un lien public (jamais une route technique /api/...).
 */
export function buildInvoiceWhatsappMessage(
  invoice: Invoice,
  customerName?: string | null
): string {
  const lines = [
    `Bonjour ${customerName?.trim() || 'Monsieur/Madame'},`,
    `Merci pour votre commande ${invoice.order_number || invoice.order_id}.`,
    `Voici votre facture ${invoice.invoice_number} d'un montant de ${formatFcfa(invoice.total)}.`,
  ];
  if (invoice.payment?.status) {
    lines.push(`Statut du paiement : ${OrderService.getPaymentStatusLabel(invoice.payment.status)}.`);
  }
  const publicUrl = getPublicInvoiceViewUrl(invoice);
  if (publicUrl) {
    lines.push(`Retrouvez votre facture ici : ${publicUrl}`);
  }
  return lines.join('\n');
}

// ─── Service ────────────────────────────────────────────────────────────────

export class InvoiceService {
  /**
   * Créer/générer la facture d'une commande.
   * POST /api/v1/orders/{order_id}/invoice (idempotent côté backend).
   */
  static async createInvoice(orderId: string | number): Promise<Invoice> {
    try {
      const response = await api.post<Invoice>(`/api/v1/orders/${orderId}/invoice`);
      return response.data;
    } catch (error) {
      throw await normalizeError(error, 'Impossible de générer la facture');
    }
  }

  /**
   * Récupérer la facture d'une commande.
   * GET /api/v1/orders/{order_id}/invoice — 404 = facture encore inexistante.
   */
  static async getInvoiceByOrderId(orderId: string | number): Promise<Invoice> {
    try {
      const response = await api.get<Invoice>(`/api/v1/orders/${orderId}/invoice`);
      return response.data;
    } catch (error) {
      throw await normalizeError(error, 'Impossible de récupérer la facture de la commande');
    }
  }

  /**
   * Récupérer une facture par son identifiant.
   * GET /api/v1/invoices/{invoice_id}
   */
  static async getInvoice(invoiceId: string | number): Promise<Invoice> {
    try {
      const response = await api.get<Invoice>(`/api/v1/invoices/${invoiceId}`);
      return response.data;
    } catch (error) {
      throw await normalizeError(error, 'Impossible de récupérer la facture');
    }
  }

  /**
   * Télécharger le PDF d'une facture (réponse binaire).
   * GET /api/v1/invoices/{invoice_id}/pdf
   * Accept est surchargé pour accepter à la fois le PDF (succès) et le JSON
   * (détail d'erreur backend) ; le corps d'erreur est normalisé via Blob.
   */
  static async getInvoicePdf(invoiceId: string | number): Promise<Blob> {
    try {
      const response = await api.get(`/api/v1/invoices/${invoiceId}/pdf`, {
        responseType: 'blob',
        headers: { Accept: 'application/pdf, application/json' },
      });
      return response.data as Blob;
    } catch (error) {
      throw await normalizeError(error, 'Impossible de télécharger le PDF de la facture');
    }
  }
}

export default InvoiceService;