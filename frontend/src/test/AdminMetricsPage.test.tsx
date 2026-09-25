import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthProvider';
import ToastProvider from '../components/ToastProvider';
import AdminMetricsPage from '../pages/admin/AdminMetricsPage';
import { api } from '../services/api';

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>{ui}</ToastProvider>
      </AuthProvider>
    </BrowserRouter>,
  );
}

describe('AdminMetricsPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders metrics table', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] } as any);

    renderWithProviders(<AdminMetricsPage />);
    expect(await screen.findByText('Метрики рейтинга')).toBeDefined();
  });

  it('edits decimal metric settings and keeps the technical code immutable', async () => {
    const metric = { id: 5, name: 'Тест', code: 'TEST', unit: '%', direction: 'HIGHER_IS_BETTER', targetValue: 90, midValue: 75, ptTarget: 11.5, ptMid: 5.75, isActive: true, source: 'Manual', section: 'TEAM_GUESTS' };
    vi.mocked(api.get).mockResolvedValue({ data: [metric] } as any);
    vi.mocked(api.patch).mockResolvedValue({ data: metric } as any);

    renderWithProviders(<AdminMetricsPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Изменить' }));
    expect(screen.getByLabelText('Код')).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Целевой порог'), { target: { value: '95,5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }));

    await waitFor(() => expect(api.patch).toHaveBeenCalledWith('/metrics/5', expect.objectContaining({
      code: 'TEST', targetValue: 95.5, midValue: 75, ptTarget: 11.5, ptMid: 5.75,
    })));
  });

  it('shows threshold validation errors instead of failing silently', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] } as any);
    renderWithProviders(<AdminMetricsPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Добавить метрику' }));
    fireEvent.change(screen.getByLabelText('Название'), { target: { value: 'Новая' } });
    fireEvent.change(screen.getByLabelText('Код'), { target: { value: 'NEW' } });
    fireEvent.change(screen.getByLabelText('Единица измерения'), { target: { value: '%' } });
    fireEvent.change(screen.getByLabelText('Блок'), { target: { value: 'TEAM_GUESTS' } });
    fireEvent.change(screen.getByLabelText('Целевой порог'), { target: { value: '70' } });
    fireEvent.change(screen.getByLabelText('Ниже цели'), { target: { value: '80' } });
    fireEvent.change(screen.getByLabelText('Баллы (зелёная)'), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText('Баллы (жёлтая)'), { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('целевой порог должен быть не ниже');
    expect(api.post).not.toHaveBeenCalled();
  });
});
