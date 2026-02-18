'use client';

import { useToastStore } from '@/store/useToastStore';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();
  const isClient = typeof window !== 'undefined';
  if (!isClient) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "pointer-events-auto min-w-[300px] max-w-md p-4 rounded-md shadow-lg border flex items-start gap-3 transition-all animate-in slide-in-from-right-full fade-in duration-300",
            toast.type === 'success' && "bg-white dark:bg-zinc-900 border-green-200 dark:border-green-900",
            toast.type === 'error' && "bg-white dark:bg-zinc-900 border-red-200 dark:border-red-900",
            toast.type === 'info' && "bg-white dark:bg-zinc-900 border-blue-200 dark:border-blue-900"
          )}
        >
          {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />}
          {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />}
          {toast.type === 'info' && <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />}
          
          <div className="flex-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {toast.message}
          </div>

          <button
            onClick={() => removeToast(toast.id)}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
