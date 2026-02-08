'use client';

import { useState, useRef } from 'react';
import { Upload, X, Loader2, FileIcon } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import Image from 'next/image';

interface FileUploadProps {
  value?: string;
  onUpload: (url: string) => void;
  label?: string;
  accept?: string;
}

export function FileUpload({ value, onUpload, label = "Upload File", accept = "image/*,application/pdf" }: FileUploadProps) {
  const [loading, setLoading] = useState(false);
  const { token } = useAuthStore();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('http://localhost:3001/uploads', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) throw new Error('Upload failed');

      const data = await res.json();
      onUpload(data.url);
    } catch (error) {
      console.error(error);
      alert('Upload failed');
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const clearFile = () => {
    onUpload('');
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </label>
      
      {value ? (
        <div className="relative group w-full h-48 border rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            {value.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                 <Image 
                   src={value} 
                   alt="Uploaded file" 
                   fill 
                   className="object-contain"
                 />
            ) : (
                <div className="flex flex-col items-center text-zinc-500">
                    <FileIcon className="w-12 h-12 mb-2" />
                    <span className="text-xs truncate max-w-[200px]">{value.split('/').pop()}</span>
                </div>
            )}
            
          <button
            type="button"
            onClick={clearFile}
            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div 
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors bg-zinc-50 dark:bg-zinc-900/50"
        >
          {loading ? (
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          ) : (
            <>
              <Upload className="w-8 h-8 text-zinc-400 mb-2" />
              <p className="text-sm text-zinc-500 font-medium">Click to upload</p>
              <p className="text-xs text-zinc-400 mt-1">Images or PDF (max 5MB)</p>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
