import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '@/lib/api';
import InvoiceService, {
  buildInvoiceWhatsappMessage,
  getInvoicePaymentBadge,
  getInvoicePaymentMethodLabel,
  getInvoicePdfFileName,
  getInvoiceStatusLabel,
  getPublicInvoiceViewUrl,
  normalizeInvoicePhone,
} from '../invoice.service';
import type { Invoice } from '../invoice.service';

vi.mock('@/lib/api', () => {
  const api = {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  };
  return {
    default: api,
    api,
    getProducts: vi.fn(),
    getProductById: vi.fn(),
    getProductBySlug: vi.fn(),
    getProductStock: vi.fn(),
    searchProducts: vi.fn(),
    getCategories: vi.fn(),
    getCategoryById: vi.fn(),
    getOrders: vi.fn(),
    getAdminOrders: vi.fn(),
    getOrderById: vi.fn(),
    createOrder: vi.fn(),
    cancelOrder: vi.fn(),
    confirmOrderDelivery: vi.fn(),
    updateOrderStatus: vi.fn(),
    updateOrderDelivery: vi.fn(),
    getOrderPayments: vi.fn(),
  };
});

const baseInvoice: Invoice = {
  id: 41,
  order_id: 123,
  order_number: 'CMD-001',
  invoice_number: 'INV-001',
  status: 'issued',
  currency: 'FCFA',
  issued_at: '2026-09-20T10:00:00Z',
  created_at: '2026-09-20T10:00:00Z',
  customer: { full_name: 'Awa Diop', email: 'awa@test.sn', phone: '+221771234567' },
  items: [
    { product_id: 1, product_name: 'Table', quantity: 2, unit_price: 5000, total_price: 10000 },
  ],
  subtotal: 10000,
  delivery_fee: 1000,
  discount_amount: 0,
  tax_amount: 0,
  total: 11000,
  payment: { status: 'paid', method: 'Carte', transaction_reference: 'TXN-1', paid_amount: 11000, amount_remaining: 0 },
  view_url: 'https://example.com/inv/INV-001',
};

describe('getInvoicePdfFileName', () => {
  it('produit un nom de fichier .pdf à partir du numéro de facture', () => {
    expect(getInvoicePdfFileName('INV-001')).toBe('INV-001.pdf');
  });

  it('échappe les caractères problématiques (espaces, slash)', () => {
    expect(getInvoicePdfFileName('Fac 2026/07')).toBe('Fac_2026_07.pdf');
  });

  it('retombe sur "facture" quand le numéro est absent', () => {
    expect(getInvoicePdfFileName(null)).toBe('facture.pdf');
    expect(getInvoicePdfFileName(undefined)).toBe('facture.pdf');
    expect(getInvoicePdfFileName('')).toBe('facture.pdf');
  });
});

describe('getInvoiceStatusLabel', () => {
  it('mappe les statuts connus en français', () => {
    expect(getInvoiceStatusLabel('draft')).toBe('Brouillon');
    expect(getInvoiceStatusLabel('issued')).toBe('Émise');
    expect(getInvoiceStatusLabel('sent')).toBe('Envoyée');
    expect(getInvoiceStatusLabel('paid')).toBe('Payée');
    expect(getInvoiceStatusLabel('overdue')).toBe('En retard');
    expect(getInvoiceStatusLabel('void')).toBe('Annulée');
  });

  it('retombe sur la valeur brute pour un statut inconnu', () => {
    expect(getInvoiceStatusLabel('mystery')).toBe('mystery');
  });
});

describe('normalizeInvoicePhone', () => {
  it('supprime le +, les espaces et les tirets', () => {
    expect(normalizeInvoicePhone('+221 77 123 45 67')).toBe('221771234567');
    expect(normalizeInvoicePhone('77-123-45-67')).toBe('771234567');
  });

  it('retourne une chaîne vide pour une valeur absente', () => {
    expect(normalizeInvoicePhone(null)).toBe('');
    expect(normalizeInvoicePhone(undefined)).toBe('');
  });
});

