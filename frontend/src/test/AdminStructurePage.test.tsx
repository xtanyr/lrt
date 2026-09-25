import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminStructurePage from '../pages/admin/AdminStructurePage';
import ToastProvider from '../components/ToastProvider';
import { api } from '../services/api';

describe('AdminStructurePage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('loads inactive shops and can activate them again', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [{ id: 1, name: 'Омск', isActive: true, coffeeShops: [{ id: 9, name: 'Закрытая', isActive: false }] }] } as any);
    vi.mocked(api.patch).mockResolvedValue({ data: { id: 9, isActive: true } } as any);

    render(<ToastProvider><AdminStructurePage /></ToastProvider>);
    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/cities?includeInactiveShops=true'));
    fireEvent.click(await screen.findByText('Омск'));
    expect(await screen.findByText('деактивирована')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Активировать' }));

    await waitFor(() => expect(api.patch).toHaveBeenCalledWith('/coffee-shops/9', { isActive: true }));
    expect(await screen.findByText('активна')).toBeInTheDocument();
  });
});
