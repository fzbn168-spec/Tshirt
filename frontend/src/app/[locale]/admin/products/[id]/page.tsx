'use client';

import { useEffect, useState, use } from 'react';
import ProductForm from '../_components/ProductForm';
import { useAuthStore } from '@/store/useAuthStore';

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [product, setProduct] = useState(null);
  const [error, setError] = useState('');
  const { token } = useAuthStore();

  useEffect(() => {
    if (token && id) {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      fetch(`${API_URL}/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch product');
        return res.json();
      })
      .then(data => setProduct(data))
      .catch(err => {
        console.error(err);
        setError(err.message);
      });
    }
  }, [token, id]);

  if (error) return <div className="p-8 text-red-500">Error loading product: {error}</div>;
  if (!product) return <div className="p-8">Loading product details...</div>;

  return <ProductForm initialData={product} isEdit />;
}
