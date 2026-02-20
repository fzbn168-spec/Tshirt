'use client';

import { ArrowRight, CheckCircle, Package, Truck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@/navigation';
import { useTranslations } from 'next-intl';
import { TrustSection } from '@/components/home/TrustSection';
import { HomeRankingCarousel } from '@/components/home/HomeRankingCarousel';
import { BrandWall } from '@/components/home/BrandWall';
import Image from 'next/image';
import api from '@/lib/api';

interface LayoutHeroBanner {
  id: string;
  imageUrl: string;
  href: string;
  enabled?: boolean;
  sortOrder?: number;
}

interface LayoutCategoryCard {
  id: string;
  label: string;
  imageUrl: string;
  href: string;
  enabled?: boolean;
  sortOrder?: number;
}

interface LayoutRankingSection {
  enabled?: boolean;
  title?: string;
  subtitle?: string;
}

interface LayoutBrandLogo {
  id: string;
  name: string;
  imageUrl: string;
  href: string;
  enabled?: boolean;
  sortOrder?: number;
}

interface LayoutBrandWall {
  enabled?: boolean;
  title?: string;
  subtitle?: string;
  logos?: LayoutBrandLogo[];
}

interface LayoutTextBlock {
  id: string;
  title?: string;
  content: string;
  enabled?: boolean;
  sortOrder?: number;
}

type LayoutSectionType =
  | 'hero'
  | 'ranking'
  | 'categoryGrid'
  | 'brandWall'
  | 'textBlock'
  | 'collectionProducts';

type CollectionSourceType = 'category' | 'keyword' | 'tag' | 'manual' | 'raw';

interface CollectionSourceConfig {
  type: CollectionSourceType;
  categoryId?: string;
  keyword?: string;
  tag?: string;
  productIds?: string;
  rawPath?: string;
  sort?: string;
}

interface LayoutSection {
  id: string;
  type: LayoutSectionType;
  title?: string;
  enabled?: boolean;
  sortOrder?: number;
  textBlockId?: string;
  collectionPath?: string;
  collectionLimit?: number;
  collectionSource?: CollectionSourceConfig;
}

interface LayoutConfig {
  heroBanners?: LayoutHeroBanner[];
  homeCategoryCards?: LayoutCategoryCard[];
  rankingSection?: LayoutRankingSection;
  brandWall?: LayoutBrandWall;
  textBlocks?: LayoutTextBlock[];
  sections?: LayoutSection[];
}

interface ProductImage {
  url: string;
}

interface Product {
  id: string;
  title: string;
  images?: ProductImage[];
  basePrice?: number | null;
  moq?: number | null;
  soldCount?: number | null;
  fakeSoldCount?: number | null;
}

interface ProductsResponse {
  items: Product[];
}

function getFirstImageUrl(images?: ProductImage[]) {
  if (!images || images.length === 0) return '';
  return images[0]?.url || '';
}

function buildCollectionPath(section: LayoutSection): string | null {
  if (section.collectionSource) {
    const limit = section.collectionLimit;
    const source = section.collectionSource;
    const params = new URLSearchParams();
    if (limit && limit > 0) {
      params.set('limit', String(limit));
      params.set('page', '1');
    }
    if (source.sort) {
      params.set('sort', source.sort);
    }
    if (source.type === 'category') {
      if (!source.categoryId) return null;
      params.set('categoryId', source.categoryId);
      return `/products?${params.toString()}`;
    }
    if (source.type === 'keyword') {
      if (!source.keyword) return null;
      params.set('search', source.keyword);
      return `/products?${params.toString()}`;
    }
    if (source.type === 'tag') {
      if (!source.tag) return null;
      params.set('search', source.tag);
      return `/products?${params.toString()}`;
    }
    if (source.type === 'manual') {
      if (!source.productIds) return null;
      params.set('ids', source.productIds);
      return `/products?${params.toString()}`;
    }
    if (source.type === 'raw') {
      const raw = source.rawPath || section.collectionPath || '/products';
      return raw;
    }
    return null;
  }
  if (section.collectionPath) {
    return section.collectionPath;
  }
  return null;
}

function CollectionSection(section: LayoutSection) {
  const path = buildCollectionPath(section);
  const limit = section.collectionLimit;
  const id = section.id;
  const title = section.title;

  const query = useQuery({
    queryKey: ['home-collection', id, path, limit],
    queryFn: async () => {
      const safePath = path || '/products';
      const res = await api.get<ProductsResponse>(safePath);
      return res.data;
    },
    enabled: !!path,
  });

  if (!path) return null;

  const isLoading = query.isLoading;
  const data = query.data;

  const items = (() => {
    if (!data || !data.items) return [];
    const list = data.items.slice(0, limit && limit > 0 ? limit : data.items.length);
    return list;
  })();

  if (!isLoading && items.length === 0) {
    return null;
  }

  return (
    <section className="py-12 border-t border-zinc-100 dark:border-zinc-800">
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">
              {title || '精选商品'}
            </h2>
          </div>
          <Link
            href={path.startsWith('/products') ? path : '/products'}
            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
          >
            查看全部
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {isLoading ? (
          <div className="py-8 text-sm text-zinc-500">加载商品中...</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {items.map((product) => {
              const img = getFirstImageUrl(product.images);
              const totalSold =
                (product.soldCount || 0) + (product.fakeSoldCount || 0);
              return (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  className="group border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-white dark:bg-zinc-900 hover:border-blue-500 transition-colors"
                >
                  <div className="relative aspect-[4/5] bg-zinc-100 dark:bg-zinc-800">
                    {img && (
                      <Image
                        src={img}
                        alt={product.title}
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="p-3 space-y-1">
                    <div className="text-xs text-zinc-500 line-clamp-2">
                      {product.title}
                    </div>
                    <div className="flex items-center justify-between text-xs mt-1">
                      {typeof product.basePrice === 'number' && (
                        <span className="font-semibold text-blue-600">
                          ${product.basePrice.toFixed(2)}
                        </span>
                      )}
                      {typeof product.moq === 'number' && (
                        <span className="text-zinc-500">
                          MOQ {product.moq}
                        </span>
                      )}
                    </div>
                    {totalSold > 0 && (
                      <div className="text-[11px] text-zinc-400 mt-1">
                        累计出货 {totalSold}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export default function Home() {
  const t = useTranslations('Home');
  const [layoutConfig, setLayoutConfig] = useState<LayoutConfig | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadLayout = async () => {
      try {
        const res = await api.get<{ key: string; value: string }[]>('/system-settings');
        const setting = res.data.find((s) => s.key === 'layout_config');
        if (!setting || !setting.value || cancelled) return;
        const parsed = JSON.parse(setting.value) as Partial<LayoutConfig>;
        if (cancelled) return;
        setLayoutConfig({
          heroBanners: parsed.heroBanners || [],
          homeCategoryCards: parsed.homeCategoryCards || [],
          rankingSection: parsed.rankingSection || {},
          brandWall: parsed.brandWall || {},
          textBlocks: parsed.textBlocks || [],
          sections: parsed.sections || [],
        });
      } catch {
      }
    };
    loadLayout();
    return () => {
      cancelled = true;
    };
  }, []);

  const defaultHeroImage =
    "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=2012&auto=format&fit=crop";

  const heroBanner = (() => {
    if (!layoutConfig || !layoutConfig.heroBanners || layoutConfig.heroBanners.length === 0) {
      return null;
    }
    const enabled = layoutConfig.heroBanners
      .filter((item) => item.enabled !== false && item.imageUrl)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    if (enabled.length === 0) return null;
    return enabled[0];
  })();

  const heroBackgroundImage = heroBanner ? heroBanner.imageUrl : defaultHeroImage;
  const heroHref = heroBanner?.href || '/products';

  const rankingConfig = layoutConfig?.rankingSection;
  const showRanking =
    rankingConfig && typeof rankingConfig.enabled !== 'undefined'
      ? rankingConfig.enabled
      : true;
  const rankingTitle = rankingConfig?.title || '热销 TOP 10 · 新品推荐';
  const rankingSubtitle =
    rankingConfig?.subtitle || '帮助买家快速发现热卖款和最新上架款，提升转化。';

  const defaultCategoryCards = [
    {
      id: 'cat-men-sneakers',
      name: "Men's Sneakers",
      img: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=500&q=80",
      href: '/products?search=Men',
    },
    {
      id: 'cat-hiking',
      name: 'Hiking Boots',
      img: "https://images.unsplash.com/photo-1520639888713-78db11c5dd59?auto=format&fit=crop&w=500&q=80",
      href: '/products?search=Hiking',
    },
    {
      id: 'cat-women-heels',
      name: "Women's Heels",
      img: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=500&q=80",
      href: '/products?search=Heels',
    },
    {
      id: 'cat-kids-active',
      name: "Kids' Active",
      img: "https://images.unsplash.com/photo-1514989940723-e8e51635b782?auto=format&fit=crop&w=500&q=80",
      href: '/products?search=Kids',
    },
  ];

  const categoryCards = (() => {
    if (!layoutConfig || !layoutConfig.homeCategoryCards || layoutConfig.homeCategoryCards.length === 0) {
      return defaultCategoryCards;
    }
    const enabled = layoutConfig.homeCategoryCards
      .filter((card) => card.enabled !== false && card.imageUrl)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      .map((card) => ({
        id: card.id,
        name: card.label || '',
        img: card.imageUrl,
        href: card.href || '/products',
      }));
    if (enabled.length === 0) {
      return defaultCategoryCards;
    }
    return enabled;
  })();

  const brandWallConfig = (() => {
    if (!layoutConfig || !layoutConfig.brandWall) {
      return null;
    }
    if (layoutConfig.brandWall.enabled === false) {
      return null;
    }
    const logos = (layoutConfig.brandWall.logos || [])
      .filter((logo) => logo.enabled !== false)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      .map((logo) => ({
        id: logo.id,
        name: logo.name,
        imageUrl: logo.imageUrl,
        href: logo.href || '/products',
      }));
    if (logos.length === 0) {
      return null;
    }
    return {
      title: layoutConfig.brandWall.title,
      subtitle: layoutConfig.brandWall.subtitle,
      logos,
    };
  })();

  const textBlocks = (() => {
    if (!layoutConfig || !layoutConfig.textBlocks) {
      return [];
    }
    return layoutConfig.textBlocks
      .filter((block) => block.enabled !== false && block.content)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  })();

  const hasSections =
    layoutConfig &&
    layoutConfig.sections &&
    layoutConfig.sections.some((s) => s.enabled !== false);

  const sectionsToRender: LayoutSection[] = (() => {
    if (!layoutConfig) return [];
    if (hasSections && layoutConfig.sections) {
      return layoutConfig.sections
        .filter((s) => s.enabled !== false)
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    }
    const sections: LayoutSection[] = [];
    sections.push({
      id: 'sec-hero-fallback',
      type: 'hero',
      enabled: true,
      sortOrder: 1,
    });
    if (showRanking) {
      sections.push({
        id: 'sec-ranking-fallback',
        type: 'ranking',
        enabled: true,
        sortOrder: 2,
      });
    }
    sections.push({
      id: 'sec-category-fallback',
      type: 'categoryGrid',
      enabled: true,
      sortOrder: 3,
    });
    if (brandWallConfig) {
      sections.push({
        id: 'sec-brand-wall-fallback',
        type: 'brandWall',
        enabled: true,
        sortOrder: 4,
      });
    }
    return sections;
  })();

  return (
    <div className="flex flex-col min-h-screen">
      {sectionsToRender.map((section) => {
        if (section.type === 'hero') {
          return (
            <section
              key={section.id}
              className="relative bg-zinc-900 text-white overflow-hidden"
            >
              <div className="absolute inset-0">
                <Image
                  src={heroBackgroundImage}
                  alt=""
                  fill
                  sizes="100vw"
                  className="object-cover opacity-20"
                  priority
                />
              </div>

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
                      href={heroHref}
                      className="inline-flex items-center justify-center h-12 px-8 font-medium text-white border border-white/30 rounded-md hover:bg-white/10 transition-colors"
                    >
                      {t('viewCatalog')}
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          );
        }

        if (section.type === 'ranking' && showRanking) {
          return (
            <section
              key={section.id}
              className="py-12 bg-zinc-50 dark:bg-zinc-900/40 border-b border-zinc-100 dark:border-zinc-800"
            >
              <div className="container mx-auto px-4">
                <HomeRankingCarousel
                  title={rankingTitle}
                  subtitle={rankingSubtitle}
                />
              </div>
            </section>
          );
        }

        if (section.type === 'categoryGrid') {
          return (
            <section
              key={section.id}
              className="py-16 border-t border-zinc-100 dark:border-zinc-800"
            >
              <div className="container mx-auto px-4">
                <div className="flex justify-between items-end mb-8">
                  <h2 className="text-3xl font-bold">{t('shopCategory')}</h2>
                  <Link
                    href="/products"
                    className="text-blue-600 hover:underline flex items-center gap-1"
                  >
                    {t('viewAll')} <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {categoryCards.map((cat, i) => (
                    <Link
                      key={cat.id}
                      href={cat.href}
                      className="group relative block aspect-[4/5] overflow-hidden rounded-xl bg-zinc-100"
                    >
                      <Image
                        src={cat.img}
                        alt={cat.name}
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        priority={i < 2}
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
          );
        }

        if (section.type === 'brandWall' && brandWallConfig) {
          return (
            <BrandWall
              key={section.id}
              title={brandWallConfig.title}
              subtitle={brandWallConfig.subtitle}
              logos={brandWallConfig.logos}
            />
          );
        }

        if (section.type === 'textBlock') {
          const block =
            textBlocks.find((b) => b.id === section.textBlockId) ||
            textBlocks[0];
          if (!block) return null;
          return (
            <section
              key={section.id}
              className="py-12 bg-white dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-800"
            >
              <div className="container mx-auto px-4 max-w-3xl">
                {block.title && (
                  <h2 className="text-2xl font-bold mb-3">{block.title}</h2>
                )}
                <p className="text-sm md:text-base leading-relaxed text-zinc-600 dark:text-zinc-300 whitespace-pre-line">
                  {block.content}
                </p>
              </div>
            </section>
          );
        }

        if (section.type === 'collectionProducts') {
          return <CollectionSection key={section.id} {...section} />;
        }

        return null;
      })}

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

      <TrustSection />

    </div>
  );
}
