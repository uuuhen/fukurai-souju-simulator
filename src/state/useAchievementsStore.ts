import { create } from "zustand";
import { AchievementId } from "@/types";
import { listUnlockedAchievements, unlockAchievement } from "@/db/achievementsRepo";

interface EvaluateContext {
  saveCount: number;
  netTotal: number;
  characterStage: number | null;
  goalAchieved: boolean;
}

interface AchievementsStoreState {
  unlockedIds: Set<AchievementId>;
  isLoaded: boolean;
  load: () => Promise<void>;
  // 新たに条件を満たしたバッジを解除してDBに保存し、そのID一覧を返す
  evaluate: (context: EvaluateContext) => Promise<AchievementId[]>;
}

function candidatesFor(context: EvaluateContext): AchievementId[] {
  const candidates: AchievementId[] = [];
  if (context.saveCount >= 1) candidates.push("first-save");
  if (context.saveCount >= 10) candidates.push("save-x10");
  if (context.saveCount >= 50) candidates.push("save-x50");
  if (context.saveCount >= 100) candidates.push("save-x100");
  if (context.netTotal >= 1000) candidates.push("total-1000");
  if (context.netTotal >= 10000) candidates.push("total-10000");
  if (context.netTotal >= 50000) candidates.push("total-50000");
  if (context.characterStage !== null && context.characterStage >= 4) candidates.push("character-stage4");
  if (context.goalAchieved) candidates.push("goal-achieved");
  return candidates;
}

export const useAchievementsStore = create<AchievementsStoreState>((set, get) => ({
  unlockedIds: new Set(),
  isLoaded: false,
  load: async () => {
    const list = await listUnlockedAchievements();
    set({ unlockedIds: new Set(list.map((a) => a.id)), isLoaded: true });
  },
  evaluate: async (context) => {
    const current = get().unlockedIds;
    const newlyUnlocked = candidatesFor(context).filter((id) => !current.has(id));
    if (newlyUnlocked.length === 0) return [];

    for (const id of newlyUnlocked) {
      await unlockAchievement(id);
    }
    const next = new Set(current);
    newlyUnlocked.forEach((id) => next.add(id));
    set({ unlockedIds: next });
    return newlyUnlocked;
  },
}));
