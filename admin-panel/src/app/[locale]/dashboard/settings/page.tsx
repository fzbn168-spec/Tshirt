'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { Loader2, Save } from 'lucide-react';
import { useToastStore } from '@/store/useToastStore';

interface SystemSetting {
  key: string;
  value: string;
  description?: string;
}

export default function SettingsPage() {
  const { addToast } = useToastStore();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Record<string, string>>({});

  const { data: settings, isLoading } = useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const res = await api.get<SystemSetting[]>('/system-settings');
      return res.data;
    },
  });

  // Initialize form data when settings are loaded
  if (settings && Object.keys(formData).length === 0 && !isLoading) {
    const initialData: Record<string, string> = {};
    settings.forEach(s => {
      initialData[s.key] = s.value;
    });
    setFormData(initialData);
  }

  const mutation = useMutation({
    mutationFn: async (data: Record<string, string>) => {
      const payload = Object.entries(data).map(([key, value]) => ({
        key,
        value,
        description: settings?.find(s => s.key === key)?.description
      }));
      return api.put('/system-settings', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      addToast('Settings updated successfully', 'success');
    },
    onError: () => {
      addToast('Failed to update settings', 'error');
    }
  });

  const handleSave = () => {
    mutation.mutate(formData);
  };

  if (isLoading) return <div className="p-8">Loading settings...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">System Settings</h1>
          <p className="text-zinc-500">Configure global units and defaults.</p>
        </div>
        <Button onClick={handleSave} disabled={mutation.isPending}>
          {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save Changes
        </Button>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 space-y-6">
        <h2 className="font-semibold text-lg border-b pb-2">Measurement Units</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-1">Weight Unit</label>
            <p className="text-xs text-zinc-500 mb-2">Used for product weight (e.g. kg, lbs)</p>
            <Input 
              value={formData['weight_unit'] || ''}
              onChange={(e) => setFormData({ ...formData, weight_unit: e.target.value })}
              placeholder="kg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Dimension Unit</label>
            <p className="text-xs text-zinc-500 mb-2">Used for product dimensions (e.g. cm, in)</p>
            <Input 
              value={formData['dimension_unit'] || ''}
              onChange={(e) => setFormData({ ...formData, dimension_unit: e.target.value })}
              placeholder="cm"
            />
          </div>

           <div>
            <label className="block text-sm font-medium mb-1">Currency Code</label>
            <p className="text-xs text-zinc-500 mb-2">Default currency for prices (e.g. USD, CNY)</p>
            <Input 
              value={formData['currency'] || ''}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              placeholder="USD"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
