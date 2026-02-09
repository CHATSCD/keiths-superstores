'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Check } from 'lucide-react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { CATEGORIES } from '@/data/inventory';
import {
  getInventory,
  getEnabledItemIds,
  setEnabledItemIds,
  toggleItemEnabled,
  addCustomItem,
  deleteCustomItem,
  generateId,
} from '@/lib/storage';
import { InventoryItem } from '@/types';

export default function StoreItemsPage() {
  const [allItems, setAllItems] = useState<InventoryItem[]>([]);
  const [enabledIds, setLocalEnabledIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState(CATEGORIES[0]);
  const [newUnit, setNewUnit] = useState('units');

  const reload = () => {
    setAllItems(getInventory());
    setLocalEnabledIds(getEnabledItemIds());
  };

  useEffect(() => {
    reload();
  }, []);

  const filteredItems = allItems.filter((item) => {
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === 'All' || item.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const categoriesWithItems = CATEGORIES.filter((cat) =>
    allItems.some((item) => item.category === cat)
  );

  const enabledCount = enabledIds.length;
  const totalCount = allItems.length;

  const handleToggle = (itemId: string) => {
    toggleItemEnabled(itemId);
    setLocalEnabledIds(getEnabledItemIds());
  };

  const handleEnableAll = (category?: string) => {
    const targetItems = category
      ? allItems.filter((i) => i.category === category)
      : allItems;
    const targetIds = targetItems.map((i) => i.id);
    const newEnabled = [...new Set([...enabledIds, ...targetIds])];
    setEnabledItemIds(newEnabled);
    setLocalEnabledIds(newEnabled);
  };

  const handleDisableAll = (category?: string) => {
    const targetItems = category
      ? allItems.filter((i) => i.category === category)
      : allItems;
    const targetIds = new Set(targetItems.map((i) => i.id));
    const newEnabled = enabledIds.filter((id) => !targetIds.has(id));
    setEnabledItemIds(newEnabled);
    setLocalEnabledIds(newEnabled);
  };

  const handleAddCustom = () => {
    if (!newName.trim()) return;
    const item: InventoryItem = {
      id: `custom-${generateId()}`,
      name: newName.trim(),
      category: newCategory,
      parLevel: 10,
      unit: newUnit,
      custom: true,
    };
    addCustomItem(item);
    // Auto-enable
    const newIds = [...getEnabledItemIds(), item.id];
    setEnabledItemIds(newIds);
    reload();
    setNewName('');
    setShowAdd(false);
  };

  const handleDeleteCustom = (id: string) => {
    deleteCustomItem(id);
    reload();
  };

  // Group by category for display
  const displayCategories = categoryFilter === 'All'
    ? categoriesWithItems
    : [categoryFilter];

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <Header />
      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Store Items</h2>
          <span className="text-sm text-muted-foreground font-medium">
            {enabledCount} / {totalCount} enabled
          </span>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-36"
          >
            <option value="All">All</option>
            {categoriesWithItems.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
        </div>

        {/* Add Custom Item */}
        <Button
          onClick={() => setShowAdd(!showAdd)}
          variant="outline"
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Custom Item
        </Button>

        {showAdd && (
          <Card className="border-2 border-keiths-red">
            <CardContent className="p-3 space-y-2">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Item name"
                autoFocus
              />
              <div className="flex gap-2">
                <Select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="flex-1"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </Select>
                <Input
                  value={newUnit}
                  onChange={(e) => setNewUnit(e.target.value)}
                  placeholder="Unit"
                  className="w-24"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setShowAdd(false)} variant="outline" className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={handleAddCustom}
                  className="flex-1 bg-keiths-red hover:bg-keiths-darkRed"
                  disabled={!newName.trim()}
                >
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Items by Category */}
        {displayCategories.map((cat) => {
          const catItems = filteredItems.filter((i) => i.category === cat);
          if (catItems.length === 0) return null;
          const catEnabled = catItems.filter((i) => enabledIds.includes(i.id)).length;
          const allEnabled = catEnabled === catItems.length;

          return (
            <Card key={cat}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>{cat} ({catEnabled}/{catItems.length})</span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleEnableAll(cat)}
                      className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                        allEnabled
                          ? 'bg-green-100 text-green-700 border-green-200'
                          : 'text-gray-500 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      Enable All
                    </button>
                    <button
                      onClick={() => handleDisableAll(cat)}
                      className="text-[10px] px-2 py-0.5 rounded border text-gray-500 border-gray-200 hover:bg-gray-50"
                    >
                      Disable All
                    </button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-0.5">
                {catItems.map((item) => {
                  const isEnabled = enabledIds.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between py-1.5"
                    >
                      <span className={`text-sm flex-1 truncate pr-2 ${!isEnabled ? 'text-gray-400' : ''}`}>
                        {item.name}
                        {item.custom && (
                          <span className="text-[10px] ml-1 text-purple-500">(custom)</span>
                        )}
                      </span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {item.custom && (
                          <button
                            onClick={() => handleDeleteCustom(item.id)}
                            className="text-red-400 hover:text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {/* Toggle Switch */}
                        <button
                          onClick={() => handleToggle(item.id)}
                          className={`relative w-10 h-5 rounded-full transition-colors ${
                            isEnabled ? 'bg-green-500' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                              isEnabled ? 'translate-x-5' : 'translate-x-0.5'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </main>
      <BottomNav />
    </div>
  );
}
