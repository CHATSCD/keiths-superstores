'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { STORE_LOCATIONS, StoreLocation, getStoreById } from '@/data/stores';
import { getCurrentStoreId, setCurrentStoreId } from '@/lib/storage';

interface StoreContextValue {
  currentStore: StoreLocation | null;
  selectStore: (storeId: string) => void;
  isPickerOpen: boolean;
  openPicker: () => void;
  closePicker: () => void;
}

const StoreContext = createContext<StoreContextValue>({
  currentStore: null,
  selectStore: () => {},
  isPickerOpen: false,
  openPicker: () => {},
  closePicker: () => {},
});

export function useStore() {
  return useContext(StoreContext);
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [currentStore, setCurrentStore] = useState<StoreLocation | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const id = getCurrentStoreId();
    if (id) {
      const store = getStoreById(id);
      setCurrentStore(store || null);
    } else {
      // No store selected yet — open picker
      setIsPickerOpen(true);
    }
    setHydrated(true);
  }, []);

  const selectStore = useCallback((storeId: string) => {
    setCurrentStoreId(storeId);
    setCurrentStore(getStoreById(storeId) || null);
    setIsPickerOpen(false);
    // Reload so all data hooks re-read from the new store's namespace
    window.location.reload();
  }, []);

  const openPicker = useCallback(() => setIsPickerOpen(true), []);
  const closePicker = useCallback(() => {
    // Only allow closing if a store is already selected
    if (getCurrentStoreId()) setIsPickerOpen(false);
  }, []);

  if (!hydrated) return null;

  return (
    <StoreContext.Provider value={{ currentStore, selectStore, isPickerOpen, openPicker, closePicker }}>
      {children}
      {isPickerOpen && <StorePicker />}
    </StoreContext.Provider>
  );
}

// ─── Store Picker Modal ───────────────────────────────────────────────────────
function StorePicker() {
  const { selectStore, closePicker } = useStore();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const hasExisting = !!getCurrentStoreId();

  const filtered = STORE_LOCATIONS.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.city.toLowerCase().includes(q) ||
      s.state.toLowerCase().includes(q) ||
      s.number.toLowerCase().includes(q) ||
      s.address.toLowerCase().includes(q)
    );
  });

  // Group by state
  const byState: Record<string, StoreLocation[]> = {};
  for (const store of filtered) {
    if (!byState[store.state]) byState[store.state] = [];
    byState[store.state].push(store);
  }
  const states = Object.keys(byState).sort();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b bg-blue-700 rounded-t-xl">
          <h2 className="text-white text-lg font-bold text-center">Select Your Store</h2>
          <p className="text-blue-200 text-sm text-center mt-0.5">
            Your data is saved per location
          </p>
        </div>

        {/* Search */}
        <div className="p-3 border-b">
          <input
            type="text"
            placeholder="Search by store #, city, or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        </div>

        {/* Store list */}
        <div className="overflow-y-auto flex-1 p-2">
          {states.map((state) => (
            <div key={state}>
              <div className="px-2 py-1 text-xs font-bold text-gray-500 uppercase tracking-wide">
                {state === 'AL' ? 'Alabama' : state === 'MS' ? 'Mississippi' : state}
              </div>
              {byState[state].map((store) => (
                <button
                  key={store.id}
                  onClick={() => setSelectedId(store.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg mb-0.5 transition-colors ${
                    selectedId === store.id
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-gray-100 text-gray-800'
                  }`}
                >
                  <div className="font-semibold text-sm">{store.name}</div>
                  {store.address && (
                    <div className={`text-xs ${selectedId === store.id ? 'text-blue-100' : 'text-gray-500'}`}>
                      {store.address}, {store.city}, {store.state} {store.zip}
                    </div>
                  )}
                  {store.phone && (
                    <div className={`text-xs ${selectedId === store.id ? 'text-blue-200' : 'text-gray-400'}`}>
                      {store.phone}
                    </div>
                  )}
                </button>
              ))}
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-gray-400 py-8 text-sm">No stores match your search</p>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t flex gap-2">
          {hasExisting && (
            <button
              onClick={closePicker}
              className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-600 text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
          <button
            onClick={() => selectedId && selectStore(selectedId)}
            disabled={!selectedId}
            className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold disabled:opacity-40 hover:bg-blue-700 transition-colors"
          >
            {hasExisting ? 'Switch Store' : 'Select Store'}
          </button>
        </div>
      </div>
    </div>
  );
}
