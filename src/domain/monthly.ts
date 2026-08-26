import { MonthlyHistoryGroup, Transaction } from "@/types";

function monthKeyOf(iso: string): string {
  return iso.slice(0, 7); // "YYYY-MM"
}

function labelOf(monthKey: string): string {
  const [year, month] = monthKey.split("-");
  return `${year}年${Number(month)}月`;
}

export function groupTransactionsByMonth(transactions: Transaction[]): MonthlyHistoryGroup[] {
  const groups = new Map<string, Transaction[]>();
  for (const tx of transactions) {
    const key = monthKeyOf(tx.occurredAt);
    const list = groups.get(key) ?? [];
    list.push(tx);
    groups.set(key, list);
  }

  const result: MonthlyHistoryGroup[] = [];
  for (const [monthKey, txs] of groups.entries()) {
    const totalSaved = txs.filter((t) => t.type === "save").reduce((sum, t) => sum + t.amount, 0);
    const totalSpent = txs.filter((t) => t.type === "spend").reduce((sum, t) => sum + t.amount, 0);
    result.push({
      monthKey,
      label: labelOf(monthKey),
      totalSaved,
      totalSpent,
      net: totalSaved - totalSpent,
      transactions: txs.sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1)),
    });
  }

  return result.sort((a, b) => (a.monthKey < b.monthKey ? 1 : -1));
}
