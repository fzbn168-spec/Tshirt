'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { Check, X, Clock, AlertCircle, Users, Filter, User } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface SalesRep {
  id: string;
  fullName: string;
  email: string;
}

interface Company {
  id: string;
  name: string;
  contactEmail: string;
  taxId?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  documents?: string; // JSON string
  salesRepId?: string;
  salesRep?: SalesRep;
  createdAt: string;
  _count: {
    users: number;
    inquiries: number;
  };
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter State
  const [viewMode, setViewMode] = useState<'ALL' | 'MY'>('ALL');
  const [selectedSalesRepFilter, setSelectedSalesRepFilter] = useState<string>('');

  const { token, user } = useAuthStore();
  const t = useTranslations('Admin');

  // Helper to parse documents
  const getLicenseUrl = (docsStr?: string) => {
    try {
      if (!docsStr) return null;
      const docs = JSON.parse(docsStr);
      const license = docs.find((d: any) => d.type === 'license');
      return license ? license.url : null;
    } catch {
      return null;
    }
  };

  const fetchSalesReps = async () => {
    try {
      const res = await fetch('http://localhost:3001/platform/sales-reps', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSalesReps(data);
      }
    } catch (err) {
      console.error('Failed to fetch sales reps', err);
    }
  };

  const fetchCompanies = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Build query params
      const params = new URLSearchParams();
      
      if (viewMode === 'MY' && user?.id) {
        params.append('salesRepId', user.id);
      } else if (selectedSalesRepFilter) {
        params.append('salesRepId', selectedSalesRepFilter);
      }

      const res = await fetch(`http://localhost:3001/platform/companies?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Failed to fetch companies');
      const data = await res.json();
      setCompanies(data);
    } catch (err: any) {
      console.error(err.message);
      setError('Failed to load companies. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchSalesReps();
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchCompanies();
    }
  }, [token, viewMode, selectedSalesRepFilter]);

  const handleAssignSalesRep = async (companyId: string, salesRepId: string) => {
    try {
      const res = await fetch(`http://localhost:3001/platform/companies/${companyId}/sales-rep`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ salesRepId })
      });

      if (!res.ok) throw new Error('Failed to assign sales rep');

      // Update local state
      const updatedRep = salesReps.find(r => r.id === salesRepId);
      setCompanies(companies.map(c => 
        c.id === companyId ? { ...c, salesRepId, salesRep: updatedRep } : c
      ));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleStatusUpdate = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await fetch(`http://localhost:3001/platform/companies/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      
      if (!res.ok) throw new Error('Failed to update status');
      
      // Refresh list locally
      setCompanies(companies.map(c => 
        c.id === id ? { ...c, status } : c
      ));
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (isLoading) return <div>{t('loading')}</div>;

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2">
        <AlertCircle className="w-5 h-5" />
        {error}
        <button onClick={fetchCompanies} className="underline ml-2">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t('companyTitle')}</h2>
        <p className="text-zinc-500">{t('companySubtitle')}</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white dark:bg-zinc-900 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('ALL')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                viewMode === 'ALL' 
                  ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-100' 
                  : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
            >
              All Customers
            </button>
            <button
              onClick={() => setViewMode('MY')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                viewMode === 'MY' 
                  ? 'bg-white dark:bg-zinc-700 shadow-sm text-blue-600 dark:text-blue-400' 
                  : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
            >
              My Customers
            </button>
          </div>

          {viewMode === 'ALL' && (
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <select
                value={selectedSalesRepFilter}
                onChange={(e) => setSelectedSalesRepFilter(e.target.value)}
                className="pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm appearance-none min-w-[180px]"
              >
                <option value="">Filter by Sales Rep</option>
                {salesReps.map(rep => (
                  <option key={rep.id} value={rep.id}>{rep.fullName || rep.email}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
            <tr>
              <th className="px-6 py-3 font-medium text-zinc-500">{t('table.companyName')}</th>
              <th className="px-6 py-3 font-medium text-zinc-500">{t('table.contactEmail')}</th>
              <th className="px-6 py-3 font-medium text-zinc-500">{t('table.status')}</th>
              <th className="px-6 py-3 font-medium text-zinc-500">Sales Rep</th>
              <th className="px-6 py-3 font-medium text-zinc-500">{t('table.documents')}</th>
              <th className="px-6 py-3 font-medium text-zinc-500">{t('table.stats')}</th>
              <th className="px-6 py-3 font-medium text-zinc-500">{t('table.registered')}</th>
              <th className="px-6 py-3 font-medium text-zinc-500 text-right">{t('table.action')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {companies.map((company) => (
              <tr key={company.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                <td className="px-6 py-4 font-medium">
                  {company.name}
                  {company.taxId && <span className="block text-xs text-zinc-400 mt-1">{t('common.taxId')}: {company.taxId}</span>}
                </td>
                <td className="px-6 py-4 text-zinc-500">{company.contactEmail}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    company.status === 'APPROVED' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                      : company.status === 'REJECTED'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                  }`}>
                    {company.status === 'APPROVED' && <Check className="w-3 h-3" />}
                    {company.status === 'REJECTED' && <X className="w-3 h-3" />}
                    {company.status === 'PENDING' && <Clock className="w-3 h-3" />}
                    {t(`status.${company.status}`)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-zinc-400" />
                    <select
                      value={company.salesRepId || ''}
                      onChange={(e) => handleAssignSalesRep(company.id, e.target.value)}
                      className="bg-transparent border-none text-sm focus:ring-0 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded px-2 py-1 -ml-2"
                    >
                      <option value="">Unassigned</option>
                      {salesReps.map(rep => (
                        <option key={rep.id} value={rep.id}>{rep.fullName || rep.email}</option>
                      ))}
                    </select>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {getLicenseUrl(company.documents) ? (
                    <a 
                      href={getLicenseUrl(company.documents)!} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      View License
                    </a>
                  ) : (
                    <span className="text-zinc-400 text-sm">No documents</span>
                  )}
                </td>
                <td className="px-6 py-4 text-zinc-500">
                  <div className="flex gap-4">
                    <span title="Users">{company._count.users} {t('common.users')}</span>
                    <span title="Inquiries">{company._count.inquiries} {t('common.rfqs')}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-zinc-500">
                  {new Date(company.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  {company.status === 'PENDING' && (
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleStatusUpdate(company.id, 'APPROVED')}
                        className="text-green-600 hover:bg-green-50 p-1.5 rounded-md transition-colors"
                        title={t('actions.approve')}
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleStatusUpdate(company.id, 'REJECTED')}
                        className="text-red-600 hover:bg-red-50 p-1.5 rounded-md transition-colors"
                        title={t('actions.reject')}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {companies.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-zinc-500">
                  {t('noCompanies')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
