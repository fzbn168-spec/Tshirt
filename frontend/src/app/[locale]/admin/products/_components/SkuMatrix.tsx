'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Trash2, Plus, Copy, Settings2 } from 'lucide-react';

interface Attribute {
  id: string;
  name: string; // JSON
  code: string;
  values: AttributeValue[];
}

interface AttributeValue {
  id: string;
  value: string; // JSON
  meta?: string;
}

interface SkuMatrixProps {
  attributes: Attribute[];
  selectedAttributes: Attribute[]; // Ordered list of selected attributes
  selectedValues: { [attrId: string]: string[] }; // Map of attrId -> valueIds
  onSkusGenerated: (skus: any[]) => void;
  basePrice?: number;
}

export function SkuMatrix({
  attributes,
  selectedAttributes,
  selectedValues,
  onSkusGenerated,
  basePrice = 0
}: SkuMatrixProps) {
  const t = useTranslations('Admin.productForm');
  
  // Batch Edit State
  const [batchPrice, setBatchPrice] = useState('');
  const [batchStock, setBatchStock] = useState('');
  const [batchMoq, setBatchMoq] = useState('');

  // Helper to parse localized string
  const getLoc = (str: string) => {
    try {
      const obj = JSON.parse(str);
      return obj.en || str;
    } catch {
      return str;
    }
  };

  const handleGenerate = () => {
    // Cartesian Product Logic
    const activeAttrs = selectedAttributes.filter(attr => 
      selectedValues[attr.id] && selectedValues[attr.id].length > 0
    );

    if (activeAttrs.length === 0) return;

    // 1. Prepare arrays of values
    const valueArrays = activeAttrs.map(attr => {
      const valueIds = selectedValues[attr.id];
      // Map IDs back to full value objects, preserving selection order if possible
      // (For now just filter from attr.values)
      return attr.values
        .filter(v => valueIds.includes(v.id))
        .map(v => ({ ...v, _attr: attr }));
    });

    // 2. Cartesian Product
    const cartesian = (a: any[], b: any[]) => [].concat(...a.map((d: any) => b.map((e: any) => [].concat(d, e))) as any);
    
    let combinations: any[] = valueArrays[0];
    for (let i = 1; i < valueArrays.length; i++) {
      combinations = cartesian(combinations, valueArrays[i]);
    }

    // 3. Map to SKU objects
    const generatedSkus = combinations.map((combo: any) => {
      const values = Array.isArray(combo) ? combo : [combo];
      
      // Generate SKU Code suffix (e.g. BLK-42)
      const codeSuffix = values.map((v: any) => {
        const valName = getLoc(v.value);
        return valName.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 3);
      }).join('-');

      return {
        skuCode: '', // Leave empty to be auto-filled by parent or user
        _codeSuffix: codeSuffix,
        attributeValueIds: values.map((v: any) => v.id),
        // Default values
        price: basePrice,
        stock: 0,
        moq: 1,
        netWeight: 0,
        grossWeight: 0,
        itemsPerCarton: 1,
        // UI Helpers
        _values: values // Store for display
      };
    });

    onSkusGenerated(generatedSkus);
  };

  return (
    <div className="space-y-4 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 bg-white dark:bg-zinc-900">
      <div className="flex justify-between items-center">
        <h3 className="font-medium flex items-center gap-2">
          <Settings2 className="w-4 h-4" />
          SKU Matrix Generator
        </h3>
        <button
          type="button"
          onClick={handleGenerate}
          className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
        >
          Generate / Refresh Matrix
        </button>
      </div>

      <div className="text-sm text-zinc-500">
        <p>Selected Variations:</p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          {selectedAttributes.map(attr => {
            const count = selectedValues[attr.id]?.length || 0;
            if (count === 0) return null;
            return (
              <li key={attr.id}>
                <span className="font-medium">{getLoc(attr.name)}</span>: {count} values
              </li>
            );
          })}
        </ul>
      </div>

      <div className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-md flex flex-wrap gap-4 items-end border border-zinc-200 dark:border-zinc-700">
        <div className="flex-1 min-w-[120px]">
          <label className="text-xs text-zinc-500 mb-1 block">Batch Price</label>
          <input
            type="number"
            value={batchPrice}
            onChange={(e) => setBatchPrice(e.target.value)}
            className="w-full h-8 px-2 rounded border border-zinc-300 dark:border-zinc-600 text-sm"
            placeholder="0.00"
          />
        </div>
        <div className="flex-1 min-w-[120px]">
          <label className="text-xs text-zinc-500 mb-1 block">Batch Stock</label>
          <input
            type="number"
            value={batchStock}
            onChange={(e) => setBatchStock(e.target.value)}
            className="w-full h-8 px-2 rounded border border-zinc-300 dark:border-zinc-600 text-sm"
            placeholder="0"
          />
        </div>
        <div className="flex-1 min-w-[120px]">
          <label className="text-xs text-zinc-500 mb-1 block">Batch MOQ</label>
          <input
            type="number"
            value={batchMoq}
            onChange={(e) => setBatchMoq(e.target.value)}
            className="w-full h-8 px-2 rounded border border-zinc-300 dark:border-zinc-600 text-sm"
            placeholder="1"
          />
        </div>
        <button
          type="button"
          onClick={() => {
            // This is a "headless" component helper
            // We'll expose this via a callback or ref in the real integration
            // For now, the parent component handles the actual batch update logic on the SKUs state
            // But to make this component self-contained for the generator part, we might need to rethink.
            // Actually, let's keep this UI here but the logic will be in ProductForm for now to avoid prop drilling hell.
            // Or better: pass a `onBatchApply` prop.
          }}
          className="h-8 px-3 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 text-zinc-800 dark:text-zinc-200 rounded text-xs font-medium"
        >
          Apply to All
        </button>
      </div>
    </div>
  );
}
