'use client';

import { useState } from 'react';
import { FileUpload } from '@/components/ui/FileUpload';
import { Trash2, Plus, FileText } from 'lucide-react';

interface Document {
  name: string;
  url: string;
  type: string;
}

interface DocumentUploadListProps {
  value: string; // JSON string
  onChange: (value: string) => void;
}

export function DocumentUploadList({ value, onChange }: DocumentUploadListProps) {
  const documents: Document[] = value ? JSON.parse(value) : [];
  
  const [isAdding, setIsAdding] = useState(false);
  const [newDoc, setNewDoc] = useState<Document>({ name: '', url: '', type: 'license' });

  const handleDelete = (index: number) => {
    const newDocs = [...documents];
    newDocs.splice(index, 1);
    onChange(JSON.stringify(newDocs));
  };

  const handleAdd = () => {
    if (!newDoc.name || !newDoc.url) return;
    const newDocs = [...documents, newDoc];
    onChange(JSON.stringify(newDocs));
    setNewDoc({ name: '', url: '', type: 'license' });
    setIsAdding(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
         <label className="block text-sm font-medium text-gray-700">Documents</label>
         {!isAdding && (
             <button 
                type="button" 
                onClick={() => setIsAdding(true)}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
             >
                <Plus className="w-4 h-4" /> Add Document
             </button>
         )}
      </div>

      <div className="space-y-3">
        {documents.map((doc, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-zinc-50 border rounded-lg">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded">
                        <FileText className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="font-medium text-sm">{doc.name}</div>
                        <div className="text-xs text-zinc-500 capitalize">{doc.type}</div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <a href={doc.url} target="_blank" className="text-sm text-blue-600 hover:underline">View</a>
                    <button type="button" onClick={() => handleDelete(idx)} className="text-red-500 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        ))}
      </div>

      {isAdding && (
          <div className="p-4 border border-dashed border-blue-200 bg-blue-50/50 rounded-lg space-y-4">
              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="block text-xs font-medium mb-1">Document Name</label>
                      <input 
                        type="text" 
                        value={newDoc.name}
                        onChange={e => setNewDoc({ ...newDoc, name: e.target.value })}
                        className="w-full text-sm border rounded p-2"
                        placeholder="e.g. Business License"
                      />
                  </div>
                  <div>
                      <label className="block text-xs font-medium mb-1">Type</label>
                      <select 
                        value={newDoc.type}
                        onChange={e => setNewDoc({ ...newDoc, type: e.target.value })}
                        className="w-full text-sm border rounded p-2"
                      >
                          <option value="license">Business License</option>
                          <option value="permit">Reseller Permit</option>
                          <option value="cert">Certification</option>
                          <option value="other">Other</option>
                      </select>
                  </div>
              </div>
              
              <div>
                  <label className="block text-xs font-medium mb-1">File</label>
                  <FileUpload 
                    onUpload={(url) => setNewDoc({ ...newDoc, url })}
                    value={newDoc.url}
                    accept="application/pdf,image/*"
                    label=""
                  />
              </div>

              <div className="flex justify-end gap-2">
                  <button 
                    type="button" 
                    onClick={() => setIsAdding(false)}
                    className="text-sm px-3 py-1.5 text-zinc-600 hover:bg-zinc-100 rounded"
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    onClick={handleAdd}
                    disabled={!newDoc.name || !newDoc.url}
                    className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    Add
                  </button>
              </div>
          </div>
      )}
    </div>
  );
}
