import { getDb } from "@/db/client";
import { generateId } from "@/domain/id";
import { SavingsGoal } from "@/types";

interface GoalRow {
  id: string;
  title: string;
  target_amount: number;
  created_at: string;
  achieved_at: string | null;
}

function rowToGoal(row: GoalRow): SavingsGoal {
  return {
    id: row.id,
    title: row.title,
    targetAmount: row.target_amount,
    createdAt: row.created_at,
    achievedAt: row.achieved_at,
  };
}

export async function getActiveGoal(): Promise<SavingsGoal | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<GoalRow>(
    "SELECT * FROM savings_goals WHERE achieved_at IS NULL ORDER BY created_at DESC LIMIT 1"
  );
  return row ? rowToGoal(row) : null;
}

export async function listAchievedGoals(): Promise<SavingsGoal[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<GoalRow>(
    "SELECT * FROM savings_goals WHERE achieved_at IS NOT NULL ORDER BY achieved_at DESC"
  );
  return rows.map(rowToGoal);
}

export async function setGoal(title: string, targetAmount: number): Promise<SavingsGoal> {
  const db = await getDb();
  // シンプルさのため、アクティブな目標は常に1件のみ。新しい目標を設定したら未達成の古い目標は破棄する。
  await db.runAsync("DELETE FROM savings_goals WHERE achieved_at IS NULL");
  const id = generateId();
  const createdAt = new Date().toISOString();
  await db.runAsync(
    "INSERT INTO savings_goals (id, title, target_amount, created_at, achieved_at) VALUES (?, ?, ?, ?, NULL)",
    [id, title, targetAmount, createdAt]
  );
  return { id, title, targetAmount, createdAt, achievedAt: null };
}

export async function markGoalAchieved(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync("UPDATE savings_goals SET achieved_at = ? WHERE id = ?", [new Date().toISOString(), id]);
}

export async function clearActiveGoal(): Promise<void> {
  const db = await getDb();
  await db.runAsync("DELETE FROM savings_goals WHERE achieved_at IS NULL");
}
