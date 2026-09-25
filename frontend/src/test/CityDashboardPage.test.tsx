import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthProvider';
import ToastProvider from '../components/ToastProvider';
import CityDashboardPage from '../pages/city-leader/CityDashboardPage';

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>{ui}</ToastProvider>
      </AuthProvider>
    </BrowserRouter>,
  );
}

describe('CityDashboardPage', () => {
  it('renders city dashboard', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((url: RequestInfo | URL) => {
      const urlString = typeof url === 'string' ? url : url.toString();
      if (urlString.includes('/metrics')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
        }) as any;
      }
      if (urlString.includes('/dashboard/city-leader')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { reports: [], ipvStatuses: [] } }),
        }) as any;
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      }) as any;
    });

    renderWithProviders(<CityDashboardPage />);
    expect(await screen.findByText('Дашборд города · 0 кофеен')).toBeDefined();
  });
});
