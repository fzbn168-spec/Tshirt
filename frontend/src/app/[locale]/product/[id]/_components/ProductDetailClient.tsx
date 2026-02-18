
'use client';

import { Link } from '@/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { ProductGallery } from '@/components/product/ProductGallery';
import { ProductInfo } from '@/components/product/ProductInfo';
import { SkuSelector } from '@/components/product/SkuSelector';
import { ServiceBlock } from '@/components/product/ServiceBlock';
import { ProductTabs } from '@/components/product/ProductTabs';
import { RelatedProducts } from '@/components/product/RelatedProducts';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useEffect } from 'react';

interface AttributeValue { id: string; value: string }
interface Attribute { id: string; name: string; values: AttributeValue[] }
interface Sku {
  id: string;
  skuCode: string;
  price: number | string;
  stock: number;
  attributeValues: { attributeValueId: string }[];
  tierPrices?: string | { minQty: number; price: number }[];
}
interface Product {
  id: string;
  title: string;
  description: string;
  images: string;
  images360?: string;
  basePrice: number;
  soldCount?: number;
  fakeSoldCount?: number;
  skus: Sku[];
  attributes: { attribute: Attribute }[];
  sizeChart?: { name: string; data: string };
}

interface ProductDetailClientProps {
  product: Product;
}

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const { trackEvent } = useAnalytics();

  // Parse i18n fields
  const getLocStr = (jsonStr: string) => {
    try {
      const obj = JSON.parse(jsonStr || '{}');
      return obj.en || obj.zh || ''; // Default to EN, fallback to ZH
    } catch {
      return jsonStr;
    }
  };

  const title = getLocStr(product.title);
  const description = getLocStr(product.description);
  const images: string[] = JSON.parse(product.images || '[]');

  useEffect(() => {
    trackEvent('VIEW_PRODUCT', { 
      productId: product.id, 
      productName: title,
    });
  }, [product.id, title, trackEvent]);
  
  // Transform SKUs to find min/max price
  // Note: This logic seems simplistic (just min price), but matches original code.
  // Ideally should handle tiered prices if available.
  const prices = product.skus.length > 0 
    ? [{ minQty: 1, price: Math.min(...product.skus.map((s) => Number(s.price))) }]
    : [];

  const token = useAuthStore(state => state.token);
  const isAuth = !!token;

  const soldCount = (product.soldCount || 0) + (product.fakeSoldCount || 0);

  // Derive a representative tier pricing table from the first SKU that has tiers
  const representativeTiers = (() => {
    const skuWithTiers = product.skus.find((s) => s.tierPrices);
    if (!skuWithTiers) return [];
    try {
      const tiers = typeof skuWithTiers.tierPrices === 'string'
        ? JSON.parse(skuWithTiers.tierPrices)
        : skuWithTiers.tierPrices;
      if (!Array.isArray(tiers)) return [];
      return tiers
        .map((t: { minQty: number | string; price: number | string }) => ({ minQty: Number(t.minQty), price: Number(t.price) }))
        .sort((a, b) => a.minQty - b.minQty);
    } catch {
      return [];
    }
  })();

  return (
    <div className="container mx-auto px-4 py-8 lg:py-12">
      {/* Breadcrumbs */}
      <nav className="flex items-center text-sm text-zinc-500 mb-8 lg:mb-12 overflow-x-auto whitespace-nowrap pb-2">
        <Link href="/" className="hover:text-blue-600 transition-colors flex items-center">
          <Home className="w-4 h-4 mr-1" />
          Home
        </Link>
        <ChevronRight className="w-4 h-4 mx-2 flex-shrink-0 text-zinc-400" />
        <Link href="/products" className="hover:text-blue-600 transition-colors">
          Products
        </Link>
        <ChevronRight className="w-4 h-4 mx-2 flex-shrink-0 text-zinc-400" />
        <span className="text-zinc-900 dark:text-zinc-100 font-medium truncate max-w-[200px] sm:max-w-md">
          {title}
        </span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
        {/* Left Column: Gallery */}
        <div className="space-y-6">
          <ProductGallery 
            images={images} 
            images360={product.images360 ? JSON.parse(product.images360) : []}
          />
        </div>

        {/* Right Column: Info & Selector */}
        <div className="flex flex-col h-full">
          <div className="lg:sticky lg:top-24">
            <ProductInfo 
              title={title}
              skuCode={product.skus[0]?.skuCode || ''}
              description={description}
              prices={prices}
              isAuth={isAuth}
              soldCount={soldCount}
            />
            
            <div className="my-8 h-px bg-zinc-100 dark:bg-zinc-800" />
            
            <SkuSelector 
              productId={product.id}
              productName={title}
              productImage={images[0]}
              basePrice={product.basePrice}
              attributes={product.attributes}
              skus={product.skus}
              isAuth={isAuth}
              sizeChart={product.sizeChart}
            />
            
            {representativeTiers.length > 0 && (
              <div className="mt-6 rounded-lg border bg-white p-4 dark:bg-zinc-900 dark:border-zinc-800">
                <div className="font-medium mb-3 text-zinc-700 dark:text-zinc-300">Volume Pricing</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-zinc-500">1+</div>
                  <div className="text-right">
                    ${Math.min(...product.skus.map((s) => Number(s.price))).toFixed(2)}
                  </div>
                  {representativeTiers.map((tier, idx) => (
                    <div key={idx} className="contents">
                      <div className="text-zinc-500">{tier.minQty}+</div>
                      <div className="text-right">${Number(tier.price).toFixed(2)}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-xs text-zinc-500">
                  Tier pricing varies by variant. Select options to view exact tiers.
                </div>
              </div>
            )}
            
            <ServiceBlock />
          </div>
        </div>
      </div>

      <div className="mt-16">
        <ProductTabs description={description} productId={product.id} />
      </div>
      <div className="mt-16">
        <RelatedProducts />
      </div>
    </div>
  );
}
