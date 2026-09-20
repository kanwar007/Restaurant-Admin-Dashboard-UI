import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { api, tokenStore } from '../api/client';
import type { LoginResponse, User } from '../api/types';
import { AuthContext, type AuthContextValue } from './context';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthContextValue['status']>(() =>
    tokenStore.read() ? 'loading' : 'anonymous',
  );

  useEffect(() => {
    if (!tokenStore.read()) return;
    api
      .get<{ user: User }>('/auth/me')
      .then(({ user: current }) => {
        setUser(current);
        setStatus('authenticated');
      })
      .catch(() => {
        tokenStore.clear();
        setStatus('anonymous');
      });
  }, []);

  const signIn = useCallback<AuthContextValue['signIn']>(
    async (credentials) => {
      const { token, user: signedIn } = await api.post<LoginResponse>('/auth/login', credentials);
      tokenStore.write(token);
      setUser(signedIn);
      setStatus('authenticated');
      await queryClient.invalidateQueries();
    },
    [queryClient],
  );

  const signOut = useCallback<AuthContextValue['signOut']>(async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      tokenStore.clear();
      setUser(null);
      setStatus('anonymous');
      queryClient.clear();
    }
  }, [queryClient]);

  const value = useMemo(() => ({ user, status, signIn, signOut }), [user, status, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
