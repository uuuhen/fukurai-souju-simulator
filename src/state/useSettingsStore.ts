import { create } from "zustand";
import { AppSettings } from "@/types";
import { DEFAULT_SETTINGS, loadSettings, saveSetting } from "@/db/settingsRepo";

interface SettingsStoreState {
  settings: AppSettings;
  isLoaded: boolean;
  load: () => Promise<void>;
  updateThemeColor: (color: string) => Promise<void>;
  updateDefaultSaveAmount: (amount: number) => Promise<void>;
  updateCooldownMinutes: (minutes: number) => Promise<void>;
}

export const useSettingsStore = create<SettingsStoreState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  isLoaded: false,
  load: async () => {
    const settings = await loadSettings();
    set({ settings, isLoaded: true });
  },
  updateThemeColor: async (themeColor) => {
    await saveSetting("themeColor", themeColor);
    set({ settings: { ...get().settings, themeColor } });
  },
  updateDefaultSaveAmount: async (defaultSaveAmount) => {
    await saveSetting("defaultSaveAmount", defaultSaveAmount);
    set({ settings: { ...get().settings, defaultSaveAmount } });
  },
  updateCooldownMinutes: async (cooldownMinutes) => {
    await saveSetting("cooldownMinutes", cooldownMinutes);
    set({ settings: { ...get().settings, cooldownMinutes } });
  },
}));
