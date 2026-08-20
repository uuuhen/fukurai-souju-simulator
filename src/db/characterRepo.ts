import { getDb } from "@/db/client";
import { CharacterSpecies, CharacterState, TransactionType } from "@/types";

interface CharacterRow {
  species: CharacterSpecies;
  points: number;
  level: number;
  stage: number;
  generation: number;
  is_alive: number;
  born_at: string;
  last_action: TransactionType | null;
}

function rowToCharacter(row: CharacterRow): CharacterState {
  return {
    species: row.species,
    points: row.points,
    level: row.level,
    stage: row.stage,
    generation: row.generation,
    isAlive: row.is_alive === 1,
    bornAt: row.born_at,
    lastAction: row.last_action,
  };
}

export async function getCharacter(): Promise<CharacterState | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<CharacterRow>("SELECT * FROM character_state WHERE id = 1");
  return row ? rowToCharacter(row) : null;
}

export async function createCharacter(species: CharacterSpecies, generation = 1): Promise<CharacterState> {
  const db = await getDb();
  const bornAt = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO character_state (id, species, points, level, stage, generation, is_alive, born_at, last_action)
     VALUES (1, ?, 0, 1, 1, ?, 1, ?, NULL)
     ON CONFLICT(id) DO UPDATE SET
       species = excluded.species,
       points = 0,
       level = 1,
       stage = 1,
       generation = excluded.generation,
       is_alive = 1,
       born_at = excluded.born_at,
       last_action = NULL`,
    [species, generation, bornAt]
  );
  return { species, points: 0, level: 1, stage: 1, generation, isAlive: true, bornAt, lastAction: null };
}

export async function updateCharacter(updates: {
  points: number;
  level: number;
  stage: number;
  isAlive: boolean;
  lastAction: TransactionType | null;
}): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "UPDATE character_state SET points = ?, level = ?, stage = ?, is_alive = ?, last_action = ? WHERE id = 1",
    [updates.points, updates.level, updates.stage, updates.isAlive ? 1 : 0, updates.lastAction]
  );
}
