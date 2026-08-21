import { StyleSheet, Text, View } from "react-native";
import { StoreStat, WeekdayStat } from "@/domain/report";

export function ReportSection({
  weekdayStats,
  storeStats,
  themeColor,
}: {
  weekdayStats: WeekdayStat[];
  storeStats: StoreStat[];
  themeColor: string;
}) {
  const maxAmount = Math.max(1, ...weekdayStats.map((w) => Math.max(w.savedTotal, w.spentTotal)));
  const hasData = weekdayStats.some((w) => w.savedTotal > 0 || w.spentTotal > 0);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>今月のレポート</Text>

      {!hasData ? (
        <Text style={styles.empty}>今月のデータがまだありません</Text>
      ) : (
        <>
          <Text style={styles.subLabel}>曜日別の傾向</Text>
          <View style={styles.chartRow}>
            {weekdayStats.map((w) => (
              <View key={w.weekday} style={styles.chartCol}>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barSaved,
                      { height: `${(w.savedTotal / maxAmount) * 100}%`, backgroundColor: themeColor },
                    ]}
                  />
                  <View style={[styles.barSpent, { height: `${(w.spentTotal / maxAmount) * 100}%` }]} />
                </View>
                <Text style={styles.dayLabel}>{w.label}</Text>
              </View>
            ))}
          </View>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: themeColor }]} />
              <Text style={styles.legendText}>貯金</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.legendDotSpent]} />
              <Text style={styles.legendText}>買っちゃった</Text>
            </View>
          </View>

          {storeStats.length > 0 && (
            <>
              <Text style={[styles.subLabel, { marginTop: 16 }]}>よく使うコンビニ</Text>
              {storeStats.map((s) => (
                <View key={s.storeName} style={styles.storeRow}>
                  <Text style={styles.storeName} numberOfLines={1}>
                    {s.storeName}
                  </Text>
                  <Text style={[styles.storeAmount, { color: themeColor }]}>+¥{s.savedTotal.toLocaleString()}</Text>
                  {s.spentTotal > 0 && <Text style={styles.storeSpent}>-¥{s.spentTotal.toLocaleString()}</Text>}
                </View>
              ))}
            </>
          )}
        </>
      )}
    </View>
  );
}

const CHART_HEIGHT = 84;

const styles = StyleSheet.create({
  card: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 14, marginBottom: 12 },
  title: { fontSize: 14, fontWeight: "800" },
  empty: { fontSize: 12, color: "#A79A83", marginTop: 10 },
  subLabel: { fontSize: 11, color: "#8C7F6C", fontWeight: "700", marginTop: 12, marginBottom: 8 },
  chartRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", height: CHART_HEIGHT + 18 },
  chartCol: { alignItems: "center", flex: 1 },
  barTrack: {
    height: CHART_HEIGHT,
    width: 14,
    justifyContent: "flex-end",
    flexDirection: "row",
    gap: 2,
  },
  barSaved: { width: 6, borderRadius: 3, minHeight: 2 },
  barSpent: { width: 6, borderRadius: 3, backgroundColor: "#D9534F", minHeight: 2 },
  dayLabel: { fontSize: 10, color: "#A79A83", marginTop: 4 },
  legendRow: { flexDirection: "row", gap: 14, marginTop: 6, justifyContent: "center" },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  legendDotSpent: { backgroundColor: "#D9534F" },
  legendText: { fontSize: 10, color: "#8C7F6C" },
  storeRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 6 },
  storeName: { flex: 1, fontSize: 12.5, color: "#2B2319" },
  storeAmount: { fontSize: 12, fontWeight: "700" },
  storeSpent: { fontSize: 11, color: "#D9534F" },
});
