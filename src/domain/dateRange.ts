import type { CsvRangePreset } from "@/components/settings/CsvExportSection";

export function resolveCsvRange(
  preset: CsvRangePreset,
  startDate: string,
  endDate: string
): { startIso: string; endIso: string; label: string } {
  const now = new Date();

  if (preset === "all") {
    return { startIso: "0000-01-01", endIso: "9999-12-31T23:59:59", label: "all" };
  }

  if (preset === "thisMonth") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return {
      startIso: start.toISOString(),
      endIso: end.toISOString(),
      label: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
    };
  }

  if (preset === "lastMonth") {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    return {
      startIso: start.toISOString(),
      endIso: end.toISOString(),
      label: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`,
    };
  }

  // custom
  return {
    startIso: `${startDate}T00:00:00`,
    endIso: `${endDate}T23:59:59`,
    label: `${startDate}_${endDate}`,
  };
}
