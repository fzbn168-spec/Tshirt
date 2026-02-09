'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { Plus, Trash2, Save, ArrowLeft, Layers } from 'lucide-react';
import { Link } from '@/navigation';
import { useTranslations } from 'next-intl';
import { TierPriceDialog } from './TierPriceDialog';

interface ProductFormProps {
  initialData?: any;
  isEdit?: boolean;
}

export default function ProductForm({ initialData, isEdit }: ProductFormProps) {
  const router = useRouter();
  const { token } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const t = useTranslations('Admin.productForm');

  // Form State
  const [titleEn, setTitleEn] = useState('');
  const [titleZh, setTitleZh] = useState('');
  const [descEn, setDescEn] = useState('');
  const [descZh, setDescZh] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [categoryId, setCategoryId] = useState(''); 
  const [images, setImages] = useState(''); 
  const [isPublished, setIsPublished] = useState(false);
  
  // Attribute Management
  const [availableAttributes, setAvailableAttributes] = useState<any[]>([]);
  const [selectedAttributes, setSelectedAttributes] = useState<any[]>([]); // Array of attribute objects
  const [selectedValues, setSelectedValues] = useState<{[key: string]: string[]}>({}); // attributeId -> valueIds[]

  const [skus, setSkus] = useState<any[]>([
    { skuCode: '', color: '', size: '', price: '', stock: 0, moq: 1 }
  ]);
  
  const [tierDialogOpen, setTierDialogOpen] = useState(false);
  const [currentSkuIndex, setCurrentSkuIndex] = useState<number | null>(null);

  // Helper to safely parse localized strings
  const safeParseLocalized = (str: string) => {
    if (!str) return { en: '', zh: '' };
    try {
      const parsed = JSON.parse(str);
      // If valid object
      if (typeof parsed === 'object' && parsed !== null) {
        return { en: parsed.en || '', zh: parsed.zh || '' };
      }
      // If it's a primitive string after parse
      return { en: String(parsed), zh: '' };
    } catch (e) {
      // Not valid JSON, treat as plain string (legacy data)
      return { en: str, zh: '' };
    }
  };

  useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    // Fetch attributes
    fetch(`${API_URL}/attributes`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => setAvailableAttributes(data))
    .catch(err => console.error("Failed to fetch attributes", err));

    if (initialData) {
        try {
          const title = safeParseLocalized(initialData.title);
          const desc = safeParseLocalized(initialData.description);
          
          let imgs: string[] = [];
          try {
            const parsedImgs = JSON.parse(initialData.images || '[]');
            imgs = Array.isArray(parsedImgs) ? parsedImgs : [];
          } catch {
            // Fallback for legacy plain string
            if (initialData.images) imgs = [initialData.images];
          }
          
          setTitleEn(title.en);
          setTitleZh(title.zh);
          setDescEn(desc.en);
          setDescZh(desc.zh);
          setBasePrice(initialData.basePrice || '');
          setCategoryId(initialData.categoryId || '');
          setImages(imgs.join('\n'));
          setIsPublished(initialData.isPublished || false);

          // Restore Attributes
          if (initialData.attributes && initialData.attributes.length > 0) {
            const attrs = initialData.attributes.map((pa: any) => pa.attribute);
            setSelectedAttributes(attrs);
            
            // Restore Values from SKUs
            const valuesMap: {[key: string]: Set<string>} = {};
            initialData.skus.forEach((sku: any) => {
              sku.attributeValues.forEach((sav: any) => {
                const attrId = sav.attributeValue.attributeId;
                if (!valuesMap[attrId]) valuesMap[attrId] = new Set();
                valuesMap[attrId].add(sav.attributeValue.id);
              });
            });

            const restoredValues: {[key: string]: string[]} = {};
            Object.keys(valuesMap).forEach(k => {
              restoredValues[k] = Array.from(valuesMap[k]);
            });
            setSelectedValues(restoredValues);
          }

          if (initialData.skus && initialData.skus.length > 0) {
            setSkus(initialData.skus.map((s: any) => {
              // const specs = JSON.parse(s.specs || '{}');
              return {
                skuCode: s.skuCode,
                // color: specs.color || '',
                // size: specs.size || '',
                specs: s.specs,
                price: s.price,
                tierPrices: s.tierPrices || '', // Restore tierPrices
                stock: s.stock,
                moq: s.moq,
                attributeValueIds: s.attributeValues.map((sav: any) => sav.attributeValueId)
              };
            }));
          }
        } catch (e) {
          console.error("Error parsing initial data", e);
        }
      }
  }, [initialData]);

  // Attribute Logic
  const handleAttributeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const attrId = e.target.value;
    if (!attrId) return;
    
    const attr = availableAttributes.find(a => a.id === attrId);
    if (attr && !selectedAttributes.find(sa => sa.id === attrId)) {
      setSelectedAttributes([...selectedAttributes, attr]);
      setSelectedValues(prev => ({ ...prev, [attrId]: [] }));
    }
    e.target.value = ''; // Reset select
  };

  const removeAttribute = (attrId: string) => {
    setSelectedAttributes(selectedAttributes.filter(a => a.id !== attrId));
    const newValues = { ...selectedValues };
    delete newValues[attrId];
    setSelectedValues(newValues);
  };

  const toggleValue = (attrId: string, valueId: string) => {
    const current = selectedValues[attrId] || [];
    const updated = current.includes(valueId)
      ? current.filter(id => id !== valueId)
      : [...current, valueId];
    
    setSelectedValues({ ...selectedValues, [attrId]: updated });
  };

  const generateSkus = () => {
    // Cartesian product of selected values
    const attrs = selectedAttributes.filter(attr => (selectedValues[attr.id] || []).length > 0);
    
    if (attrs.length === 0) {
      alert("Please select at least one attribute and value");
      return;
    }

    const cartesian = (a: any[], b: any[]) => [].concat(...a.map((d: any) => b.map((e: any) => [].concat(d, e))) as any);
    
    // Get array of value objects for each attribute
    const valueArrays = attrs.map(attr => {
      const selectedIds = selectedValues[attr.id];
      return attr.values.filter((v: any) => selectedIds.includes(v.id)).map((v: any) => ({
        ...v,
        attrCode: attr.code,
        attrName: attr.name
      }));
    });

    let combinations: any[] = valueArrays[0];
    for (let i = 1; i < valueArrays.length; i++) {
      combinations = cartesian(combinations, valueArrays[i]);
    }

    // Generate SKUs
    const newSkus = combinations.map((combo: any) => {
      // combo can be single object (if 1 attr) or array of objects
      const values = Array.isArray(combo) ? combo : [combo];
      
      // Generate spec string and code
      const specObj: any = {};
      const codes: string[] = [];
      const valueIds: string[] = [];
      
      values.forEach((v: any) => {
        const attrName = JSON.parse(v.attrName).en;
        const valName = JSON.parse(v.value).en;
        specObj[attrName.toLowerCase()] = valName; // Legacy support
        codes.push(valName.toUpperCase().substring(0, 3));
        valueIds.push(v.id);
      });

      // Simple SKU Code Gen
      const skuCode = `${codes.join('-')}-${Math.floor(Math.random() * 1000)}`;

      return {
        skuCode,
        specs: JSON.stringify(specObj), // Legacy display
        attributeValueIds: valueIds, // New relation
        price: basePrice || 0,
        tierPrices: '', // Default empty
        stock: 0,
        moq: 1,
        // Helper for display
        _displaySpecs: values.map((v: any) => JSON.parse(v.value).en).join(' / ')
      };
    });

    setSkus(newSkus);
  };

  const handleAddSku = () => {
    setSkus([...skus, { skuCode: '', specs: '', price: basePrice, tierPrices: '', stock: 0, moq: 1 }]);
  };

  const handleRemoveSku = (index: number) => {
    setSkus(skus.filter((_, i) => i !== index));
  };

  const handleSkuChange = (index: number, field: string, value: any) => {
    const newSkus = [...skus];
    newSkus[index][field] = value;
    setSkus(newSkus);
  };

  const openTierDialog = (index: number) => {
    setCurrentSkuIndex(index);
    setTierDialogOpen(true);
  };

  const handleTierSave = (value: string) => {
    if (currentSkuIndex !== null) {
      handleSkuChange(currentSkuIndex, 'tierPrices', value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side Validation
    const skuCodes = skus.map(s => (s.skuCode || '').trim());
    if (skuCodes.some(c => !c)) {
      alert("Please ensure all SKUs have a valid SKU Code.");
      return;
    }
    
    const uniqueCodes = new Set(skuCodes);
    if (uniqueCodes.size !== skuCodes.length) {
      alert("Duplicate SKU Codes detected in the list. Each SKU must be unique.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        categoryId: categoryId, 
        title: JSON.stringify({ en: titleEn, zh: titleZh }),
        description: JSON.stringify({ en: descEn, zh: descZh }),
        images: JSON.stringify(images.split('\n').filter(url => url.trim() !== '')),
        basePrice: parseFloat(basePrice),
        specsTemplate: JSON.stringify({}), 
        isPublished,
        attributeIds: selectedAttributes.map(a => a.id),
        skus: skus.map(s => ({
          skuCode: s.skuCode,
          specs: s.specs || JSON.stringify({}),
          price: parseFloat(s.price) || 0,
          tierPrices: s.tierPrices, // Pass through
          stock: parseInt(s.stock) || 0,
          moq: parseInt(s.moq) || 1,
          attributeValueIds: s.attributeValueIds
        }))
      };

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const url = isEdit 
        ? `${API_URL}/products/${initialData.id}`
        : `${API_URL}/products`;
      
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to save product');
      }

      router.push('/admin/products');
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl mx-auto pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/products" className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold">{isEdit ? t('editTitle') : t('createTitle')}</h1>
        </div>
        <div className="flex items-center gap-3">
            <button
                type="button"
                onClick={() => router.push('/admin/products')}
                className="px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
                {t('cancel')}
            </button>
            <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-6 py-2 bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900 rounded-md hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors text-sm font-medium disabled:opacity-50"
            >
                <Save className="w-4 h-4" />
                {isSubmitting ? t('saving') : t('save')}
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 space-y-4">
            <h3 className="font-semibold text-lg">{t('generalInfo')}</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('titleEn')}</label>
                <input 
                  value={titleEn}
                  onChange={e => setTitleEn(e.target.value)}
                  className="w-full px-3 py-2 bg-transparent border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  placeholder="e.g. Hiking Boots (Auto-translate)"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('titleZh')}</label>
                <input 
                  value={titleZh}
                  onChange={e => setTitleZh(e.target.value)}
                  className="w-full px-3 py-2 bg-transparent border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  placeholder="例如 登山靴 (自动翻译)"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('descEn')}</label>
              <textarea 
                rows={3}
                value={descEn}
                onChange={e => setDescEn(e.target.value)}
                className="w-full px-3 py-2 bg-transparent border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-900"
                placeholder="Auto-translated if empty"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('descZh')}</label>
              <textarea 
                rows={3}
                value={descZh}
                onChange={e => setDescZh(e.target.value)}
                className="w-full px-3 py-2 bg-transparent border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-900"
                placeholder="如果留空将自动翻译"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">{t('basePrice')}</label>
                    <input 
                    type="number"
                    step="0.01"
                    required
                    value={basePrice}
                    onChange={e => setBasePrice(e.target.value)}
                    className="w-full px-3 py-2 bg-transparent border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">{t('categoryId')}</label>
                    <input 
                    required
                    value={categoryId}
                    onChange={e => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 bg-transparent border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    placeholder="UUID"
                    />
                    <p className="text-xs text-zinc-500">{t('categoryIdHelp')}</p>
                </div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 space-y-4">
            <h3 className="font-semibold text-lg">{t('variants')}</h3>
            
            {/* Attribute Selection Area */}
            <div className="border-b border-zinc-200 dark:border-zinc-800 pb-6 mb-6">
              <div className="flex gap-4 mb-4">
                <select 
                  className="px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md"
                  onChange={handleAttributeSelect}
                  defaultValue=""
                >
                  <option value="" disabled>Select Attribute to Add...</option>
                  {availableAttributes.map(attr => (
                    <option key={attr.id} value={attr.id}>
                      {JSON.parse(attr.name).en} ({attr.code})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={generateSkus}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                >
                  Generate SKUs
                </button>
              </div>

              <div className="space-y-4">
                {selectedAttributes.map(attr => (
                  <div key={attr.id} className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-md">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium">{JSON.parse(attr.name).en}</h4>
                      <button 
                        type="button" 
                        onClick={() => removeAttribute(attr.id)}
                        className="text-zinc-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {attr.values.map((val: any) => {
                        const isSelected = (selectedValues[attr.id] || []).includes(val.id);
                        return (
                          <button
                            key={val.id}
                            type="button"
                            onClick={() => toggleValue(attr.id, val.id)}
                            className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                              isSelected 
                                ? 'bg-blue-100 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300' 
                                : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-400'
                            }`}
                          >
                            {JSON.parse(val.value).en}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm text-zinc-500">Generated SKUs</h4>
                <button
                    type="button"
                    onClick={handleAddSku}
                    className="text-sm text-blue-600 hover:text-blue-500 font-medium flex items-center gap-1"
                >
                    <Plus className="w-4 h-4" />
                    {t('addVariant')}
                </button>
            </div>
            
            <div className="space-y-3">
                {skus.map((sku, idx) => (
                    <div key={idx} className="flex gap-3 items-start p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-md">
                        <div className="grid grid-cols-6 gap-3 flex-1">
                            <div className="col-span-2 space-y-1">
                                <label className="text-xs text-zinc-500">{t('skuCode')}</label>
                                <input 
                                    value={sku.skuCode}
                                    onChange={e => handleSkuChange(idx, 'skuCode', e.target.value)}
                                    placeholder="e.g. HB-RED-40"
                                    className="w-full px-2 py-1.5 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded"
                                />
                            </div>
                            <div className="col-span-2 space-y-1">
                                <label className="text-xs text-zinc-500">Specs</label>
                                <div className="px-2 py-1.5 text-sm text-zinc-600 dark:text-zinc-400">
                                  {sku._displaySpecs || (sku.specs ? (() => {
                                    try {
                                      const parsed = JSON.parse(sku.specs);
                                      return Object.values(parsed).join(' / ');
                                    } catch {
                                      return sku.specs; // Fallback to raw string
                                    }
                                  })() : 'Custom')}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-zinc-500">{t('price')}</label>
                                <input 
                                    type="number"
                                    value={sku.price}
                                    onChange={e => handleSkuChange(idx, 'price', e.target.value)}
                                    className="w-full px-2 py-1.5 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded"
                                />
                            </div>
                            <div className="space-y-1 col-span-2">
                                <label className="text-xs text-zinc-500">Volume Pricing</label>
                                <button
                                    type="button"
                                    onClick={() => openTierDialog(idx)}
                                    className="w-full px-2 py-1.5 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded text-left flex items-center justify-between hover:border-blue-500 transition-colors group"
                                >
                                    <span className="truncate text-zinc-600 dark:text-zinc-400">
                                    {sku.tierPrices && sku.tierPrices !== '[]' && sku.tierPrices !== ''
                                        ? (() => {
                                            try {
                                                const len = JSON.parse(sku.tierPrices).length;
                                                return len > 0 ? `${len} Tier${len > 1 ? 's' : ''} Set` : 'Configure';
                                            } catch { return 'Configure'; }
                                        })()
                                        : 'Configure'}
                                    </span>
                                    <Layers className="w-4 h-4 text-zinc-400 group-hover:text-blue-500" />
                                </button>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-zinc-500">{t('stock')}</label>
                                <input 
                                    type="number"
                                    value={sku.stock}
                                    onChange={e => handleSkuChange(idx, 'stock', e.target.value)}
                                    className="w-full px-2 py-1.5 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded"
                                />
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => handleRemoveSku(idx)}
                            className="mt-6 p-1.5 text-zinc-400 hover:text-red-600 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 space-y-4">
            <h3 className="font-semibold text-lg">{t('status')}</h3>
            <div className="flex items-center gap-2">
                <input 
                    type="checkbox"
                    id="isPublished"
                    checked={isPublished}
                    onChange={e => setIsPublished(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                />
                <label htmlFor="isPublished" className="text-sm font-medium">{t('published')}</label>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 space-y-4">
            <h3 className="font-semibold text-lg">{t('images')}</h3>
            <div className="space-y-2">
                <label className="text-sm font-medium">{t('imageUrls')}</label>
                <textarea 
                    rows={5}
                    value={images}
                    onChange={e => setImages(e.target.value)}
                    placeholder="https://example.com/image1.jpg"
                    className="w-full px-3 py-2 bg-transparent border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-900 text-sm font-mono"
                />
                <p className="text-xs text-zinc-500">{t('imageHelp')}</p>
            </div>
          </div>
        </div>
      </div>
      <TierPriceDialog 
        isOpen={tierDialogOpen}
        onClose={() => setTierDialogOpen(false)}
        initialValue={currentSkuIndex !== null ? skus[currentSkuIndex]?.tierPrices || '' : ''}
        onSave={handleTierSave}
      />
    </form>
  );
}
