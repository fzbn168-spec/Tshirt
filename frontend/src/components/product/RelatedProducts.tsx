'use client';

import { Link } from '@/navigation';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

const RELATED_PRODUCTS = [
  {
    id: 'prod-1',
    name: "Men's Premium Running Shoes",
    price: "$45.00",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=500&q=80",
    category: "Running"
  },
  {
    id: 'prod-2',
    name: "Classic Leather Loafers",
    price: "$68.00",
    image: "https://images.unsplash.com/photo-1533867617858-e7b97e0605df?auto=format&fit=crop&w=500&q=80",
    category: "Casual"
  },
  {
    id: 'prod-3',
    name: "Women's High Heels",
    price: "$32.00",
    image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=500&q=80",
    category: "Formal"
  },
  {
    id: 'prod-4',
    name: "Hiking Boots Waterproof",
    price: "$55.00",
    image: "https://images.unsplash.com/photo-1520639888713-78db11c5dd59?auto=format&fit=crop&w=500&q=80",
    category: "Outdoor"
  }
];

export function RelatedProducts() {
  const t = useTranslations('Product');

  return (
    <div className="py-12 border-t border-zinc-100 dark:border-zinc-800">
      <div className="mb-8">
        <h2 className="text-2xl font-bold">{t('relatedProducts')}</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {RELATED_PRODUCTS.map((product) => (
          <Link 
            key={product.id} 
            href={`/product/${product.id}`}
            className="group block"
          >
            <div className="aspect-[4/5] relative bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden mb-3">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="text-xs text-zinc-500 mb-1">{product.category}</div>
            <h3 className="font-medium text-zinc-900 dark:text-zinc-100 truncate group-hover:text-blue-600 transition-colors">
              {product.name}
            </h3>
            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-1">
              {product.price} <span className="text-xs font-normal text-zinc-500">/ pair</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
