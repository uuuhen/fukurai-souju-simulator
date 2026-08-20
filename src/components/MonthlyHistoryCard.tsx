import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MonthlyHistoryGroup } from "@/types";
import { formatDateTime } from "@/domain/format";

export function MonthlyHistoryCard({ group, themeColor }: { group: MonthlyHistoryGroup; themeColor: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.card}>
      <Pressable style={styles.header} onPress={() => setExpanded((e) => !e)}>
        <Text style={styles.month}>{group.label}</Text>
        <View style={styles.amounts}>
          <Text style={[styles.saved, { color: themeColor }]}>+¥{group.totalSaved.toLocaleString()}</Text>
          {group.totalSpent > 0 && (
            <Text style={styles.spent}>-¥{group.totalSpent.toLocaleString()}</Text>
          )}
        </View>
        <Text style={styles.chevron}>{expanded ? "▲" : "▼"}</Text>
      </Pressable>

      {expanded && (
        <View style={styles.list}>
          {group.transactions.map((tx) => (
            <View key={tx.id} style={styles.row}>
              <Text style={styles.rowDate}>{formatDateTime(tx.occurredAt)}</Text>
              <Text style={styles.rowStore}>{tx.storeName ?? "-"}</Text>
              <Text style={[styles.rowAmount, tx.type === "spend" && styles.rowAmountSpend]}>
                {tx.type === "save" ? "+" : "-"}¥{tx.amount.toLocaleString()}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#FFF", borderRadius: 16, overflow: "hidden" },
  header: { flexDirection: "row", alignItems: "center", padding: 16, gap: 8 },
  month: { fontSize: 15, fontWeight: "700", flex: 1 },
  amounts: { alignItems: "flex-end" },
  saved: { fontSize: 15, fontWeight: "700" },
  spent: { fontSize: 12, color: "#D9534F" },
  chevron: { marginLeft: 8, color: "#AAA" },
  list: { borderTopWidth: 1, borderTopColor: "#F0F0F0" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "#F7F7F7",
    gap: 8,
  },
  rowDate: { fontSize: 11, color: "#999", flex: 1.3 },
  rowStore: { fontSize: 12, color: "#555", flex: 1 },
  rowAmount: { fontSize: 13, fontWeight: "600", color: "#3DAA6B" },
  rowAmountSpend: { color: "#D9534F" },
});
