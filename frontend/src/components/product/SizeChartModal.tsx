'use client';

import { X, Ruler } from 'lucide-react';
import { useMemo } from 'react';

interface SizeChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  sizeChart: {
    name: string;
    data: string; // JSON string
  };
}

export function SizeChartModal({ isOpen, onClose, sizeChart }: SizeChartModalProps) {
  const tableData = useMemo<Record<string, string>[]>(() => {
    try {
      const parsed = sizeChart?.data ? JSON.parse(sizeChart.data) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [sizeChart]);

  const columns = useMemo<string[]>(() => {
    return tableData.length > 0 ? Object.keys(tableData[0]) : [];
  }, [tableData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Ruler className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100">
              {sizeChart.name}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          <div className="prose prose-sm dark:prose-invert max-w-none mb-6">
            <p className="text-zinc-500">
              Use this chart to find your perfect fit. Measurements are in centimeters unless otherwise noted.
            </p>
          </div>

          <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded-lg">
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  {columns.map((col) => (
                    <th key={col} className="px-6 py-3 font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                {tableData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    {columns.map((col) => (
                      <td key={`${idx}-${col}`} className="px-6 py-3 text-zinc-600 dark:text-zinc-300 whitespace-nowrap">
                        {row[col]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
}
