
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { ArrowLeft, Save, Loader2, Plus, Trash2, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';
import api from '@/lib/axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToastStore } from '@/store/useToastStore';
import AttributeSelector from './AttributeSelector';
import SkuMatrix, { SkuRow } from './SkuMatrix';
import { FileUpload } from '@/components/FileUpload';

const MATERIAL_OPTIONS = {
  upper: ['Genuine Leather', 'PU Leather', 'Mesh', 'Canvas', 'Suede', 'Microfiber', 'Synthetic', 'Flyknit'],
  lining: ['Mesh', 'Pigskin', 'Fabric', 'PU', 'Fur', 'None', 'Cotton'],
  outsole: ['Rubber', 'EVA', 'TPU', 'TPR', 'Phylon', 'Leather', 'MD']
};

interface ProductEditorProps {
  initialData?: any;
  mode: 'create' | 'edit';
}

export default function ProductEditor({ initialData, mode }: ProductEditorProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    basePrice: '',
    categoryId: '',
    sizeChartId: '',
    sizeChartImage: '', // Alternative to sizeChartId
    skuCode: '', // For simple single-SKU creation
    moq: '1',
    fakeSoldCount: '0',
    images: [] as string[],
    // New Fields
    materialDetail: { upper: '', lining: '', outsole: '' },
    originCountry: 'China',
    loadingPort: 'Xiamen',
    season: '',
    // Packing Info (for default SKU)
    itemsPerCarton: '',
    netWeight: '',
    grossWeight: '',
    length: '',
    width: '',
    height: '',
    cartonLength: '',
    cartonWidth: '',
    cartonHeight: '',
    cartonGrossWeight: '',
  });

  // Attribute & SKU State
  const [selectedAttributes, setSelectedAttributes] = useState<any[]>([]);
  const [generatedSkus, setGeneratedSkus] = useState<SkuRow[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');

  useEffect(() => {
    if (initialData) {
      let mat = { upper: '', lining: '', outsole: '' };
      try {
        if (initialData.materialDetail) mat = JSON.parse(initialData.materialDetail);
      } catch (e) {}

      let imgs = [];
      try {
        imgs = JSON.parse(initialData.images || '[]');
      } catch (e) {}

      setFormData({
        title: initialData.title ? JSON.parse(initialData.title).en : '',
        description: initialData.description ? JSON.parse(initialData.description).en : '',
        basePrice: initialData.basePrice || '',
        categoryId: initialData.categoryId || '',
        sizeChartId: initialData.sizeChartId || '',
        sizeChartImage: initialData.sizeChartImage || '',
        skuCode: initialData.skus?.[0]?.skuCode || '',
        moq: initialData.skus?.[0]?.moq?.toString() || '1',
        fakeSoldCount: initialData.fakeSoldCount?.toString() || '0',
        images: imgs,
        materialDetail: mat,
        originCountry: initialData.originCountry || 'China',
        loadingPort: initialData.loadingPort || 'Xiamen',
        season: initialData.season || '',
        itemsPerCarton: initialData.skus?.[0]?.itemsPerCarton?.toString() || '',
        netWeight: initialData.skus?.[0]?.netWeight?.toString() || '',
        grossWeight: initialData.skus?.[0]?.grossWeight?.toString() || '',
        length: initialData.skus?.[0]?.length?.toString() || '',
        width: initialData.skus?.[0]?.width?.toString() || '',
        height: initialData.skus?.[0]?.height?.toString() || '',
        cartonLength: initialData.skus?.[0]?.cartonLength?.toString() || '',
        cartonWidth: initialData.skus?.[0]?.cartonWidth?.toString() || '',
        cartonHeight: initialData.skus?.[0]?.cartonHeight?.toString() || '',
        cartonGrossWeight: initialData.skus?.[0]?.cartonGrossWeight?.toString() || '',
      });

      // Reconstruct Attributes & SKUs for Edit Mode
      if (initialData.attributes && initialData.attributes.length > 0 && initialData.skus && initialData.skus.length > 0) {
         try {
           // 1. Reconstruct Selected Attributes
           // We need to group values by attribute from the SKUs, as ProductAttribute doesn't store selected values
           const attrValueMap = new Map<string, Set<string>>(); // attrId -> Set<JSON-stringified-value>
           
           initialData.skus.forEach((sku: any) => {
              sku.attributeValues.forEach((av: any) => {
                 const attrId = av.attributeValue.attributeId;
                 if (!attrValueMap.has(attrId)) {
                    attrValueMap.set(attrId, new Set());
                 }
                 attrValueMap.get(attrId)?.add(JSON.stringify(av.attributeValue));
              });
           });

           const reconstructedAttrs = initialData.attributes.map((pa: any) => {
              const attr = pa.attribute;
              const valueSet = attrValueMap.get(attr.id) || new Set();
              const values = Array.from(valueSet).map((v: string) => JSON.parse(v));
              
              return {
                 attributeId: attr.id,
                 attributeName: JSON.parse(attr.name).en || attr.code,
                 attributeCode: attr.code,
                 selectedValues: values
              };
           });
           setSelectedAttributes(reconstructedAttrs);

           // 2. Reconstruct SKU Matrix Rows
           const reconstructedSkus = initialData.skus.map((sku: any) => {
               const key = sku.attributeValues
                  .map((av: any) => av.attributeValue.id)
                  .sort()
                  .join('-');
               
               return {
                  id: sku.id, // Keep ID for updates
                  key,
                  skuCode: sku.skuCode,
                  price: sku.price.toString(),
                  stock: sku.stock.toString(),
                  moq: sku.moq.toString(),
                  imageUrl: sku.image || '',
                  attributes: sku.attributeValues.map((av: any) => {
                     const attrId = av.attributeValue.attributeId;
                     const pa = initialData.attributes.find((p: any) => p.attributeId === attrId);
                     const attrName = pa ? (JSON.parse(pa.attribute.name).en || pa.attribute.code) : 'Variant';

                     return {
                       attributeId: attrId,
                       attributeName: attrName,
                       valueId: av.attributeValue.id,
                       valueName: JSON.parse(av.attributeValue.value).en || 'Value'
                     };
                  })
               };
           });
           setGeneratedSkus(reconstructedSkus);
         } catch (err) {
           console.error("Failed to reconstruct attributes/SKUs", err);
         }
      }
    }
  }, [initialData]);

  // Fetch Categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        const res = await api.get('/products/categories');
        return res.data; 
      } catch (e) {
        return [];
      }
    },
  });

  // Fetch Size Charts
  const { data: sizeCharts } = useQuery({
    queryKey: ['size-charts'],
    queryFn: async () => {
      const res = await api.get('/size-charts');
      return res.data;
    },
  });

  const mutation = useMutation({
    mutationFn: async (payload: any) => {
      // Transform payload for backend
      const submitData: any = {
        title: JSON.stringify({ en: payload.title }),
        description: JSON.stringify({ en: payload.description }),
        basePrice: Number(payload.basePrice),
        categoryId: payload.categoryId, // UUID required
        sizeChartId: payload.sizeChartId || undefined,
        sizeChartImage: payload.sizeChartImage || undefined,
        images: JSON.stringify(payload.images),
        specsTemplate: JSON.stringify({}),
        fakeSoldCount: Number(payload.fakeSoldCount),
        // New Fields
        materialDetail: JSON.stringify(payload.materialDetail),
        originCountry: payload.originCountry,
        loadingPort: payload.loadingPort,
        season: payload.season,
      };

      // Packing Data
      const packingData = {
        itemsPerCarton: payload.itemsPerCarton ? Number(payload.itemsPerCarton) : undefined,
        netWeight: payload.netWeight ? Number(payload.netWeight) : undefined,
        grossWeight: payload.grossWeight ? Number(payload.grossWeight) : undefined,
        // Use unified L/W/H for packaging (compatible with PL generation)
        length: payload.length ? Number(payload.length) : (payload.cartonLength ? Number(payload.cartonLength) : undefined),
        width: payload.width ? Number(payload.width) : (payload.cartonWidth ? Number(payload.cartonWidth) : undefined),
        height: payload.height ? Number(payload.height) : (payload.cartonHeight ? Number(payload.cartonHeight) : undefined),
        cartonLength: payload.cartonLength ? Number(payload.cartonLength) : undefined,
        cartonWidth: payload.cartonWidth ? Number(payload.cartonWidth) : undefined,
        cartonHeight: payload.cartonHeight ? Number(payload.cartonHeight) : undefined,
        cartonGrossWeight: payload.cartonGrossWeight ? Number(payload.cartonGrossWeight) : undefined,
      };

      // Determine SKUs: Matrix vs Simple
      let skusToSubmit: any[] = [];
      if (generatedSkus.length > 0) {
        // Use generated matrix
        skusToSubmit = generatedSkus.map((sku) => {
          const baseSku = {
            skuCode: sku.skuCode,
            price: Number(sku.price),
            moq: Number(sku.moq),
            stock: Number(sku.stock),
            image: sku.imageUrl || undefined,
            specs: JSON.stringify({}),
            attributeValueIds: sku.attributes.map((a) => a.valueId),
            ...packingData,
          };

          // Preserve existing SKU id when editing
          if (mode === 'edit' && (sku as any).id) {
            return {
              id: (sku as any).id,
              ...baseSku,
            };
          }

          return baseSku;
        });
      } else {
        // Use simple single SKU
        skusToSubmit = [
          {
            skuCode: payload.skuCode,
            price: Number(payload.basePrice),
            moq: Number(payload.moq),
            stock: 100,
            specs: JSON.stringify({}),
            ...packingData,
          },
        ];
      }

      // Map selected attributes to backend format
      const attributeIds =
        selectedAttributes.length > 0
          ? selectedAttributes.map((a) => a.attributeId)
          : undefined;

      submitData.attributeIds = attributeIds;
      submitData.skus = skusToSubmit;

      if (mode === 'create') {
        return api.post('/products', submitData);
      } else {
        return api.patch(`/products/${initialData.id}`, submitData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      addToast(`Product ${mode === 'create' ? 'created' : 'updated'} successfully`, 'success');
      router.push('/dashboard/products');
    },
    onError: (error: any) => {
      addToast(error.response?.data?.message || 'Something went wrong', 'error');
    },
  });

  const handleSubmit = () => {
    if (!formData.title || !formData.basePrice) {
      addToast('Please fill in title and base price', 'error');
      return;
    }
    if (generatedSkus.length === 0 && !formData.skuCode) {
      addToast('Please either add Attributes or set a SKU Code', 'error');
      return;
    }
    mutation.mutate(formData);
  };

  const addImage = (url: string) => {
    if (!url) return;
    setFormData({ ...formData, images: [...formData.images, url] });
    setNewImageUrl('');
  };

  const removeImage = (index: number) => {
    const newImages = [...formData.images];
    newImages.splice(index, 1);
    setFormData({ ...formData, images: newImages });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">{mode === 'create' ? 'New Product' : 'Edit Product'}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Main Info */}
        <div className="lg:col-span-2 space-y-6">
           <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-6">
              <h2 className="font-semibold text-lg">Basic Information</h2>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Product Title (EN)</label>
                  <Input 
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Men's Casual Sneaker"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Description (EN)</label>
                  <textarea 
                    className="flex w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300 min-h-[100px]"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Product description..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Base Price (USD)</label>
                  <Input 
                    type="number"
                    value={formData.basePrice}
                    onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select 
                    className="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300"
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  >
                    <option value="">Select Category</option>
                    {categories?.map((cat: any) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name ? (JSON.parse(cat.name).en || 'Category') : 'Category'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
           </div>

           {/* Attributes & SKU Matrix */}
           <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-6">
              <h2 className="font-semibold text-lg">Variants & Inventory</h2>
              
              <AttributeSelector 
                initialAttributes={selectedAttributes}
                onChange={setSelectedAttributes}
              />

              <SkuMatrix 
                attributes={selectedAttributes}
                baseProductCode={formData.skuCode}
                basePrice={formData.basePrice}
                onChange={setGeneratedSkus}
                initialSkus={generatedSkus}
              />
              
              {selectedAttributes.length === 0 && (
                <div className="bg-zinc-50 dark:bg-zinc-800 p-4 rounded border border-zinc-200 dark:border-zinc-800">
                    <label className="block text-sm font-medium mb-1">Single SKU Code</label>
                    <Input 
                      value={formData.skuCode}
                      onChange={(e) => setFormData({ ...formData, skuCode: e.target.value })}
                      placeholder="e.g. SNK-001"
                    />
                    <p className="text-xs text-zinc-500 mt-1">
                      Use this if the product has no variants (no color/size options).
                    </p>
                </div>
              )}
           </div>

           {/* Material Details */}
           <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-6">
              <h2 className="font-semibold text-lg">Material Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(Object.keys(MATERIAL_OPTIONS) as Array<keyof typeof MATERIAL_OPTIONS>).map((key) => (
                  <div key={key}>
                    <label className="block text-sm font-medium mb-1 capitalize">{key} Material</label>
                    <Input 
                      list={`material-options-${key}`}
                      value={formData.materialDetail[key]}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        materialDetail: { ...formData.materialDetail, [key]: e.target.value } 
                      })}
                      placeholder={`Select or type ${key}...`}
                    />
                    <datalist id={`material-options-${key}`}>
                      {MATERIAL_OPTIONS[key].map((opt) => (
                        <option key={opt} value={opt} />
                      ))}
                    </datalist>
                  </div>
                ))}
              </div>
           </div>

           {/* Trade & Logistics */}
           <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-6">
              <h2 className="font-semibold text-lg">Trade & Logistics</h2>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1">Origin Country</label>
                  <Input 
                    value={formData.originCountry}
                    onChange={(e) => setFormData({ ...formData, originCountry: e.target.value })}
                    placeholder="e.g. China"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Loading Port</label>
                  <Input 
                    value={formData.loadingPort}
                    onChange={(e) => setFormData({ ...formData, loadingPort: e.target.value })}
                    placeholder="e.g. Xiamen"
                  />
                </div>

                <div className="col-span-2">
                  <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded border border-zinc-100 dark:border-zinc-800">
                    <div className="text-sm font-medium mb-3">Packing / Boxing (Default for SKUs)</div>
                    <div className="grid grid-cols-4 gap-4">
                       <div>
                         <label className="block text-xs mb-1">Items / Carton</label>
                         <Input 
                           type="number"
                           value={formData.itemsPerCarton}
                           onChange={(e) => setFormData({ ...formData, itemsPerCarton: e.target.value })}
                           placeholder="e.g. 12"
                         />
                       </div>
                       <div>
                         <label className="block text-xs mb-1">Unit N.W (kg)</label>
                         <Input 
                           type="number"
                           value={formData.netWeight}
                           onChange={(e) => setFormData({ ...formData, netWeight: e.target.value })}
                           placeholder="e.g. 0.8"
                         />
                       </div>
                       <div>
                         <label className="block text-xs mb-1">Unit G.W (kg)</label>
                         <Input 
                           type="number"
                           value={formData.grossWeight}
                           onChange={(e) => setFormData({ ...formData, grossWeight: e.target.value })}
                           placeholder="e.g. 1.0"
                         />
                       </div>
                       <div />
                       <div className="col-span-4 grid grid-cols-4 gap-4">
                         <div>
                           <label className="block text-xs mb-1">Pkg Length (cm)</label>
                           <Input 
                             type="number"
                             value={formData.length}
                             onChange={(e) => setFormData({ ...formData, length: e.target.value })}
                             placeholder="L"
                           />
                         </div>
                         <div>
                           <label className="block text-xs mb-1">Pkg Width (cm)</label>
                           <Input 
                             type="number"
                             value={formData.width}
                             onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                             placeholder="W"
                           />
                         </div>
                         <div>
                           <label className="block text-xs mb-1">Pkg Height (cm)</label>
                           <Input 
                             type="number"
                             value={formData.height}
                             onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                             placeholder="H"
                           />
                         </div>
                         <div />
                       </div>
                        <div>
                          <label className="block text-xs mb-1">Length (cm)</label>
                          <Input 
                            type="number"
                            value={formData.cartonLength}
                            onChange={(e) => setFormData({ ...formData, cartonLength: e.target.value })}
                            placeholder="L"
                          />
                        </div>
                        <div>
                          <label className="block text-xs mb-1">Width (cm)</label>
                          <Input 
                            type="number"
                            value={formData.cartonWidth}
                            onChange={(e) => setFormData({ ...formData, cartonWidth: e.target.value })}
                            placeholder="W"
                          />
                        </div>
                        <div>
                          <label className="block text-xs mb-1">Height (cm)</label>
                          <Input 
                            type="number"
                            value={formData.cartonHeight}
                            onChange={(e) => setFormData({ ...formData, cartonHeight: e.target.value })}
                            placeholder="H"
                          />
                        </div>
                        <div>
                          <label className="block text-xs mb-1">G.W (kg)</label>
                          <Input 
                            type="number"
                            value={formData.cartonGrossWeight}
                            onChange={(e) => setFormData({ ...formData, cartonGrossWeight: e.target.value })}
                            placeholder="kg"
                          />
                        </div>
                     </div>
                   </div>
                </div>
              </div>
           </div>
        </div>

        {/* Right Column: Media & Meta */}
        <div className="space-y-6">
          {/* Images */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-4">
            <h2 className="font-semibold text-lg">Product Images</h2>
            
            <div className="space-y-3">
               <div className="flex gap-2">
                  <Input 
                    value={newImageUrl} 
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="Paste image URL..."
                    className="flex-1"
                  />
                  <Button size="sm" variant="secondary" onClick={() => addImage(newImageUrl)}>
                    <Plus className="h-4 w-4" />
                  </Button>
               </div>
               
               <div className="text-xs text-zinc-400 text-center">- OR -</div>

               <FileUpload 
                 onUpload={addImage}
                 label="Upload Image"
               />

               <div className="grid grid-cols-2 gap-2 mt-4">
                 {formData.images.map((img, idx) => (
                   <div key={idx} className="relative group aspect-square border rounded-md overflow-hidden bg-zinc-100">
                     <img src={img} alt="Product" className="w-full h-full object-cover" />
                     {idx === 0 && (
                        <div className="absolute top-0 left-0 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-br font-medium">
                          Main
                        </div>
                     )}
                     <button 
                       onClick={() => removeImage(idx)}
                       className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                     >
                       <Trash2 className="h-3 w-3" />
                     </button>
                   </div>
                 ))}
               </div>
            </div>
          </div>

          {/* Material Specs */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-4">
            <h2 className="font-semibold text-lg">Material Specifications</h2>
            
            {Object.entries(MATERIAL_OPTIONS).map(([key, options]) => (
              <div key={key}>
                <label className="block text-sm font-medium mb-1 capitalize">{key} Material</label>
                <div className="relative">
                  <Input 
                    value={(formData.materialDetail as any)[key]}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      materialDetail: { ...formData.materialDetail, [key]: e.target.value } 
                    })}
                    placeholder={`Select or type...`}
                    list={`list-${key}`}
                  />
                  <datalist id={`list-${key}`}>
                    {options.map(opt => (
                      <option key={opt} value={opt} />
                    ))}
                  </datalist>
                </div>
              </div>
            ))}
          </div>

          {/* Additional Settings */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-4">
            <h2 className="font-semibold text-lg">Settings</h2>

            <div>
              <label className="block text-sm font-medium mb-1">MOQ</label>
              <Input 
                type="number"
                value={formData.moq}
                onChange={(e) => setFormData({ ...formData, moq: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Virtual Sales</label>
              <Input 
                type="number"
                value={formData.fakeSoldCount}
                onChange={(e) => setFormData({ ...formData, fakeSoldCount: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Size Chart</label>
              <select 
                className="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm"
                value={formData.sizeChartId}
                onChange={(e) => setFormData({ ...formData, sizeChartId: e.target.value })}
              >
                <option value="">Select Size Chart</option>
                {sizeCharts?.map((sc: any) => (
                  <option key={sc.id} value={sc.id}>
                    {sc.name}
                  </option>
                ))}
              </select>
              
              <div className="mt-2 text-xs text-center text-zinc-500">- OR -</div>

              <div className="mt-2">
                 <label className="block text-sm font-medium mb-1">Upload Size Chart Image</label>
                 <FileUpload 
                   label="Upload Size Chart"
                   onUpload={(url) => setFormData({ ...formData, sizeChartImage: url })}
                 />
                 {formData.sizeChartImage && (
                    <div className="mt-2 relative group w-32 aspect-[3/4] border rounded-md overflow-hidden bg-zinc-100">
                      <img src={formData.sizeChartImage} alt="Size Chart" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => setFormData({ ...formData, sizeChartImage: '' })}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                 )}
              </div>
            </div>
          </div>

          <Button onClick={handleSubmit} disabled={mutation.isPending} className="w-full" size="lg">
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Save Product
          </Button>
        </div>
      </div>
    </div>
  );
}
