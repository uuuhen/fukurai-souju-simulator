import { create } from "zustand";
import { SavingsGoal } from "@/types";
import { clearActiveGoal, getActiveGoal, markGoalAchieved, setGoal as setGoalRepo } from "@/db/goalsRepo";

interface GoalStoreState {
  goal: SavingsGoal | null;
  isLoaded: boolean;
  load: () => Promise<void>;
  setGoal: (title: string, targetAmount: number) => Promise<void>;
  clearGoal: () => Promise<void>;
  // 目標を新規達成していれば、その目標を返して内部状態をクリアする
  checkAchievement: (netTotal: number) => Promise<SavingsGoal | null>;
}

export const useGoalStore = create<GoalStoreState>((set, get) => ({
  goal: null,
  isLoaded: false,
  load: async () => {
    const goal = await getActiveGoal();
    set({ goal, isLoaded: true });
  },
  setGoal: async (title, targetAmount) => {
    const goal = await setGoalRepo(title, targetAmount);
    set({ goal });
  },
  clearGoal: async () => {
    await clearActiveGoal();
    set({ goal: null });
  },
  checkAchievement: async (netTotal) => {
    const goal = get().goal;
    if (!goal || goal.achievedAt || netTotal < goal.targetAmount) return null;
    await markGoalAchieved(goal.id);
    set({ goal: null });
    return goal;
  },
}));
