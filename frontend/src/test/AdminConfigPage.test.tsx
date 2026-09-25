import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthProvider';
import ToastProvider from '../components/ToastProvider';
import AdminConfigPage from '../pages/admin/AdminConfigPage';

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>{ui}</ToastProvider>
      </AuthProvider>
    </BrowserRouter>,
  );
}

describe('AdminConfigPage', () => {
  it('renders config tabs', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((url: RequestInfo | URL) => {
      const urlString = typeof url === 'string' ? url : url.toString();
      if (urlString.includes('/admin/rating-color-config')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { id: 1, greenThreshold: 80, redThreshold: 60 } }),
        }) as any;
      }
      if (urlString.includes('/admin/trigger-configs')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
        }) as any;
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      }) as any;
    });

    renderWithProviders(<AdminConfigPage />);
    expect(await screen.findByText('Конфигурация')).toBeDefined();
    expect(screen.getByText('Рейтинг')).toBeDefined();
    expect(screen.getByText('Триггеры')).toBeDefined();
  });
});
