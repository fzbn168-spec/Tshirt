'use client';

import { useCartStore } from '@/store/useCartStore';
import { useCurrencyStore } from '@/store/useCurrencyStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useToastStore } from '@/store/useToastStore';
import { Minus, Plus, Trash2, Send, Upload, X, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useRef } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';
import api from '@/lib/api';

export default function RFQCartPage() {
  const { items, updateQuantity, removeItem, clearCart, totalPrice, totalItems, getCartType } = useCartStore();
  const { format } = useCurrencyStore();
  const { user, token } = useAuthStore();
  const { addToast } = useToastStore();
  const { trackEvent } = useAnalytics();
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    if (items.length > 0) {
      trackEvent('INITIATE_CHECKOUT', {
        cartValue: totalPrice(),
        itemCount: totalItems(),
        cartType: getCartType()
      });
    }
  }, [items.length, trackEvent, getCartType, totalItems, totalPrice]);

  if (!mounted) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
        addToast('Please login to submit an inquiry', 'error');
        return;
    }

    setIsSubmitting(true);

    const formData = new FormData(e.target as HTMLFormElement);
    const uploadedUrls: string[] = [];

    try {
        // 1. Upload Attachments if any
        if (attachments.length > 0) {
            // Loop upload for simplicity as per original logic
            for (const file of attachments) {
                const fData = new FormData();
                fData.append('file', file);
                const upRes = await api.post('/uploads', fData, {
                  headers: { 'Content-Type': 'multipart/form-data' }
                });
                uploadedUrls.push(upRes.data.url);
            }
        }

        const data = {
                contactName: formData.get('companyName') as string,
                contactEmail: formData.get('email') as string,
                notes: formData.get('notes') as string,
                attachments: JSON.stringify(uploadedUrls),
                type: getCartType() || 'STANDARD',
                items: items.map(item => ({
                productId: item.productId,
                productName: item.productName,
                skuId: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.skuId) ? item.skuId : undefined,
                skuSpecs: item.specs || `Color: ${item.color || 'N/A'}, Size: ${item.size || 'N/A'}`,
                quantity: Number(item.quantity),
                price: Number(item.price)
            }))
        };

        await api.post('/inquiries', data);

        setSubmitted(true);
        trackEvent('PURCHASE', {
            transactionId: Date.now().toString(), // Using timestamp as mock ID since Inquiry ID isn't returned in simple response
            value: totalPrice(),
            currency: 'USD',
            items: items.map(i => ({
                id: i.productId,
                sku: i.skuCode,
                quantity: i.quantity,
                price: i.price
            }))
        });
        clearCart();
        addToast('Inquiry submitted successfully!', 'success');
    } catch (error) {
        console.error(error);
        addToast('Failed to submit inquiry. Please try again.', 'error');
    } finally {
        setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-lg">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Send className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold mb-4">Inquiry Sent Successfully!</h1>
        <p className="text-zinc-500 mb-8">
          We have received your request for quotation. Our sales team will review your requirements and get back to you within 24 hours.
        </p>
        <Link 
          href="/" 
          className="inline-flex items-center justify-center h-12 px-8 font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
        >
          Continue Sourcing
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Your RFQ Cart is Empty</h1>
        <p className="text-zinc-500 mb-8">Browse our catalog to find products you want to source.</p>
        <Link 
          href="/" 
          className="inline-flex items-center justify-center h-12 px-8 font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
        >
          Start Sourcing
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <h1 className="text-2xl font-bold">Request for Quotation</h1>
        {getCartType() === 'SAMPLE' && (
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold border border-purple-200">
                SAMPLE ORDER
            </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex justify-between items-center">
              <span className="font-medium text-sm text-zinc-500">Product Details</span>
              <span className="font-medium text-sm text-zinc-500 hidden sm:block">Quantity</span>
            </div>
            
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {items.map((item) => (
                <div key={item.id} className="p-4 flex gap-4">
                  <div className="w-20 h-20 bg-zinc-100 rounded-md relative overflow-hidden shrink-0">
                    <Image 
                      src={item.image} 
                      alt={item.productName} 
                      fill 
                      className="object-cover"
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium truncate pr-4">{item.productName}</h3>
                      <button 
                        onClick={() => removeItem(item.id)}
                        className="text-zinc-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="text-sm text-zinc-500 mb-4">
                      {item.specs ? item.specs : (
                        <>Color: {item.color} <span className="mx-2">|</span> Size: {item.size}</>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-start sm:gap-8">
                      <div className="font-bold text-blue-600">
                        ${Number(item.price).toFixed(2)}
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 hover:bg-zinc-200"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 hover:bg-zinc-200"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Submission Form */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 sticky top-24">
            <h2 className="text-lg font-bold mb-6">Inquiry Summary</h2>
            
            <div className="space-y-3 mb-6 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Total Items</span>
                <span className="font-medium">{items.length} SKUs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Total Quantity</span>
                <span className="font-medium">{totalItems()} Pairs</span>
              </div>
              <div className="flex justify-between border-t pt-3 mt-3">
                <span className="font-bold">Estimated Value</span>
                <span className="font-bold text-lg text-blue-600">{format(totalPrice())}</span>
              </div>
              <p className="text-xs text-zinc-400 mt-2">
                * Final price including shipping will be confirmed in the official quotation.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                        <label className="block text-sm font-medium mb-1">Company Name</label>
                        <input
                          name="companyName"
                          type="text"
                          required
                          defaultValue={user?.company?.name || ''}
                          className="w-full h-10 rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-900"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Email Address</label>
                        <input
                          name="email"
                          type="email"
                          required
                          defaultValue={user?.email || ''}
                          className="w-full h-10 rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-900"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Additional Notes</label>
                        <textarea
                          name="notes"
                          rows={3}
                          className="w-full rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-900"
                          placeholder="Specific requirements, shipping destination, etc."
                        />
                      </div>

                      {/* File Upload Section */}
                      <div>
                        <label className="block text-sm font-medium mb-1">Attachments (Logo, Design)</label>
                        <input 
                            type="file" 
                            multiple
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileChange}
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full h-10 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-md flex items-center justify-center gap-2 text-zinc-500 hover:text-zinc-700 hover:border-zinc-400 dark:hover:text-zinc-300 transition-colors"
                        >
                            <Upload className="w-4 h-4" />
                            <span className="text-sm">Upload Files</span>
                        </button>
                        
                        {attachments.length > 0 && (
                            <div className="mt-2 space-y-2">
                                {attachments.map((file, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-sm bg-zinc-50 dark:bg-zinc-800 p-2 rounded">
                                        <span className="truncate max-w-[200px]">{file.name}</span>
                                        <button 
                                            type="button"
                                            onClick={() => removeAttachment(idx)}
                                            className="text-zinc-400 hover:text-red-500"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                      </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Sending...' : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Inquiry
                  </>
                )}
              </button>

              {/* WhatsApp Quick Action */}
              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 text-center">
                <p className="text-xs text-zinc-500 mb-3">Need a faster response?</p>
                <a 
                  href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '8613800000000'}?text=${encodeURIComponent(`Hi, I am interested in ${items.length} items (Value: ${format(totalPrice())}) from SoleTrade.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-10 border border-green-500 text-green-600 rounded-md font-medium hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  Chat on WhatsApp
                </a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
