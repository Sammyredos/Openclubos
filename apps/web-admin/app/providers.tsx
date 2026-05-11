'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { AuthProvider } from '@/lib/auth/AuthContext';
import { usePathname } from 'next/navigation';

export default function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
      },
    },
  }));

  useEffect(() => {
    const base = 'Openclub Admin';
    const titleFor = (path: string) => {
      if (path === '/' || path === '/super-admin/dashboard') return 'Overview';
      if (path === '/login') return 'Login';
      if (path === '/forgot-password') return 'Forgot Password';
      if (path === '/members') return 'Users';
      if (path === '/super-admin/users') return 'Users';
      if (path === '/super-admin/organizers') return 'Organizers';
      if (path.startsWith('/super-admin/organizers/')) return 'Organizer Details';
      if (path === '/super-admin/tournaments') return 'Tournaments';
      if (path === '/tournaments/new') return 'New Tournament';
      if (path.startsWith('/tournaments/') && path.endsWith('/register')) return 'Tournament Registration';
      if (path === '/organizer-admin/dashboard') return 'Organizer Dashboard';
      return null;
    };

    const pageTitle = titleFor(pathname) ?? base;
    document.title = pageTitle === base ? base : `${pageTitle} | ${base}`;
  }, [pathname]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  );
}
