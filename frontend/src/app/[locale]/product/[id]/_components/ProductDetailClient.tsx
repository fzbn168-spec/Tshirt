
'use client';

import { Link } from '@/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { ProductGallery } from '@/components/product/ProductGallery';
import { ProductInfo } from '@/components/product/ProductInfo';
import { SkuSelector } from '@/components/product/SkuSelector';

interface ProductDetailClientProps {
  product: any;
}

export function ProductDetailClient({ product }: ProductDetailClientProps) {
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
  const images = JSON.parse(product.images || '[]');
  
  // Transform SKUs to find min/max price
  // Note: This logic seems simplistic (just min price), but matches original code.
  // Ideally should handle tiered prices if available.
  const prices = product.skus.length > 0 
    ? [{ minQty: 1, price: Math.min(...product.skus.map((s: any) => s.price)) }]
    : [];

  const token = useAuthStore(state => state.token);
  const isAuth = !!token;

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
            />
          </div>
        </div>
      </div>
    </div>
  );
}
