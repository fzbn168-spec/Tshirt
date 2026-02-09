'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, X } from 'lucide-react';

interface TierPrice {
  minQty: number;
  price: number;
}

interface TierPriceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialValue: string; // JSON string
  onSave: (value: string) => void;
}

export function TierPriceDialog({ isOpen, onClose, initialValue, onSave }: TierPriceDialogProps) {
  const [tiers, setTiers] = useState<TierPrice[]>([]);
  const [newQty, setNewQty] = useState('');
  const [newPrice, setNewPrice] = useState('');

  useEffect(() => {
    if (isOpen) {
      try {
        const parsed = JSON.parse(initialValue || '[]');
        if (Array.isArray(parsed)) {
          setTiers(parsed);
        } else {
          setTiers([]);
        }
      } catch (e) {
        setTiers([]);
      }
      setNewQty('');
      setNewPrice('');
    }
  }, [isOpen, initialValue]);

  const handleAdd = () => {
    const qty = parseInt(newQty);
    const price = parseFloat(newPrice);
    
    if (isNaN(qty) || isNaN(price) || qty <= 0 || price < 0) {
      alert('Please enter valid quantity and price');
      return;
    }

    // Check duplicate qty
    if (tiers.some(t => t.minQty === qty)) {
      alert('A tier with this quantity already exists');
      return;
    }

    const newTiers = [...tiers, { minQty: qty, price }];
    // Sort by qty
    newTiers.sort((a, b) => a.minQty - b.minQty);
    setTiers(newTiers);
    setNewQty('');
    setNewPrice('');
  };

  const handleDelete = (index: number) => {
    const newTiers = tiers.filter((_, i) => i !== index);
    setTiers(newTiers);
  };

  const handleSave = () => {
    onSave(JSON.stringify(tiers));
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-lg shadow-xl p-6 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Manage Volume Pricing</h3>
          <button type="button" onClick={onClose} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Add New Row */}
          <div className="flex gap-2 items-end bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-md">
            <div className="flex-1">
              <label className="text-xs text-zinc-500 mb-1 block">Min Qty</label>
              <input 
                type="number" 
                value={newQty}
                onChange={e => setNewQty(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-zinc-200 dark:border-zinc-700 rounded"
                placeholder="e.g. 10"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-zinc-500 mb-1 block">Price ($)</label>
              <input 
                type="number" 
                value={newPrice}
                onChange={e => setNewPrice(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-zinc-200 dark:border-zinc-700 rounded"
                placeholder="e.g. 9.50"
              />
            </div>
            <button 
              type="button"
              onClick={handleAdd}
              className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 flex items-center gap-1 h-[34px]"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>

          {/* List */}
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-800">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-zinc-500">Min Qty</th>
                  <th className="px-4 py-2 text-left font-medium text-zinc-500">Unit Price</th>
                  <th className="px-4 py-2 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {tiers.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-4 text-center text-zinc-500">
                      No tiered prices configured
                    </td>
                  </tr>
                ) : (
                  tiers.map((tier, idx) => (
                    <tr key={idx} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                      <td className="px-4 py-2">{tier.minQty}+</td>
                      <td className="px-4 py-2">${tier.price.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right">
                        <button 
                          type="button"
                          onClick={() => handleDelete(idx)}
                          className="text-zinc-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button 
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900"
          >
            Cancel
          </button>
          <button 
            type="button"
            onClick={handleSave}
            className="px-4 py-2 bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900 rounded-md text-sm font-medium hover:opacity-90"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}
