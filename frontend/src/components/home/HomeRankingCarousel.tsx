'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@/navigation';
import Image from 'next/image';
import { Loader2, ArrowRight, Flame, Sparkles, ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { useCurrencyStore } from '@/store/useCurrencyStore';

type HomeRankingCarouselProps = {
  title?: string;
  subtitle?: string;
};

type Product = {
  id: string;
  title: string;
  images: string;
  basePrice: string;
  moq: number;
  soldCount?: number;
  fakeSoldCount?: number;
};

function parseJsonTitle(str: string) {
  try {
    const obj = JSON.parse(str);
    return obj.zh || obj.en || str;
  } catch {
    return str;
  }
}

function getFirstImage(images: string) {
  try {
    const arr = JSON.parse(images);
    if (Array.isArray(arr) && arr.length > 0) return arr[0];
    return '';
  } catch {
    return '';
  }
}

export function HomeRankingCarousel({ title, subtitle }: HomeRankingCarouselProps) {
  const [tab, setTab] = useState<'hot' | 'new'>('hot');
  const { user } = useAuthStore();
  const { format } = useCurrencyStore();
  const isAuth = !!user;

  const { data, isLoading } = useQuery({
    queryKey: ['home-ranking', tab],
    queryFn: async () => {
      const params =
        tab === 'hot' ? 'sort=hot&page=1&limit=10' : 'page=1&limit=10';
      const res = await api.get(`/products?${params}`);
      return res.data;
    },
  });

  const products: Product[] = data
    ? Array.isArray(data)
      ? data
      : data.items || []
    : [];

  const [page, setPage] = useState(0);
  const perPage = 4;

  const maxPage =
    products.length > 0 ? Math.max(0, Math.ceil(products.length / perPage) - 1) : 0;

  const currentPage = Math.min(page, maxPage);

  useEffect(() => {
    if (products.length <= perPage) return;
    const id = setInterval(() => {
      setPage((prev) => (prev >= maxPage ? 0 : prev + 1));
    }, 6000);
    return () => clearInterval(id);
  }, [products.length, maxPage]);

  const start = currentPage * perPage;
  const visible = products.slice(start, start + perPage);

  const headingTitle =
    title || '热销 TOP 10 · 新品推荐';
  const headingSubtitle =
    subtitle || '帮助买家快速发现热卖款和最新上架款，提升转化。';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-orange-600">
            <Flame className="w-4 h-4" />
            <span>热门排行榜</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mt-1">
            {headingTitle}
          </h2>
          <p className="text-sm text-zinc-500 mt-1">
            {headingSubtitle}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setTab('hot');
              setPage(0);
            }}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              tab === 'hot'
                ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
            }`}
          >
            <Flame className="w-3 h-3" />
            <span>热销 TOP 10</span>
          </button>
          <button
            onClick={() => {
              setTab('new');
              setPage(0);
            }}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              tab === 'new'
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>新品推荐</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setPage((p) => (p === 0 ? maxPage : p - 1))}
          disabled={products.length === 0}
          className="flex items-center justify-center w-9 h-9 rounded-full border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : visible.length === 0 ? (
            <div className="flex justify-center py-10 text-sm text-zinc-500">
              暂无商品数据
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {visible.map((product, idx) => {
                const globalIndex = start + idx + 1;
                const title = parseJsonTitle(product.title);
                const imageUrl = getFirstImage(product.images);
                const sold =
                  (product.soldCount || 0) + (product.fakeSoldCount || 0);

                return (
                  <Link
                    key={product.id}
                    href={`/product/${product.id}`}
                    className="group bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden hover:shadow-md transition-shadow flex flex-col"
                  >
                    <div className="relative aspect-[4/5] bg-zinc-100 dark:bg-zinc-900">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={title}
                          fill
                          sizes="(max-width: 768px) 50vw, 25vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : null}
                      <div className="absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-semibold bg-black/70 text-white">
                        TOP {globalIndex}
                      </div>
                      {sold > 0 && (
                        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-[11px] font-medium bg-orange-500 text-white">
                          累计成交 {sold.toLocaleString()}+
                        </div>
                      )}
                    </div>
                    <div className="p-3 flex-1 flex flex-col">
                      <div className="text-xs text-zinc-500 mb-1">
                        {tab === 'hot' ? '热销爆款' : '最新上架'}
                      </div>
                      <h3 className="font-medium text-sm line-clamp-2 mb-2 group-hover:text-blue-600">
                        {title}
                      </h3>
                      <div className="mt-auto flex items-end justify-between gap-2">
                        <div>
                          <div className="text-[11px] text-zinc-500 mb-0.5">
                            起订量 MOQ: {product.moq}
                          </div>
                          {isAuth ? (
                            <div className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                              {format(Number(product.basePrice))}
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-zinc-500 text-xs">
                              <Lock className="w-3 h-3" />
                              <span>登录后查看价格</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-blue-600 font-medium">
                          <span>查看详情</span>
                          <ArrowRight className="w-3 h-3" />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <button
          onClick={() => setPage((p) => (p >= maxPage ? 0 : p + 1))}
          disabled={products.length === 0}
          className="flex items-center justify-center w-9 h-9 rounded-full border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {products.length > 0 && (
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <div>
            第 {currentPage + 1} 页 / 共 {maxPage + 1} 页
          </div>
          <div className="flex gap-1">
            {Array.from({ length: maxPage + 1 }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`w-1.5 h-1.5 rounded-full ${
                  i === currentPage ? 'bg-blue-600' : 'bg-zinc-300'
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
