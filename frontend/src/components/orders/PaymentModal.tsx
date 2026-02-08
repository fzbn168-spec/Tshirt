'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { FileUpload } from '@/components/ui/FileUpload';
import { X } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (method: string, proofUrl?: string) => Promise<void>;
  amount: number;
  currency: string;
}

export function PaymentModal({ isOpen, onClose, onSubmit, amount, currency }: PaymentModalProps) {
  const [method, setMethod] = useState('WIRE');
  const [proofUrl, setProofUrl] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(method, proofUrl);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl w-full max-w-md p-6 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold mb-4">Make Payment</h2>
        
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Total Amount</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {currency} {amount.toFixed(2)}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Payment Method</label>
            <select 
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:border-zinc-700"
            >
              <option value="WIRE">Offline Transfer (Bank Wire)</option>
              {/* <option value="STRIPE">Credit Card (Stripe)</option> */}
            </select>
          </div>

          {method === 'WIRE' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium">Upload Transfer Proof</label>
              <FileUpload 
                value={proofUrl}
                onUpload={setProofUrl}
                label="Upload Receipt (Image/PDF)"
              />
              <p className="text-xs text-zinc-500">
                Please upload the bank transfer receipt. We will verify it within 24 hours.
              </p>
            </div>
          )}

          <div className="pt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 rounded-md dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (method === 'WIRE' && !proofUrl)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Submit Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
