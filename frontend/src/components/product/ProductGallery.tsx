'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Rotate3D, ImageIcon } from 'lucide-react';

interface ProductGalleryProps {
  images: string[];
  images360?: string[];
}

export function ProductGallery({ images, images360 = [] }: ProductGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [mode, setMode] = useState<'image' | '360'>('image');
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  
  // Auto-switch to 360 mode if user selects it, or if no regular images
  const handleModeSwitch = (newMode: 'image' | '360') => {
    if (newMode === '360' && images360.length === 0) return;
    setMode(newMode);
  };

  // 360 View Logic
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    startX.current = e.clientX;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const delta = e.clientX - startX.current;
    if (Math.abs(delta) > 10) { // Sensitivity
      const direction = delta > 0 ? 1 : -1;
      setCurrentFrame(prev => {
        let next = prev - direction;
        if (next < 0) next = images360.length - 1;
        if (next >= images360.length) next = 0;
        return next;
      });
      startX.current = e.clientX;
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div className="flex flex-col gap-4">
      {/* Mode Switcher */}
      {images360.length > 0 && (
        <div className="flex gap-2 justify-center">
            <button
                onClick={() => handleModeSwitch('image')}
                className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                    mode === 'image' 
                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" 
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"
                )}
            >
                <ImageIcon className="w-4 h-4" />
                Photos
            </button>
            <button
                onClick={() => handleModeSwitch('360')}
                className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                    mode === '360' 
                        ? "bg-blue-600 text-white" 
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"
                )}
            >
                <Rotate3D className="w-4 h-4" />
                360° View
            </button>
        </div>
      )}

      {/* Main Display */}
      <div 
        className="aspect-square relative overflow-hidden rounded-lg bg-zinc-100 border border-zinc-200 dark:border-zinc-800 cursor-grab active:cursor-grabbing"
        onMouseDown={mode === '360' ? handleMouseDown : undefined}
        onMouseMove={mode === '360' ? handleMouseMove : undefined}
      >
        {mode === 'image' ? (
            <Image
            src={images[selectedImage]}
            alt="Product main image"
            fill
            className="object-cover"
            priority
            />
        ) : (
            <>
                <Image
                src={images360[currentFrame]}
                alt={`360 view frame ${currentFrame}`}
                fill
                className="object-contain"
                draggable={false}
                priority
                />
                <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
                    <span className="bg-black/50 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                        Drag to rotate
                    </span>
                </div>
            </>
        )}
      </div>

      {/* Thumbnails (Only for Image Mode) */}
      {mode === 'image' && (
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
      )}
    </div>
  );
}
