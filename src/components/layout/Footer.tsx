import { Link } from '@/i18n/routing';
import { Shirt, Facebook, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function Footer() {
  const t = useTranslations('Footer');

  return (
    <footer className="bg-gray-900 text-white" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>
      <div className="mx-auto max-w-7xl px-6 pb-8 pt-16 sm:pt-24 lg:px-8 lg:pt-32">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8">
            <div className="flex items-center gap-2">
               <Shirt className="h-8 w-8 text-indigo-400" />
               <span className="text-2xl font-bold">FashionExport</span>
            </div>
            <p className="text-sm leading-6 text-gray-300">
              {t('description')}
            </p>
            <div className="flex space-x-6">
              {/* Social placeholders */}
              <a href="#" className="text-gray-400 hover:text-gray-300">
                <span className="sr-only">Facebook</span>
                <Facebook className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-300">
                <span className="sr-only">Instagram</span>
                <Instagram className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-300">
                <span className="sr-only">LinkedIn</span>
                <Linkedin className="h-6 w-6" />
              </a>
            </div>
          </div>
          <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold leading-6 text-white">{t('products')}</h3>
                <ul role="list" className="mt-6 space-y-4">
                  <li>
                    <Link href="/products?cat=men" className="text-sm leading-6 text-gray-300 hover:text-white">
                      {t('men')}
                    </Link>
                  </li>
                  <li>
                    <Link href="/products?cat=women" className="text-sm leading-6 text-gray-300 hover:text-white">
                      {t('women')}
                    </Link>
                  </li>
                  <li>
                    <Link href="/products?cat=kids" className="text-sm leading-6 text-gray-300 hover:text-white">
                      {t('kids')}
                    </Link>
                  </li>
                  <li>
                    <Link href="/products?cat=accessories" className="text-sm leading-6 text-gray-300 hover:text-white">
                      {t('accessories')}
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm font-semibold leading-6 text-white">{t('company')}</h3>
                <ul role="list" className="mt-6 space-y-4">
                  <li>
                    <Link href="/about" className="text-sm leading-6 text-gray-300 hover:text-white">
                      {t('about')}
                    </Link>
                  </li>
                  <li>
                    <Link href="/process" className="text-sm leading-6 text-gray-300 hover:text-white">
                      {t('process')}
                    </Link>
                  </li>
                  <li>
                    <Link href="/sustainability" className="text-sm leading-6 text-gray-300 hover:text-white">
                      {t('sustainability')}
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" className="text-sm leading-6 text-gray-300 hover:text-white">
                      {t('contact')}
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="md:grid md:grid-cols-1 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold leading-6 text-white">{t('contactUs')}</h3>
                <ul role="list" className="mt-6 space-y-4">
                  <li className="flex items-center gap-2 text-sm leading-6 text-gray-300">
                    <MapPin className="h-4 w-4 shrink-0" />
                    {t('address')}
                  </li>
                  <li className="flex items-center gap-2 text-sm leading-6 text-gray-300">
                    <Phone className="h-4 w-4 shrink-0" />
                    +1 (555) 123-4567
                  </li>
                  <li className="flex items-center gap-2 text-sm leading-6 text-gray-300">
                    <Mail className="h-4 w-4 shrink-0" />
                    contact@fashionexport.com
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