describe('getInvoicePaymentBadge', () => {
  it('mappe payé en badge vert "Payé"', () => {
    expect(getInvoicePaymentBadge('paid')).toEqual({ label: 'Payé', tone: 'success' });
    expect(getInvoicePaymentBadge('completed')).toEqual({ label: 'Payé', tone: 'success' });
  });

  it('mappe en attente à l\'orange', () => {
    expect(getInvoicePaymentBadge('pending')).toEqual({ label: 'En attente', tone: 'warning' });
    expect(getInvoicePaymentBadge('processing')).toEqual({ label: 'En attente', tone: 'warning' });
  });

  it('mappe échoué/annulé/expiré en rouge', () => {
    for (const s of ['failed', 'cancelled', 'expired']) {
      expect(getInvoicePaymentBadge(s)).toEqual({ label: 'Échoué', tone: 'error' });
    }
  });

  it('retourne null pour un statut absent ou inconnu', () => {
    expect(getInvoicePaymentBadge(null)).toBeNull();
    expect(getInvoicePaymentBadge(undefined)).toBeNull();
    expect(getInvoicePaymentBadge('mystery')).toBeNull();
  });
});

describe('getInvoicePaymentMethodLabel', () => {
  it('normalise les variantes PayTech en libellé lisible', () => {
    expect(getInvoicePaymentMethodLabel('paytech')).toBe('PayTech');
    expect(getInvoicePaymentMethodLabel('pay_tech')).toBe('PayTech');
    expect(getInvoicePaymentMethodLabel('pay-tech')).toBe('PayTech');
    expect(getInvoicePaymentMethodLabel('PayTech')).toBe('PayTech');
  });

  it('retombe sur la valeur brute pour un moyen inconnu', () => {
    expect(getInvoicePaymentMethodLabel('Mobile Money')).toBe('Mobile Money');
  });

  it('retourne "—" pour une valeur absente', () => {
    expect(getInvoicePaymentMethodLabel(null)).toBe('—');
    expect(getInvoicePaymentMethodLabel(undefined)).toBe('—');
  });
});

describe('getPublicInvoiceViewUrl', () => {
  it('accepte un lien public https', () => {
    expect(getPublicInvoiceViewUrl({ view_url: 'https://damedeco.sn/factures/INV-001' })).toBe(
      'https://damedeco.sn/factures/INV-001'
    );
  });

  it('neutralise la route technique /api/v1/invoices/...', () => {
    expect(getPublicInvoiceViewUrl({ view_url: '/api/v1/invoices/41' })).toBeNull();
    expect(
      getPublicInvoiceViewUrl({ view_url: 'https://api.example.com/api/v1/invoices/41' })
    ).toBeNull();
  });

  it('neutralise les liens relatifs et valeurs absentes', () => {
    expect(getPublicInvoiceViewUrl({ view_url: '/facture/41' })).toBeNull();
    expect(getPublicInvoiceViewUrl({})).toBeNull();
    expect(getPublicInvoiceViewUrl({ view_url: null })).toBeNull();
  });
});

describe('buildInvoiceWhatsappMessage', () => {
  it('construit un message complet avec paiement et lien public', () => {
    const message = buildInvoiceWhatsappMessage(baseInvoice, 'Awa Diop');
    expect(message).toContain('Bonjour Awa Diop');
    expect(message).toContain('commande CMD-001');
    expect(message).toContain('facture INV-001');
    expect(message).toContain('11\u202F000 FCFA');
    expect(message).toContain('Statut du paiement : Payé.');
    expect(message).toContain('https://example.com/inv/INV-001');
  });

  it('n\'expose jamais la route technique /api/v1/invoices/...', () => {
    const message = buildInvoiceWhatsappMessage({ ...baseInvoice, view_url: '/api/v1/invoices/41' });
    expect(message).not.toContain('/api/v1/invoices');
    expect(message).not.toContain('Retrouvez votre facture ici');
  });

  it("omet le lien public et le statut quand ils sont absents", () => {
    const message = buildInvoiceWhatsappMessage({
      ...baseInvoice,
      payment: null,
      view_url: null,
      customer: undefined,
    });
    expect(message).toContain('Bonjour Monsieur/Madame');
    expect(message).not.toContain('Statut du paiement');
    expect(message).not.toContain('Retrouvez votre facture ici');
  });
});

