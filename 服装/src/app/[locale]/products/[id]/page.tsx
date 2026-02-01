import { Link } from '@/i18n/routing';
import { getProducts } from '@/lib/data';
import { notFound } from 'next/navigation';
import { Check, Mail } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

export default function ProductDetail({ params }: { params: { id: string } }) {
  const t = useTranslations('Products');
  const locale = useLocale();
  const products = getProducts(locale);
  const product = products.find((p) => p.id === params.id);

  if (!product) {
    notFound();
  }

  return (
    <div className="bg-white">
      <div className="pt-6">
        <nav aria-label="Breadcrumb">
          <ol role="list" className="mx-auto flex max-w-2xl items-center space-x-2 px-4 sm:px-6 lg:max-w-7xl lg:px-8">
            <li>
              <div className="flex items-center">
                <Link href="/products" className="mr-2 text-sm font-medium text-gray-900">
                  {t('breadcrumb')}
                </Link>
                <svg
                  width={16}
                  height={20}
                  viewBox="0 0 16 20"
                  fill="currentColor"
                  aria-hidden="true"
                  className="h-5 w-4 text-gray-300"
                >
                  <path d="M5.697 4.34L8.98 16.532h1.327L7.025 4.341H5.697z" />
                </svg>
              </div>
            </li>
            <li className="text-sm">
              <span aria-current="page" className="font-medium text-gray-500 hover:text-gray-600">
                {product.name}
              </span>
            </li>
          </ol>
        </nav>

        {/* Product info */}
        <div className="mx-auto max-w-2xl px-4 pb-16 pt-10 sm:px-6 lg:grid lg:max-w-7xl lg:grid-cols-3 lg:grid-rows-[auto,auto,1fr] lg:gap-x-8 lg:px-8 lg:pb-24 lg:pt-16">
          <div className="lg:col-span-2 lg:border-r lg:border-gray-200 lg:pr-8">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">{product.name}</h1>
          </div>

          {/* Options / Sidebar */}
          <div className="mt-4 lg:row-span-3 lg:mt-0">
            <h2 className="sr-only">Product information</h2>
            <p className="text-3xl tracking-tight text-gray-900">{product.price}</p>

            <div className="mt-10">
              <h3 className="text-sm font-medium text-gray-900">{t('highlights')}</h3>
              <div className="mt-4">
                <ul role="list" className="list-disc space-y-2 pl-4 text-sm">
                  {product.features.map((highlight) => (
                    <li key={highlight} className="text-gray-400">
                      <span className="text-gray-600">{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-10">
               <Link
                href={`/contact?product=${encodeURIComponent(product.name)}`}
                className="flex w-full items-center justify-center rounded-md border border-transparent bg-indigo-600 px-8 py-3 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                <Mail className="mr-2 h-5 w-5" />
                {t('inquire')}
              </Link>
            </div>
          </div>

          <div className="py-10 lg:col-span-2 lg:col-start-1 lg:border-r lg:border-gray-200 lg:pb-16 lg:pr-8 lg:pt-6">
            {/* Description and details */}
            <div>
              <h3 className="sr-only">Description</h3>
              <div className="space-y-6">
                <p className="text-base text-gray-900">{product.description}</p>
              </div>
            </div>

            <div className="mt-10">
              <h2 className="text-sm font-medium text-gray-900">{t('details')}</h2>
              <div className="mt-4 space-y-6">
                <p className="text-sm text-gray-600">
                  {t('moq')}: {product.moq} <br />
                  {t('material')}: {product.material}
                </p>
              </div>
            </div>
            
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Previous code used product.images (array) but data.ts had image (string).
                    Let's check data.ts again.
                    data.ts has `image: string`.
                    products/[id]/page.tsx used `product.images.map(...)`.
                    
                    This implies I might have read an older version or there was a mismatch.
                    The previous `Read` of `products/[id]/page.tsx` showed `product.images.map`.
                    The previous `Read` of `data.ts` showed `image: string`.
                    
                    This is a bug in the code I inherited/wrote.
                    I should fix it. I will use `product.image` as a single image for now, or wrap it in an array.
                */}
                <img src={product.image} alt={product.name} className="rounded-lg bg-gray-100" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
