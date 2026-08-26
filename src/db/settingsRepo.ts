import { getDb } from "@/db/client";
import { AppSettings } from "@/types";
import { DEFAULT_THEME_COLOR } from "@/constants/theme";

export const DEFAULT_SETTINGS: AppSettings = {
  themeColor: DEFAULT_THEME_COLOR,
  defaultSaveAmount: 150,
  cooldownMinutes: 60,
};

export async function loadSettings(): Promise<AppSettings> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ key: string; value: string }>("SELECT key, value FROM app_settings");
  const map = new Map(rows.map((r) => [r.key, r.value]));
  return {
    themeColor: map.get("themeColor") ?? DEFAULT_SETTINGS.themeColor,
    defaultSaveAmount: Number(map.get("defaultSaveAmount") ?? DEFAULT_SETTINGS.defaultSaveAmount),
    cooldownMinutes: Number(map.get("cooldownMinutes") ?? DEFAULT_SETTINGS.cooldownMinutes),
  };
}

export async function saveSetting(key: keyof AppSettings, value: string | number): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "INSERT INTO app_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    [key, String(value)]
  );
}
