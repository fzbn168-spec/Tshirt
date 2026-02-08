'use client';

import { useState } from 'react';
import { Link, useRouter } from '@/navigation';
import { ArrowRight, Mail, Lock, Building, User } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useTranslations } from 'next-intl';

export default function RegisterPage() {
  const t = useTranslations('Auth');
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      email: formData.get('email'),
      password: formData.get('password'),
      fullName: formData.get('fullName'),
      companyName: formData.get('companyName'),
    };

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || 'Registration failed');
      }

      router.push('/login?registered=true');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4 py-12">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm p-8">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold tracking-tight inline-block mb-2">
            SOLE<span className="text-blue-600">TRADE</span>
          </Link>
          <h1 className="text-xl font-semibold">{t('registerTitle')}</h1>
          <p className="text-sm text-zinc-500 mt-2">
            {t('registerSubtitle')}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('fullName')}</label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <input 
                name="fullName"
                type="text" 
                className="w-full h-10 rounded-md border border-zinc-200 bg-zinc-50 pl-9 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-900"
                required 
                placeholder="John Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('companyName')}</label>
            <div className="relative">
              <Building className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <input 
                name="companyName"
                type="text" 
                className="w-full h-10 rounded-md border border-zinc-200 bg-zinc-50 pl-9 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-900"
                required 
                placeholder="Global Traders Ltd."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('email')}</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <input 
                name="email"
                type="email" 
                className="w-full h-10 rounded-md border border-zinc-200 bg-zinc-50 pl-9 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-900"
                required 
                placeholder="name@company.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('password')}</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <input 
                name="password"
                type="password" 
                className="w-full h-10 rounded-md border border-zinc-200 bg-zinc-50 pl-9 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-900"
                required 
                minLength={6}
                placeholder="At least 6 characters"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-blue-600 text-white h-10 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? t('creatingAccount') : (
              <>
                {t('createAccount')} <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-zinc-500">
          {t('hasAccount')}{' '}
          <Link href="/login" className="text-blue-600 hover:underline font-medium">
            {t('signIn')}
          </Link>
        </div>
      </div>
    </div>
  );
}
