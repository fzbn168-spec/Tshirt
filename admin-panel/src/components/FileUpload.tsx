'use client';

import { useState, useRef } from 'react';
import { Upload, X, Loader2, FileIcon, Video } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import Image from 'next/image';

interface FileUploadProps {
  value?: string;
  onUpload: (url: string) => void;
  label?: string;
  accept?: string;
  className?: string;
}

export function FileUpload({ value, onUpload, label = "Upload File", accept = "image/*,video/*,application/pdf", className }: FileUploadProps) {
  const [loading, setLoading] = useState(false);
  const { token } = useAuthStore();
  const inputRef = useRef<HTMLInputElement>(null);

  // ... existing code ...

  const isVideo = (url: string) => {
    return url.match(/\.(mp4|webm|ogg|mov)$/i);
  };

  const isImage = (url: string) => {
    return url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);
  };

  const clearFile = () => {
    onUpload('');
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* ... existing code ... */}
      
      {value ? (
        <div className="relative group w-full h-full min-h-[120px] border rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            {isImage(value) ? (
                 <Image 
                   src={value} 
                   alt="Uploaded file" 
                   fill 
                   className="object-contain"
                 />
            ) : isVideo(value) ? (
                <video src={value} className="w-full h-full object-contain" controls />
            ) : (
                <div className="flex flex-col items-center text-zinc-500">
                    <FileIcon className="w-12 h-12 mb-2" />
                    <span className="text-xs truncate max-w-[200px]">{value.split('/').pop()}</span>
                </div>
            )}
            
          <button
            type="button"
            onClick={clearFile}
            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div 
            onClick={() => inputRef.current?.click()}
            className="w-full h-full min-h-[120px] border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors bg-zinc-50 dark:bg-zinc-900/50"
        >
          {loading ? (
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          ) : (
            <>
              <Upload className="w-8 h-8 text-zinc-400 mb-2" />
              <p className="text-sm text-zinc-500 font-medium">Click to upload</p>
              <p className="text-xs text-zinc-400 mt-1">Images, Videos or PDF</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
