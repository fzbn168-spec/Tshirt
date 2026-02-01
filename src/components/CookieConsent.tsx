
'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const t = useTranslations('CookieConsent');

  useEffect(() => {
    // Check if user has already consented
    const consented = localStorage.getItem('cookie-consent');
    if (!consented) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 p-4 text-white shadow-lg md:p-6">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 md:flex-row">
        <div className="flex-1">
          <p className="text-sm leading-6">
            {t('message')}
          </p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={handleAccept}
            className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {t('accept')}
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="p-2 text-gray-400 hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
