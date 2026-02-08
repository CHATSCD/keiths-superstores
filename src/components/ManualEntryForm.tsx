'use client';

import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { getInventory, getEmployees } from '@/lib/storage';
import { CATEGORIES } from '@/data/inventory';
import { ProductionLineItem, WasteLineItem } from '@/types';

interface ManualEntryFormProps {
  type: 'production' | 'waste';
  onSubmit: (data: {
    employeeName: string;
    shift: 'AM' | 'PM' | 'Night';
    items: (ProductionLineItem | WasteLineItem)[];
  }) => void;
}

export default function ManualEntryForm({ type, onSubmit }: ManualEntryFormProps) {
  const inventory = getInventory();
  const employees = getEmployees();
  const [employeeName, setEmployeeName] = useState('');
  const [shift, setShift] = useState<'AM' | 'PM' | 'Night'>('AM');
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [items, setItems] = useState<Array<{ itemId: string; itemName: string; quantity: number }>>([]);

  const categoryItems = inventory.filter((i) => i.category === selectedCategory);

  const addItem = (itemId: string) => {
    const invItem = inventory.find((i) => i.id === itemId);
    if (!invItem) return;
    if (items.find((i) => i.itemId === itemId)) return;
    setItems([...items, { itemId, itemName: invItem.name, quantity: 1 }]);
  };

  const updateQuantity = (idx: number, qty: number) => {
    const updated = [...items];
    updated[idx].quantity = qty;
    setItems(updated);
  };

  const removeItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleSubmit = () => {
    if (!employeeName.trim() || items.length === 0) return;
    onSubmit({
      employeeName: employeeName.trim(),
      shift,
      items: items.map((i) => ({
        itemId: i.itemId,
        itemName: i.itemName,
        quantity: i.quantity,
        confidence: 100,
      })),
    });
    setItems([]);
    setEmployeeName('');
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm">
        Manual {type === 'production' ? 'Production' : 'Waste'} Entry
      </h3>

      {/* Employee */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-muted-foreground">Employee</label>
          {employees.length > 0 ? (
            <Select value={employeeName} onChange={(e) => setEmployeeName(e.target.value)}>
              <option value="">Select...</option>
              {employees
                .filter((e) => e.active)
                .map((e) => (
                  <option key={e.id} value={e.name}>
                    {e.name}
                  </option>
                ))}
            </Select>
          ) : (
            <Input
              value={employeeName}
              onChange={(e) => setEmployeeName(e.target.value)}
              placeholder="Employee name"
            />
          )}
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Shift</label>
          <Select value={shift} onChange={(e) => setShift(e.target.value as 'AM' | 'PM' | 'Night')}>
            <option value="AM">AM</option>
            <option value="PM">PM</option>
            <option value="Night">Night</option>
          </Select>
        </div>
      </div>

      {/* Add Items */}
      <div>
        <label className="text-xs text-muted-foreground">Category</label>
        <Select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto">
        {categoryItems.map((item) => (
          <button
            key={item.id}
            onClick={() => addItem(item.id)}
            className="text-left text-xs p-1.5 rounded border hover:bg-accent transition-colors truncate"
            disabled={!!items.find((i) => i.itemId === item.id)}
          >
            <Plus className="h-3 w-3 inline mr-1" />
            {item.name}
          </button>
        ))}
      </div>

      {/* Added Items */}
      {items.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground">Added Items</h4>
          {items.map((item, idx) => (
            <div key={item.itemId} className="flex items-center gap-2 bg-gray-50 rounded p-2">
              <span className="text-sm flex-1 truncate">{item.itemName}</span>
              <Input
                type="number"
                value={item.quantity}
                onChange={(e) => updateQuantity(idx, parseInt(e.target.value) || 0)}
                className="w-16 h-8 text-center text-sm"
                min={0}
              />
              <button onClick={() => removeItem(idx)} className="text-red-500 hover:text-red-700">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Button
        onClick={handleSubmit}
        className="w-full bg-keiths-red hover:bg-keiths-darkRed"
        disabled={!employeeName.trim() || items.length === 0}
      >
        Save {type === 'production' ? 'Production' : 'Waste'} Report
      </Button>
    </div>
  );
}
