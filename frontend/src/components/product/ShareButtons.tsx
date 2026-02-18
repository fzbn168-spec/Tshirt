'use client';

import { Facebook, Linkedin, Twitter, Link as LinkIcon, Share2, MessageCircle } from 'lucide-react';
import { useToastStore } from '@/store/useToastStore';

interface ShareButtonsProps {
  title: string;
  description?: string;
  url?: string;
}

import { useTranslations } from 'next-intl';

export function ShareButtons({ title, description = '', url }: ShareButtonsProps) {
  const t = useTranslations('Product');
  const { addToast } = useToastStore();
  const currentUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  const encodedUrl = encodeURIComponent(currentUrl);
  const encodedTitle = encodeURIComponent(title);
  const encodedDesc = encodeURIComponent(description);

  const shareLinks = [
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      color: 'hover:text-green-500'
    },
    {
      name: 'Facebook',
      icon: Facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      color: 'hover:text-blue-600'
    },
    {
      name: 'Twitter',
      icon: Twitter,
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      color: 'hover:text-sky-500'
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      href: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}&summary=${encodedDesc}`,
      color: 'hover:text-blue-700'
    }
  ];

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      addToast(t('linkCopied'), 'success');
    } catch {
      addToast(t('copyFailed'), 'error');
    }
  };

  return (
    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
      <span className="text-sm font-medium text-zinc-500 flex items-center gap-1">
        <Share2 className="w-4 h-4" />
        {t('share')}
      </span>
      
      <div className="flex items-center gap-1">
        {shareLinks.map((link) => (
          <a
            key={link.name}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`p-2 text-zinc-400 transition-colors rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 ${link.color}`}
            title={t('shareOn', { platform: link.name })}
          >
            <link.icon className="w-4 h-4" />
          </a>
        ))}
        
        <button
          onClick={handleCopyLink}
          className="p-2 text-zinc-400 transition-colors rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-600 dark:hover:text-zinc-200"
          title={t('copyLink')}
        >
          <LinkIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
