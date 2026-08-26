import { getNetTotal } from "@/db/transactionsRepo";
import { getCharacter } from "@/db/characterRepo";
import { getActiveGoal } from "@/db/goalsRepo";
import { CHARACTERS } from "@/constants/characters";
import { goalProgress } from "@/domain/goal";

export interface WidgetSnapshot {
  netTotal: number;
  characterEmoji: string;
  characterLabel: string;
  goalTitle: string | null;
  goalProgressRatio: number | null; // 0-1, 目標未設定ならnull
  updatedAt: string;
}

// ホーム画面ウィジェット(iOS WidgetKit / Android App Widget)に渡すための
// 最小限の要約データを組み立てる。貯金・買っちゃったの操作の直後に呼ばれる想定。
export async function buildWidgetSnapshot(): Promise<WidgetSnapshot> {
  const [netTotal, character, goal] = await Promise.all([getNetTotal(), getCharacter(), getActiveGoal()]);

  let characterEmoji = "🐷";
  let characterLabel = "貯金をはじめよう";
  if (character && character.isAlive) {
    const def = CHARACTERS[character.species];
    const stage = def.stages.find((s) => s.stage === character.stage) ?? def.stages[0];
    characterEmoji = character.lastAction === "spend" ? def.sickEmoji : stage.emoji;
    characterLabel = `${def.displayName}・Lv.${character.level}`;
  }

  return {
    netTotal,
    characterEmoji,
    characterLabel,
    goalTitle: goal?.title ?? null,
    goalProgressRatio: goal ? goalProgress(goal, netTotal) : null,
    updatedAt: new Date().toISOString(),
  };
}
