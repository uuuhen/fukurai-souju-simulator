import { Pressable, StyleSheet, Text, View } from "react-native";
import { SavingsGoal } from "@/types";
import { goalProgress, remainingSavesToGoal } from "@/domain/goal";

export function GoalCard({
  goal,
  netTotal,
  perSaveAmount,
  themeColor,
  onSetGoal,
  onEditGoal,
}: {
  goal: SavingsGoal | null;
  netTotal: number;
  perSaveAmount: number;
  themeColor: string;
  onSetGoal: () => void;
  onEditGoal: () => void;
}) {
  if (!goal) {
    return (
      <Pressable style={styles.emptyCard} onPress={onSetGoal}>
        <Text style={styles.emptyText}>🎯 目標貯金額を設定する</Text>
      </Pressable>
    );
  }

  const progress = goalProgress(goal, netTotal);
  const remainingTimes = remainingSavesToGoal(goal, netTotal, perSaveAmount);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title} numberOfLines={1}>
          🎯 {goal.title}
        </Text>
        <Pressable onPress={onEditGoal} hitSlop={8}>
          <Text style={styles.clear}>変更</Text>
        </Pressable>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: themeColor }]} />
      </View>
      <View style={styles.footerRow}>
        <Text style={styles.amountText}>
          ¥{netTotal.toLocaleString()} / ¥{goal.targetAmount.toLocaleString()}
        </Text>
        {remainingTimes !== null && (
          <Text style={[styles.remainText, { color: themeColor }]}>
            {remainingTimes === 0 ? "達成目前！" : `あと ${remainingTimes} 回！`}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyCard: {
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: "#E3D6BE",
    borderStyle: "dashed",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  emptyText: { color: "#8C7F6C", fontWeight: "700", fontSize: 13 },
  card: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 14, marginTop: 12 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 13.5, fontWeight: "700", flex: 1 },
  clear: { fontSize: 11, color: "#999" },
  track: { height: 8, backgroundColor: "#F1E7D4", borderRadius: 5, marginTop: 10, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 5 },
  footerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  amountText: { fontSize: 11.5, color: "#8C7F6C" },
  remainText: { fontSize: 12.5, fontWeight: "800" },
});
