import { create } from "zustand";
import { AchievementId, MonthlyHistoryGroup, SavingsGoal, Transaction } from "@/types";
import {
  deleteAllTransactions,
  getLastSaveAt,
  getNetTotal,
  insertTransaction,
  listAllTransactions,
} from "@/db/transactionsRepo";
import { groupTransactionsByMonth } from "@/domain/monthly";
import { useCharacterStore } from "@/state/useCharacterStore";
import { useGoalStore } from "@/state/useGoalStore";
import { useAchievementsStore } from "@/state/useAchievementsStore";
import { syncWidgets } from "@/domain/widgetSync";

interface TransactionsStoreState {
  transactions: Transaction[];
  monthlyGroups: MonthlyHistoryGroup[];
  netTotal: number;
  saveCount: number;
  lastSaveAt: string | null;
  isLoaded: boolean;
  load: () => Promise<void>;
  save: (input: {
    amount: number;
    storeId: string | null;
    storeName: string | null;
  }) => Promise<{ achievedGoal: SavingsGoal | null; newBadges: AchievementId[] }>;
  spend: (input: { amount: number; storeId: string | null; storeName: string | null; note?: string }) => Promise<void>;
  deleteAll: () => Promise<void>;
}

async function refresh(
  set: (partial: Partial<TransactionsStoreState>) => void
): Promise<{ netTotal: number; saveCount: number }> {
  const [transactions, netTotal, lastSaveAt] = await Promise.all([
    listAllTransactions(),
    getNetTotal(),
    getLastSaveAt(),
  ]);
  const saveCount = transactions.filter((t) => t.type === "save").length;
  set({
    transactions,
    monthlyGroups: groupTransactionsByMonth(transactions),
    netTotal,
    saveCount,
    lastSaveAt,
    isLoaded: true,
  });
  return { netTotal, saveCount };
}

export const useTransactionsStore = create<TransactionsStoreState>((set) => ({
  transactions: [],
  monthlyGroups: [],
  netTotal: 0,
  saveCount: 0,
  lastSaveAt: null,
  isLoaded: false,
  load: async () => {
    await refresh(set);
  },
  save: async ({ amount, storeId, storeName }) => {
    await insertTransaction({
      type: "save",
      amount,
      storeId,
      storeName,
      occurredAt: new Date().toISOString(),
    });
    await useCharacterStore.getState().registerSave(amount);
    const { netTotal, saveCount } = await refresh(set);

    const achievedGoal = await useGoalStore.getState().checkAchievement(netTotal);
    const newBadges = await useAchievementsStore.getState().evaluate({
      saveCount,
      netTotal,
      characterStage: useCharacterStore.getState().character?.stage ?? null,
      goalAchieved: achievedGoal !== null,
    });
    syncWidgets();
    return { achievedGoal, newBadges };
  },
  spend: async ({ amount, storeId, storeName, note }) => {
    await insertTransaction({
      type: "spend",
      amount,
      storeId,
      storeName,
      occurredAt: new Date().toISOString(),
      note: note ?? null,
    });
    await useCharacterStore.getState().registerSpend(amount);
    await refresh(set);
    syncWidgets();
  },
  deleteAll: async () => {
    await deleteAllTransactions();
    await refresh(set);
  },
}));

export function canSaveNow(lastSaveAt: string | null, cooldownMinutes: number, now = Date.now()): boolean {
  if (!lastSaveAt) return true;
  const elapsedMs = now - new Date(lastSaveAt).getTime();
  return elapsedMs >= cooldownMinutes * 60 * 1000;
}

export function remainingCooldownMs(lastSaveAt: string | null, cooldownMinutes: number, now = Date.now()): number {
  if (!lastSaveAt) return 0;
  const elapsedMs = now - new Date(lastSaveAt).getTime();
  const remaining = cooldownMinutes * 60 * 1000 - elapsedMs;
  return Math.max(0, remaining);
}
