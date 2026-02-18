'use client';

import { useState, useMemo } from 'react';
import { ShoppingBag, Lock, Box, MessageCircle, Ruler } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useCartStore } from '@/store/useCartStore';
import { useToastStore } from '@/store/useToastStore';
import { useTranslations } from 'next-intl';
import { SizeChartModal } from './SizeChartModal';
import { useAnalytics } from '@/hooks/useAnalytics';

import { useCurrencyStore } from '@/store/useCurrencyStore';

type AttributeValue = { id: string; value: string };
type ProductAttribute = {
  attribute: {
    id: string;
    name: string;
    values: AttributeValue[];
  };
};

type TierPrice = { minQty: number; price: number };
type Sku = {
  id: string;
  skuCode: string;
  price: number | string;
  stock: number;
  attributeValues: { attributeValueId: string }[];
  tierPrices?: TierPrice[] | string;
};

interface SkuSelectorProps {
  productId: string;
  productName: string;
  productImage: string;
  basePrice: number;
  attributes: ProductAttribute[];
  skus: Sku[];
  isAuth?: boolean;
  sizeChart?: {
    name: string;
    data: string;
  };
}

export function SkuSelector({ 
  productId, 
  productName, 
  productImage, 
  basePrice,
  attributes = [],
  skus = [],
  isAuth = false,
  sizeChart
}: SkuSelectorProps) {
  const router = useRouter();
  const t = useTranslations('Product');
  const addItem = useCartStore(state => state.addItem);
  const { addToast } = useToastStore();
  const { trackEvent } = useAnalytics();
  const { format } = useCurrencyStore();
  const [selectedValues, setSelectedValues] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [customNote, setCustomNote] = useState('');
  const [isSizeChartOpen, setIsSizeChartOpen] = useState(false);

  // Helper to parse JSON strings
  const parseJson = (str: string) => {
    try {
      const obj = JSON.parse(str || '{}');
      return obj.en || obj.zh || str;
    } catch {
      return str;
    }
  };

  // Filter values that are actually used in SKUs
  const availableValues = useMemo<Set<string>>(() => {
    const valueIds = new Set<string>();
    skus.forEach((sku) => {
      sku.attributeValues.forEach((av) => {
        valueIds.add(av.attributeValueId);
      });
    });
    return valueIds;
  }, [skus]);

  // Find matching SKU based on selection
  const matchingSku = useMemo(() => {
    // Check if all attributes are selected
    if (attributes.length === 0) return skus[0]; // No attributes product?
    if (Object.keys(selectedValues).length !== attributes.length) return null;

    return skus.find((sku) => {
      return attributes.every((attr) => {
        const selectedValId = selectedValues[attr.attribute.id];
        return sku.attributeValues.some((av) => av.attributeValueId === selectedValId);
      });
    });
  }, [selectedValues, attributes, skus]);

  const handleSelect = (attrId: string, valueId: string) => {
    setSelectedValues(prev => ({
      ...prev,
      [attrId]: valueId
    }));
  };

  // Calculate tier prices
  const tierPrices = useMemo<TierPrice[]>(() => {
    if (!matchingSku || !matchingSku.tierPrices) return [];
    try {
      const parsed: unknown = typeof matchingSku.tierPrices === 'string' 
        ? JSON.parse(matchingSku.tierPrices as string) 
        : matchingSku.tierPrices;
      const arr = Array.isArray(parsed) ? (parsed as TierPrice[]) : [];
      return arr.slice().sort((a, b) => a.minQty - b.minQty);
    } catch {
      return [];
    }
  }, [matchingSku]);

  // Calculate dynamic price based on quantity
  const currentPrice = useMemo(() => {
    if (!matchingSku) return basePrice;
    let price = Number(matchingSku.price);
    
    if (tierPrices.length > 0) {
      const tier = [...tierPrices].reverse().find((t) => quantity >= t.minQty);
      if (tier) {
        price = Number(tier.price);
      }
    }
    return price;
  }, [matchingSku, tierPrices, quantity, basePrice]);

  const handleAddToRFQ = (isSample = false) => {
    if (!isAuth) {
      router.push('/login');
      return;
    }

    if (!matchingSku) return;

    // Create a description of selected attributes
    let specsDescription = attributes.map((attr) => {
        const valId = selectedValues[attr.attribute.id];
        const val = attr.attribute.values.find((v) => v.id === valId);
        return `${parseJson(attr.attribute.name)}: ${val ? parseJson(val.value) : ''}`;
    }).join(', ');

    // Mark as sample if applicable
    if (isSample) {
        specsDescription = `[SAMPLE REQUEST] ${specsDescription}`;
    }

    // Append customization note if present
    if (customNote.trim()) {
      specsDescription += ` | ${t('customization.label')}: ${customNote.trim()}`;
    }

    addItem({
      id: `${productId}-${matchingSku.id}-${Date.now()}`, // Unique ID for customized items
      productId,
      productName,
      skuId: matchingSku.id,
      skuCode: matchingSku.skuCode,
      specs: specsDescription,
      quantity: isSample ? 1 : quantity, // Samples usually qty 1
      price: currentPrice, // Samples might be free or paid, logic can be adjusted
      image: productImage,
      type: isSample ? 'SAMPLE' : 'STANDARD'
    });

    // Track Event
    trackEvent('ADD_TO_CART', {
      productId,
      skuId: matchingSku.id,
      quantity: isSample ? 1 : quantity,
      price: currentPrice,
      isSample
    });

    // Reset or show feedback
    addToast(isSample ? t('sampleAdded') : t('addedToCart'), 'success');
    setCustomNote(''); // Reset note
  };

  return (
    <div className="space-y-6">
      {/* Attribute Selectors */}
      <div className="space-y-6">
        {attributes.map((pa) => {
            const attr = pa.attribute;
            const attrName = parseJson(attr.name);
            const values = attr.values.filter((v) => availableValues.has(v.id));

            if (values.length === 0) return null;

            // Check if this is a size attribute (simple check by name)
            const isSizeAttribute = /size|尺码/i.test(attrName);

            return (
                <div key={attr.id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {attrName}: <span className="text-zinc-500 font-normal">
                          {selectedValues[attr.id] 
                                  ? parseJson(values.find((v) => v.id === selectedValues[attr.id])?.value || '') 
                                  : t('selectOption')}
                          </span>
                      </h3>
                      
                      {/* Size Chart Button */}
                      {isSizeAttribute && sizeChart && (
                        <button 
                          onClick={() => setIsSizeChartOpen(true)}
                          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline"
                        >
                          <Ruler className="w-4 h-4" />
                          {t('sizeGuide') || 'Size Guide'}
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-3">
                        {values.map((val) => {
                            const isSelected = selectedValues[attr.id] === val.id;
                            const valName = parseJson(val.value);
                            
                            return (
                                <button
                                    key={val.id}
                                    onClick={() => handleSelect(attr.id, val.id)}
                                    className={cn(
                                        "px-4 py-2 rounded-md text-sm font-medium transition-all border",
                                        isSelected 
                                            ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:border-blue-500 dark:text-blue-400 ring-1 ring-blue-600 dark:ring-blue-500" 
                                            : "border-zinc-200 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                                    )}
                                >
                                    {valName}
                                </button>
                            );
                        })}
                    </div>
                </div>
            );
        })}
      </div>

      <div className="h-px bg-zinc-200 dark:bg-zinc-800" />

      {/* Tiered Price Table */}
      {isAuth && tierPrices.length > 0 && (
        <div className="bg-zinc-50 dark:bg-zinc-900 rounded-md p-3 text-sm">
          <div className="font-medium mb-2 text-zinc-700 dark:text-zinc-300">{t('volumePricing')}</div>
          <div className="grid grid-cols-2 gap-2">
             <div className="text-zinc-500">1+</div>
             <div className="text-right">${(matchingSku ? Number(matchingSku.price) : Number(basePrice)).toFixed(2)}</div>
             {tierPrices.map((tier, idx: number) => (
                <div key={idx} className={cn("contents", quantity >= tier.minQty && "font-bold text-blue-600")}>
                    <div className="text-zinc-500">{tier.minQty}+</div>
                    <div className="text-right">${Number(tier.price).toFixed(2)}</div>
                </div>
             ))}
          </div>
        </div>
      )}

      {/* Price & Stock Display */}
      <div className="flex items-end justify-between">
          <div>
            <div className="text-sm text-zinc-500 mb-1">{t('price')}</div>
            {isAuth ? (
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                  {matchingSku ? format(currentPrice) : `${format(Number(basePrice))}+`}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-zinc-500 py-1">
                 <Lock className="w-5 h-5" />
                 <span className="font-medium text-lg">{t('loginToView')}</span>
              </div>
            )}
          </div>
          {matchingSku && (
              <div className="text-right">
                  <div className="text-sm text-zinc-500 mb-1">{t('stock')}</div>
                  <div className={cn("font-medium", matchingSku.stock > 0 ? "text-green-600" : "text-red-600")}>
                      {matchingSku.stock > 0 ? `${matchingSku.stock} ${t('available')}` : t('outOfStock')}
                  </div>
              </div>
          )}
      </div>

      {/* Customization Input */}
      {isAuth && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {t('customization.title')}
          </label>
          <textarea
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            placeholder={t('customization.placeholder')}
            className="w-full min-h-[80px] px-3 py-2 rounded-md border border-zinc-200 dark:border-zinc-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Quantity & Action */}
      <div className="flex flex-col gap-3">
          <div className="flex gap-4">
            <div className="w-32 flex items-center border border-zinc-200 dark:border-zinc-700 rounded-md">
                <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                    -
                </button>
                <div className="flex-1 text-center font-medium">{quantity}</div>
                <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                    +
                </button>
            </div>
            
            <button 
              onClick={() => handleAddToRFQ(false)}
              disabled={(!matchingSku || matchingSku.stock === 0) && isAuth}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isAuth ? (
                <>
                  <ShoppingBag className="w-5 h-5" />
                  {matchingSku ? (matchingSku.stock > 0 ? t('addToRfq') : t('outOfStock')) : t('selectOptions')}
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  {t('loginToAdd')}
                </>
              )}
            </button>
          </div>

          {/* Sample Request Button (Secondary Action) */}
          {isAuth && matchingSku && matchingSku.stock > 0 && (
            <div className="flex gap-4">
              <button 
                onClick={() => handleAddToRFQ(true)}
                className="flex-1 border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 px-6 py-2.5 rounded-md font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center justify-center gap-2 transition-colors"
              >
                <Box className="w-4 h-4" />
                {t('requestSample')}
              </button>
              
              <a 
                href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '8613800000000'}?text=${encodeURIComponent(`Hi, I'm interested in ${productName} (SKU: ${matchingSku.skuCode})`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 border border-green-500 text-green-600 px-6 py-2.5 rounded-md font-medium hover:bg-green-50 dark:hover:bg-green-900/20 flex items-center justify-center gap-2 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                {t('chatWhatsApp')}
              </a>
            </div>
          )}
      </div>

      {/* Size Chart Modal */}
      {sizeChart && (
        <SizeChartModal 
          isOpen={isSizeChartOpen} 
          onClose={() => setIsSizeChartOpen(false)} 
          sizeChart={sizeChart} 
        />
      )}
    </div>
  );
}
