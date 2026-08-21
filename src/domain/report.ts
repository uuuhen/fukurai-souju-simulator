import { Transaction } from "@/types";

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

export interface WeekdayStat {
  weekday: number; // 0=日
  label: string;
  savedTotal: number;
  spentTotal: number;
}

export interface StoreStat {
  storeName: string;
  savedTotal: number;
  spentTotal: number;
}

export function currentMonthTransactions(transactions: Transaction[], now = new Date()): Transaction[] {
  const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  return transactions.filter((t) => t.occurredAt.startsWith(prefix));
}

export function buildWeekdayReport(transactions: Transaction[]): WeekdayStat[] {
  // 月曜始まりで表示する(日本の生活リズムに合わせる)
  const order = [1, 2, 3, 4, 5, 6, 0];
  const stats = new Map<number, WeekdayStat>();
  order.forEach((weekday) => stats.set(weekday, { weekday, label: WEEKDAY_LABELS[weekday], savedTotal: 0, spentTotal: 0 }));

  for (const tx of transactions) {
    const weekday = new Date(tx.occurredAt).getDay();
    const stat = stats.get(weekday);
    if (!stat) continue;
    if (tx.type === "save") stat.savedTotal += tx.amount;
    else stat.spentTotal += tx.amount;
  }

  return order.map((weekday) => stats.get(weekday) as WeekdayStat);
}

export function buildStoreReport(transactions: Transaction[], limit = 4): StoreStat[] {
  const stats = new Map<string, StoreStat>();
  for (const tx of transactions) {
    const key = tx.storeName ?? "店舗未指定";
    const stat = stats.get(key) ?? { storeName: key, savedTotal: 0, spentTotal: 0 };
    if (tx.type === "save") stat.savedTotal += tx.amount;
    else stat.spentTotal += tx.amount;
    stats.set(key, stat);
  }
  return Array.from(stats.values())
    .sort((a, b) => b.savedTotal + b.spentTotal - (a.savedTotal + a.spentTotal))
    .slice(0, limit);
}
