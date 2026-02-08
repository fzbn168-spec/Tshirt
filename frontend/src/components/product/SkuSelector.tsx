'use client';

import { useState, useMemo } from 'react';
import { ShoppingBag, Check, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useCartStore } from '@/store/useCartStore';

interface SkuSelectorProps {
  productId: string;
  productName: string;
  productImage: string;
  basePrice: number;
  attributes: any[];
  skus: any[];
  isAuth?: boolean;
}

export function SkuSelector({ 
  productId, 
  productName, 
  productImage, 
  basePrice,
  attributes = [],
  skus = [],
  isAuth = false
}: SkuSelectorProps) {
  const router = useRouter();
  const addItem = useCartStore(state => state.addItem);
  const [selectedValues, setSelectedValues] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);

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
  const availableValues = useMemo(() => {
    const valueIds = new Set<string>();
    skus.forEach(sku => {
      sku.attributeValues.forEach((av: any) => {
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

    return skus.find(sku => {
      return attributes.every(attr => {
        const selectedValId = selectedValues[attr.attribute.id];
        return sku.attributeValues.some((av: any) => av.attributeValueId === selectedValId);
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
  const tierPrices = useMemo(() => {
    if (!matchingSku || !matchingSku.tierPrices) return [];
    try {
      const parsed = typeof matchingSku.tierPrices === 'string' 
        ? JSON.parse(matchingSku.tierPrices) 
        : matchingSku.tierPrices;
      return Array.isArray(parsed) ? parsed.sort((a: any, b: any) => a.minQty - b.minQty) : [];
    } catch {
      return [];
    }
  }, [matchingSku]);

  // Calculate dynamic price based on quantity
  const currentPrice = useMemo(() => {
    if (!matchingSku) return basePrice;
    let price = Number(matchingSku.price);
    
    if (tierPrices.length > 0) {
      const tier = [...tierPrices].reverse().find((t: any) => quantity >= t.minQty);
      if (tier) {
        price = Number(tier.price);
      }
    }
    return price;
  }, [matchingSku, tierPrices, quantity, basePrice]);

  const handleAddToRFQ = () => {
    if (!isAuth) {
      router.push('/login');
      return;
    }

    if (!matchingSku) return;

    // Create a description of selected attributes
    const specsDescription = attributes.map(attr => {
        const valId = selectedValues[attr.attribute.id];
        const val = attr.attribute.values.find((v: any) => v.id === valId);
        return `${parseJson(attr.attribute.name)}: ${val ? parseJson(val.value) : ''}`;
    }).join(', ');

    addItem({
      id: `${productId}-${matchingSku.id}`,
      productId,
      productName,
      skuId: matchingSku.id,
      skuCode: matchingSku.skuCode,
      specs: specsDescription,
      quantity,
      price: currentPrice,
      image: productImage
    });

    // Reset or show feedback
    alert('Added to RFQ Cart');
  };

  // If no attributes, show simple quantity selector for base product (if applicable)
  // But our products usually have SKUs.

  return (
    <div className="space-y-6">
      {/* Attribute Selectors */}
      <div className="space-y-6">
        {attributes.map((pa: any) => {
            const attr = pa.attribute;
            const attrName = parseJson(attr.name);
            const values = attr.values.filter((v: any) => availableValues.has(v.id));

            if (values.length === 0) return null;

            return (
                <div key={attr.id} className="space-y-3">
                    <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {attrName}: <span className="text-zinc-500 font-normal">
                            {selectedValues[attr.id] 
                                ? parseJson(values.find((v: any) => v.id === selectedValues[attr.id])?.value || '') 
                                : 'Select option'}
                        </span>
                    </h3>
                    <div className="flex flex-wrap gap-3">
                        {values.map((val: any) => {
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
          <div className="font-medium mb-2 text-zinc-700 dark:text-zinc-300">Volume Pricing</div>
          <div className="grid grid-cols-2 gap-2">
             <div className="text-zinc-500">1+</div>
             <div className="text-right">${Number(matchingSku.price).toFixed(2)}</div>
             {tierPrices.map((tier: any, idx: number) => (
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
            <div className="text-sm text-zinc-500 mb-1">Price</div>
            {isAuth ? (
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                  {matchingSku ? `$${currentPrice.toFixed(2)}` : `$${Number(basePrice).toFixed(2)}+`}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-zinc-500 py-1">
                 <Lock className="w-5 h-5" />
                 <span className="font-medium text-lg">Login to view price</span>
              </div>
            )}
          </div>
          {matchingSku && (
              <div className="text-right">
                  <div className="text-sm text-zinc-500 mb-1">Stock</div>
                  <div className={cn("font-medium", matchingSku.stock > 0 ? "text-green-600" : "text-red-600")}>
                      {matchingSku.stock > 0 ? `${matchingSku.stock} Available` : 'Out of Stock'}
                  </div>
              </div>
          )}
      </div>

      {/* Quantity & Action */}
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
            onClick={handleAddToRFQ}
            disabled={(!matchingSku || matchingSku.stock === 0) && isAuth}
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isAuth ? (
              <>
                <ShoppingBag className="w-5 h-5" />
                {matchingSku ? (matchingSku.stock > 0 ? 'Add to RFQ' : 'Out of Stock') : 'Select Options'}
              </>
            ) : (
              <>
                <Lock className="w-5 h-5" />
                Login to Add to RFQ
              </>
            )}
          </button>
      </div>
    </div>
  );
}