import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from '../contexts/AuthProvider';
import { authStore } from '../services/auth-store';

function SessionProbe() {
  const { user, loading } = useAuth();
  return <div>{loading ? 'loading' : user?.email || 'anonymous'}</div>;
}

describe('AuthProvider session restoration', () => {
  beforeEach(() => {
    authStore.logout();
  });

  it('renews the cookie session and restores the current user on startup', async () => {
    (globalThis as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        data: {
          accessToken: 'renewed-token',
          user: { id: 5, name: 'Current', email: 'current@example.com', role: 'LEADER' },
        },
      }),
    });

    render(<AuthProvider><SessionProbe /></AuthProvider>);

    await waitFor(() => expect(screen.getByText('current@example.com')).toBeDefined());
    expect((globalThis as any).fetch).toHaveBeenCalledWith('/api/auth/refresh', expect.objectContaining({
      method: 'POST',
      credentials: 'include',
    }));
  });
});
