import { useMemo } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSettingsStore } from "@/state/useSettingsStore";
import { useTransactionsStore } from "@/state/useTransactionsStore";
import { useAchievementsStore } from "@/state/useAchievementsStore";
import { MonthlyHistoryCard } from "@/components/MonthlyHistoryCard";
import { ReportSection } from "@/components/ReportSection";
import { AchievementGrid } from "@/components/AchievementGrid";
import { buildStoreReport, buildWeekdayReport, currentMonthTransactions } from "@/domain/report";

export default function HistoryScreen() {
  const themeColor = useSettingsStore((s) => s.settings.themeColor);
  const monthlyGroups = useTransactionsStore((s) => s.monthlyGroups);
  const transactions = useTransactionsStore((s) => s.transactions);
  const netTotal = useTransactionsStore((s) => s.netTotal);
  const unlockedIds = useAchievementsStore((s) => s.unlockedIds);

  const { weekdayStats, storeStats } = useMemo(() => {
    const thisMonth = currentMonthTransactions(transactions);
    return { weekdayStats: buildWeekdayReport(thisMonth), storeStats: buildStoreReport(thisMonth) };
  }, [transactions]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.headerBar}>
        <Text style={styles.title}>履歴</Text>
        <Text style={styles.subtitle}>累計 ¥{netTotal.toLocaleString()}</Text>
      </View>
      <FlatList
        data={monthlyGroups}
        keyExtractor={(item) => item.monthKey}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={{ gap: 12, marginBottom: 4 }}>
            <ReportSection weekdayStats={weekdayStats} storeStats={storeStats} themeColor={themeColor} />
            <AchievementGrid unlockedIds={unlockedIds} />
          </View>
        }
        renderItem={({ item }) => <MonthlyHistoryCard group={item} themeColor={themeColor} />}
        ListEmptyComponent={
          <Text style={styles.empty}>まだ履歴がありません。{"\n"}コンビニで我慢できたら「貯金する」を押してみよう。</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFF7E8" },
  headerBar: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: 22, fontWeight: "800" },
  subtitle: { fontSize: 13, color: "#888", marginTop: 2 },
  list: { paddingHorizontal: 20, paddingBottom: 40, gap: 12 },
  empty: { textAlign: "center", color: "#AAA", marginTop: 60, lineHeight: 22 },
});
