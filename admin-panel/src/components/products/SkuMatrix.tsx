
'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/input';
import { Trash2, Link as LinkIcon, Upload } from 'lucide-react';
import { Button } from '@/components/button';

interface AttributeValue {
  id: string;
  value: string;
  meta?: string;
}

interface SelectedAttribute {
  attributeId: string;
  attributeName: string;
  attributeCode: string;
  selectedValues: AttributeValue[];
}

export interface SkuRow {
  key: string; // Unique key based on attribute value IDs
  skuCode: string;
  price: string;
  stock: string;
  moq: string;
  imageUrl: string;
  attributes: {
    attributeId: string;
    attributeName: string;
    valueId: string;
    valueName: string;
  }[];
}

interface SkuMatrixProps {
  attributes: SelectedAttribute[];
  baseProductCode: string;
  basePrice: string;
  onChange: (skus: SkuRow[]) => void;
  initialSkus?: SkuRow[];
}

import api from '@/lib/axios';
import { useToastStore } from '@/store/useToastStore';

export default function SkuMatrix({ attributes, baseProductCode, basePrice, onChange, initialSkus = [] }: SkuMatrixProps) {
  const { addToast } = useToastStore();
  const [rows, setRows] = useState<SkuRow[]>(initialSkus);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);

  // Generate rows based on attributes
  useEffect(() => {
    if (attributes.length === 0) {
      setRows([]);
      return;
    }

    // Cartesian Product Helper
    const cartesian = (args: any[][]) => {
      const r: any[] = [];
      const max = args.length - 1;
      function helper(arr: any[], i: number) {
        for (let j = 0, l = args[i].length; j < l; j++) {
          const a = arr.slice(0);
          a.push(args[i][j]);
          if (i === max) r.push(a);
          else helper(a, i + 1);
        }
      }
      helper([], 0);
      return r;
    };

    // Prepare arrays of values [ [val1, val2], [val3, val4] ]
    const attrValues = attributes.map(a => a.selectedValues.map(v => ({
      ...v,
      _parentAttr: a
    })));

    // If any attribute has no values selected, we can't generate complete SKUs yet
    if (attrValues.some(arr => arr.length === 0)) {
       // Optional: Decide if we want to show nothing or partial. 
       // Usually we wait until at least one value is selected for each attr.
       return;
    }

    const combinations = cartesian(attrValues);

    const newRows: SkuRow[] = combinations.map(combo => {
      // Create a unique key for this combination: "valId1-valId2"
      const key = combo.map((c: any) => c.id).sort().join('-');
      
      // Check if we already have this row (preserve user edits)
      const existing = rows.find(r => r.key === key);
      
      if (existing) return existing;

      // Generate default SKU Code: PRODUCT-COLOR-SIZE
      const suffix = combo.map((c: any) => {
          const val = parseName(c.value);
          return val.replace(/\s+/g, '').toUpperCase().substring(0, 3);
      }).join('-');
      
      const defaultSku = baseProductCode ? `${baseProductCode}-${suffix}` : suffix;

      return {
        key,
        skuCode: defaultSku,
        price: basePrice || '0',
        stock: '100',
        moq: '1',
        imageUrl: '',
        attributes: combo.map((c: any) => ({
          attributeId: c._parentAttr.attributeId,
          attributeName: c._parentAttr.attributeName,
          valueId: c.id,
          valueName: parseName(c.value)
        }))
      };
    });

    setRows(newRows);
    onChange(newRows);
  }, [attributes, baseProductCode]); // Depend on attributes change

  const parseName = (jsonOrString: string) => {
    try {
      const obj = JSON.parse(jsonOrString);
      return obj.en || obj.zh || jsonOrString;
    } catch {
      return jsonOrString;
    }
  };

  const updateRow = (index: number, field: keyof SkuRow, value: string) => {
    const newRows = [...rows];
    // @ts-ignore
    newRows[index][field] = value;
    setRows(newRows);
    onChange(newRows);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploadingIdx(idx);
    try {
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateRow(idx, 'imageUrl', res.data.url);
      addToast('Image uploaded successfully', 'success');
    } catch (error) {
      addToast('Failed to upload image', 'error');
    } finally {
      setUploadingIdx(null);
    }
  };

  if (attributes.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="font-medium">SKU Matrix</h3>
      <div className="overflow-x-auto border rounded-md">
        <table className="w-full text-sm text-left">
          <thead className="bg-zinc-50 dark:bg-zinc-800 text-zinc-500 font-medium">
            <tr>
              <th className="px-4 py-3">Variant</th>
              <th className="px-4 py-3 w-48">SKU Code (Editable)</th>
              <th className="px-4 py-3 w-32">Price ($)</th>
              <th className="px-4 py-3 w-24">Stock</th>
              <th className="px-4 py-3 w-24">MOQ</th>
              <th className="px-4 py-3 w-64">Image URL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {rows.map((row, idx) => (
              <tr key={row.key} className="bg-white dark:bg-zinc-900">
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    {row.attributes.map(a => (
                      <span key={a.attributeId} className="text-xs px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 w-fit">
                        {a.attributeName}: {a.valueName}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Input 
                    value={row.skuCode} 
                    onChange={(e) => updateRow(idx, 'skuCode', e.target.value)}
                    className="h-8"
                  />
                </td>
                <td className="px-4 py-3">
                  <Input 
                    type="number" 
                    value={row.price} 
                    onChange={(e) => updateRow(idx, 'price', e.target.value)}
                    className="h-8"
                  />
                </td>
                <td className="px-4 py-3">
                  <Input 
                    type="number" 
                    value={row.stock} 
                    onChange={(e) => updateRow(idx, 'stock', e.target.value)}
                    className="h-8"
                  />
                </td>
                <td className="px-4 py-3">
                  <Input 
                    type="number" 
                    value={row.moq} 
                    onChange={(e) => updateRow(idx, 'moq', e.target.value)}
                    className="h-8"
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 items-center">
                    <div className="relative flex-1">
                      <Input 
                        value={row.imageUrl} 
                        onChange={(e) => updateRow(idx, 'imageUrl', e.target.value)}
                        placeholder="https://..."
                        className="h-8 text-xs pr-8"
                      />
                       <label className="absolute right-1 top-1 p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded cursor-pointer">
                          {uploadingIdx === idx ? (
                            <span className="h-3 w-3 block animate-spin rounded-full border-2 border-zinc-400 border-t-transparent"></span>
                          ) : (
                            <Upload className="h-3 w-3 text-zinc-500" />
                          )}
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, idx)}
                          />
                       </label>
                    </div>
                    {row.imageUrl && (
                       <img src={row.imageUrl} alt="Preview" className="h-8 w-8 rounded object-cover border bg-white" />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && (
         <div className="text-center py-4 text-zinc-500 border rounded-md border-dashed">
            Select attribute values above to generate SKUs.
         </div>
      )}
    </div>
  );
}
