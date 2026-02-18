'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Button } from '@/components/button';
import { Plus, Trash2, Loader2, Star } from 'lucide-react';
import { useToastStore } from '@/store/useToastStore';
import { useState } from 'react';
import CreateReviewModal from './_components/CreateReviewModal';

interface Review {
  id: string;
  productId: string;
  product: {
    title: string;
    images: string;
  };
  userName: string;
  rating: number;
  content: string;
  createdAt: string;
  isPublished: boolean;
}

export default function ReviewsPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: reviews, isLoading, error } = useQuery({
    queryKey: ['reviews'],
    queryFn: async () => {
      const res = await api.get('/reviews/admin');
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/reviews/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      addToast('Review deleted successfully', 'success');
    },
    onError: () => {
      addToast('Failed to delete review', 'error');
    },
  });

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this review?')) {
      deleteMutation.mutate(id);
    }
  };

  const getProductTitle = (titleJson: string) => {
    try {
      return JSON.parse(titleJson).en;
    } catch {
      return 'Unknown Product';
    }
  };

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
        Failed to load reviews.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Star className="h-6 w-6" />
            Reviews
          </h1>
          <p className="text-zinc-500">Manage product reviews and ratings</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Review
        </Button>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-800">
            <tr>
              <th className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">Product</th>
              <th className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">User</th>
              <th className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">Rating</th>
              <th className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">Content</th>
              <th className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">Date</th>
              <th className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {reviews?.map((review: Review) => (
              <tr key={review.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                <td className="px-6 py-4">
                  <span className="font-medium text-zinc-900 dark:text-zinc-100 block max-w-xs truncate" title={getProductTitle(review.product?.title)}>
                    {getProductTitle(review.product?.title)}
                  </span>
                </td>
                <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                  {review.userName}
                </td>
                <td className="px-6 py-4">
                  <div className="flex text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-current' : 'text-zinc-300 dark:text-zinc-600'}`} />
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400 max-w-sm truncate" title={review.content}>
                  {review.content}
                </td>
                <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                  {new Date(review.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <button 
                    onClick={() => handleDelete(review.id)}
                    className="text-red-500 hover:text-red-600 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {reviews?.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
                  No reviews found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <CreateReviewModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
