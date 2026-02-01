import { Link } from '@/i18n/routing';
import { getProducts } from '@/lib/data';
import { Filter } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

export default function ProductsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const t = useTranslations('Products');
  const locale = useLocale();
  const products = getProducts(locale);
  const category = searchParams.cat as string | undefined;

  const filteredProducts = category
    ? products.filter((p) => p.category === category)
    : products;

  const categories = [
    { name: t('all'), value: undefined },
    { name: t('men'), value: 'men' },
    { name: t('women'), value: 'women' },
    { name: t('kids'), value: 'kids' },
    { name: t('accessories'), value: 'accessories' },
  ];

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full md:w-64 flex-shrink-0">
            <div className="flex items-center gap-2 mb-6">
              <Filter className="h-5 w-5" />
              <h2 className="text-lg font-bold">{t('categories')}</h2>
            </div>
            <ul className="space-y-3">
              {categories.map((c) => (
                <li key={c.name}>
                  <Link
                    href={c.value ? `/products?cat=${c.value}` : '/products'}
                    className={`block px-3 py-2 rounded-md transition-colors ${
                      category === c.value
                        ? 'bg-indigo-50 text-indigo-600 font-semibold'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Product Grid */}
          <div className="flex-1">
            <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8">
              {filteredProducts.map((product) => (
                <Link key={product.id} href={`/products/${product.id}`} className="group">
                  <div className="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-lg bg-gray-200 xl:aspect-h-8 xl:aspect-w-7">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover object-center group-hover:opacity-75"
                    />
                  </div>
                  <h3 className="mt-4 text-sm text-gray-700">{product.name}</h3>
                  <p className="mt-1 text-lg font-medium text-gray-900">{product.price}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
