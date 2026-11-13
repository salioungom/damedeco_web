import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import type { ReactNode } from 'react';

const { post, push, refetchUser } = vi.hoisted(() => ({
  post: vi.fn(),
  push: vi.fn(),
  refetchUser: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace: vi.fn(), prefetch: vi.fn() }),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', role: 'superadmin', full_name: 'Admin' },
    refetchUser,
  }),
}));

vi.mock('@/lib/api-client', () => ({
  default: { post },
}));

vi.mock('@/components/RequireRole', () => ({
  RequireRole: ({ children }: { children: ReactNode }) => children,
}));

import ChangePasswordPage from '@/app/change-password/page';

describe('/change-password', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    refetchUser.mockResolvedValue({ role: 'superadmin' });
    post.mockResolvedValue({ data: { success: true } });
  });

  afterEach(() => cleanup());

  it('submits using the authenticated session without requesting a user id', async () => {
    render(<ChangePasswordPage />);

    const submit = screen.getByRole('button', { name: /changer le mot de passe/i });
    fireEvent.change(screen.getByLabelText(/^mot de passe actuel/i), {
      target: { value: 'Ancien123!' },
    });
    fireEvent.change(screen.getByLabelText(/^nouveau mot de passe/i), {
      target: { value: 'Nouveau456!A' },
    });
    fireEvent.change(screen.getByLabelText(/^confirmer le nouveau mot de passe/i), {
      target: { value: 'Nouveau456!A' },
    });

    expect(submit).toBeEnabled();
    fireEvent.click(submit);

    await waitFor(() => {
      expect(post).toHaveBeenCalledWith('/api/v1/auth/password/change', {
        current_password: 'Ancien123!',
        new_password: 'Nouveau456!A',
        confirm_password: 'Nouveau456!A',
      });
    });
    expect(refetchUser).toHaveBeenCalled();
    expect(post).not.toHaveBeenCalledWith('/api/v1/users/me');
    await waitFor(() => expect(push).toHaveBeenCalledWith('/dashboards'), { timeout: 3500 });
  });
});
