'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { FileUpload } from '@/components/ui/FileUpload';
import { DocumentUploadList } from '@/components/profile/DocumentUploadList';
import { useTranslations } from 'next-intl';

export default function ProfilePage() {
  const t = useTranslations('Profile');
  useAuthStore(); // ensure auth initialized if needed
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    taxId: '',
    address: '',
    contactEmail: '',
    phone: '',
    website: '',
    description: '',
    logo: '',
    documents: '', // JSON string
  });
  const [message, setMessage] = useState('');

  const fetchProfile = useCallback(async () => {
    try {
      const res = await api.get('/companies/profile');
      const data = res.data;
      setFormData({
        name: data.name || '',
        taxId: data.taxId || '',
        address: data.address || '',
        contactEmail: data.contactEmail || '',
        phone: data.phone || '',
        website: data.website || '',
        description: data.description || '',
        logo: data.logo || '',
        documents: data.documents || '',
      });
    } catch (err) {
      console.error(err);
      setMessage(t('loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await api.patch('/companies/profile', formData);
      setMessage(t('updateSuccess'));
    } catch (err) {
      console.error(err);
      setMessage(t('updateError'));
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (loading) return <div>{t('loading')}</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">{t('title')}</h1>
      {message && <div className={`p-4 mb-4 rounded ${message.includes('success') || message === t('updateSuccess') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{message}</div>}
      
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('companyName')}</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('taxId')}</label>
            <input type="text" name="taxId" value={formData.taxId} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('email')}</label>
            <input type="email" name="contactEmail" value={formData.contactEmail} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" disabled />
            <p className="text-xs text-gray-500 mt-1">{t('emailHint')}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('phone')}</label>
            <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">{t('address')}</label>
            <input type="text" name="address" value={formData.address} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">{t('website')}</label>
            <input type="text" name="website" value={formData.website} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
          </div>
           <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">{t('description')}</label>
            <textarea name="description" rows={3} value={formData.description} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
          </div>
          <div className="md:col-span-2">
            <FileUpload 
                label={t('logo')}
                value={formData.logo}
                onUpload={(url) => setFormData(prev => ({ ...prev, logo: url }))}
                accept="image/*"
            />
          </div>
          <div className="md:col-span-2">
            <DocumentUploadList 
                value={formData.documents}
                onChange={(docsStr) => setFormData(prev => ({ ...prev, documents: docsStr }))}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50">
            {saving ? t('saving') : t('save')}
          </button>
        </div>
      </form>
    </div>
  );
}
