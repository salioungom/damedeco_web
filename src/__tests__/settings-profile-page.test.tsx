/**
 * @file /src/__tests__/settings-profile-page.test.tsx
 * @description Comportement de la page /settings/profile.
 *
 * Cible la garde §4 : `last_name` est NOT NULL en base, un nom d'un seul mot
 * doit être refusé AVANT tout appel réseau, sans jamais dupliquer le prénom
 * en nom. Vérifie aussi l'orchestration double (identité + adresse).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

const { push, replace, updateProfile, getCurrentProfile, saveProfileAddress, getUserAddresses, getDefaultAddress, currentUser } =
  vi.hoisted(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    updateProfile: vi.fn(),
    getCurrentProfile: vi.fn(),
    saveProfileAddress: vi.fn(),
    getUserAddresses: vi.fn(),
    getDefaultAddress: vi.fn(),
    currentUser: { role: 'client' as string },
  }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace, prefetch: vi.fn() }),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    loading: false,
    user: { id: '1', role: currentUser.role, name: 'Client' },
  }),
}));

vi.mock('@/services/user.service', () => ({
  default: { updateProfile, getCurrentProfile },
  UserService: { updateProfile, getCurrentProfile },
}));

vi.mock('@/services/address.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/address.service')>();
  return {
    ...actual,
    AddressService: { ...actual.AddressService, saveProfileAddress, getUserAddresses, getDefaultAddress },
  };
});

import ProfilePage from '@/app/settings/profile/page';

const baseProfile = {
  id: 1,
  full_name: 'Ancien Nom Ancien',
  username: 'ancien',
  email: 'ancien@test.sn',
  phone: '+221785958076',
  created_at: '2024-01-01T00:00:00Z',
};

function fillFullName(value: string) {
  fireEvent.change(screen.getByLabelText(/nom complet/i), { target: { value } });
}

function submit() {
  fireEvent.click(screen.getByRole('button', { name: /enregistrer les modifications/i }));
}

describe('/settings/profile — validation du nom et orchestration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentUser.role = 'client';
    getCurrentProfile.mockResolvedValue(baseProfile);
    getUserAddresses.mockResolvedValue([]);
    getDefaultAddress.mockResolvedValue(null);
    updateProfile.mockResolvedValue({ ...baseProfile, full_name: 'Salioungom ibn' });
    saveProfileAddress.mockResolvedValue({ id: 7, address_line_1: 'dakar hlm', is_default: true });
  });

  afterEach(() => {
    cleanup();
  });

  it('affiche le nom snake_case renvoyé par /users/me', async () => {
    render(<ProfilePage />);
    await waitFor(() => expect(screen.getByLabelText(/nom complet/i)).toHaveValue('Ancien Nom Ancien'));
  });

  it('refuse un nom d’un seul mot ET n’envoie AUCUNE requête', async () => {
    render(<ProfilePage />);
    await waitFor(() => expect(getCurrentProfile).toHaveBeenCalled());

    fillFullName('Salioungom');
    submit();

    // Le message inline doit apparaître…
    await waitFor(() =>
      expect(screen.getByText(/au moins 2 mots/i)).toBeInTheDocument()
    );

    // …et surtout, aucun appel réseau ne doit partir.
    expect(updateProfile).not.toHaveBeenCalled();
    expect(saveProfileAddress).not.toHaveBeenCalled();
  });

  it('accepte un nom complet et déclenche les DEUX appels', async () => {
    render(<ProfilePage />);
    await waitFor(() => expect(getCurrentProfile).toHaveBeenCalled());

    fillFullName('Salioungom ibn');
    submit();

    await waitFor(() => expect(updateProfile).toHaveBeenCalled());
    expect(saveProfileAddress).toHaveBeenCalled();

    // Le payload frontend reste camelCase ; c'est le service qui convertit.
    expect(updateProfile.mock.calls[0][0]).toMatchObject({ fullName: 'Salioungom ibn' });

    // Le nom n'est jamais dupliqué en lastName côté formulaire.
    const [, addressPayload] = saveProfileAddress.mock.calls[0];
    expect(addressPayload.firstName).toBe('Salioungom');
    expect(addressPayload.lastName).toBe('ibn');
  });

  it('limite le superadmin aux champs de création et ne charge ni ne sauvegarde une adresse', async () => {
    currentUser.role = 'superadmin';
    render(<ProfilePage />);

    await waitFor(() => expect(screen.getByLabelText(/nom complet/i)).toHaveValue('Ancien Nom Ancien'));

    expect(screen.getByLabelText(/adresse email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/numéro de téléphone/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/nom d'utilisateur/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/^adresse$/i)).not.toBeInTheDocument();
    expect(getDefaultAddress).not.toHaveBeenCalled();

    fillFullName('Salioungom ibn');
    submit();

    await waitFor(() => expect(updateProfile).toHaveBeenCalled());
    expect(saveProfileAddress).not.toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith('/dashboards');
  });

  it('affiche le detail backend quand un 422 est renvoyé', async () => {
    const detail = [{ loc: ['body', 'username'], msg: 'String should have at least 3 characters' }];
    updateProfile.mockRejectedValue({ response: { status: 422, data: { detail } } });
    saveProfileAddress.mockRejectedValue({ response: { status: 422, data: { detail: [{ loc: ['body', 'city'], msg: 'Field required' }] } } });

    render(<ProfilePage />);
    await waitFor(() => expect(getCurrentProfile).toHaveBeenCalled());

    fillFullName('Salioungom ibn');
    submit();

    // Le message technique doit remonter à l'utilisateur (bug masqué avant).
    await waitFor(() => expect(screen.getByText(/at least 3 characters/i)).toBeInTheDocument());
    expect(screen.getByText(/field required/i)).toBeInTheDocument();
  });

  it('NE redirige PAS en cas d’échec partiel (l’erreur doit rester visible)', async () => {
    updateProfile.mockResolvedValue({ ...baseProfile, full_name: 'Salioungom ibn' });
    saveProfileAddress.mockRejectedValue({ response: { status: 422, data: { detail: 'Field required' } } });

    render(<ProfilePage />);
    await waitFor(() => expect(getCurrentProfile).toHaveBeenCalled());

    fillFullName('Salioungom ibn');
    submit();

    await waitFor(() => expect(screen.getByText(/adresse : field required/i)).toBeInTheDocument());
    // Rediriger ici masquerait l'erreur et ferait croire à un succès.
    expect(push).not.toHaveBeenCalled();
  });
});

describe('/settings/profile — redirection après succès', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentUser.role = 'client';
    getCurrentProfile.mockResolvedValue(baseProfile);
    getUserAddresses.mockResolvedValue([]);
    getDefaultAddress.mockResolvedValue(null);
    updateProfile.mockResolvedValue({ ...baseProfile, full_name: 'Salioungom ibn' });
    saveProfileAddress.mockResolvedValue({ id: 7, address_line_1: 'dakar hlm', is_default: true });
  });

  afterEach(() => {
    cleanup();
  });

  async function submitAndWait() {
    render(<ProfilePage />);
    await waitFor(() => expect(getCurrentProfile).toHaveBeenCalled());
    fillFullName('Salioungom ibn');
    submit();
    await waitFor(() => expect(push).toHaveBeenCalled());
  }

  it('redirige un client vers /account après un enregistrement réussi', async () => {
    currentUser.role = 'client';
    await submitAndWait();
    expect(push).toHaveBeenCalledWith('/account');
  });

  it('redirige un admin vers /dashboard', async () => {
    currentUser.role = 'admin';
    await submitAndWait();
    expect(push).toHaveBeenCalledWith('/dashboard');
  });

  it('redirige un superadmin vers /dashboards', async () => {
    currentUser.role = 'superadmin';
    await submitAndWait();
    expect(push).toHaveBeenCalledWith('/dashboards');
  });

  it('ne redirige pas vers une route interdite au rôle du user', async () => {
    currentUser.role = 'client';
    await submitAndWait();
    // Un client ne doit jamais atterrir sur une page admin.
    expect(push).not.toHaveBeenCalledWith('/dashboard');
    expect(push).not.toHaveBeenCalledWith('/dashboards');
  });
});
