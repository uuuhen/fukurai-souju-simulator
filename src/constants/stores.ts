import { ConvenienceStore } from "@/types";

// 主要コンビニの初期セット。設定画面で編集・追加・非表示にできる。
export const DEFAULT_STORES: ConvenienceStore[] = [
  { id: "seven-eleven", name: "セブンイレブン", emoji: "🟢", sortOrder: 0, isCustom: false, isVisible: true },
  { id: "lawson", name: "ローソン", emoji: "🔵", sortOrder: 1, isCustom: false, isVisible: true },
  { id: "family-mart", name: "ファミリーマート", emoji: "🟦", sortOrder: 2, isCustom: false, isVisible: true },
  { id: "seicomart", name: "セイコーマート", emoji: "🟠", sortOrder: 3, isCustom: false, isVisible: true },
  { id: "ministop", name: "ミニストップ", emoji: "🟣", sortOrder: 4, isCustom: false, isVisible: true },
  { id: "daily-yamazaki", name: "デイリーヤマザキ", emoji: "🟡", sortOrder: 5, isCustom: false, isVisible: true },
  { id: "other", name: "その他", emoji: "🏪", sortOrder: 6, isCustom: false, isVisible: true },
];
