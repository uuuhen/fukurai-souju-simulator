import { getDb } from "@/db/client";
import { AchievementId, UnlockedAchievement } from "@/types";

export async function listUnlockedAchievements(): Promise<UnlockedAchievement[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ id: AchievementId; unlocked_at: string }>(
    "SELECT * FROM achievements ORDER BY unlocked_at ASC"
  );
  return rows.map((r) => ({ id: r.id, unlockedAt: r.unlocked_at }));
}

export async function unlockAchievement(id: AchievementId): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "INSERT INTO achievements (id, unlocked_at) VALUES (?, ?) ON CONFLICT(id) DO NOTHING",
    [id, new Date().toISOString()]
  );
}
