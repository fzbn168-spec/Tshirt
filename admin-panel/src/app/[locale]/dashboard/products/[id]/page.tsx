'use client';

import { useQuery } from '@tanstack/react-query';
import ProductEditor from '@/components/products/ProductEditor';
import api from '@/lib/axios';
import { Loader2 } from 'lucide-react';
import { use } from 'react';

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const res = await api.get(`/products/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500">
        Failed to load product.
      </div>
    );
  }

  return <ProductEditor mode="edit" initialData={product} />;
}
