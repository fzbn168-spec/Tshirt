
'use client';

import { useState } from 'react';
import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { X, Loader2 } from 'lucide-react';
import api from '@/lib/axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToastStore } from '@/store/useToastStore';

interface AddPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newPackageId: string) => void;
}

export default function AddPackageModal({ isOpen, onClose, onSuccess }: AddPackageModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    length: '',
    width: '',
    height: '',
    weight: '0',
    isDefault: false
  });
  
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ...data,
        length: Number(data.length),
        width: Number(data.width),
        height: Number(data.height),
        weight: Number(data.weight),
      };
      return api.post('/packages', payload);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      addToast('Package created successfully', 'success');
      onSuccess(res.data.id);
      onClose();
      setFormData({
        name: '',
        length: '',
        width: '',
        height: '',
        weight: '0',
        isDefault: false
      });
    },
    onError: () => {
      addToast('Failed to create package', 'error');
    }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl w-full max-w-md border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800">
          <h3 className="font-semibold text-lg">Add New Package</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Package Name</label>
            <Input 
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Small Box"
            />
          </div>
          
          <div className="grid grid-cols-3 gap-3">
             <div>
                <label className="block text-xs font-medium mb-1 text-zinc-500">Length (cm)</label>
                <Input 
                  type="number"
                  value={formData.length}
                  onChange={(e) => setFormData({ ...formData, length: e.target.value })}
                  placeholder="0"
                />
             </div>
             <div>
                <label className="block text-xs font-medium mb-1 text-zinc-500">Width (cm)</label>
                <Input 
                  type="number"
                  value={formData.width}
                  onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                  placeholder="0"
                />
             </div>
             <div>
                <label className="block text-xs font-medium mb-1 text-zinc-500">Height (cm)</label>
                <Input 
                  type="number"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                  placeholder="0"
                />
             </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Empty Weight (kg)</label>
            <Input 
              type="number"
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              placeholder="0.0"
            />
          </div>

          <div className="flex items-center gap-2">
             <input 
               type="checkbox" 
               checked={formData.isDefault}
               onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
               className="rounded border-zinc-300"
             />
             <span className="text-sm">Set as default package</span>
          </div>
        </div>

        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => mutation.mutate(formData)} disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Package
          </Button>
        </div>
      </div>
    </div>
  );
}
