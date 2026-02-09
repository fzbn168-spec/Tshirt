'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { Plus, Trash2, Edit, Save, X, ChevronRight, ChevronDown } from 'lucide-react';

interface AttributeValue {
  id: string;
  value: string; // JSON string
  meta?: string;
}

interface Attribute {
  id: string;
  name: string; // JSON string
  code: string;
  type: string;
  values: AttributeValue[];
}

export default function AttributesPage() {
  const { token, user } = useAuthStore();
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<Attribute | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    nameEn: '',
    nameZh: '',
    code: '',
    type: 'text',
  });

  const fetchAttributes = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${API_URL}/attributes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAttributes(data);
      }
    } catch (error) {
      console.error('Failed to fetch attributes', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttributes();
  }, [token]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure? This will delete all associated values.')) return;
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${API_URL}/attributes/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchAttributes();
      }
    } catch (error) {
      console.error('Failed to delete', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: JSON.stringify({ en: formData.nameEn, zh: formData.nameZh }),
      code: formData.code,
      type: formData.type,
    };

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const url = editingAttribute
        ? `${API_URL}/attributes/${editingAttribute.id}`
        : `${API_URL}/attributes`;
      
      const method = editingAttribute ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setEditingAttribute(null);
        setFormData({ nameEn: '', nameZh: '', code: '', type: 'text' });
        fetchAttributes();
      }
    } catch (error) {
      console.error('Failed to save', error);
    }
  };

  const openEdit = (attr: Attribute) => {
    const name = JSON.parse(attr.name);
    setFormData({
      nameEn: name.en || '',
      nameZh: name.zh || '',
      code: attr.code,
      type: attr.type,
    });
    setEditingAttribute(attr);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Attributes</h1>
        <button
          onClick={() => {
            setEditingAttribute(null);
            setFormData({ nameEn: '', nameZh: '', code: '', type: 'text' });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900"
        >
          <Plus className="h-4 w-4" />
          Add Attribute
        </button>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div>Loading...</div>
        ) : (
          attributes.map((attr) => (
            <AttributeCard 
              key={attr.id} 
              attribute={attr} 
              onDelete={() => handleDelete(attr.id)}
              onEdit={() => openEdit(attr)}
              refresh={fetchAttributes}
              token={token}
            />
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-zinc-900">
            <h2 className="mb-4 text-lg font-bold">
              {editingAttribute ? 'Edit Attribute' : 'New Attribute'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Name (EN)</label>
                  <input
                    required
                    value={formData.nameEn}
                    onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                    className="w-full rounded-md border p-2 text-sm dark:bg-zinc-800"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Name (ZH)</label>
                  <input
                    required
                    value={formData.nameZh}
                    onChange={(e) => setFormData({ ...formData, nameZh: e.target.value })}
                    className="w-full rounded-md border p-2 text-sm dark:bg-zinc-800"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Code (Unique)</label>
                <input
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full rounded-md border p-2 text-sm dark:bg-zinc-800"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full rounded-md border p-2 text-sm dark:bg-zinc-800"
                >
                  <option value="text">Text</option>
                  <option value="color">Color</option>
                  <option value="image">Image</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-md px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function AttributeCard({ attribute, onDelete, onEdit, refresh, token }: any) {
  const [expanded, setExpanded] = useState(false);
  const [newValue, setNewValue] = useState({ en: '', zh: '', meta: '' });
  const [adding, setAdding] = useState(false);

  const name = JSON.parse(attribute.name);

  const handleAddValue = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${API_URL}/attributes/${attribute.id}/values`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          value: JSON.stringify({ en: newValue.en, zh: newValue.zh }),
          meta: newValue.meta,
        }),
      });

      if (res.ok) {
        setNewValue({ en: '', zh: '', meta: '' });
        setAdding(false);
        refresh();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteValue = async (valueId: string) => {
    if (!confirm('Delete this value?')) return;
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${API_URL}/attributes/values/${valueId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) refresh();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm dark:bg-zinc-950">
      <div className="flex items-center justify-between">
        <div 
          className="flex cursor-pointer items-center gap-2"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <div>
            <h3 className="font-semibold">{name.en} <span className="text-zinc-400">/ {name.zh}</span></h3>
            <p className="text-xs text-zinc-500">Code: {attribute.code} • Type: {attribute.type}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onEdit} className="p-2 text-zinc-500 hover:text-blue-600">
            <Edit className="h-4 w-4" />
          </button>
          <button onClick={onDelete} className="p-2 text-zinc-500 hover:text-red-600">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 border-t pt-4">
          <div className="mb-4 flex flex-wrap gap-2">
            {attribute.values.map((val: any) => {
              const valName = JSON.parse(val.value);
              return (
                <div key={val.id} className="group relative flex items-center gap-2 rounded-full border bg-zinc-50 px-3 py-1 text-sm dark:bg-zinc-900">
                  {attribute.type === 'color' && val.meta && (
                    <span 
                      className="h-3 w-3 rounded-full border border-zinc-200" 
                      style={{ backgroundColor: val.meta }}
                    />
                  )}
                  <span>{valName.en}</span>
                  <button 
                    onClick={() => handleDeleteValue(val.id)}
                    className="ml-1 hidden text-red-500 hover:text-red-700 group-hover:block"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
            <button
              onClick={() => setAdding(true)}
              className="flex items-center gap-1 rounded-full border border-dashed px-3 py-1 text-sm text-zinc-500 hover:border-blue-500 hover:text-blue-500"
            >
              <Plus className="h-3 w-3" /> Add Value
            </button>
          </div>

          {adding && (
            <form onSubmit={handleAddValue} className="flex items-end gap-2 rounded-md bg-zinc-50 p-3 dark:bg-zinc-900">
              <div className="grid flex-1 grid-cols-3 gap-2">
                <div>
                  <label className="text-xs">Value (EN)</label>
                  <input
                    required
                    value={newValue.en}
                    onChange={(e) => setNewValue({ ...newValue, en: e.target.value })}
                    className="w-full rounded border px-2 py-1 text-sm"
                    placeholder="Red"
                  />
                </div>
                <div>
                  <label className="text-xs">Value (ZH)</label>
                  <input
                    required
                    value={newValue.zh}
                    onChange={(e) => setNewValue({ ...newValue, zh: e.target.value })}
                    className="w-full rounded border px-2 py-1 text-sm"
                    placeholder="红色"
                  />
                </div>
                {attribute.type === 'color' && (
                  <div>
                    <label className="text-xs">Color Hex</label>
                    <input
                      type="color"
                      value={newValue.meta || '#000000'}
                      onChange={(e) => setNewValue({ ...newValue, meta: e.target.value })}
                      className="h-[30px] w-full rounded border px-1"
                    />
                  </div>
                )}
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setAdding(false)}
                  className="rounded border bg-white px-3 py-1 text-sm hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
