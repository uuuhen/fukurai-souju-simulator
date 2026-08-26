import { Alert, ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSettingsStore } from "@/state/useSettingsStore";
import { useStoresStore } from "@/state/useStoresStore";
import { useTransactionsStore } from "@/state/useTransactionsStore";
import { listTransactionsBetween } from "@/db/transactionsRepo";
import { SectionCard } from "@/components/settings/SectionCard";
import { ColorPickerRow } from "@/components/settings/ColorPickerRow";
import { NumberField } from "@/components/settings/NumberField";
import { StoreManageSection } from "@/components/settings/StoreManageSection";
import { CsvExportSection, type CsvRangePreset } from "@/components/settings/CsvExportSection";
import { resolveCsvRange } from "@/domain/dateRange";
import { exportCsvAndShare } from "@/domain/csv";

export default function SettingsScreen() {
  const settings = useSettingsStore((s) => s.settings);
  const updateThemeColor = useSettingsStore((s) => s.updateThemeColor);
  const updateDefaultSaveAmount = useSettingsStore((s) => s.updateDefaultSaveAmount);
  const updateCooldownMinutes = useSettingsStore((s) => s.updateCooldownMinutes);

  const stores = useStoresStore((s) => s.stores);
  const updateStore = useStoresStore((s) => s.update);
  const addStore = useStoresStore((s) => s.add);
  const removeStore = useStoresStore((s) => s.remove);

  const deleteAllTransactions = useTransactionsStore((s) => s.deleteAll);

  const handleExportCsv = async (range: { preset: CsvRangePreset; startDate: string; endDate: string }) => {
    const { startIso, endIso, label } = resolveCsvRange(range.preset, range.startDate, range.endDate);
    const transactions = await listTransactionsBetween(startIso, endIso);
    if (transactions.length === 0) {
      Alert.alert("出力対象がありません", "指定した期間に履歴がありませんでした。");
      return;
    }
    await exportCsvAndShare(transactions, label);
  };

  const handleDeleteAllHistory = () => {
    Alert.alert("履歴を全て削除しますか？", "この操作は取り消せません。", [
      { text: "キャンセル", style: "cancel" },
      { text: "削除する", style: "destructive", onPress: () => deleteAllTransactions() },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>設定</Text>

        <SectionCard title="テーマカラー">
          <ColorPickerRow selected={settings.themeColor} onSelect={updateThemeColor} />
        </SectionCard>

        <SectionCard title="貯金金額">
          <NumberField
            label="デフォルト貯金額"
            value={settings.defaultSaveAmount}
            onChangeValue={updateDefaultSaveAmount}
            suffix="円"
          />
        </SectionCard>

        <SectionCard title="貯金するボタンの連打防止">
          <NumberField
            label="次に押せるまでの時間"
            value={settings.cooldownMinutes}
            onChangeValue={updateCooldownMinutes}
            suffix="分"
          />
        </SectionCard>

        <SectionCard title="コンビニの設定">
          <StoreManageSection
            stores={stores}
            onUpdate={(id, updates) => updateStore(id, updates)}
            onAdd={(name, emoji) => addStore(name, emoji)}
            onRemove={(id) => removeStore(id)}
          />
        </SectionCard>

        <SectionCard title="CSV出力">
          <CsvExportSection onExport={handleExportCsv} />
        </SectionCard>

        <SectionCard title="履歴データ">
          <Text style={styles.dangerText} onPress={handleDeleteAllHistory}>
            すべての履歴を削除する
          </Text>
        </SectionCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFF7E8" },
  container: { padding: 20, gap: 14, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: "800", marginBottom: 4 },
  dangerText: { color: "#D9534F", fontWeight: "700", fontSize: 14, textAlign: "center", paddingVertical: 6 },
});
