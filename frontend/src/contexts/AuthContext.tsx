import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { User } from '../types/auth.types';
import { authApi } from '../api/auth.api';
import axios from 'axios';
import { setAccessToken } from '../api/axios';
import api from '../api/axios';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const initAuth = useCallback(async () => {
    try {
      const { data: refreshData } = await axios.post('/api/auth/refresh', {}, { withCredentials: true });
      const result = refreshData.data || refreshData;
      if (!result?.accessToken) throw new Error('no token');
      setAccessToken(result.accessToken);
      const { data } = await api.get('/users/me');
      setUser(data.data || data);
    } catch {
      setUser(null);
      setAccessToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const login = async (email: string, password: string) => {
    const { data } = await authApi.login({ email, password });
    const result = data.data || data;
    setAccessToken(result.accessToken);
    setUser(result.user);
  };

  const register = async (email: string, password: string, firstName: string, lastName: string) => {
    const { data } = await authApi.register({ email, password, firstName, lastName });
    const result = data.data || data;
    setAccessToken(result.accessToken);
    setUser(result.user);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
