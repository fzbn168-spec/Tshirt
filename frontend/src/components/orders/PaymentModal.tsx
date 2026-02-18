'use client';

import { useState, useEffect } from 'react';
import { FileUpload } from '@/components/ui/FileUpload';
import { X } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';
import { BANK_INFO, WESTERN_UNION_INFO } from '@/config/payment-methods';

// Initialize Stripe outside of component to avoid recreation
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (method: string, proofUrl?: string) => Promise<void>;
  amount: number;
  currency: string;
  orderId: string;
}

function StripePaymentForm({ onSuccess }: { onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard/orders`,
      },
      redirect: 'if_required',
    });

    if (submitError) {
      setError(submitError.message || 'An unexpected error occurred.');
      setProcessing(false);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
      >
        {processing ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  );
}

export function PaymentModal({ isOpen, onClose, onSubmit, amount, currency, orderId }: PaymentModalProps) {
  const [method, setMethod] = useState('WIRE');
  const [proofUrl, setProofUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuthStore();

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setMethod('WIRE');
      setClientSecret(null);
      setProofUrl('');
      setError(null);
    }
  }, [isOpen]);

  // Fetch PaymentIntent when switching to Stripe
  useEffect(() => {
    if (method === 'STRIPE' && isOpen && !clientSecret) {
      const fetchPaymentIntent = async () => {
        try {
          const { data } = await api.post('/stripe/create-payment-intent', {
            amount,
            currency,
            orderId
          });
          // Check if it's a mock response
          if (data.mock) {
             console.warn('Using Mock Payment Intent');
             setClientSecret(data.clientSecret); 
          } else {
             setClientSecret(data.clientSecret);
          }
        } catch (err) {
          console.error(err);
          setError('Failed to initialize Stripe payment');
        }
      };
      fetchPaymentIntent();
    }
  }, [method, isOpen, amount, currency, orderId, token, clientSecret]);

  if (!isOpen) return null;

  const handleWireSubmit = async (e: React.FormEvent) => {
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

  const handleStripeSuccess = () => {
    alert('Payment Successful!');
    onClose();
    window.location.reload(); 
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto">
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

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Payment Method</label>
          <select 
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:border-zinc-700"
          >
            <option value="WIRE">Offline Transfer (Bank Wire)</option>
            <option value="STRIPE">Credit Card (Stripe)</option>
          </select>
        </div>

        {method === 'STRIPE' ? (
          <div className="mt-4">
             {clientSecret ? (
               clientSecret.startsWith('mock_') ? (
                  <div className="p-4 bg-yellow-50 text-yellow-800 rounded-md">
                    <p className="mb-2">Stripe is in Mock Mode (No API Key).</p>
                    <button 
                      onClick={handleStripeSuccess}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-md"
                    >
                      Simulate Success
                    </button>
                  </div>
               ) : (
                 <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <StripePaymentForm onSuccess={handleStripeSuccess} />
                 </Elements>
               )
             ) : (
               <div className="text-center py-4">Loading Stripe...</div>
             )}
             {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
          </div>
        ) : (
          <form onSubmit={handleWireSubmit} className="space-y-4">
            
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-md space-y-3 text-sm border dark:border-zinc-700">
                <h3 className="font-semibold border-b pb-2 dark:border-zinc-700">Beneficiary Information</h3>
                
                <div className="grid grid-cols-2 gap-y-1 gap-x-4">
                    <div className="col-span-2 font-medium text-blue-600 mb-1">Bank Transfer (T/T)</div>
                    <div className="text-zinc-500">Bank Name:</div>
                    <div className="font-medium text-right">{BANK_INFO.bankName}</div>
                    <div className="text-zinc-500">Account No:</div>
                    <div className="font-medium text-right font-mono">{BANK_INFO.accountNo}</div>
                    <div className="text-zinc-500">Swift Code:</div>
                    <div className="font-medium text-right font-mono">{BANK_INFO.swiftCode}</div>
                    <div className="text-zinc-500">Beneficiary:</div>
                    <div className="font-medium text-right">{BANK_INFO.accountName}</div>
                </div>

                <div className="border-t pt-2 dark:border-zinc-700">
                    <div className="font-medium text-blue-600 mb-1">Western Union / MoneyGram</div>
                    <div className="grid grid-cols-2 gap-y-1 gap-x-4">
                        <div className="text-zinc-500">Receiver:</div>
                        <div className="font-medium text-right">{WESTERN_UNION_INFO.receiverName}</div>
                        <div className="text-zinc-500">City/Country:</div>
                        <div className="font-medium text-right">{WESTERN_UNION_INFO.city}, {WESTERN_UNION_INFO.country}</div>
                    </div>
                </div>
            </div>

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
                disabled={loading || !proofUrl}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit Payment'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
