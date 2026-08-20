import { CharacterSpecies } from "@/types";

export interface CharacterStageDef {
  stage: number;
  name: string;
  emoji: string;
  minLevel: number;
}

export interface CharacterSpeciesDef {
  species: CharacterSpecies;
  displayName: string;
  description: string;
  stages: CharacterStageDef[];
  sickEmoji: string; // ランクダウン中(不健康)の表示
}

// 成長ポイントは「純貯金額(円)」を1ポイント=1円として扱う。
// 500ポイントごとに1レベルアップ。
export const POINTS_PER_LEVEL = 500;

// 累計がこの値を下回ると、キャラクターが居なくなる(消滅)。
export const DISAPPEAR_THRESHOLD = -3000;

export function levelFromPoints(points: number): number {
  if (points <= 0) return 1;
  return Math.floor(points / POINTS_PER_LEVEL) + 1;
}

export function stageFromLevel(species: CharacterSpecies, level: number): number {
  const def = CHARACTERS[species];
  let current = def.stages[0].stage;
  for (const s of def.stages) {
    if (level >= s.minLevel) current = s.stage;
  }
  return current;
}

export const CHARACTERS: Record<CharacterSpecies, CharacterSpeciesDef> = {
  owl: {
    species: "owl",
    displayName: "フクロウ",
    description: "夜な夜な家計をチェックする物知り博士",
    sickEmoji: "🤒",
    stages: [
      { stage: 1, name: "たまご", emoji: "🥚", minLevel: 1 },
      { stage: 2, name: "ひなふくろう", emoji: "🐣", minLevel: 5 },
      { stage: 3, name: "ふくろう", emoji: "🦉", minLevel: 15 },
      { stage: 4, name: "賢者フクロウ", emoji: "🦉✨", minLevel: 30 },
    ],
  },
  cat: {
    species: "cat",
    displayName: "ネコ",
    description: "気まぐれだけどお金にはシビアな猫",
    sickEmoji: "🙀",
    stages: [
      { stage: 1, name: "たまご", emoji: "🥚", minLevel: 1 },
      { stage: 2, name: "こねこ", emoji: "🐱", minLevel: 5 },
      { stage: 3, name: "やり手ネコ", emoji: "😼", minLevel: 15 },
      { stage: 4, name: "富豪ネコ", emoji: "😻👑", minLevel: 30 },
    ],
  },
  pig: {
    species: "pig",
    displayName: "ブタ",
    description: "王道、貯金箱といえばこの子",
    sickEmoji: "🤢",
    stages: [
      { stage: 1, name: "たまご", emoji: "🥚", minLevel: 1 },
      { stage: 2, name: "こぶた", emoji: "🐖", minLevel: 5 },
      { stage: 3, name: "ちょきんブタ", emoji: "🐷", minLevel: 15 },
      { stage: 4, name: "黄金ブタ", emoji: "🐷👑", minLevel: 30 },
    ],
  },
};
