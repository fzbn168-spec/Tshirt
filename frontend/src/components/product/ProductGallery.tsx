'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface ProductGalleryProps {
  images: string[];
}

export function ProductGallery({ images }: ProductGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0);

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image */}
      <div className="aspect-square relative overflow-hidden rounded-lg bg-zinc-100 border border-zinc-200 dark:border-zinc-800">
        <Image
          src={images[selectedImage]}
          alt="Product main image"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Thumbnails */}
      <div className="grid grid-cols-5 gap-4">
        {images.map((image, index) => (
          <button
            key={index}
            onClick={() => setSelectedImage(index)}
            className={cn(
              "relative aspect-square rounded-md overflow-hidden bg-zinc-100 border-2",
              selectedImage === index 
                ? "border-blue-600 ring-2 ring-blue-100 dark:ring-blue-900" 
                : "border-transparent hover:border-zinc-300"
            )}
          >
            <Image
              src={image}
              alt={`Thumbnail ${index + 1}`}
              fill
              className="object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
