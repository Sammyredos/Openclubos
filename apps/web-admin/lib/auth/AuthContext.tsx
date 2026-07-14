"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { AuthUser } from '@/lib/api/auth';
import { getAuthToken, handleAuthFailure } from '@/lib/api/auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: AuthUser, rememberMe?: boolean) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ROLE_REDIRECT: Record<string, string> = {
  SUPER_ADMIN: '/super-admin/dashboard',
  CLUB_ADMIN: '/organizer-admin/dashboard',
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

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    let inFlight = false;

    const ping = async () => {
      if (cancelled) return;
      if (inFlight) return;
      const token = getAuthToken();
      if (!token) return;
      inFlight = true;
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        if (!res.ok) {
          await handleAuthFailure(res);
        } else {
          const freshUser = await res.json();
          const storedStr = localStorage.getItem('oc_user');
          const freshStr = JSON.stringify(freshUser);
          if (storedStr !== freshStr) {
            localStorage.setItem('oc_user', freshStr);
            setUser(freshUser);
          }
        }
      } catch {
        // ignore transient network errors
      } finally {
        inFlight = false;
      }
    };

    ping();
    const id = window.setInterval(() => {
      if (document.hidden) return;
      ping();
    }, 4000);

    const onFocus = () => ping();
    const onVisibility = () => {
      if (!document.hidden) ping();
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelled = true;
      window.clearInterval(id);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [user]);

  const login = (token: string, user: AuthUser, rememberMe: boolean = false) => {
    // Store token in localStorage for cross-tab persistence
    localStorage.setItem('oc_token', token);
    localStorage.setItem('oc_user', JSON.stringify(user));
    
    // Set cookie. If rememberMe is true, it lasts 30 days. Otherwise, it's a session cookie.
    const maxAgeStr = rememberMe ? `max-age=${30 * 24 * 60 * 60}; ` : '';
    document.cookie = `accessToken=${token}; path=/; ${maxAgeStr}samesite=strict`;
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
