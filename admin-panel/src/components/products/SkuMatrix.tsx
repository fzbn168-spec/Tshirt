
'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/input';
import { Trash2, Link as LinkIcon, Upload, Image as ImageIcon, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/button';
import { FileUpload } from '@/components/FileUpload';

// ... existing interfaces ...
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
  key: string;
  skuCode: string;
  price: string;
  stock: string;
  barcode: string;
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
  onChange: (skus: SkuRow[]) => void;
  initialSkus?: SkuRow[];
}

import api from '@/lib/axios';
import { useToastStore } from '@/store/useToastStore';

export default function SkuMatrix({ attributes, baseProductCode, onChange, initialSkus = [] }: SkuMatrixProps) {
  const { addToast } = useToastStore();
  const [rows, setRows] = useState<SkuRow[]>(initialSkus);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  
  // Grouping State
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Generate rows based on attributes
  useEffect(() => {
    // ... existing generation logic ...
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

    const attrValues = attributes.map(a => a.selectedValues.map(v => ({
      ...v,
      _parentAttr: a
    })));

    if (attrValues.some(arr => arr.length === 0)) return;

    const combinations = cartesian(attrValues);

    const newRows: SkuRow[] = combinations.map(combo => {
      const key = combo.map((c: any) => c.id).sort().join('-');
      const existing = rows.find(r => r.key === key);
      if (existing) return existing;

      const suffix = combo.map((c: any) => {
          const val = parseName(c.value);
          return val.replace(/\s+/g, '').toUpperCase().substring(0, 3);
      }).join('-');
      
      const defaultSku = baseProductCode ? `${baseProductCode}-${suffix}` : suffix;

      return {
        key,
        skuCode: defaultSku,
        price: '0',
        stock: '100',
        barcode: '',
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
    
    // Auto-expand all groups initially
    const groups = new Set<string>();
    newRows.forEach(r => {
        const groupKey = r.attributes[0]?.valueName || 'Default';
        groups.add(groupKey);
    });
    setExpandedGroups(groups);

  }, [attributes, baseProductCode]);

  const parseName = (jsonOrString: string) => {
    try {
      const obj = JSON.parse(jsonOrString);
      return obj.en || obj.zh || jsonOrString;
    } catch {
      return jsonOrString;
    }
  };

  const updateRow = (key: string, field: keyof SkuRow, value: string) => {
    const newRows = rows.map(r => r.key === key ? { ...r, [field]: value } : r);
    setRows(newRows);
    onChange(newRows);
  };

  const handleGroupImageUpload = (groupValue: string, url: string) => {
     // Apply image to all rows in this group
     const newRows = rows.map(r => {
         if (r.attributes[0]?.valueName === groupValue) {
             return { ...r, imageUrl: url };
         }
         return r;
     });
     setRows(newRows);
     onChange(newRows);
  };

  const toggleGroup = (groupKey: string) => {
      const newExpanded = new Set(expandedGroups);
      if (newExpanded.has(groupKey)) {
          newExpanded.delete(groupKey);
      } else {
          newExpanded.add(groupKey);
      }
      setExpandedGroups(newExpanded);
  };

  if (attributes.length === 0) return null;

  // Group rows by the first attribute (e.g. Color)
  const groupedRows = rows.reduce((acc, row) => {
      const groupKey = row.attributes[0]?.valueName || 'Default';
      if (!acc[groupKey]) acc[groupKey] = [];
      acc[groupKey].push(row);
      return acc;
  }, {} as Record<string, SkuRow[]>);

  const firstAttrName = attributes[0]?.attributeName || 'Variant';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
          <h3 className="font-medium text-sm">Variants</h3>
          <div className="text-xs text-zinc-500">
              Total {rows.length} variants
          </div>
      </div>
      
      <div className="border rounded-lg divide-y divide-zinc-200 dark:divide-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
          {Object.entries(groupedRows).map(([groupValue, groupRows]) => {
              const isExpanded = expandedGroups.has(groupValue);
              const firstRow = groupRows[0];
              const groupImage = firstRow.imageUrl; // Use first row's image as group image representation

              return (
                  <div key={groupValue} className="bg-white dark:bg-zinc-900">
                      {/* Group Header */}
                      <div className="flex items-center p-3 bg-zinc-50/50 dark:bg-zinc-800/30 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                          <button 
                            onClick={() => toggleGroup(groupValue)}
                            className="mr-3 p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500"
                          >
                              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </button>
                          
                          <div className="flex items-center gap-3 flex-1">
                              {/* Group Image Uploader */}
                              <div className="relative group/img h-10 w-10 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 overflow-hidden flex-shrink-0">
                                  {groupImage ? (
                                      <img src={groupImage} alt={groupValue} className="h-full w-full object-cover" />
                                  ) : (
                                      <ImageIcon className="h-4 w-4 text-zinc-300 m-auto" />
                                  )}
                                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity cursor-pointer">
                                      <FileUpload 
                                        onUpload={(url) => handleGroupImageUpload(groupValue, url)}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                      />
                                      <Upload className="h-3 w-3 text-white pointer-events-none" />
                                  </div>
                              </div>
                              
                              <span className="font-medium text-sm">{groupValue}</span>
                              <span className="text-xs text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                                  {groupRows.length} variants
                              </span>
                          </div>
                      </div>

                      {/* Group Rows */}
                      {isExpanded && (
                          <div className="border-t border-zinc-100 dark:border-zinc-800">
                              <table className="w-full text-sm text-left">
                                  <thead className="text-xs text-zinc-500 bg-zinc-50/30 dark:bg-zinc-800/30 border-b border-zinc-100 dark:border-zinc-800">
                                      <tr>
                                          <th className="px-4 py-2 font-medium">Variant</th>
                                          <th className="px-4 py-2 font-medium">Price</th>
                                          <th className="px-4 py-2 font-medium">Quantity</th>
                                          <th className="px-4 py-2 font-medium">SKU</th>
                                          <th className="px-4 py-2 font-medium">Barcode</th>
                                      </tr>
                                  </thead>
                                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                                      {groupRows.map((row) => (
                                          <tr key={row.key} className="group hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                                              <td className="px-4 py-2">
                                                  <div className="flex flex-col">
                                                      {row.attributes.filter(a => a.attributeName !== firstAttrName).map(a => (
                                                          <span key={a.attributeId} className="text-sm">
                                                              {a.valueName}
                                                          </span>
                                                      ))}
                                                      {row.attributes.length === 1 && <span className="text-zinc-400 text-xs">Default</span>}
                                                  </div>
                                              </td>
                                              <td className="px-4 py-2 w-32">
                                                  <div className="relative">
                                                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-400 text-xs">$</span>
                                                      <Input 
                                                          type="number" 
                                                          value={row.price} 
                                                          onChange={(e) => updateRow(row.key, 'price', e.target.value)}
                                                          className="h-8 pl-5 bg-transparent border-transparent hover:border-zinc-200 focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-900 transition-all text-right"
                                                          placeholder="0.00"
                                                      />
                                                  </div>
                                              </td>
                                              <td className="px-4 py-2 w-24">
                                                  <Input 
                                                      type="number" 
                                                      value={row.stock} 
                                                      onChange={(e) => updateRow(row.key, 'stock', e.target.value)}
                                                      className="h-8 bg-transparent border-transparent hover:border-zinc-200 focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-900 transition-all text-right"
                                                      placeholder="0"
                                                  />
                                              </td>
                                              <td className="px-4 py-2 w-40">
                                                  <Input 
                                                      value={row.skuCode} 
                                                      onChange={(e) => updateRow(row.key, 'skuCode', e.target.value)}
                                                      className="h-8 bg-transparent border-transparent hover:border-zinc-200 focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-900 transition-all"
                                                  />
                                              </td>
                                              <td className="px-4 py-2 w-40">
                                                  <Input 
                                                      value={row.barcode} 
                                                      onChange={(e) => updateRow(row.key, 'barcode', e.target.value)}
                                                      className="h-8 bg-transparent border-transparent hover:border-zinc-200 focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-900 transition-all"
                                                      placeholder="ISBN/UPC"
                                                  />
                                              </td>
                                          </tr>
                                      ))}
                                  </tbody>
                              </table>
                          </div>
                      )}
                  </div>
              );
          })}
      </div>
    </div>
  );
}
