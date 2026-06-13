import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { CurrentUser } from '../../types';
import { fetchCurrentUser, loginWithPassword } from '../../api/auth';

const ACCESS_TOKEN_KEY = 'merchant_access_token';
const REFRESH_TOKEN_KEY = 'merchant_refresh_token';
export const PARTNER_ROLES = ['partner_owner', 'partner_admin'] as const;
type PartnerRole = (typeof PARTNER_ROLES)[number];

interface AuthContextValue {
  user: CurrentUser | null;
  loading: boolean;
  login: (payload: { phone: string; password: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  const bootstrap = useCallback(async () => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const profile = await fetchCurrentUser();
      if (!PARTNER_ROLES.includes(profile.role as PartnerRole)) {
        throw new Error('not_partner');
      }
      setUser(profile);
    } catch (error) {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const login = useCallback(async ({ phone, password }: { phone: string; password: string }) => {
    try {
      const tokens = await loginWithPassword({ phone, password });
      localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
      localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
      const profile = await fetchCurrentUser();
      if (!PARTNER_ROLES.includes(profile.role as PartnerRole)) {
        throw new Error('not_partner');
      }
      setUser(profile);
    } catch (error) {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
    }),
    [user, loading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const clearStoredTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};
