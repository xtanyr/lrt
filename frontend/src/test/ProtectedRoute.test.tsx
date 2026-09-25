import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthProvider';
import ProtectedRoute from '../App';

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <BrowserRouter>
      <AuthProvider>{children}</AuthProvider>
    </BrowserRouter>
  );
}

describe('ProtectedRoute', () => {
  it('redirects to login when not authenticated', async () => {
    (globalThis as any).fetch = vi.fn().mockResolvedValue({ ok: false });
    render(
      <Wrapper>
        <ProtectedRoute />
      </Wrapper>,
    );
    expect(await screen.findByPlaceholderText('name@skuratov.ru')).toBeDefined();
  });
});
