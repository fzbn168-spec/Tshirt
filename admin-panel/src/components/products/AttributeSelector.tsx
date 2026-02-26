
'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Button } from '@/components/button';
import { Plus, X, Check, Loader2, Trash2 } from 'lucide-react';
import { useToastStore } from '@/store/useToastStore';
import { Input } from '@/components/input';

interface AttributeValue {
  id: string;
  value: string; // JSON string or plain text
  meta?: string;
}

interface Attribute {
  id: string;
  name: string; // JSON string
  code: string;
  type: string;
  values: AttributeValue[];
}

interface SelectedAttribute {
  attributeId: string;
  attributeName: string; // En
  attributeCode: string;
  selectedValues: AttributeValue[];
}

interface AttributeSelectorProps {
  onChange: (attributes: SelectedAttribute[]) => void;
  initialAttributes?: SelectedAttribute[];
}

export default function AttributeSelector({ onChange, initialAttributes = [] }: AttributeSelectorProps) {
  const { addToast } = useToastStore();
  const queryClient = useQueryClient();
  const [selectedAttributes, setSelectedAttributes] = useState<SelectedAttribute[]>(initialAttributes);
  
  // Quick Add Value State
  const [addingValueTo, setAddingValueTo] = useState<string | null>(null); // attributeId
  const [newValueName, setNewValueName] = useState('');

  // Fetch all available attributes
  const { data: availableAttributes, isLoading } = useQuery({
    queryKey: ['attributes'],
    queryFn: async () => {
      const res = await api.get<Attribute[]>('/attributes');
      return res.data;
    },
  });

  const addValueMutation = useMutation({
    mutationFn: async ({ attrId, value }: { attrId: string, value: string }) => {
      const payload = {
         value: JSON.stringify({ en: value, zh: value }) 
      };
      return api.post(`/attributes/${attrId}/values`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attributes'] });
      addToast('Value added successfully', 'success');
      setAddingValueTo(null);
      setNewValueName('');
    },
    onError: () => {
        addToast('Failed to add value', 'error');
    }
  });

  const handleAddValue = (attrId: string) => {
    if (!newValueName.trim()) return;
    addValueMutation.mutate({ attrId, value: newValueName });
  };

  useEffect(() => {
    onChange(selectedAttributes);
  }, [selectedAttributes]);

  const handleAddAttribute = () => {
    if (!availableAttributes) return;
    
    // Find first unselected attribute
    const unselected = availableAttributes.find(
      attr => !selectedAttributes.find(sa => sa.attributeId === attr.id)
    );

    if (unselected) {
      const name = parseName(unselected.name);
      setSelectedAttributes([
        ...selectedAttributes,
        {
          attributeId: unselected.id,
          attributeName: name,
          attributeCode: unselected.code,
          selectedValues: []
        }
      ]);
    } else {
      addToast('No more attributes available to add', 'error');
    }
  };

  const handleRemoveAttribute = (index: number) => {
    const newAttrs = [...selectedAttributes];
    newAttrs.splice(index, 1);
    setSelectedAttributes(newAttrs);
  };

  const handleAttributeChange = (index: number, newAttrId: string) => {
    const attr = availableAttributes?.find(a => a.id === newAttrId);
    if (!attr) return;

    const newAttrs = [...selectedAttributes];
    newAttrs[index] = {
      attributeId: attr.id,
      attributeName: parseName(attr.name),
      attributeCode: attr.code,
      selectedValues: [] // Reset values when changing attribute type
    };
    setSelectedAttributes(newAttrs);
  };

  const toggleValue = (attrIndex: number, value: AttributeValue) => {
    const newAttrs = [...selectedAttributes];
    const currentValues = newAttrs[attrIndex].selectedValues;
    const exists = currentValues.find(v => v.id === value.id);

    if (exists) {
      newAttrs[attrIndex].selectedValues = currentValues.filter(v => v.id !== value.id);
    } else {
      newAttrs[attrIndex].selectedValues = [...currentValues, value];
    }
    setSelectedAttributes(newAttrs);
  };

  const parseName = (jsonOrString: string) => {
    try {
      const obj = JSON.parse(jsonOrString);
      return obj.en || obj.zh || jsonOrString;
    } catch {
      return jsonOrString;
    }
  };

  if (isLoading) return <div>Loading attributes...</div>;

  const commonAttributes = ['Color', 'Size'];
  const unselectedCommonAttributes = availableAttributes?.filter(attr => 
    commonAttributes.includes(attr.code) || commonAttributes.includes(parseName(attr.name))
  ).filter(attr => !selectedAttributes.find(sa => sa.attributeId === attr.id)) || [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium text-sm text-zinc-700 dark:text-zinc-300">Options</h3>
        <div className="flex gap-2">
          {/* Quick Add Common Attributes */}
          {unselectedCommonAttributes.map(attr => (
             <Button 
               key={attr.id} 
               size="sm" 
               variant="ghost" 
               className="h-8 px-2 text-xs text-blue-600 hover:bg-blue-50 hover:text-blue-700"
               onClick={() => {
                 setSelectedAttributes([
                   ...selectedAttributes,
                   {
                     attributeId: attr.id,
                     attributeName: parseName(attr.name),
                     attributeCode: attr.code,
                     selectedValues: []
                   }
                 ]);
               }}
             >
               <Plus className="h-3 w-3 mr-1" />
               Add {parseName(attr.name)}
             </Button>
           ))}
           <Button size="sm" variant="ghost" className="h-8 px-2 text-xs" onClick={handleAddAttribute}>
            <Plus className="h-3 w-3 mr-1" />
            Add another option
          </Button>
        </div>
      </div>

      {selectedAttributes.length === 0 && (
        <div className="text-sm text-zinc-500 py-4 px-4 bg-zinc-50 dark:bg-zinc-800/50 rounded border border-zinc-100 dark:border-zinc-800">
          <p className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
            This product has options, like size or color.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {selectedAttributes.map((sa, idx) => {
          const fullAttr = availableAttributes?.find(a => a.id === sa.attributeId);
          
          return (
            <div key={idx} className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
              <div className="flex items-center justify-between p-3 bg-zinc-50/50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="cursor-grab text-zinc-400 hover:text-zinc-600">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg>
                  </div>
                  <select
                    className="bg-transparent font-medium text-sm focus:outline-none cursor-pointer hover:underline underline-offset-4 decoration-zinc-300"
                    value={sa.attributeId}
                    onChange={(e) => handleAttributeChange(idx, e.target.value)}
                  >
                    {availableAttributes?.map(attr => (
                      <option key={attr.id} value={attr.id}>
                        {parseName(attr.name)}
                      </option>
                    ))}
                  </select>
                </div>
                <button onClick={() => handleRemoveAttribute(idx)} className="text-zinc-400 hover:text-red-500 p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="p-4">
                <div className="flex flex-wrap gap-2">
                  {fullAttr?.values.map(val => {
                    const isSelected = sa.selectedValues.some(v => v.id === val.id);
                    const label = parseName(val.value);
                    
                    return (
                      <button
                        key={val.id}
                        onClick={() => toggleValue(idx, val)}
                        className={`
                          px-3 py-1.5 rounded-md text-sm font-medium border transition-all flex items-center gap-1.5
                          ${isSelected 
                            ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm dark:bg-zinc-100 dark:text-zinc-900' 
                            : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300'}
                        `}
                      >
                        {label}
                        {isSelected && <Check className="h-3 w-3 ml-0.5" />}
                      </button>
                    );
                  })}
                  
                  {/* Quick Add Value Button */}
                  {addingValueTo === sa.attributeId ? (
                    <div className="flex items-center gap-1 animate-in fade-in zoom-in-95 duration-200 bg-zinc-50 dark:bg-zinc-800 p-1 rounded border border-blue-200 dark:border-blue-900">
                      <Input 
                        value={newValueName}
                        onChange={(e) => setNewValueName(e.target.value)}
                        placeholder="Option value"
                        className="h-7 w-28 text-sm px-2 border-none focus:ring-0 bg-transparent"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddValue(sa.attributeId);
                          if (e.key === 'Escape') setAddingValueTo(null);
                        }}
                      />
                      <Button 
                        size="sm" 
                        className="h-6 w-6 p-0 rounded-sm" 
                        onClick={() => handleAddValue(sa.attributeId)}
                        disabled={addValueMutation.isPending}
                      >
                        {addValueMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        className="h-6 w-6 p-0 text-zinc-400 hover:text-zinc-600 rounded-sm" 
                        onClick={() => setAddingValueTo(null)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setAddingValueTo(sa.attributeId);
                        setNewValueName('');
                      }}
                      className="px-3 py-1.5 rounded-md text-sm border border-dashed border-zinc-300 text-zinc-500 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50/50 transition-colors flex items-center gap-1.5"
                    >
                      <Plus className="h-3.5 w-3.5" /> 
                      <span className="text-xs font-medium">Add value</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
