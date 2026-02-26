
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
import RichTextEditor from '@/components/RichTextEditor';

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
    singlePrice: '',
    singleStock: '',
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
        basePrice:
          initialData.skus && initialData.skus.length > 0
            ? String(
                Math.min(
                  ...initialData.skus.map((s: any) => Number(s.price) || 0),
                ),
              )
            : initialData.basePrice || '',
        singlePrice: initialData.skus?.[0]?.price?.toString() || '',
        singleStock: initialData.skus?.[0]?.stock?.toString() || '',
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

           const reconstructedSkus = initialData.skus.map((sku: any) => {
               const key = sku.attributeValues
                  .map((av: any) => av.attributeValue.id)
                  .sort()
                  .join('-');
               
               return {
                  id: sku.id,
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
      const submitData: any = {};
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
            price: Number(payload.singlePrice),
            moq: Number(payload.moq),
            stock: payload.singleStock ? Number(payload.singleStock) : 0,
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

      const basePriceFromSkus =
        skusToSubmit.length > 0
          ? Math.min(...skusToSubmit.map((s) => Number(s.price) || 0))
          : 0;

      submitData.title = JSON.stringify({ en: payload.title });
      submitData.description = JSON.stringify({ en: payload.description });
      submitData.basePrice = basePriceFromSkus;
      submitData.categoryId = payload.categoryId;
      submitData.sizeChartId = payload.sizeChartId || undefined;
      submitData.sizeChartImage = payload.sizeChartImage || undefined;
      submitData.images = JSON.stringify(payload.images);
      submitData.specsTemplate = JSON.stringify({});
      submitData.fakeSoldCount = Number(payload.fakeSoldCount);
      submitData.materialDetail = JSON.stringify(payload.materialDetail);
      submitData.originCountry = payload.originCountry;
      submitData.loadingPort = payload.loadingPort;
      submitData.season = payload.season;
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
    if (!formData.title) {
      addToast('Please fill in title', 'error');
      return;
    }
    if (generatedSkus.length === 0) {
      if (!formData.skuCode || !formData.singlePrice) {
        addToast('Please fill in SKU code and unit price', 'error');
        return;
      }
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

  const isVideo = (url: string) => {
    return url.match(/\.(mp4|webm|ogg)$/i);
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
              
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <Input 
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Men's Casual Sneaker"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <RichTextEditor 
                    value={formData.description}
                    onChange={(val) => setFormData({ ...formData, description: val })}
                    placeholder="Product description..."
                  />
                </div>
              </div>
           </div>

           {/* Media */}
           <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-4">
            <h2 className="font-semibold text-lg">Media</h2>
            <div className="space-y-4">
               <div className="grid grid-cols-4 gap-4">
                 {formData.images.map((img, idx) => (
                   <div key={idx} className="relative group aspect-square border rounded-lg overflow-hidden bg-zinc-50">
                     {isVideo(img) ? (
                        <video src={img} className="w-full h-full object-cover" controls />
                     ) : (
                        <img src={img} alt="Product" className="w-full h-full object-cover" />
                     )}
                     {idx === 0 && (
                        <div className="absolute top-0 left-0 bg-zinc-900 text-white text-[10px] px-2 py-0.5 rounded-br font-medium z-10">
                          Main
                        </div>
                     )}
                     <button 
                       type="button"
                       onClick={() => removeImage(idx)}
                       className="absolute top-1 right-1 p-1.5 bg-white/90 text-red-600 rounded-md opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-20"
                     >
                       <Trash2 className="h-4 w-4" />
                     </button>
                   </div>
                 ))}
                 
                 <div className="aspect-square border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-lg flex flex-col items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <FileUpload 
                      onUpload={addImage}
                      label="Add Media"
                      className="w-full h-full opacity-0 absolute cursor-pointer"
                    />
                    <div className="pointer-events-none flex flex-col items-center gap-2 text-zinc-500">
                        <Plus className="h-6 w-6" />
                        <span className="text-xs font-medium">Add Media</span>
                    </div>
                 </div>
               </div>
               
               <div className="flex gap-2">
                  <Input 
                    value={newImageUrl} 
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="Or paste image URL..."
                    className="flex-1"
                  />
                  <Button size="sm" variant="secondary" type="button" onClick={() => addImage(newImageUrl)}>
                    Add URL
                  </Button>
               </div>
            </div>
          </div>

           {/* Attributes & SKU Matrix */}
           <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-6">
              <h2 className="font-semibold text-lg">Variants</h2>
              
              <AttributeSelector 
                initialAttributes={selectedAttributes}
                onChange={setSelectedAttributes}
              />

              <SkuMatrix 
                attributes={selectedAttributes}
                baseProductCode={formData.skuCode}
                onChange={setGeneratedSkus}
                initialSkus={generatedSkus}
              />
              
              {selectedAttributes.length === 0 && (
                <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium text-sm">Pricing & Inventory</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div className="col-span-2">
                         <label className="block text-sm font-medium mb-1">SKU Code</label>
                         <Input 
                           value={formData.skuCode}
                           onChange={(e) => setFormData({ ...formData, skuCode: e.target.value })}
                           placeholder="e.g. PROD-001"
                         />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Price</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">$</span>
                            <Input 
                              type="number"
                              value={formData.singlePrice}
                              onChange={(e) => setFormData({ ...formData, singlePrice: e.target.value })}
                              placeholder="0.00"
                              className="pl-7"
                            />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Stock</label>
                        <Input 
                          type="number"
                          value={formData.singleStock}
                          onChange={(e) => setFormData({ ...formData, singleStock: e.target.value })}
                          placeholder="0"
                        />
                      </div>
                    </div>
                </div>
              )}
           </div>

           {/* Material Details (Hidden as per request) */}
           
           {/* Trade & Logistics (Hidden/Defaulted for now as per request) */}
        </div>

        {/* Right Column: Sidebar */}
        <div className="space-y-6">
          
          {/* Product Organization */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-4">
            <h2 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">Product Organization</h2>
            
            <div>
              <label className="block text-xs font-medium mb-1.5 text-zinc-500">Category</label>
              <select 
                className="flex w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
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

            <div>
               <label className="block text-xs font-medium mb-1.5 text-zinc-500">Product Type</label>
               <Input placeholder="e.g. Sneaker" />
            </div>

            <div>
               <label className="block text-xs font-medium mb-1.5 text-zinc-500">Vendor</label>
               <Input placeholder="e.g. Nike" />
            </div>

            <div>
               <label className="block text-xs font-medium mb-1.5 text-zinc-500">Collections</label>
               <Input placeholder="Search collections..." />
            </div>

            <div>
               <label className="block text-xs font-medium mb-1.5 text-zinc-500">Tags</label>
               <Input placeholder="Vintage, Summer, Sale" />
            </div>
          </div>

          {/* Size Chart */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-4">
            <h2 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">Size Chart</h2>
            <select 
                className="flex w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm shadow-sm"
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
            
            <div className="relative">
                 <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-zinc-200 dark:border-zinc-800" />
                 </div>
                 <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white dark:bg-zinc-900 px-2 text-zinc-500">Or upload image</span>
                 </div>
            </div>

            <div>
                 <FileUpload 
                   label="Upload Image"
                   onUpload={(url) => setFormData({ ...formData, sizeChartImage: url })}
                   className="h-24"
                 />
                 {formData.sizeChartImage && (
                    <div className="mt-2 relative group w-full aspect-[3/4] border rounded-md overflow-hidden bg-zinc-100">
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
          
          <div className="sticky top-6">
              <Button onClick={handleSubmit} disabled={mutation.isPending} className="w-full shadow-lg" size="lg">
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Save Product
              </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
