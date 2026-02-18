'use client';

import { useEffect } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';

export default function ErrorReporter() {
  const { trackEvent } = useAnalytics();
  useEffect(() => {
    const dsn = process.env.NEXT_PUBLIC_ERROR_DSN;
    const send = (payload: Record<string, unknown>) => {
      trackEvent('JS_ERROR', payload);
      if (dsn) {
        try {
          fetch(dsn, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).catch(() => {});
        } catch {}
      }
    };
    const onError = (event: ErrorEvent) => {
      const payload = {
        message: event.message || '',
        filename: event.filename || '',
        lineno: event.lineno || 0,
        colno: event.colno || 0,
        stack: event.error && (event.error as Error).stack ? (event.error as Error).stack : '',
        url: typeof window !== 'undefined' ? window.location.href : '',
        ua: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        ts: Date.now(),
      };
      send(payload);
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason as unknown;
      let message = 'unhandledrejection';
      let stack = '';
      if (typeof reason === 'string') {
        message = reason;
      } else if (typeof reason === 'object' && reason !== null) {
        const err = reason as { message?: string; stack?: string };
        if (err.message) {
          message = err.message;
        }
        if (err.stack) {
          stack = err.stack;
        }
      }
      const payload = {
        message,
        stack,
        url: typeof window !== 'undefined' ? window.location.href : '',
        ua: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        ts: Date.now(),
      };
      send(payload);
    };
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, [trackEvent]);
  return null;
}
