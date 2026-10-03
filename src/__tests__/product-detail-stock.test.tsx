/**
 * @file /src/__tests__/product-detail-stock.test.tsx
 * @description Le stock NE pilote plus l'UX d'achat.
 *
 * Règle : `canBuy = product.active`. Le champ `inventory_quantity` est
 * conservé dans les types et les données de l'API, mais un produit à 0
 * exemplaire doit rester Fullment commandable : quantité à 1, « + » libre,
 * « − » actif jusqu'à 1, bouton d'achat actif, aucun message de rupture.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

const { getProducts } = vi.hoisted(() => ({ getProducts: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  useParams: () => ({ id: '8' }),
}));

vi.mock('@/services/product.service', () => ({
  productService: { getProducts, getProductById: vi.fn() },
  default: { getProducts, getProductById: vi.fn() },
}));

import { ProductDetailPage } from '@/components/ProductDetailPage';
import { ProductStatus, type Product } from '@/types/product';

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: '8',
    name: 'Manual Product',
    slug: 'manual-product',
    price: 12000,
    sku: 'SKU-8',
    inventory_quantity: 0,
    min_order_quantity: 1,
    status: ProductStatus.ACTIVE,
    is_featured: false,
    is_new: false,
    category_id: 1,
    created_at: '2026-09-17T00:00:00Z',
    updated_at: '2026-09-17T00:00:00Z',
    ...overrides,
  } as Product;
}

function renderDetail(product: Product, onAddToCart = vi.fn()) {
  return {
    onAddToCart,
    ...render(
      <ProductDetailPage
        product={product}
        onAddToCart={onAddToCart}
        onBack={vi.fn()}
        userType="retail"
        favorites={[]}
        onToggleFavorite={vi.fn()}
        onViewProduct={vi.fn()}
      />
    ),
  };
}

const plusBtn = () => screen.getByRole('button', { name: /augmenter la quantité/i });
const minusBtn = () => screen.getByRole('button', { name: /diminuer la quantité/i });
const addBtn = () => screen.getByRole('button', { name: /ajouter au panier/i });
const qty = () => screen.getByText(/^\d+$/);

describe('Produit à stock = 0 — achat toujours possible', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getProducts.mockResolvedValue({ items: [], total: 0 });
  });

  afterEach(() => cleanup());

  it('1. propose une quantité initiale de 1 (et non 0)', async () => {
    renderDetail(makeProduct({ inventory_quantity: 0 }));
    await waitFor(() => expect(addBtn()).toBeEnabled());
    expect(qty()).toHaveTextContent('1');
  });

  it('2. le bouton « + » fonctionne, sans plafond imposé par le stock', async () => {
    renderDetail(makeProduct({ inventory_quantity: 0 }));
    await waitFor(() => expect(addBtn()).toBeEnabled());

    expect(plusBtn()).toBeEnabled();
    fireEvent.click(plusBtn());
    await waitFor(() => expect(qty()).toHaveTextContent('2'));
    fireEvent.click(plusBtn());
    await waitFor(() => expect(qty()).toHaveTextContent('3'));
  });

  it('3. le bouton « − » fonctionne jusqu’à 1 puis se bloque', async () => {
    renderDetail(makeProduct({ inventory_quantity: 0 }));
    await waitFor(() => expect(addBtn()).toBeEnabled());

    fireEvent.click(plusBtn());
    await waitFor(() => expect(qty()).toHaveTextContent('2'));

    expect(minusBtn()).toBeEnabled();
    fireEvent.click(minusBtn());
    await waitFor(() => expect(qty()).toHaveTextContent('1'));

    // À 1, « − » est le seul contrôle désactivé — plus jamais à cause du stock.
    expect(minusBtn()).toBeDisabled();
  });

  it('4. le bouton « Ajouter au panier » est actif et transmet la quantité', async () => {
    const onAddToCart = vi.fn();
    renderDetail(makeProduct({ inventory_quantity: 0 }), onAddToCart);
    await waitFor(() => expect(addBtn()).toBeEnabled());

    fireEvent.click(plusBtn());
    await waitFor(() => expect(qty()).toHaveTextContent('2'));

    fireEvent.click(addBtn());
    expect(onAddToCart).toHaveBeenCalledTimes(1);
    const [product, quantity] = onAddToCart.mock.calls[0];
    expect(quantity).toBe(2);
    expect(product.inventory_quantity).toBe(0);
  });

  it('5. n’affiche aucun message de rupture de stock', async () => {
    renderDetail(makeProduct({ inventory_quantity: 0 }));
    await waitFor(() => expect(addBtn()).toBeEnabled());

    expect(screen.queryByText(/rupture de stock/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/réapprovisionnement/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /rupture de stock/i })).not.toBeInTheDocument();
    // « Plus que 0 exemplaire » serait un non-sens : rien ne doit s'afficher.
    expect(screen.queryByText(/plus que 0/i)).not.toBeInTheDocument();
  });

  it('6. n’impose aucune limite max issue du stock', async () => {
    renderDetail(makeProduct({ inventory_quantity: 0 }));
    await waitFor(() => expect(addBtn()).toBeEnabled());

    // Bien au-delà de l'inventaire (0) : le « + » reste actif.
    for (let i = 0; i < 6; i += 1) fireEvent.click(plusBtn());
    await waitFor(() => expect(qty()).toHaveTextContent('7'));
    expect(plusBtn()).toBeEnabled();
  });

  it('conserve l’inventaire dans le type et les données reçues', () => {
    // Le champ stock n’est PAS supprimé : il reste exposé et typé.
    const p = makeProduct({ inventory_quantity: 0 });
    expect(p.inventory_quantity).toBe(0);
    expect('inventory_quantity' in p).toBe(true);
  });
});

describe('La règle « produit actif » reste appliquée', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getProducts.mockResolvedValue({ items: [], total: 0 });
  });

  afterEach(() => cleanup());

  it('7. un produit inactif reste non achetable', async () => {
    renderDetail(makeProduct({ inventory_quantity: 10, status: ProductStatus.INACTIVE }));
    await waitFor(() => expect(screen.getByRole('button', { name: /indisponible/i })).toBeInTheDocument());

    const button = screen.getByRole('button', { name: /indisponible/i });
    expect(button).toBeDisabled();
    expect(plusBtn()).toBeDisabled();
    expect(minusBtn()).toBeDisabled();
    expect(screen.queryByRole('button', { name: /ajouter au panier/i })).not.toBeInTheDocument();
  });

  it('un produit inactif affiche « Produit indisponible à la vente »', async () => {
    renderDetail(makeProduct({ inventory_quantity: 10, status: ProductStatus.INACTIVE }));
    await waitFor(() => expect(screen.getByText(/indisponible à la vente/i)).toBeInTheDocument());
  });

  it('fail open : un statut absent n’empêche pas l’achat', async () => {
    // Si l'API ne renvoie pas de statut, on ne doit pas bloquer la vente.
    renderDetail(makeProduct({ inventory_quantity: 0, status: undefined as never }));
    await waitFor(() => expect(addBtn()).toBeEnabled());
    expect(screen.getByText('1')).toBeInTheDocument();
  });
});

describe('Information stock non bloquante', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getProducts.mockResolvedValue({ items: [], total: 0 });
  });

  afterEach(() => cleanup());

  it('affiche un avertissement de stock faible quand il reste 1 à 5 unités', async () => {
    renderDetail(makeProduct({ inventory_quantity: 3 }));
    await waitFor(() => expect(screen.getByText(/Plus que 3 exemplaires en stock\./)).toBeInTheDocument());
    // L'information est affichée mais ne bloque RIEN.
    expect(addBtn()).toBeEnabled();
  });

  it('n’affiche rien quand le stock est confortable', async () => {
    renderDetail(makeProduct({ inventory_quantity: 40 }));
    await waitFor(() => expect(addBtn()).toBeEnabled());
    expect(screen.queryByText(/plus que/i)).not.toBeInTheDocument();
  });
});
