'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useRouter } from '@/navigation';
import api from '@/lib/axios';
import { Button } from '@/components/button';
import { Plus, Edit, Trash2, Loader2, Ruler } from 'lucide-react';
import { useToastStore } from '@/store/useToastStore';

interface SizeChart {
  id: string;
  name: string;
  data: string;
  createdAt: string;
  updatedAt: string;
}

export default function SizeChartsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  const { data: charts, isLoading, error } = useQuery<SizeChart[]>({
    queryKey: ['size-charts'],
    queryFn: async () => {
      const res = await api.get('/size-charts');
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/size-charts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['size-charts'] });
      addToast('Size chart deleted successfully', 'success');
    },
    onError: () => {
      addToast('Failed to delete size chart', 'error');
    },
  });

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this size chart?')) {
      deleteMutation.mutate(id);
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
        Failed to load size charts. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Ruler className="h-6 w-6" />
            Size Charts
          </h1>
          <p className="text-zinc-500">Manage global size conversion tables</p>
        </div>
        <Button onClick={() => router.push('/dashboard/size-charts/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Create New Chart
        </Button>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-800">
            <tr>
              <th className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">Chart Name</th>
              <th className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">Last Updated</th>
              <th className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {charts?.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-zinc-500">
                  No size charts found. Create one to get started.
                </td>
              </tr>
            ) : (
              charts?.map((chart) => (
                <tr key={chart.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="px-6 py-4 font-medium">{chart.name}</td>
                  <td className="px-6 py-4 text-zinc-500">
                    {new Date(chart.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => router.push(`/dashboard/size-charts/${chart.id}`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDelete(chart.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
