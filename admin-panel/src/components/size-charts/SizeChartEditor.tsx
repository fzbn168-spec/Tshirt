'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/navigation';
import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { Trash2, Plus, Save, ArrowLeft } from 'lucide-react';
import api from '@/lib/axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToastStore } from '@/store/useToastStore';

interface SizeChartEditorProps {
  initialData?: {
    id?: string;
    name: string;
    data: string; // JSON string
  };
  mode: 'create' | 'edit';
}

export default function SizeChartEditor({ initialData, mode }: SizeChartEditorProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();
  
  const [name, setName] = useState(initialData?.name || '');
  const [regions, setRegions] = useState<string[]>(['US', 'EU', 'CM']);
  const [rows, setRows] = useState<Record<string, string>[]>([]);

  useEffect(() => {
    if (initialData?.data) {
      try {
        const parsed = JSON.parse(initialData.data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Infer regions from the first row keys
          const keys = Object.keys(parsed[0]);
          if (keys.length > 0) setRegions(keys);
          setRows(parsed);
        } else {
          // Default empty row
          setRows([{ US: '', EU: '', CM: '' }]);
        }
      } catch (e) {
        console.error('Failed to parse size chart data', e);
        setRows([{ US: '', EU: '', CM: '' }]);
      }
    } else {
      setRows([{ US: '', EU: '', CM: '' }]);
    }
  }, [initialData]);

  const mutation = useMutation({
    mutationFn: async (payload: { name: string; data: string }) => {
      if (mode === 'create') {
        return api.post('/size-charts', payload);
      } else {
        return api.patch(`/size-charts/${initialData?.id}`, payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['size-charts'] });
      addToast(`Size chart ${mode === 'create' ? 'created' : 'updated'} successfully`, 'success');
      router.push('/dashboard/size-charts');
    },
    onError: (error: any) => {
      addToast(error.response?.data?.message || 'Something went wrong', 'error');
    },
  });

  const handleSave = () => {
    if (!name.trim()) {
      addToast('Please enter a chart name', 'error');
      return;
    }
    // Filter out empty rows
    const cleanRows = rows.filter(row => Object.values(row).some(v => v.trim() !== ''));
    
    // Ensure all rows have all region keys (even if empty)
    const normalizedRows = cleanRows.map(row => {
      const newRow: Record<string, string> = {};
      regions.forEach(r => {
        newRow[r] = row[r] || '';
      });
      return newRow;
    });

    mutation.mutate({
      name,
      data: JSON.stringify(normalizedRows),
    });
  };

  const addColumn = () => {
    const newRegion = prompt('Enter new region name (e.g., UK, INCH):');
    if (newRegion && !regions.includes(newRegion)) {
      setRegions([...regions, newRegion]);
      setRows(rows.map(row => ({ ...row, [newRegion]: '' })));
    }
  };

  const removeColumn = (region: string) => {
    if (regions.length <= 1) {
      addToast('At least one column is required', 'error');
      return;
    }
    if (confirm(`Delete column ${region}?`)) {
      setRegions(regions.filter(r => r !== region));
      setRows(rows.map(row => {
        const newRow = { ...row };
        delete newRow[region];
        return newRow;
      }));
    }
  };

  const updateCell = (rowIndex: number, region: string, value: string) => {
    const newRows = [...rows];
    newRows[rowIndex] = { ...newRows[rowIndex], [region]: value };
    setRows(newRows);
  };

  const addRow = () => {
    const newRow: Record<string, string> = {};
    regions.forEach(r => newRow[r] = '');
    setRows([...rows, newRow]);
  };

  const removeRow = (index: number) => {
    if (rows.length <= 1) return;
    setRows(rows.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">{mode === 'create' ? 'New Size Chart' : 'Edit Size Chart'}</h1>
      </div>

      <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Chart Name</label>
          <Input 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            placeholder="e.g. Men's Standard Sneakers" 
            className="max-w-md"
          />
        </div>

        <div className="border rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-800">
                <tr>
                  {regions.map((region) => (
                    <th key={region} className="px-4 py-3 text-left font-medium border-b border-r last:border-r-0 min-w-[100px] relative group">
                      <div className="flex items-center justify-between">
                        {region}
                        <button 
                          onClick={() => removeColumn(region)}
                          className="opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-50 p-1 rounded"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </th>
                  ))}
                  <th className="w-12 border-b bg-zinc-50 dark:bg-zinc-800 p-2 text-center">
                    <button onClick={addColumn} className="text-blue-600 hover:text-blue-700" title="Add Column">
                      <Plus className="h-4 w-4" />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-b last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    {regions.map((region) => (
                      <td key={`${rowIndex}-${region}`} className="p-0 border-r last:border-r-0">
                        <input
                          type="text"
                          value={row[region] || ''}
                          onChange={(e) => updateCell(rowIndex, region, e.target.value)}
                          className="w-full h-10 px-4 bg-transparent focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                        />
                      </td>
                    ))}
                    <td className="p-2 text-center">
                      <button 
                        onClick={() => removeRow(rowIndex)}
                        className="text-zinc-400 hover:text-red-500 transition-colors"
                        disabled={rows.length <= 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <Button variant="outline" onClick={addRow} className="w-full border-dashed">
          <Plus className="h-4 w-4 mr-2" /> Add Row
        </Button>
      </div>

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button onClick={handleSave} disabled={mutation.isPending}>
          <Save className="h-4 w-4 mr-2" />
          {mutation.isPending ? 'Saving...' : 'Save Chart'}
        </Button>
      </div>
    </div>
  );
}
