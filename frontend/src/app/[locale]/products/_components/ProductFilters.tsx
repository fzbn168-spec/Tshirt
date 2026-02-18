
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, SlidersHorizontal, X, RotateCcw } from 'lucide-react';
import { useDebounce } from 'use-debounce';
import api from '@/lib/api';

interface Category {
  id: string;
  name: string; // JSON string
}

interface Attribute {
  id: string;
  name: string; // JSON string
  code: string;
  values: { id: string; value: string }[];
}

export function ProductFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State from URL
  const initialSearch = searchParams.get('search') || '';
  const initialCategory = searchParams.get('categoryId') || '';
  const initialMinPrice = searchParams.get('minPrice') || '';
  const initialMaxPrice = searchParams.get('maxPrice') || '';

  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch] = useDebounce(search, 500);
  
  const [categoryId, setCategoryId] = useState(initialCategory);
  const [minPrice, setMinPrice] = useState(initialMinPrice);
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice);
  const [debouncedMinPrice] = useDebounce(minPrice, 500);
  const [debouncedMaxPrice] = useDebounce(maxPrice, 500);

  // Data State
  const [categories, setCategories] = useState<Category[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);

  // Fetch Data
  useEffect(() => {
    api.get('/products/categories')
      .then(res => {
        const data = res.data;
        setCategories(Array.isArray(data) ? data : []);
      })
      .catch(err => console.error('Failed to fetch categories', err));

    api.get('/attributes')
      .then(res => {
        const data = res.data;
        setAttributes(Array.isArray(data) ? data : []);
      })
      .catch(err => console.error('Failed to fetch attributes', err));
  }, []);

  const selectedAttributes: Record<string, string[]> = (() => {
    const attrStr = searchParams.get('attributes');
    if (!attrStr) return {};
    try {
      const obj = JSON.parse(attrStr);
      return typeof obj === 'object' && obj ? obj : {};
    } catch {
      return {};
    }
  })();

  // Handle Attribute Toggle
  const toggleAttribute = (attrId: string, valueId: string) => {
    const current = selectedAttributes[attrId] || [];
    const isSelected = current.includes(valueId);
    let nextForAttr: string[];
    if (isSelected) {
      nextForAttr = current.filter(id => id !== valueId);
    } else {
      nextForAttr = [...current, valueId];
    }
    const next: Record<string, string[]> = { ...selectedAttributes };
    if (nextForAttr.length === 0) {
      delete next[attrId];
    } else {
      next[attrId] = nextForAttr;
    }
    const params = new URLSearchParams(searchParams.toString());
    if (Object.keys(next).length > 0) {
      params.set('attributes', JSON.stringify(next));
    } else {
      params.delete('attributes');
    }
    if (params.toString() !== searchParams.toString()) {
      router.push(`?${params.toString()}`);
    }
  };

  // Sync URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (debouncedSearch) params.set('search', debouncedSearch);
    else params.delete('search');

    if (categoryId) params.set('categoryId', categoryId);
    else params.delete('categoryId');

    if (debouncedMinPrice) params.set('minPrice', debouncedMinPrice);
    else params.delete('minPrice');

    if (debouncedMaxPrice) params.set('maxPrice', debouncedMaxPrice);
    else params.delete('maxPrice');

    if (params.toString() !== searchParams.toString()) {
      router.push(`?${params.toString()}`);
    }
  }, [debouncedSearch, categoryId, debouncedMinPrice, debouncedMaxPrice, router, searchParams]);

  const parseJson = (str: string) => {
    try {
      const obj = JSON.parse(str);
      return obj.en || obj.zh || str;
    } catch {
      return str;
    }
  };

  const hasActiveFilters = search || categoryId || minPrice || maxPrice || Object.keys(selectedAttributes).length > 0;

  const clearFilters = () => {
    setSearch('');
    setCategoryId('');
    setMinPrice('');
    setMaxPrice('');
    const params = new URLSearchParams(searchParams.toString());
    params.delete('search');
    params.delete('categoryId');
    params.delete('minPrice');
    params.delete('maxPrice');
    params.delete('attributes');
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="space-y-8 sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2 custom-scrollbar">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5" /> Filters
        </h3>
        {hasActiveFilters && (
          <button 
            onClick={clearFilters}
            className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1 font-medium transition-colors"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        )}
      </div>
      
      {/* Search */}
      <div>
        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 block">Keywords</label>
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-blue-500 transition-colors" />
          <input 
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-10 pr-8 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
          />
          {search && (
            <button 
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-0.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Categories */}
      <div>
        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 block">Category</label>
        <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
          <label className={`flex items-center gap-3 cursor-pointer p-2 rounded-lg transition-colors ${categoryId === '' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}>
            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${categoryId === '' ? 'border-blue-600 bg-blue-600' : 'border-zinc-300 dark:border-zinc-600'}`}>
              {categoryId === '' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
            </div>
            <input 
              type="radio" 
              name="category"
              checked={categoryId === ''}
              onChange={() => setCategoryId('')}
              className="hidden"
            />
            <span className="text-sm font-medium">All Categories</span>
          </label>
          {categories.map(cat => (
            <label key={cat.id} className={`flex items-center gap-3 cursor-pointer p-2 rounded-lg transition-colors ${categoryId === cat.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}>
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${categoryId === cat.id ? 'border-blue-600 bg-blue-600' : 'border-zinc-300 dark:border-zinc-600'}`}>
                {categoryId === cat.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
              <input 
                type="radio" 
                name="category"
                checked={categoryId === cat.id}
                onChange={() => setCategoryId(cat.id)}
                className="hidden"
              />
              <span className="text-sm font-medium">{parseJson(cat.name)}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 block">Price Range ($)</label>
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs">$</span>
            <input 
              type="number"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="Min"
              className="w-full pl-6 pr-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
            />
          </div>
          <span className="text-zinc-400 font-medium">-</span>
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs">$</span>
            <input 
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="Max"
              className="w-full pl-6 pr-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
            />
          </div>
        </div>
      </div>

      {/* Attributes */}
      {attributes.length > 0 && (
        <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4 block">Attributes</label>
          <div className="space-y-6">
            {attributes.map(attr => (
              <div key={attr.id}>
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2.5 block">{parseJson(attr.name)}</span>
                <div className="flex flex-wrap gap-2">
                  {attr.values.slice(0, 12).map(val => {
                    const isSelected = selectedAttributes[attr.id]?.includes(val.id);
                    return (
                      <button
                        key={val.id}
                        onClick={() => toggleAttribute(attr.id, val.id)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all
                          ${isSelected 
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                            : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                          }`}
                      >
                        {parseJson(val.value)}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
