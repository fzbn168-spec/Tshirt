import { Link } from '@/i18n/routing';
import { ArrowRight, ShieldCheck, Truck, Gem } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function Home() {
  const tHero = useTranslations('Hero');
  const tFeatures = useTranslations('Features');
  const tCategories = useTranslations('Categories');

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative isolate overflow-hidden bg-gray-900 py-24 sm:py-32">
        <img
          src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2850&q=80"
          alt="Fashion background"
          className="absolute inset-0 -z-10 h-full w-full object-cover object-center opacity-30"
        />
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:mx-0">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
              {tHero('title')}
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-300">
              {tHero('subtitle')}
            </p>
            <div className="mt-10 flex items-center gap-x-6">
              <Link
                href="/products"
                className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                {tHero('explore')}
              </Link>
              <Link href="/contact" className="text-sm font-semibold leading-6 text-white">
                {tHero('contact')} <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-24 sm:py-32">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-indigo-600">{tFeatures('title')}</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {tFeatures('subtitle')}
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-3 lg:gap-y-16">
            <div className="relative pl-16">
              <dt className="text-base font-semibold leading-7 text-gray-900">
                <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600">
                  <ShieldCheck className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                {tFeatures('quality')}
              </dt>
              <dd className="mt-2 text-base leading-7 text-gray-600">
                {tFeatures('qualityDesc')}
              </dd>
            </div>
            <div className="relative pl-16">
              <dt className="text-base font-semibold leading-7 text-gray-900">
                <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600">
                  <Truck className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                {tFeatures('logistics')}
              </dt>
              <dd className="mt-2 text-base leading-7 text-gray-600">
                {tFeatures('logisticsDesc')}
              </dd>
            </div>
            <div className="relative pl-16">
              <dt className="text-base font-semibold leading-7 text-gray-900">
                <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600">
                  <Gem className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                {tFeatures('materials')}
              </dt>
              <dd className="mt-2 text-base leading-7 text-gray-600">
                {tFeatures('materialsDesc')}
              </dd>
            </div>
          </dl>
        </div>
      </div>
      
      {/* Featured Categories */}
      <div className="bg-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="sm:flex sm:items-baseline sm:justify-between">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">{tCategories('title')}</h2>
            <Link href="/products" className="hidden text-sm font-semibold text-indigo-600 hover:text-indigo-500 sm:block">
              {tCategories('browseAll')}
              <span aria-hidden="true"> &rarr;</span>
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:grid-rows-2 sm:gap-x-6 lg:gap-8">
            <div className="group aspect-h-1 aspect-w-2 overflow-hidden rounded-lg sm:aspect-h-1 sm:aspect-w-1 sm:row-span-2 relative h-96">
              <img
                src="https://images.unsplash.com/photo-1483985988355-763728e1935b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80"
                alt="Women's collection"
                className="object-cover object-center group-hover:opacity-75 h-full w-full"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-50" />
              <div className="absolute inset-0 flex items-end p-6">
                <div>
                  <h3 className="font-semibold text-white">
                    <Link href="/products?cat=women">
                      <span className="absolute inset-0" />
                      Women
                    </Link>
                  </h3>
                  <p aria-hidden="true" className="mt-1 text-sm text-white">
                    Shop now
                  </p>
                </div>
              </div>
            </div>
            <div className="group aspect-h-1 aspect-w-2 overflow-hidden rounded-lg sm:aspect-none sm:relative sm:h-full relative h-48">
              <img
                src="https://images.unsplash.com/photo-1488161628813-994252600322?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80"
                alt="Men's collection"
                className="object-cover object-center group-hover:opacity-75 sm:absolute sm:inset-0 sm:h-full sm:w-full h-full w-full"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-50" />
              <div className="absolute inset-0 flex items-end p-6">
                <div>
                  <h3 className="font-semibold text-white">
                    <Link href="/products?cat=men">
                      <span className="absolute inset-0" />
                      Men
                    </Link>
                  </h3>
                  <p aria-hidden="true" className="mt-1 text-sm text-white">
                    Shop now
                  </p>
                </div>
              </div>
            </div>
            <div className="group aspect-h-1 aspect-w-2 overflow-hidden rounded-lg sm:aspect-none sm:relative sm:h-full relative h-48">
              <img
                src="https://images.unsplash.com/photo-1622290291303-cf75107d2004?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80"
                alt="Kids collection"
                className="object-cover object-center group-hover:opacity-75 sm:absolute sm:inset-0 sm:h-full sm:w-full h-full w-full"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-50" />
              <div className="absolute inset-0 flex items-end p-6">
                <div>
                  <h3 className="font-semibold text-white">
                    <Link href="/products?cat=kids">
                      <span className="absolute inset-0" />
                      Kids
                    </Link>
                  </h3>
                  <p aria-hidden="true" className="mt-1 text-sm text-white">
                    Shop now
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 sm:hidden">
            <Link href="/products" className="block text-sm font-semibold text-indigo-600 hover:text-indigo-500">
              {tCategories('browseAll')}
              <span aria-hidden="true"> &rarr;</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
