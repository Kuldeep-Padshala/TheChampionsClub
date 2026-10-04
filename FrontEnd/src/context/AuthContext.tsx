import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../api/client';
import { websocketService } from '../services/websocketService';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  roles?: string[];
}

export interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isFrontDesk: boolean;
  isManager: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  isBarStaff: boolean;
  isShopStaff: boolean;
  isAccountant: boolean;
  isMember: boolean;
  hasRole: (role: string) => boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (
    name: string,
    email: string,
    password: string,
    role?: string,
    phone?: string,
    date_of_birth?: string
  ) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      // Check for OAuth token in URL query params
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get('token');
      if (urlToken) {
        localStorage.setItem('auth_token', urlToken);
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }

      const res = await api.get('/auth/me');
      setUser(res.data.user);
      const activeToken = localStorage.getItem('auth_token');
      if (activeToken) {
        websocketService.authenticate(activeToken);
      }
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false));
  }, [refreshUser]);

  const login = async (email: string, password: string): Promise<AuthUser> => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.token) {
      localStorage.setItem('auth_token', res.data.token);
      websocketService.authenticate(res.data.token);
    }
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    role?: string,
    phone?: string,
    date_of_birth?: string
  ): Promise<AuthUser> => {
    const res = await api.post('/auth/register', {
      name,
      email,
      password,
      role: role || 'MEMBER',
      phone: phone || undefined,
      date_of_birth: date_of_birth || undefined,
    });
    if (res.data.token) {
      localStorage.setItem('auth_token', res.data.token);
      websocketService.authenticate(res.data.token);
    }
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      localStorage.removeItem('auth_token');
      setUser(null);
      websocketService.init();
    }
  };

  const hasRole = (role: string): boolean => {
    if (!user || !user.roles) return false;
    return user.roles.includes(role);
  };

  const isOwner = Boolean(user?.roles?.includes('OWNER'));
  const isAdmin = Boolean(user?.roles?.includes('SYSTEM_ADMIN') || user?.roles?.includes('ADMIN'));
  const isManager = Boolean(user?.roles?.includes('MANAGER'));
  const isBarStaff = Boolean(user?.roles?.includes('BAR_STAFF'));
  const isShopStaff = Boolean(user?.roles?.includes('SHOP_STAFF') || user?.roles?.includes('GEAR_BOX_STAFF'));
  const isAccountant = Boolean(user?.roles?.includes('ACCOUNTANT'));
  const isFrontDesk = Boolean(user?.roles?.includes('FRONT_DESK'));
  const isMember = Boolean(user?.roles?.includes('MEMBER'));

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isFrontDesk,
        isManager,
        isOwner,
        isAdmin,
        isBarStaff,
        isShopStaff,
        isAccountant,
        isMember,
        hasRole,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

export default AuthContext;
