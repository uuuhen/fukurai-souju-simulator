import { create } from "zustand";
import { ConvenienceStore } from "@/types";
import { addStore, deleteStore, listStores, updateStore } from "@/db/storesRepo";

interface StoresStoreState {
  stores: ConvenienceStore[];
  isLoaded: boolean;
  load: () => Promise<void>;
  add: (name: string, emoji: string) => Promise<void>;
  update: (id: string, updates: Partial<Pick<ConvenienceStore, "name" | "emoji" | "isVisible" | "sortOrder">>) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useStoresStore = create<StoresStoreState>((set, get) => ({
  stores: [],
  isLoaded: false,
  load: async () => {
    const stores = await listStores();
    set({ stores, isLoaded: true });
  },
  add: async (name, emoji) => {
    await addStore({ name, emoji });
    await get().load();
  },
  update: async (id, updates) => {
    await updateStore(id, updates);
    await get().load();
  },
  remove: async (id) => {
    await deleteStore(id);
    await get().load();
  },
}));
