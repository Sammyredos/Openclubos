"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { AuthUser } from '@/lib/api/auth';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ROLE_REDIRECT: Record<string, string> = {
  SUPER_ADMIN: '/super-admin/dashboard',
  CLUB_ADMIN: '/club-admin/dashboard',
  STAFF: '/staff/dashboard',
  PLAYER: '/app/home',
  MARKER: '/app/scoring',
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Restore session on mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        const storedUser = localStorage.getItem('oc_user');
        const hasToken = document.cookie.includes('accessToken=');
        
        if (storedUser && hasToken) {
          setUser(JSON.parse(storedUser));
        } else if (!hasToken && storedUser) {
          // Sync state if cookie is missing but localStorage has user
          localStorage.removeItem('oc_user');
          localStorage.removeItem('oc_token');
          setUser(null);
        }
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Sync across tabs
    const syncAuth = (e: StorageEvent) => {
      if (e.key === 'oc_user' || e.key === 'oc_token') {
        const hasToken = document.cookie.includes('accessToken=');
        if (!e.newValue || !hasToken) {
          setUser(null);
          router.replace('/login');
        } else if (e.key === 'oc_user') {
          setUser(JSON.parse(e.newValue));
        }
      }
    };

    window.addEventListener('storage', syncAuth);
    return () => window.removeEventListener('storage', syncAuth);
  }, [router]);

  const login = (token: string, user: AuthUser) => {
    // Store token in localStorage for cross-tab persistence
    localStorage.setItem('oc_token', token);
    localStorage.setItem('oc_user', JSON.stringify(user));
    // Also set cookie so Next.js middleware can read it
    document.cookie = `accessToken=${token}; path=/; max-age=86400; samesite=strict`;
    setUser(user);
    setIsLoading(false);
    // Use replace to prevent the login page from staying in history
    router.replace(ROLE_REDIRECT[user.role] ?? '/');
  };

  const logout = () => {
    setIsLoading(true);
    localStorage.removeItem('oc_token');
    localStorage.removeItem('oc_user');
    document.cookie = 'accessToken=; path=/; max-age=0';
    setUser(null);
    router.replace('/login');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
