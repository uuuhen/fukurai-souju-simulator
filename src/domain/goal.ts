import { SavingsGoal } from "@/types";

export function remainingSavesToGoal(goal: SavingsGoal, netTotal: number, perSaveAmount: number): number | null {
  if (perSaveAmount <= 0) return null;
  const remaining = goal.targetAmount - netTotal;
  if (remaining <= 0) return 0;
  return Math.ceil(remaining / perSaveAmount);
}

export function goalProgress(goal: SavingsGoal, netTotal: number): number {
  if (goal.targetAmount <= 0) return 1;
  return Math.max(0, Math.min(1, netTotal / goal.targetAmount));
}
