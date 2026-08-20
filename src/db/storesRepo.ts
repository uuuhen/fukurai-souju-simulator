import { getDb } from "@/db/client";
import { generateId } from "@/domain/id";
import { ConvenienceStore } from "@/types";

interface StoreRow {
  id: string;
  name: string;
  emoji: string;
  sort_order: number;
  is_custom: number;
  is_visible: number;
}

function rowToStore(row: StoreRow): ConvenienceStore {
  return {
    id: row.id,
    name: row.name,
    emoji: row.emoji,
    sortOrder: row.sort_order,
    isCustom: row.is_custom === 1,
    isVisible: row.is_visible === 1,
  };
}

export async function listStores(): Promise<ConvenienceStore[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<StoreRow>("SELECT * FROM stores ORDER BY sort_order ASC");
  return rows.map(rowToStore);
}

export async function addStore(input: { name: string; emoji: string }): Promise<ConvenienceStore> {
  const db = await getDb();
  const maxRow = await db.getFirstAsync<{ max_order: number | null }>(
    "SELECT MAX(sort_order) as max_order FROM stores"
  );
  const sortOrder = (maxRow?.max_order ?? -1) + 1;
  const id = generateId();
  await db.runAsync(
    "INSERT INTO stores (id, name, emoji, sort_order, is_custom, is_visible) VALUES (?, ?, ?, ?, 1, 1)",
    [id, input.name, input.emoji, sortOrder]
  );
  return { id, name: input.name, emoji: input.emoji, sortOrder, isCustom: true, isVisible: true };
}

export async function updateStore(
  id: string,
  updates: Partial<Pick<ConvenienceStore, "name" | "emoji" | "isVisible" | "sortOrder">>
): Promise<void> {
  const db = await getDb();
  const fields: string[] = [];
  const values: (string | number)[] = [];
  if (updates.name !== undefined) {
    fields.push("name = ?");
    values.push(updates.name);
  }
  if (updates.emoji !== undefined) {
    fields.push("emoji = ?");
    values.push(updates.emoji);
  }
  if (updates.isVisible !== undefined) {
    fields.push("is_visible = ?");
    values.push(updates.isVisible ? 1 : 0);
  }
  if (updates.sortOrder !== undefined) {
    fields.push("sort_order = ?");
    values.push(updates.sortOrder);
  }
  if (fields.length === 0) return;
  values.push(id);
  await db.runAsync(`UPDATE stores SET ${fields.join(", ")} WHERE id = ?`, values);
}

export async function deleteStore(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync("DELETE FROM stores WHERE id = ? AND is_custom = 1", [id]);
}
