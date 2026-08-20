import * as SQLite from "expo-sqlite";
import { DEFAULT_STORES } from "@/constants/stores";

const DB_NAME = "konbini_chokin.db";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function migrate(db: SQLite.SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('save', 'spend')),
      amount INTEGER NOT NULL,
      store_id TEXT,
      store_name TEXT,
      occurred_at TEXT NOT NULL,
      note TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_transactions_occurred_at ON transactions (occurred_at);

    CREATE TABLE IF NOT EXISTS stores (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      emoji TEXT NOT NULL,
      sort_order INTEGER NOT NULL,
      is_custom INTEGER NOT NULL DEFAULT 0,
      is_visible INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS character_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      species TEXT NOT NULL,
      points INTEGER NOT NULL DEFAULT 0,
      level INTEGER NOT NULL DEFAULT 1,
      stage INTEGER NOT NULL DEFAULT 1,
      generation INTEGER NOT NULL DEFAULT 1,
      is_alive INTEGER NOT NULL DEFAULT 1,
      born_at TEXT NOT NULL,
      last_action TEXT
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);

  const storeCountRow = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM stores"
  );
  if (!storeCountRow || storeCountRow.count === 0) {
    for (const store of DEFAULT_STORES) {
      await db.runAsync(
        "INSERT INTO stores (id, name, emoji, sort_order, is_custom, is_visible) VALUES (?, ?, ?, ?, ?, ?)",
        [store.id, store.name, store.emoji, store.sortOrder, store.isCustom ? 1 : 0, store.isVisible ? 1 : 0]
      );
    }
  }
}

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      await migrate(db);
      return db;
    })();
  }
  return dbPromise;
}
