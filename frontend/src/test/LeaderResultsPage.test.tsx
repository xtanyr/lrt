import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthProvider';
import ToastProvider from '../components/ToastProvider';
import LeaderResultsPage from '../pages/leader/LeaderResultsPage';

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>{ui}</ToastProvider>
      </AuthProvider>
    </BrowserRouter>,
  );
}

describe('LeaderResultsPage', () => {
  it('renders results page', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((url: RequestInfo | URL) => {
      const urlString = typeof url === 'string' ? url : url.toString();
      if (urlString.includes('/metrics')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
        }) as any;
      }
      if (urlString.includes('/dashboard/leader')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { reports: [] } }),
        }) as any;
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      }) as any;
    });

    renderWithProviders(<LeaderResultsPage />);
    expect(await screen.findByText('Мои результаты')).toBeDefined();
    expect(screen.getByText('Динамика за 12 месяцев')).toBeDefined();
  });
});
