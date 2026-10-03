/**
 * @file /src/__tests__/settings-password-page.test.tsx
 * @description Après un changement de mot de passe réussi, l'utilisateur doit
 * être redirigé vers SON tableau de bord (jamais vers une route d'un autre rôle).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

const { push, currentUser, post, get } = vi.hoisted(() => ({
  push: vi.fn(),
  currentUser: { role: 'client' as string },
  post: vi.fn(),
  get: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace: vi.fn(), prefetch: vi.fn() }),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    loading: false,
    user: { id: '1', role: currentUser.role, name: 'Client' },
  }),
}));

vi.mock('@/lib/api-client', () => ({
  default: { get, post },
}));

import PasswordPage from '@/app/settings/password/page';

function fillForm() {
  fireEvent.change(screen.getByLabelText(/^mot de passe actuel/i), { target: { value: 'Ancien123!' } });
  fireEvent.change(screen.getByLabelText(/^nouveau mot de passe/i), { target: { value: 'Nouveau456!' } });
  fireEvent.change(screen.getByLabelText(/^confirmer le nouveau mot de passe/i), { target: { value: 'Nouveau456!' } });
}

async function submitAndWait() {
  render(<PasswordPage />);
  await waitFor(() => expect(get).toHaveBeenCalled());
  fillForm();
  fireEvent.click(screen.getByRole('button', { name: /changer le mot de passe/i }));
  await waitFor(() => expect(push).toHaveBeenCalled());
}

describe('/settings/password — redirection après succès', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentUser.role = 'client';
    get.mockResolvedValue({ data: { id: 1, full_name: 'Salioungom ibn' } });
    post.mockResolvedValue({ data: { success: true } });
  });

  afterEach(() => cleanup());

  it('envoie current_password / new_password (contrat admin pré-vol)', async () => {
    render(<PasswordPage />);
    await waitFor(() => expect(get).toHaveBeenCalled());
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /changer le mot de passe/i }));

    await waitFor(() => expect(post).toHaveBeenCalled());
    expect(post.mock.calls[0][0]).toBe('/api/v1/users/1/change-password');
    expect(post.mock.calls[0][1]).toEqual({ current_password: 'Ancien123!', new_password: 'Nouveau456!' });
  });

  it('redirige un client vers /account', async () => {
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

  it('NE redirige PAS si le mot de passe actuel est refusé (401/400)', async () => {
    post.mockRejectedValue({ response: { status: 401, data: { detail: 'Mot de passe incorrect' } } });

    render(<PasswordPage />);
    await waitFor(() => expect(get).toHaveBeenCalled());
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /changer le mot de passe/i }));

    await waitFor(() => expect(screen.getByText(/mot de passe incorrect/i)).toBeInTheDocument());
    // Rediriger sur un échec donnerait une fausse impression de succès.
    expect(push).not.toHaveBeenCalled();
  });

  it('NE redirige PAS si les deux mots de passe ne correspondent pas', async () => {
    render(<PasswordPage />);
    await waitFor(() => expect(get).toHaveBeenCalled());

    fireEvent.change(screen.getByLabelText(/^mot de passe actuel/i), { target: { value: 'Ancien123!' } });
    fireEvent.change(screen.getByLabelText(/^nouveau mot de passe/i), { target: { value: 'Nouveau456!' } });
    fireEvent.change(screen.getByLabelText(/^confirmer le nouveau mot de passe/i), { target: { value: 'Different789!' } });
    fireEvent.click(screen.getByRole('button', { name: /changer le mot de passe/i }));

    await waitFor(() => expect(screen.getByText(/ne correspondent pas/i)).toBeInTheDocument());
    expect(post).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });
});
