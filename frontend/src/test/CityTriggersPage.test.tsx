import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthProvider';
import ToastProvider from '../components/ToastProvider';
import CityTriggersPage from '../pages/city-leader/CityTriggersPage';

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>{ui}</ToastProvider>
      </AuthProvider>
    </BrowserRouter>,
  );
}

describe('CityTriggersPage', () => {
  it('renders triggers list', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((url: RequestInfo | URL) => {
      const urlString = typeof url === 'string' ? url : url.toString();
      if (urlString.includes('/ipv-triggers/statuses')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
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

    renderWithProviders(<CityTriggersPage />);
    expect(await screen.findByText('Триггеры ИПВ')).toBeDefined();
  });
});
