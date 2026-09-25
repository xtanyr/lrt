import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../types/auth';
import { authStore } from '../services/auth-store';
import type { AuthContextValue, UserRole } from '../types/auth';
import LoadingState from '../components/LoadingState';

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState(() => {
    authStore.setLoading(true);
    authStore.initViewAs();
    return authStore.getState();
  });

  useEffect(() => {
    const unsubscribe = authStore.subscribe(() => {
      setState(authStore.getState());
    });
    let active = true;
    authStore.setLoading(true);
    void fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('No active session');
        }
        const body = await response.json();
        const session = body.data || body;
        if (!session?.user || !session?.accessToken) {
          throw new Error('Invalid session response');
        }
        if (active) {
          authStore.login(session.accessToken, session.user);
          authStore.initViewAs();
        }
      })
      .catch(() => {
        if (active) {
          authStore.logout();
        }
      });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const login = (accessToken: string, user: AuthContextValue['user'] & { id: number }) => {
    authStore.login(accessToken, user as Parameters<typeof authStore.login>[1]);
  };

  const logout = async () => {
    authStore.logout();
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // The local session is already cleared even when the server is unavailable.
    }
  };

  const setViewAsRole = (role: UserRole | null) => {
    authStore.setViewAsRole(role);
  };

  if (state.loading) {
    return <LoadingState label="Проверяем сессию" />;
  }

  return (
    <AuthContext.Provider value={{ ...state, login, logout, setViewAsRole }}>
      {children}
    </AuthContext.Provider>
  );
}
