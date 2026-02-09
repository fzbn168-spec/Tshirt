'use client';

import { ArrowRight, CheckCircle, Package, Truck } from 'lucide-react';
import { Link } from '@/navigation';
import { useTranslations } from 'next-intl';

export default function Home() {
  const t = useTranslations('Home');

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-zinc-900 text-white overflow-hidden">
        {/* Abstract Background */}
        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=2012&auto=format&fit=crop')] bg-cover bg-center" />
        
        <div className="container mx-auto px-4 py-24 md:py-32 relative z-10">
          <div className="max-w-2xl">
            <span className="inline-block px-3 py-1 mb-6 text-sm font-medium tracking-wider uppercase bg-blue-600 rounded-full">
              {t('tagline')}
            </span>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
              {t('heroTitle')}
            </h1>
            <p className="text-lg md:text-xl text-zinc-300 mb-8 max-w-xl">
              {t('heroSubtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                href="/register" 
                className="inline-flex items-center justify-center h-12 px-8 font-medium text-black bg-white rounded-md hover:bg-zinc-100 transition-colors"
              >
                {t('startSourcing')}
              </Link>
              <Link 
                href="/products" 
                className="inline-flex items-center justify-center h-12 px-8 font-medium text-white border border-white/30 rounded-md hover:bg-white/10 transition-colors"
              >
                {t('viewCatalog')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 bg-white dark:bg-black">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-start gap-4 p-6 rounded-lg bg-zinc-50 dark:bg-zinc-900">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-lg dark:bg-blue-900/30">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">{t('quality')}</h3>
                <p className="text-zinc-500 text-sm">{t('qualityDesc')}</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-6 rounded-lg bg-zinc-50 dark:bg-zinc-900">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-lg dark:bg-blue-900/30">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">{t('moq')}</h3>
                <p className="text-zinc-500 text-sm">{t('moqDesc')}</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-6 rounded-lg bg-zinc-50 dark:bg-zinc-900">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-lg dark:bg-blue-900/30">
                <Truck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">{t('logistics')}</h3>
                <p className="text-zinc-500 text-sm">{t('logisticsDesc')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 border-t border-zinc-100 dark:border-zinc-800">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-8">
            <h2 className="text-3xl font-bold">{t('shopCategory')}</h2>
            <Link href="/products" className="text-blue-600 hover:underline flex items-center gap-1">
              {t('viewAll')} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: "Men's Sneakers", img: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=500&q=80" },
              { name: "Hiking Boots", img: "https://images.unsplash.com/photo-1520639888713-78db11c5dd59?auto=format&fit=crop&w=500&q=80" },
              { name: "Women's Heels", img: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=500&q=80" },
              { name: "Kids' Active", img: "https://images.unsplash.com/photo-1514989940723-e8e51635b782?auto=format&fit=crop&w=500&q=80" },
            ].map((cat, i) => (
              <Link key={i} href="#" className="group relative block aspect-[4/5] overflow-hidden rounded-xl bg-zinc-100">
                <img 
                  src={cat.img} 
                  alt={cat.name}
                  className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 text-white">
                  <h3 className="font-semibold text-lg">{cat.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products (Mock) */}
      <section className="py-16 bg-zinc-50 dark:bg-zinc-900/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8">{t('trending')}</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-zinc-100 relative">
                  {/* Placeholder Image */}
                  <div className="absolute inset-0 flex items-center justify-center text-zinc-300">
                    Product Image
                  </div>
                </div>
                <div className="p-4">
                  <div className="text-xs text-zinc-500 mb-1">Men's Running</div>
                  <h3 className="font-medium text-lg mb-2">Ultra-Light Breathable Runner</h3>
                  <div className="flex justify-between items-end">
                    <div>
                      <div className="text-sm text-zinc-500">{t('moqLabel')}: 20 Pairs</div>
                      <div className="font-bold text-blue-600">$12.50 - $15.00</div>
                    </div>
                    <button className="p-2 bg-zinc-100 rounded-full hover:bg-blue-50 text-blue-600 transition-colors">
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
