import { BadgeCheck, Info, Lock } from 'lucide-react';
import { Link } from '@/navigation';

interface TieredPrice {
  minQty: number;
  price: number;
}

interface ProductInfoProps {
  title: string;
  skuCode: string;
  description: string;
  prices: TieredPrice[];
  isAuth?: boolean;
}

export function ProductInfo({ title, skuCode, description, prices, isAuth = false }: ProductInfoProps) {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded dark:bg-blue-900/30">
            In Stock
          </span>
          <span className="text-sm text-zinc-500">SKU: {skuCode}</span>
        </div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">{title}</h1>
        
        <div className="flex items-center gap-2 mt-2 text-sm text-zinc-500">
          <BadgeCheck className="w-4 h-4 text-green-600" />
          <span>Verified Supplier</span>
          <span className="mx-2">•</span>
          <span>Guangzhou, China</span>
        </div>
      </div>

      {/* Tiered Pricing */}
      <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
        {isAuth ? (
          <div className="grid grid-cols-3 gap-4 text-center">
            {prices.map((tier, index) => (
              <div key={index} className="flex flex-col relative">
                {index !== prices.length - 1 && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[1px] h-8 bg-zinc-200 dark:bg-zinc-700 hidden md:block" />
                )}
                <span className="text-sm text-zinc-500 mb-1">{tier.minQty}+ Pairs</span>
                <span className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                  ${tier.price.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-zinc-500">
            <Lock className="w-8 h-8 mb-3 opacity-40" />
            <p className="font-medium mb-3 text-zinc-900 dark:text-zinc-100">Wholesale pricing is available for members only</p>
            <Link href="/login" className="text-sm bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition-colors">
              Login to View Price
            </Link>
          </div>
        )}
      </div>

      {/* Short Description */}
      <div className="prose prose-sm dark:prose-invert text-zinc-600 dark:text-zinc-400">
        <p>{description}</p>
      </div>
    </div>
  );
}
