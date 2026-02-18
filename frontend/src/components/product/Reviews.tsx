'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Star, PenSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { WriteReviewModal } from './WriteReviewModal';
import api from '@/lib/api';
import Image from 'next/image';

interface Review {
  id: string;
  userName: string;
  rating: number;
  content?: string;
  images?: string; // JSON string
  createdAt: string;
}

interface ReviewsProps {
  productId: string;
}

export function Reviews({ productId }: ReviewsProps) {
  const t = useTranslations('Product.reviews'); // Assume we'll add keys later, fallback to hardcoded for now
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [isWriteReviewOpen, setIsWriteReviewOpen] = useState(false);

  const fetchReviews = useCallback(async () => {
    try {
      const res = await api.get(`/reviews/product/${productId}`);
      setReviews(res.data);
    } catch (error) {
      console.error('Failed to fetch reviews', error);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const parseImages = (jsonStr?: string): string[] => {
    if (!jsonStr) return [];
    try {
      return JSON.parse(jsonStr);
    } catch {
      return [];
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading reviews...</div>;
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12 bg-zinc-50 dark:bg-zinc-900/30 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700">
        <Star className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
        <p className="text-zinc-500 mb-4">{t('noReviews')}</p>
        <button
          onClick={() => setIsWriteReviewOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <PenSquare className="w-4 h-4" />
          {t('writeReview')}
        </button>

        <WriteReviewModal
          isOpen={isWriteReviewOpen}
          onClose={() => setIsWriteReviewOpen(false)}
          productId={productId}
          onSuccess={fetchReviews}
        />
      </div>
    );
  }

  // Calculate stats
  const averageRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
  const ratingCounts = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    percent: (reviews.filter(r => r.rating === star).length / reviews.length) * 100
  }));

  return (
    <div className="space-y-8">
      {/* Summary Header */}
      <div className="grid md:grid-cols-3 gap-8 p-6 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <div className="text-center md:text-left">
          <div className="text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
            {averageRating.toFixed(1)}
          </div>
          <div className="flex justify-center md:justify-start gap-1 text-yellow-400 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star 
                key={star} 
                className={`w-5 h-5 ${star <= Math.round(averageRating) ? 'fill-current' : 'text-zinc-300'}`} 
              />
            ))}
          </div>
          <p className="text-sm text-zinc-500 mb-4">{t('summary', { count: reviews.length })}</p>
          <button
            onClick={() => setIsWriteReviewOpen(true)}
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <PenSquare className="w-4 h-4" />
            {t('writeReview')}
          </button>
        </div>

        <div className="col-span-2 space-y-2">
          {ratingCounts.map(({ star, count, percent }) => (
            <div key={star} className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1 w-12 text-zinc-600 dark:text-zinc-400">
                <span>{star}</span>
                <Star className="w-3 h-3" />
              </div>
              <div className="flex-1 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-yellow-400 rounded-full" 
                  style={{ width: `${percent}%` }}
                />
              </div>
              <div className="w-12 text-right text-zinc-500">{count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Review List */}
      <div className="space-y-6">
        {reviews.map((review) => (
          <div key={review.id} className="border-b border-zinc-100 dark:border-zinc-800 pb-6 last:border-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 font-medium">
                  {review.userName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-medium text-zinc-900 dark:text-zinc-100">{review.userName}</h4>
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <div className="flex text-yellow-400">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          className={`w-3 h-3 ${star <= review.rating ? 'fill-current' : 'text-zinc-300'}`} 
                        />
                      ))}
                    </div>
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}</span>
                  </div>
                </div>
              </div>
            </div>

            {review.content && (
              <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed mb-4">
                {review.content}
              </p>
            )}

            {/* Images */}
            {review.images && parseImages(review.images).length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {parseImages(review.images).map((img, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 hover:opacity-80 transition-opacity"
                  >
                    <Image src={img} alt={`Review ${idx}`} width={80} height={80} className="object-cover w-full h-full" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Image Modal */}
      {activeImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setActiveImage(null)}
        >
          <div className="relative w-[90vw] h-[80vh] max-w-5xl">
            <Image src={activeImage} alt="Full size" fill className="object-contain rounded-lg" />
          </div>
        </div>
      )}

      <WriteReviewModal
        isOpen={isWriteReviewOpen}
        onClose={() => setIsWriteReviewOpen(false)}
        productId={productId}
        onSuccess={fetchReviews}
      />
    </div>
  );
}
