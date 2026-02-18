'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@/navigation';
import api from '@/lib/axios';
import { Button } from '@/components/button';
import { Loader2, Users, Check, X, UserPlus } from 'lucide-react';
import { useToastStore } from '@/store/useToastStore';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface Company {
  id: string;
  name: string;
  contactEmail: string;
  status: string;
  salesRepId?: string;
  salesRep?: {
    id: string;
    fullName: string;
  };
  _count: {
    users: number;
    inquiries: number;
  };
  createdAt: string;
}

interface SalesRep {
  id: string;
  fullName: string;
  email: string;
}

export default function CompaniesPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedRep, setSelectedRep] = useState<string>('');

  // Fetch Companies
  const { data: companies, isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const res = await api.get('/platform/companies');
      return res.data;
    },
  });

  // Fetch Sales Reps
  const { data: salesReps } = useQuery({
    queryKey: ['sales-reps'],
    queryFn: async () => {
      const res = await api.get('/platform/sales-reps');
      return res.data;
    },
  });

  // Assign Sales Rep Mutation
  const assignMutation = useMutation({
    mutationFn: async ({ companyId, salesRepId }: { companyId: string; salesRepId: string }) => {
      await api.patch(`/platform/companies/${companyId}/sales-rep`, { salesRepId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      addToast('Sales representative assigned successfully', 'success');
      setEditingId(null);
      setSelectedRep('');
    },
    onError: () => {
      addToast('Failed to assign sales representative', 'error');
    },
  });

  // Update Status Mutation
  const statusMutation = useMutation({
    mutationFn: async ({ companyId, status }: { companyId: string; status: string }) => {
      await api.patch(`/platform/companies/${companyId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      addToast('Company status updated', 'success');
    },
  });

  const handleAssign = (companyId: string) => {
    if (!selectedRep) return;
    assignMutation.mutate({ companyId, salesRepId: selectedRep });
  };

  const handleStatusChange = (companyId: string, newStatus: string) => {
    if (confirm(`Change status to ${newStatus}?`)) {
      statusMutation.mutate({ companyId, status: newStatus });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Companies
          </h1>
          <p className="text-zinc-500">Manage B2B customers and sales assignments</p>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-800">
            <tr>
              <th className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">Company Name</th>
              <th className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">Contact</th>
              <th className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">Status</th>
              <th className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">Sales Rep</th>
              <th className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">Stats</th>
              <th className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {companies?.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
                  No companies found.
                </td>
              </tr>
            ) : (
              companies?.map((company: Company) => (
                <tr key={company.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="px-6 py-4 font-medium">{company.name}</td>
                  <td className="px-6 py-4 text-zinc-500">{company.contactEmail}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                      company.status === 'APPROVED' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                      company.status === 'REJECTED' ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                    )}>
                      {company.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {editingId === company.id ? (
                      <div className="flex items-center gap-2">
                        <select 
                          className="h-8 rounded-md border border-zinc-200 bg-transparent text-sm"
                          value={selectedRep}
                          onChange={(e) => setSelectedRep(e.target.value)}
                        >
                          <option value="">Select Rep...</option>
                          {salesReps?.map((rep: SalesRep) => (
                            <option key={rep.id} value={rep.id}>{rep.fullName}</option>
                          ))}
                        </select>
                        <button onClick={() => handleAssign(company.id)} className="text-green-600">
                          <Check className="h-4 w-4" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="text-red-600">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 group">
                        <span className="text-zinc-600 dark:text-zinc-400">
                          {company.salesRep?.fullName || 'Unassigned'}
                        </span>
                        <button 
                          onClick={() => {
                            setEditingId(company.id);
                            setSelectedRep(company.salesRepId || '');
                          }}
                          className="opacity-0 group-hover:opacity-100 text-blue-600 hover:bg-blue-50 rounded p-1 transition-all"
                        >
                          <UserPlus className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-zinc-500 text-xs">
                    <div>Users: {company._count.users}</div>
                    <div>Inquiries: {company._count.inquiries}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {company.status === 'PENDING' && (
                      <div className="flex justify-end gap-2">
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700 h-8 text-xs"
                          onClick={() => handleStatusChange(company.id, 'APPROVED')}
                        >
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-red-600 border-red-200 hover:bg-red-50 h-8 text-xs"
                          onClick={() => handleStatusChange(company.id, 'REJECTED')}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
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
