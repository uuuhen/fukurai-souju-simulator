import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import type { Transaction } from "@/types";

function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildCsv(transactions: Transaction[]): string {
  const header = ["日時", "種別", "金額", "コンビニ", "メモ"];
  const lines = [header.join(",")];
  for (const tx of transactions) {
    const row = [
      tx.occurredAt,
      tx.type === "save" ? "貯金" : "買っちゃった",
      String(tx.amount),
      tx.storeName ?? "",
      tx.note ?? "",
    ].map(escapeCsvField);
    lines.push(row.join(","));
  }
  // Excelでの文字化け防止のためBOMを付与
  return "\uFEFF" + lines.join("\n");
}

export async function exportCsvAndShare(transactions: Transaction[], fileLabel: string): Promise<void> {
  const csv = buildCsv(transactions);
  const fileUri = `${FileSystem.cacheDirectory}konbini_chokin_${fileLabel}.csv`;
  await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(fileUri, { mimeType: "text/csv", dialogTitle: "履歴をCSVで出力" });
  }
}
