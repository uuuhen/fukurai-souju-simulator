import { AchievementId } from "@/types";

export interface AchievementDef {
  id: AchievementId;
  title: string;
  description: string;
  emoji: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "first-save", title: "はじめの一歩", description: "はじめて貯金した", emoji: "🌱" },
  { id: "save-x10", title: "習慣化", description: "貯金を10回記録した", emoji: "🔟" },
  { id: "save-x50", title: "継続は力なり", description: "貯金を50回記録した", emoji: "🏅" },
  { id: "save-x100", title: "貯金マスター", description: "貯金を100回記録した", emoji: "🏆" },
  { id: "total-1000", title: "小さな成果", description: "累計貯金1,000円達成", emoji: "💰" },
  { id: "total-10000", title: "頼れる貯金", description: "累計貯金10,000円達成", emoji: "💴" },
  { id: "total-50000", title: "大台突破", description: "累計貯金50,000円達成", emoji: "💎" },
  { id: "character-stage4", title: "相棒、完全体", description: "相棒が最終進化した", emoji: "👑" },
  { id: "goal-achieved", title: "有言実行", description: "目標貯金を達成した", emoji: "🎯" },
];
