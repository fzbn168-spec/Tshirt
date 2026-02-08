'use client';

import { useEffect, useState } from 'react';
import ProductForm from '../_components/ProductForm';
import { useAuthStore } from '@/store/useAuthStore';

export default function EditProductPage({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState(null);
  const { token } = useAuthStore();

  useEffect(() => {
    if (token && params.id) {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      fetch(`${API_URL}/products/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => setProduct(data))
      .catch(err => console.error(err));
    }
  }, [token, params.id]);

  if (!product) return <div>Loading...</div>;

  return <ProductForm initialData={product} isEdit />;
}
