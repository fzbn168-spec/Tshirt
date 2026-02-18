'use client';

import { useEffect, Suspense } from 'react';
import { useRouter } from '@/navigation';
import { useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (token) {
      api.get('/auth/profile', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        const user = res.data;
        // Login successful
        setAuth(token, user);
        
        // Redirect based on role
        if (user.role === 'PLATFORM_ADMIN') {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
      })
      .catch(err => {
        console.error('Social login error:', err);
        router.push('/login?error=SocialLoginFailed');
      });
    } else {
      router.push('/login?error=NoToken');
    }
  }, [searchParams, setAuth, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">Authenticating...</h2>
        <p className="text-sm text-zinc-500">Please wait while we log you in.</p>
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CallbackContent />
    </Suspense>
  );
}
