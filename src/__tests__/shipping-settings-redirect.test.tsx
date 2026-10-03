/**
 * @file /src/__tests__/shipping-settings-redirect.test.tsx
 * @description Après sauvegarde des frais de livraison, le dashboard doit
 * ramener l'utilisateur sur l'onglet « Vue d'ensemble ».
 *
 * `CustomTabPanel` retourne null quand `value !== index` : le formulaire est
 * donc DÉMONTÉ au changement d'onglet. `onSaved` doit être appelé APRÈS le
 * rechargement, sinon `loadSettings()` écrirait dans un composant démonté.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

const { getSettings, updateSettings, createSettings } = vi.hoisted(() => ({
  getSettings: vi.fn(),
  updateSettings: vi.fn(),
  createSettings: vi.fn(),
}));

vi.mock('@/lib/shipping', () => ({
  shippingAPI: { getSettings, updateSettings, createSettings },
}));

// `next/font/google` n'est pas exécutable en jsdom : on fournit la couleur
// de marque attendue par les composants shipping.
vi.mock('@/theme', () => ({
  BRAND_BLUE: '#185FA5',
  tokens: { colors: { brand: { main: '#185FA5' } } },
}));

import ShippingSettingsForm from '@/components/shipping/ShippingSettingsForm';
import ShippingManagement from '@/components/shipping/ShippingManagement';

const currentSettings = {
  id: 1,
  freeShippingThreshold: 20000,
  standardShippingCost: 3500,
};

const saveBtn = () => screen.getByRole('button', { name: /sauvegarder les modifications/i });

describe('ShippingSettingsForm — redirection post-sauvegarde', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSettings.mockResolvedValue({ data: currentSettings });
    updateSettings.mockResolvedValue({ data: { ...currentSettings, freeShippingThreshold: 25000 } });
    createSettings.mockResolvedValue({ data: currentSettings });
  });

  afterEach(() => cleanup());

  it('appelle onSaved après une sauvegarde réussie', async () => {
    const onSaved = vi.fn();
    render(<ShippingSettingsForm onSaved={onSaved} />);

    await waitFor(() => expect(saveBtn()).toBeEnabled());
    fireEvent.click(saveBtn());

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
  });

  it('recharge les paramètres AVANT de notifier (panneau encore monté)', async () => {
    const onSaved = vi.fn();
    getSettings.mockResolvedValue({ data: currentSettings });
    render(<ShippingSettingsForm onSaved={onSaved} />);

    await waitFor(() => expect(saveBtn()).toBeEnabled());
    fireEvent.click(saveBtn());
    await waitFor(() => expect(onSaved).toHaveBeenCalled());

    // 1er appel = chargement initial, 2e = rechargement post-save.
    expect(getSettings).toHaveBeenCalledTimes(2);
    // Le rechargement doit avoir été déclenché avant la notification.
    const reloadOrder = getSettings.mock.invocationCallOrder[1];
    const notifyOrder = onSaved.mock.invocationCallOrder[0];
    expect(reloadOrder).toBeLessThan(notifyOrder);
  });

  it('envoie les valeurs modifiées avant de notifier', async () => {
    const onSaved = vi.fn();
    render(<ShippingSettingsForm onSaved={onSaved} />);
    await waitFor(() => expect(saveBtn()).toBeEnabled());

    const threshold = screen.getByDisplayValue('20000');
    fireEvent.change(threshold, { target: { value: '25000' } });
    fireEvent.click(saveBtn());

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(updateSettings).toHaveBeenCalledWith(
      expect.objectContaining({ freeShippingThreshold: 25000, standardShippingCost: 3500 })
    );
  });

  it('N’appelle PAS onSaved si la sauvegarde échoue', async () => {
    const onSaved = vi.fn();
    updateSettings.mockResolvedValue({ error: { message: 'Erreur 422' } });

    render(<ShippingSettingsForm onSaved={onSaved} />);
    await waitFor(() => expect(saveBtn()).toBeEnabled());
    fireEvent.click(saveBtn());

    // L'erreur doit être affichée et l'utilisateur rester sur l'onglet.
    await waitFor(() => expect(screen.getByText('Erreur 422')).toBeInTheDocument());
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('N’appelle PAS onSaved si la requête lève une exception', async () => {
    const onSaved = vi.fn();
    updateSettings.mockRejectedValue(new Error('Network down'));

    render(<ShippingSettingsForm onSaved={onSaved} />);
    await waitFor(() => expect(saveBtn()).toBeEnabled());
    fireEvent.click(saveBtn());

    await waitFor(() => expect(screen.getByText('Network down')).toBeInTheDocument());
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('fonctionne sans onSaved (page /admin/shipping autonome)', async () => {
    render(<ShippingSettingsForm />);
    await waitFor(() => expect(saveBtn()).toBeEnabled());

    fireEvent.click(saveBtn());
    await waitFor(() => expect(updateSettings).toHaveBeenCalled());
    // Aucun crash malgré l'absence de callback.
    expect(screen.queryByText(/erreur/i)).not.toBeInTheDocument();
  });
});

describe('ShippingManagement — relais de la prop', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSettings.mockResolvedValue({ data: currentSettings });
    updateSettings.mockResolvedValue({ data: currentSettings });
  });

  afterEach(() => cleanup());

  it('relaye onSaved jusqu’au formulaire', async () => {
    const onSaved = vi.fn();
    render(<ShippingManagement onSaved={onSaved} />);

    await waitFor(() => expect(saveBtn()).toBeEnabled());
    fireEvent.click(saveBtn());

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
  });

  it('affiche le bloc “Frais de livraison” et se monte sans prop', async () => {
    render(<ShippingManagement />);
    await waitFor(() => expect(screen.getByText('Frais de livraison')).toBeInTheDocument());
    await waitFor(() => expect(saveBtn()).toBeEnabled());
  });
});
