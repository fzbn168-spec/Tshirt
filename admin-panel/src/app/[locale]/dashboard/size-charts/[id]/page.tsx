'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation'; // Not from navigation.ts because params logic
import SizeChartEditor from '@/components/size-charts/SizeChartEditor';
import api from '@/lib/axios';
import { Loader2 } from 'lucide-react';
import { use } from 'react';

export default function EditSizeChartPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data: chart, isLoading, error } = useQuery({
    queryKey: ['size-chart', id],
    queryFn: async () => {
      const res = await api.get(`/size-charts/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

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
        Failed to load size chart.
      </div>
    );
  }

  return <SizeChartEditor mode="edit" initialData={chart} />;
}
