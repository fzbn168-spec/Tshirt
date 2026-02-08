'use client';

import { Search, Filter, MoreHorizontal, Loader2, Eye, Upload, FileDown } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Inquiry {
  id: string;
  inquiryNo: string;
  contactName: string;
  status: string;
  createdAt: string;
  items: {
    productName: string;
    quantity: number;
  }[];
}

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuthStore();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const fetchInquiries = () => {
    setLoading(true);
    fetch(`${API_URL}/inquiries`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => {
        if (res.status === 401) {
             throw new Error('Unauthorized');
        }
        return res.json();
      })
      .then(data => {
        setInquiries(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (!token) return;
    fetchInquiries();
  }, [token]);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
        setLoading(true);
        const res = await fetch(`${API_URL}/inquiries/import`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Import failed');
        }
        
        alert('Import successful!');
        fetchInquiries();
    } catch (err: any) {
        alert(err.message);
        setLoading(false);
    } finally {
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }
  };

  const downloadTemplate = () => {
    const csvContent = "SkuCode,Quantity,TargetPrice\nSKU-001,100,50.00\nSKU-002,200,";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inquiry_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
          <input 
            type="text" 
            placeholder="Search inquiries..." 
            className="pl-9 pr-4 h-10 w-full sm:w-80 rounded-md border border-zinc-200 bg-white dark:bg-zinc-900 text-sm outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md text-sm font-medium hover:bg-zinc-50">
            <Filter className="w-4 h-4" />
            Filter
          </button>
          
          <input 
             type="file" 
             ref={fileInputRef} 
             className="hidden" 
             accept=".xlsx,.xls,.csv" 
             onChange={handleImport}
          />
          <button 
             onClick={() => fileInputRef.current?.click()}
             className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md text-sm font-medium hover:bg-zinc-50"
          >
             <Upload className="w-4 h-4" />
             Import Excel
          </button>
          <button 
             onClick={downloadTemplate}
             className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md text-sm font-medium hover:bg-zinc-50"
          >
             <FileDown className="w-4 h-4" />
             Template
          </button>

          <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
            New Inquiry
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 font-medium">
              <tr>
                <th className="px-6 py-4">Inquiry ID</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Products</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading inquiries...
                  </td>
                </tr>
              ) : inquiries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
                    No inquiries found.
                  </td>
                </tr>
              ) : (
                inquiries.map((inquiry) => (
                  <tr key={inquiry.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium">{inquiry.inquiryNo}</td>
                    <td className="px-6 py-4">{inquiry.contactName}</td>
                    <td className="px-6 py-4 max-w-xs truncate">
                      {inquiry.items.map(item => `${item.productName} (${item.quantity})`).join(', ')}
                    </td>
                    <td className="px-6 py-4 text-zinc-500">
                      {new Date(inquiry.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        inquiry.status === 'QUOTED' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {inquiry.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                         <Link 
                            href={`/dashboard/inquiries/${inquiry.id}`}
                            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-500 hover:text-blue-600"
                            title="View Details"
                         >
                            <Eye className="w-4 h-4" />
                         </Link>
                         <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-500">
                            <MoreHorizontal className="w-4 h-4" />
                         </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
