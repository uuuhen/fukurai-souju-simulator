export type TransactionType = "save" | "spend";

export interface ConvenienceStore {
  id: string;
  name: string;
  emoji: string;
  sortOrder: number;
  isCustom: boolean;
  isVisible: boolean;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  storeId: string | null;
  storeName: string | null;
  occurredAt: string; // ISO 8601
  note: string | null;
}

export type CharacterSpecies = "owl" | "cat" | "pig";

export interface CharacterState {
  species: CharacterSpecies;
  points: number; // growth points, roughly mirrors net savings (yen)
  level: number;
  stage: number; // 1-4
  generation: number; // increments each time the character disappears and restarts
  isAlive: boolean;
  bornAt: string; // ISO 8601
  lastAction: TransactionType | null; // 直近の操作。spend直後は不健康表示になる
}

export interface AppSettings {
  themeColor: string;
  defaultSaveAmount: number;
  cooldownMinutes: number;
}

export interface MonthlyHistoryGroup {
  monthKey: string; // "YYYY-MM"
  label: string;
  totalSaved: number;
  totalSpent: number;
  net: number;
  transactions: Transaction[];
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  createdAt: string; // ISO 8601
  achievedAt: string | null; // ISO 8601, 達成前はnull
}

export type AchievementId =
  | "first-save"
  | "save-x10"
  | "save-x50"
  | "save-x100"
  | "total-1000"
  | "total-10000"
  | "total-50000"
  | "character-stage4"
  | "goal-achieved";

export interface UnlockedAchievement {
  id: AchievementId;
  unlockedAt: string; // ISO 8601
}
