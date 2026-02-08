import { Link } from '@/navigation';
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin, Download } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function Footer() {
  const t = useTranslations('Footer');

  return (
    <footer className="bg-zinc-50 border-t border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Company Info */}
          <div>
            <Link href="/" className="text-2xl font-bold tracking-tight mb-4 block">
              SOLE<span className="text-blue-600">TRADE</span>
            </Link>
            <p className="text-zinc-500 text-sm leading-relaxed mb-6">
              {t('description')}
            </p>
            <div className="flex gap-4">
              <Link href="#" className="text-zinc-400 hover:text-blue-600"><Facebook className="h-5 w-5" /></Link>
              <Link href="#" className="text-zinc-400 hover:text-blue-600"><Twitter className="h-5 w-5" /></Link>
              <Link href="#" className="text-zinc-400 hover:text-blue-600"><Instagram className="h-5 w-5" /></Link>
              <Link href="#" className="text-zinc-400 hover:text-blue-600"><Linkedin className="h-5 w-5" /></Link>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-6">{t('sourcing')}</h3>
            <ul className="space-y-4 text-sm text-zinc-500">
              <li><Link href="#" className="hover:text-blue-600">{t('men')}</Link></li>
              <li><Link href="#" className="hover:text-blue-600">{t('women')}</Link></li>
              <li><Link href="#" className="hover:text-blue-600">{t('kids')}</Link></li>
              <li><Link href="#" className="hover:text-blue-600">{t('sports')}</Link></li>
              <li><Link href="#" className="hover:text-blue-600">{t('rfq')}</Link></li>
              <li>
                <a 
                    href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/products/catalog/pdf`}
                    target="_blank" 
                    className="flex items-center gap-2 hover:text-blue-600 font-medium text-blue-600/80"
                >
                    <Download className="w-4 h-4" />
                    Download Catalog
                </a>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="font-semibold mb-6">{t('support')}</h3>
            <ul className="space-y-4 text-sm text-zinc-500">
              <li><Link href="#" className="hover:text-blue-600">{t('help')}</Link></li>
              <li><Link href="#" className="hover:text-blue-600">{t('shipping')}</Link></li>
              <li><Link href="#" className="hover:text-blue-600">{t('returns')}</Link></li>
              <li><Link href="#" className="hover:text-blue-600">{t('sizeGuide')}</Link></li>
              <li><Link href="#" className="hover:text-blue-600">{t('contact')}</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-6">{t('contactHeader')}</h3>
            <ul className="space-y-4 text-sm text-zinc-500">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-blue-600 shrink-0" />
                <span>{t('address')}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-blue-600 shrink-0" />
                <span>+86 123 4567 8900</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-blue-600 shrink-0" />
                <span>business@soletrade.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-zinc-500">
          <p>{t('copyright')} <span className="opacity-50 text-xs ml-2">v1.1.0</span></p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-zinc-900">{t('privacy')}</Link>
            <Link href="#" className="hover:text-zinc-900">{t('terms')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
