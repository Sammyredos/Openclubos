'use client';

import { useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const hasVerified = useRef(false);

  useEffect(() => {
    if (!token || hasVerified.current) {
      if (!token) router.push('/login');
      return;
    }
    
    hasVerified.current = true;

    const verify = async () => {
      try {
        const backendBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const res = await fetch(`${backendBase}/auth/verify-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          toast.success('Email verified successfully! You can now log in.');
        } else {
          toast.error(data.message || 'Verification failed. The token may be invalid or expired.');
        }
      } catch (err) {
        toast.error('An error occurred during verification. Please try again.');
      } finally {
        router.push('/login');
      }
    };

    verify();
  }, [token, router]);

  return null;
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  );
}
