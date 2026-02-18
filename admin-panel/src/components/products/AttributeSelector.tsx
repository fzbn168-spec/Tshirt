
'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Button } from '@/components/button';
import { Plus, X, Check, Loader2 } from 'lucide-react';
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
    <div className="space-y-4 border rounded-md p-4 bg-zinc-50 dark:bg-zinc-800/50">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">Product Variants (Attributes)</h3>
        <div className="flex gap-2">
           {unselectedCommonAttributes.map(attr => (
             <Button 
               key={attr.id} 
               size="sm" 
               variant="outline" 
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
           <Button size="sm" onClick={handleAddAttribute} variant="secondary">
            <Plus className="h-4 w-4 mr-2" />
            Add Custom
          </Button>
        </div>
      </div>

      {selectedAttributes.length === 0 && (
        <div className="text-sm text-zinc-500 text-center py-8 border-2 border-dashed rounded-lg">
          <p>No variants selected.</p>
          <p className="mt-1">Add attributes like <strong>Color</strong> or <strong>Size</strong> to generate SKUs.</p>
        </div>
      )}

      {selectedAttributes.map((sa, idx) => {
        const fullAttr = availableAttributes?.find(a => a.id === sa.attributeId);
        
        return (
          <div key={idx} className="bg-white dark:bg-zinc-900 p-4 rounded border border-zinc-200 dark:border-zinc-800">
            <div className="flex justify-between mb-3">
              <select
                className="bg-transparent font-medium text-sm focus:outline-none cursor-pointer"
                value={sa.attributeId}
                onChange={(e) => handleAttributeChange(idx, e.target.value)}
              >
                {availableAttributes?.map(attr => (
                  <option key={attr.id} value={attr.id}>
                    {parseName(attr.name)}
                  </option>
                ))}
              </select>
              <button onClick={() => handleRemoveAttribute(idx)} className="text-zinc-400 hover:text-red-500">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {fullAttr?.values.map(val => {
                const isSelected = sa.selectedValues.some(v => v.id === val.id);
                const label = parseName(val.value);
                
                return (
                  <button
                    key={val.id}
                    onClick={() => toggleValue(idx, val)}
                    className={`
                      px-3 py-1 rounded-full text-sm border transition-colors flex items-center gap-1
                      ${isSelected 
                        ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900' 
                        : 'bg-transparent text-zinc-600 border-zinc-200 hover:border-zinc-400 dark:text-zinc-300 dark:border-zinc-700'}
                    `}
                  >
                    {isSelected && <Check className="h-3 w-3" />}
                    {label}
                  </button>
                );
              })}
              {fullAttr?.values.length === 0 && (
                <span className="text-xs text-zinc-400">No values found for this attribute.</span>
              )}
              
              {/* Quick Add Value */}
              {addingValueTo === sa.attributeId ? (
                <div className="flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
                  <Input 
                    value={newValueName}
                    onChange={(e) => setNewValueName(e.target.value)}
                    placeholder="New Option"
                    className="h-7 w-32 text-xs px-2"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddValue(sa.attributeId);
                      if (e.key === 'Escape') setAddingValueTo(null);
                    }}
                  />
                  <Button 
                    size="sm" 
                    className="h-7 w-7 p-0" 
                    onClick={() => handleAddValue(sa.attributeId)}
                    disabled={addValueMutation.isPending}
                  >
                    {addValueMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    className="h-7 w-7 p-0 text-zinc-400" 
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
                  className="px-3 py-1 rounded-full text-xs border border-dashed border-zinc-300 text-zinc-500 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" /> New Option
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
