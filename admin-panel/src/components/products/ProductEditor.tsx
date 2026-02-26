
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
import AddPackageModal from './AddPackageModal';
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
    // Product Org
    vendor: '',
    productType: '',
    collection: '',
    tags: '',
    isPublished: false,
    // Single SKU Extras
    barcode: '',
    continueSelling: false,
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
    packageId: '',
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
        vendor: initialData.vendor || '',
        productType: initialData.productType || '',
        collection: initialData.collection || '',
        tags: initialData.tags || '',
        isPublished: initialData.isPublished || false,
        barcode: initialData.skus?.[0]?.barcode || '',
        continueSelling: initialData.skus?.[0]?.allowBackorder || false,
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
        packageId: initialData.packageId || '',
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
                  barcode: sku.barcode || '',
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

  const [isAddPackageModalOpen, setIsAddPackageModalOpen] = useState(false);

  // Fetch Packages
  const { data: packages } = useQuery({
    queryKey: ['packages'],
    queryFn: async () => {
      try {
        const res = await api.get('/packages');
        return res.data;
      } catch (e) {
        return [];
      }
    },
  });

  // Set default package if not set
  useEffect(() => {
    if (!formData.packageId && packages && packages.length > 0) {
       const defaultPkg = packages.find((p: any) => p.isDefault);
       if (defaultPkg) {
          setFormData(prev => ({ ...prev, packageId: defaultPkg.id }));
       }
    }
  }, [packages, formData.packageId]);

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
            moq: 1,
            stock: Number(sku.stock),
            barcode: sku.barcode,
            image: sku.imageUrl || undefined,
            allowBackorder: false,
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
            barcode: payload.barcode,
            allowBackorder: payload.continueSelling,
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
      submitData.vendor = payload.vendor;
      submitData.productType = payload.productType;
      submitData.collection = payload.collection;
      submitData.tags = payload.tags;
      submitData.isPublished = payload.isPublished;
      submitData.weight = payload.netWeight ? Number(payload.netWeight) : undefined;
      submitData.packageId = payload.packageId === 'default' ? undefined : payload.packageId;
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
          返回
        </Button>
        <h1 className="text-2xl font-bold">{mode === 'create' ? '新建商品' : '编辑商品'}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Main Info */}
        <div className="lg:col-span-2 space-y-6">
           <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-6">
              <h2 className="font-semibold text-lg">基本信息</h2>
              
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1">标题</label>
                  <Input 
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="短袖 T 恤"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">描述</label>
                  <RichTextEditor 
                    value={formData.description}
                    onChange={(val) => setFormData({ ...formData, description: val })}
                    placeholder=""
                  />
                </div>

                <div>
                   <label className="block text-sm font-medium mb-1">类别</label>
                   <select 
                      className="flex w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                   >
                     <option value="">选择产品类别</option>
                     {categories?.map((cat: any) => (
                       <option key={cat.id} value={cat.id}>
                         {cat.name ? (JSON.parse(cat.name).en || 'Category') : 'Category'}
                       </option>
                     ))}
                   </select>
                   <p className="text-xs text-zinc-500 mt-1">
                      确定税率并添加元字段，以改进搜索、筛选和跨渠道销售
                   </p>
                </div>
              </div>
           </div>

           {/* Media */}
           <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-4">
            <h2 className="font-semibold text-lg">媒体文件</h2>
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
                          主图
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
                 
                 <div className="relative aspect-square border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-lg flex flex-col items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors p-4 text-center">
                    <div className="flex flex-col items-center gap-2 mb-2">
                        <Button size="sm" variant="secondary" className="relative w-full text-xs h-7">
                           上传新文件
                           <FileUpload 
                              onUpload={addImage}
                              label=""
                              className="absolute inset-0 opacity-0 cursor-pointer"
                           />
                        </Button>
                        <Button size="sm" variant="ghost" className="w-full text-xs h-7">
                           选择现有文件
                        </Button>
                    </div>
                    <div className="text-[10px] text-zinc-400">
                        支持图片、视频或 3D 模型
                    </div>
                 </div>
               </div>
               
               <div className="flex gap-2">
                  <Input 
                    value={newImageUrl} 
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="或粘贴图片网址..."
                    className="flex-1"
                  />
                  <Button size="sm" variant="secondary" type="button" onClick={() => addImage(newImageUrl)}>
                    添加网址
                  </Button>
               </div>
            </div>
          </div>

           {/* Attributes & SKU Matrix */}
           <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-6">
              <h2 className="font-semibold text-lg">多属性</h2>
              
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
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-6">
                    <h3 className="font-semibold text-lg">价格</h3>
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium mb-1">价格</label>
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
                         <label className="block text-sm font-medium mb-1">比较价格</label>
                         <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">$</span>
                            <Input placeholder="0.00" className="pl-7" disabled />
                         </div>
                      </div>
                    </div>
                </div>
              )}

              {selectedAttributes.length === 0 && (
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-6">
                    <div className="flex items-center justify-between">
                       <h3 className="font-semibold text-lg">库存</h3>
                       <div className="flex items-center gap-2">
                          <span className="text-sm">已跟踪库存</span>
                          <input type="checkbox" checked readOnly className="rounded border-zinc-300" />
                       </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div className="col-span-2">
                         <label className="block text-sm font-medium mb-1">数量</label>
                         <div className="flex items-center justify-between border border-zinc-200 rounded-md px-3 py-2 bg-white dark:bg-zinc-900">
                             <span className="text-sm">商店地点</span>
                             <Input 
                               type="number"
                               value={formData.singleStock}
                               onChange={(e) => setFormData({ ...formData, singleStock: e.target.value })}
                               placeholder="0"
                               className="w-24 text-right border-none shadow-none focus-visible:ring-0 p-0 h-auto"
                             />
                         </div>
                      </div>
                      
                      <div>
                         <label className="block text-sm font-medium mb-1">SKU (库存单位)</label>
                         <Input 
                           value={formData.skuCode}
                           onChange={(e) => setFormData({ ...formData, skuCode: e.target.value })}
                           placeholder=""
                         />
                      </div>
                      
                      <div>
                         <label className="block text-sm font-medium mb-1">条码 (ISBN, UPC, GTIN 等)</label>
                         <Input 
                           value={formData.barcode}
                           onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                           placeholder=""
                         />
                      </div>

                      <div className="flex items-center gap-2 col-span-2">
                          <input 
                            type="checkbox" 
                            checked={formData.continueSelling}
                            onChange={(e) => setFormData({ ...formData, continueSelling: e.target.checked })}
                            className="rounded border-zinc-300"
                          />
                          <span className="text-sm">缺货时继续销售</span>
                      </div>
                    </div>
                </div>
              )}

              {/* Shipping */}
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-6">
                  <div className="flex items-center justify-between">
                     <h3 className="font-semibold text-lg">发货</h3>
                     <div className="flex items-center gap-2">
                        <span className="text-sm">实体产品</span>
                        <input type="checkbox" checked readOnly className="rounded border-zinc-300" />
                     </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                             <label className="block text-sm font-medium mb-1">包装</label>
                             <div className="relative">
                                <select 
                                  className="flex w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 pr-24"
                                  value={formData.packageId}
                                  onChange={(e) => {
                                    if (e.target.value === '_add_new_') {
                                      setIsAddPackageModalOpen(true);
                                    } else {
                                      setFormData({ ...formData, packageId: e.target.value });
                                    }
                                  }}
                                >
                                  <option value="">Select a package</option>
                                  {packages?.map((pkg: any) => (
                                    <option key={pkg.id} value={pkg.id}>
                                      {pkg.name} - {pkg.length}×{pkg.width}×{pkg.height}cm, {pkg.weight}kg
                                    </option>
                                  ))}
                                  <option value="_add_new_" className="font-semibold text-blue-600">
                                    + Add New Package
                                  </option>
                                </select>
                                <div className="absolute right-0 top-0 h-full flex items-center pr-2 pointer-events-none">
                                   {/* Icon or spacer */}
                                </div>
                             </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-1">产品重量</label>
                            <div className="flex gap-2">
                               <Input 
                                 type="number"
                                 value={formData.netWeight}
                                 onChange={(e) => setFormData({ ...formData, netWeight: e.target.value })}
                                 placeholder="0.0"
                               />
                               <select className="rounded-md border border-zinc-200 bg-transparent px-3 text-sm">
                                 <option>kg</option>
                                 <option>lb</option>
                               </select>
                            </div>
                          </div>
                      </div>
                  </div>
              </div>
           </div>

           {/* Material Details (Hidden as per request) */}
           
           {/* Trade & Logistics (Hidden/Defaulted for now as per request) */}
        </div>

        {/* Right Column: Sidebar */}
        <div className="space-y-6">
          
          {/* Status */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-4">
             <h2 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">状态</h2>
             <select 
                className="flex w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
                value={formData.isPublished ? 'active' : 'draft'}
                onChange={(e) => setFormData({ ...formData, isPublished: e.target.value === 'active' })}
             >
                <option value="active">活跃</option>
                <option value="draft">草稿</option>
             </select>
          </div>

          {/* Product Organization */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-4">
            <h2 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">商品组织</h2>
            
            <div>
               <label className="block text-xs font-medium mb-1.5 text-zinc-500">商品类型</label>
               <Input 
                 value={formData.productType}
                 onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
                 placeholder="例如: 运动鞋"
               />
            </div>

            <div>
               <label className="block text-xs font-medium mb-1.5 text-zinc-500">厂商</label>
               <Input 
                 value={formData.vendor}
                 onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                 placeholder="例如: Nike"
               />
            </div>

            <div>
               <label className="block text-xs font-medium mb-1.5 text-zinc-500">系列</label>
               <Input 
                 value={formData.collection}
                 onChange={(e) => setFormData({ ...formData, collection: e.target.value })}
                 placeholder="搜索系列..." 
               />
            </div>

            <div>
               <label className="block text-xs font-medium mb-1.5 text-zinc-500">标签</label>
               <Input 
                 value={formData.tags}
                 onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                 placeholder="复古, 夏季, 促销"
               />
            </div>
          </div>

          {/* Size Chart */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-4">
            <h2 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">尺码表</h2>
            <select 
                className="flex w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm shadow-sm"
                value={formData.sizeChartId}
                onChange={(e) => setFormData({ ...formData, sizeChartId: e.target.value })}
              >
                <option value="">选择尺码表</option>
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
                    <span className="bg-white dark:bg-zinc-900 px-2 text-zinc-500">或上传图片</span>
                 </div>
            </div>

            <div>
                 <FileUpload 
                   label="上传图片"
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
                保存商品
              </Button>
          </div>
        </div>
      </div>
      <AddPackageModal 
        isOpen={isAddPackageModalOpen} 
        onClose={() => setIsAddPackageModalOpen(false)}
        onSuccess={(id) => setFormData({ ...formData, packageId: id })}
      />
    </div>
  );
}
