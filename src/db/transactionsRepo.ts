import { getDb } from "@/db/client";
import { generateId } from "@/domain/id";
import { Transaction, TransactionType } from "@/types";

interface TransactionRow {
  id: string;
  type: TransactionType;
  amount: number;
  store_id: string | null;
  store_name: string | null;
  occurred_at: string;
  note: string | null;
}

function rowToTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    type: row.type,
    amount: row.amount,
    storeId: row.store_id,
    storeName: row.store_name,
    occurredAt: row.occurred_at,
    note: row.note,
  };
}

export async function insertTransaction(input: {
  type: TransactionType;
  amount: number;
  storeId: string | null;
  storeName: string | null;
  occurredAt: string;
  note?: string | null;
}): Promise<Transaction> {
  const db = await getDb();
  const id = generateId();
  await db.runAsync(
    "INSERT INTO transactions (id, type, amount, store_id, store_name, occurred_at, note) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [id, input.type, input.amount, input.storeId, input.storeName, input.occurredAt, input.note ?? null]
  );
  return {
    id,
    type: input.type,
    amount: input.amount,
    storeId: input.storeId,
    storeName: input.storeName,
    occurredAt: input.occurredAt,
    note: input.note ?? null,
  };
}

export async function listAllTransactions(): Promise<Transaction[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<TransactionRow>(
    "SELECT * FROM transactions ORDER BY occurred_at DESC"
  );
  return rows.map(rowToTransaction);
}

export async function listTransactionsBetween(
  startIsoInclusive: string,
  endIsoInclusive: string
): Promise<Transaction[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<TransactionRow>(
    "SELECT * FROM transactions WHERE occurred_at >= ? AND occurred_at <= ? ORDER BY occurred_at ASC",
    [startIsoInclusive, endIsoInclusive]
  );
  return rows.map(rowToTransaction);
}

export async function getLastSaveAt(): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ occurred_at: string }>(
    "SELECT occurred_at FROM transactions WHERE type = 'save' ORDER BY occurred_at DESC LIMIT 1"
  );
  return row?.occurred_at ?? null;
}

export async function getNetTotal(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ net: number | null }>(
    `SELECT SUM(CASE WHEN type = 'save' THEN amount ELSE -amount END) as net FROM transactions`
  );
  return row?.net ?? 0;
}

export async function deleteAllTransactions(): Promise<void> {
  const db = await getDb();
  await db.runAsync("DELETE FROM transactions");
}
