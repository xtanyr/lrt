import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthProvider';
import LoginPage from '../pages/LoginPage';

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <BrowserRouter>
      <AuthProvider>{ui}</AuthProvider>
    </BrowserRouter>,
  );
}

describe('LoginPage', () => {
  it('renders login form', async () => {
    (globalThis as any).fetch = vi.fn().mockResolvedValue({ ok: false });
    renderWithProviders(<LoginPage />);
    expect(await screen.findByPlaceholderText('name@skuratov.ru')).toBeDefined();
    expect(screen.getByText('Войти')).toBeDefined();
  });

  it('submits login form', async () => {
    const user = userEvent.setup();
    (globalThis as any).fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            data: {
              accessToken: 'test-token',
              user: { id: 1, name: 'Admin', email: 'admin@skuratovcoffee.ru', role: 'ADMIN' },
            },
          }),
      }),
    ) as any;

    renderWithProviders(<LoginPage />);
    await user.type(await screen.findByPlaceholderText('name@skuratov.ru'), 'admin@skuratovcoffee.ru');
    await user.type(screen.getByLabelText('Пароль'), 'password123');
    await user.click(screen.getByText('Войти'));

    expect((globalThis as any).fetch).toHaveBeenCalledWith('/api/auth/login', expect.objectContaining({
      credentials: 'include',
    }));
  });

  it('replaces the password when opened from a reset link', async () => {
    window.history.pushState({}, '', '/login?resetToken=reset-secret');
    const user = userEvent.setup();
    (globalThis as any).fetch = vi.fn((url: string) => Promise.resolve({
      ok: url === '/api/auth/reset-password',
      json: () => Promise.resolve({ data: {} }),
    })) as any;

    renderWithProviders(<LoginPage />);
    await user.type(await screen.findByLabelText('Новый пароль'), 'new-password');
    await user.type(screen.getByLabelText('Повторите пароль'), 'new-password');
    await user.click(screen.getByRole('button', { name: 'Сохранить новый пароль' }));

    await waitFor(() => expect((globalThis as any).fetch).toHaveBeenCalledWith(
      '/api/auth/reset-password',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ token: 'reset-secret', password: 'new-password' }),
      }),
    ));
    expect(await screen.findByText('Пароль изменён. Теперь можно войти.')).toBeDefined();
    window.history.pushState({}, '', '/login');
  });
});
