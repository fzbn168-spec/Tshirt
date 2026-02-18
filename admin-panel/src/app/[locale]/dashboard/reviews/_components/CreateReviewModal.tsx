'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { Star, X, Loader2 } from 'lucide-react';
import { useToastStore } from '@/store/useToastStore';

interface CreateReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateReviewModal({ isOpen, onClose }: CreateReviewModalProps) {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();
  
  const [formData, setFormData] = useState({
    productId: '',
    userName: '',
    rating: 5,
    content: '',
    createdAt: new Date().toISOString().split('T')[0], // YYYY-MM-DD
  });

  // Fetch Products for selection
  const { data: productsData, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products-list'],
    queryFn: async () => {
      const res = await api.get('/products?limit=100'); // Limit 100 for now
      return res.data;
    },
    enabled: isOpen,
  });

  const products = productsData?.items || [];

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.post('/reviews', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      addToast('Review created successfully', 'success');
      onClose();
      // Reset form
      setFormData({
        productId: '',
        userName: '',
        rating: 5,
        content: '',
        createdAt: new Date().toISOString().split('T')[0],
      });
    },
    onError: (error: any) => {
      addToast(error.response?.data?.message || 'Failed to create review', 'error');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productId || !formData.userName || !formData.content) {
      addToast('Please fill in all required fields', 'error');
      return;
    }
    createMutation.mutate(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-lg font-semibold">Create Review</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Product</label>
            {isLoadingProducts ? (
              <div className="flex items-center gap-2 text-sm text-zinc-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading products...
              </div>
            ) : (
              <select
                className="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300"
                value={formData.productId}
                onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                required
              >
                <option value="">Select a product</option>
                {products.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.title ? JSON.parse(p.title).en : 'Untitled'}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">User Name</label>
            <Input
              value={formData.userName}
              onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
              placeholder="e.g. John Doe"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFormData({ ...formData, rating: star })}
                  className="focus:outline-none"
                >
                  <Star
                    className={`h-6 w-6 ${
                      star <= formData.rating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-zinc-300 dark:text-zinc-600'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Content</label>
            <textarea
              className="flex w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300 min-h-[100px]"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Write the review content..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <Input
              type="date"
              value={formData.createdAt}
              onChange={(e) => setFormData({ ...formData, createdAt: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Create Review
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
