import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

export type CsvRangePreset = "all" | "thisMonth" | "lastMonth" | "custom";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function CsvExportSection({
  onExport,
}: {
  onExport: (range: { preset: CsvRangePreset; startDate: string; endDate: string }) => void;
}) {
  const [preset, setPreset] = useState<CsvRangePreset>("thisMonth");
  const [startDate, setStartDate] = useState(todayIso());
  const [endDate, setEndDate] = useState(todayIso());

  const presets: { key: CsvRangePreset; label: string }[] = [
    { key: "thisMonth", label: "今月" },
    { key: "lastMonth", label: "先月" },
    { key: "all", label: "全期間" },
    { key: "custom", label: "期間を指定" },
  ];

  return (
    <View style={{ gap: 12 }}>
      <View style={styles.presetRow}>
        {presets.map((p) => (
          <Pressable
            key={p.key}
            style={[styles.presetChip, preset === p.key && styles.presetChipSelected]}
            onPress={() => setPreset(p.key)}
          >
            <Text style={[styles.presetText, preset === p.key && styles.presetTextSelected]}>{p.label}</Text>
          </Pressable>
        ))}
      </View>

      {preset === "custom" && (
        <View style={styles.dateRow}>
          <TextInput
            style={styles.dateInput}
            value={startDate}
            onChangeText={setStartDate}
            placeholder="YYYY-MM-DD"
          />
          <Text style={styles.tilde}>〜</Text>
          <TextInput
            style={styles.dateInput}
            value={endDate}
            onChangeText={setEndDate}
            placeholder="YYYY-MM-DD"
          />
        </View>
      )}

      <Pressable style={styles.exportButton} onPress={() => onExport({ preset, startDate, endDate })}>
        <Text style={styles.exportButtonText}>CSVを出力して共有</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  presetRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  presetChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#DDD",
  },
  presetChipSelected: { backgroundColor: "#333", borderColor: "#333" },
  presetText: { fontSize: 12, color: "#333" },
  presetTextSelected: { color: "#FFF" },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  dateInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#EEE",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
  },
  tilde: { color: "#999" },
  exportButton: { backgroundColor: "#3D8BFF", borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  exportButtonText: { color: "#FFF", fontWeight: "700", fontSize: 13 },
});