describe('InvoiceService.createInvoice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("appelle POST /api/v1/orders/{order_id}/invoice et renvoie la facture", async () => {
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: baseInvoice });
    const invoice = await InvoiceService.createInvoice(123);
    expect(api.post).toHaveBeenCalledWith('/api/v1/orders/123/invoice');
    expect(invoice).toEqual(baseInvoice);
  });

  it("préserve le statut d'erreur (ex. 409)", async () => {
    (api.post as ReturnType<typeof vi.fn>).mockRejectedValue({ status: 409, message: 'Conflit' });
    await expect(InvoiceService.createInvoice(123)).rejects.toMatchObject({ status: 409 });
  });
});

describe('InvoiceService.getInvoiceByOrderId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('appelle GET /api/v1/orders/{order_id}/invoice', async () => {
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: baseInvoice });
    const invoice = await InvoiceService.getInvoiceByOrderId(123);
    expect(api.get).toHaveBeenCalledWith('/api/v1/orders/123/invoice');
    expect(invoice.invoice_number).toBe('INV-001');
  });

  it('transmet le 404 (facture inexistante → génération attendue par le caller)', async () => {
    (api.get as ReturnType<typeof vi.fn>).mockRejectedValue({ status: 404, message: 'Not Found' });
    await expect(InvoiceService.getInvoiceByOrderId(123)).rejects.toMatchObject({ status: 404 });
  });
});

describe('InvoiceService.getInvoice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('appelle GET /api/v1/invoices/{invoice_id}', async () => {
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: baseInvoice });
    const invoice = await InvoiceService.getInvoice(41);
    expect(api.get).toHaveBeenCalledWith('/api/v1/invoices/41');
    expect(invoice.id).toBe(41);
  });

  it('préserve le statut 500', async () => {
    (api.get as ReturnType<typeof vi.fn>).mockRejectedValue({ status: 500, message: 'Erreur serveur' });
    await expect(InvoiceService.getInvoice(41)).rejects.toMatchObject({ status: 500 });
  });
});

describe('InvoiceService.getInvoicePdf', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('demande une réponse binaire Blob avec Accept compatible PDF+JSON', async () => {
    const blob = new Blob(['%PDF-1.4'], { type: 'application/pdf' });
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: blob });
    const result = await InvoiceService.getInvoicePdf(41);
    expect(api.get).toHaveBeenCalledWith('/api/v1/invoices/41/pdf', {
      responseType: 'blob',
      headers: { Accept: 'application/pdf, application/json' },
    });
    expect(result).toBeInstanceOf(Blob);
  });

  it("extrait le vrai `detail` du corps d'erreur Blob (ex. 404)", async () => {
    const errorBlob = new Blob([JSON.stringify({ detail: 'Facture indisponible pour cette commande.' })], {
      type: 'application/json',
    });
    (api.get as ReturnType<typeof vi.fn>).mockRejectedValue({
      status: 404,
      response: { data: errorBlob },
      config: {},
    });
    await expect(InvoiceService.getInvoicePdf(41)).rejects.toMatchObject({
      status: 404,
      message: 'Facture indisponible pour cette commande.',
    });
  });

  it('préserve le statut sans Blob (erreur réseau)', async () => {
    (api.get as ReturnType<typeof vi.fn>).mockRejectedValue({ status: 403, message: 'Forbidden' });
    await expect(InvoiceService.getInvoicePdf(41)).rejects.toMatchObject({ status: 403 });
  });
});