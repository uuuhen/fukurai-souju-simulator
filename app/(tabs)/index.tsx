import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSettingsStore } from "@/state/useSettingsStore";
import { useStoresStore } from "@/state/useStoresStore";
import { useCharacterStore } from "@/state/useCharacterStore";
import { canSaveNow, remainingCooldownMs, useTransactionsStore } from "@/state/useTransactionsStore";
import { useGoalStore } from "@/state/useGoalStore";
import { CharacterCard } from "@/components/CharacterCard";
import { CharacterSelectScreen } from "@/components/CharacterSelectScreen";
import { BoostButton, BOOST_POINTS } from "@/components/BoostButton";
import { StoreSelector } from "@/components/StoreSelector";
import { AmountInput } from "@/components/AmountInput";
import { SaveButton } from "@/components/SaveButton";
import { SpendModal } from "@/components/SpendModal";
import { GoalCard } from "@/components/GoalCard";
import { GoalSetupModal } from "@/components/GoalSetupModal";
import { formatDateTime } from "@/domain/format";
import { ACHIEVEMENTS } from "@/constants/achievements";

export default function HomeScreen() {
  const settings = useSettingsStore((s) => s.settings);
  const stores = useStoresStore((s) => s.stores);
  const character = useCharacterStore((s) => s.character);
  const chooseSpecies = useCharacterStore((s) => s.chooseSpecies);
  const netTotal = useTransactionsStore((s) => s.netTotal);
  const lastSaveAt = useTransactionsStore((s) => s.lastSaveAt);
  const save = useTransactionsStore((s) => s.save);
  const spend = useTransactionsStore((s) => s.spend);
  const boost = useCharacterStore((s) => s.boost);
  const goal = useGoalStore((s) => s.goal);
  const setGoal = useGoalStore((s) => s.setGoal);
  const clearGoal = useGoalStore((s) => s.clearGoal);

  const [amountText, setAmountText] = useState(String(settings.defaultSaveAmount));
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [spendModalVisible, setSpendModalVisible] = useState(false);
  const [goalModalVisible, setGoalModalVisible] = useState(false);

  useEffect(() => {
    setAmountText(String(settings.defaultSaveAmount));
  }, [settings.defaultSaveAmount]);

  const handleSave = async () => {
    const amount = Number(amountText || "0");
    if (amount <= 0) return;
    if (!canSaveNow(lastSaveAt, settings.cooldownMinutes)) return;
    const store = stores.find((s) => s.id === selectedStoreId) ?? null;
    const { achievedGoal, newBadges } = await save({
      amount,
      storeId: store?.id ?? null,
      storeName: store?.name ?? null,
    });
    setSelectedStoreId(null);

    if (achievedGoal) {
      Alert.alert("目標達成！🎉", `「${achievedGoal.title}」の目標を達成しました！`);
    }
    if (newBadges.length > 0) {
      const defs = newBadges.map((id) => ACHIEVEMENTS.find((a) => a.id === id)).filter(Boolean);
      const lines = defs.map((d) => `${d!.emoji} ${d!.title}`).join("\n");
      Alert.alert("実績を解除しました！", lines);
    }
  };

  const handleSpendConfirm = async (amount: number) => {
    const store = stores.find((s) => s.id === selectedStoreId) ?? null;
    await spend({ amount, storeId: store?.id ?? null, storeName: store?.name ?? null });
    setSpendModalVisible(false);
  };

  if (!character || !character.isAlive) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <CharacterSelectScreen
          isRestart={!!character && !character.isAlive}
          onSelect={(species) => chooseSpecies(species)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <CharacterCard character={character} />
        <BoostButton onBoost={() => boost(BOOST_POINTS)} />

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>貯金できた合計</Text>
          <Text style={[styles.summaryAmount, { color: settings.themeColor }]}>
            ¥{netTotal.toLocaleString()}
          </Text>
          {lastSaveAt && (
            <Text style={styles.lastSaved}>最終貯金: {formatDateTime(lastSaveAt)}</Text>
          )}
        </View>

        <GoalCard
          goal={goal}
          netTotal={netTotal}
          perSaveAmount={settings.defaultSaveAmount}
          themeColor={settings.themeColor}
          onSetGoal={() => setGoalModalVisible(true)}
          onEditGoal={() => setGoalModalVisible(true)}
        />

        <View style={styles.section}>
          <AmountInput value={amountText} onChange={setAmountText} themeColor={settings.themeColor} />
          <StoreSelector
            stores={stores}
            selectedId={selectedStoreId}
            onSelect={setSelectedStoreId}
            themeColor={settings.themeColor}
          />
          <SaveButton
            onPress={handleSave}
            remainingMs={remainingCooldownMs(lastSaveAt, settings.cooldownMinutes)}
            themeColor={settings.themeColor}
          />
        </View>

        <Pressable style={styles.spendButton} onPress={() => setSpendModalVisible(true)}>
          <Text style={styles.spendButtonText}>買っちゃった…</Text>
        </Pressable>
      </ScrollView>

      <SpendModal
        visible={spendModalVisible}
        onCancel={() => setSpendModalVisible(false)}
        onConfirm={handleSpendConfirm}
      />

      <GoalSetupModal
        visible={goalModalVisible}
        currentGoal={goal}
        onCancel={() => setGoalModalVisible(false)}
        onConfirm={async (title, targetAmount) => {
          await setGoal(title, targetAmount);
          setGoalModalVisible(false);
        }}
        onRemove={async () => {
          await clearGoal();
          setGoalModalVisible(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFF7E8" },
  container: { padding: 20, gap: 16, paddingBottom: 40 },
  summaryRow: { alignItems: "center", gap: 2 },
  summaryLabel: { fontSize: 13, color: "#888" },
  summaryAmount: { fontSize: 32, fontWeight: "800" },
  lastSaved: { fontSize: 11, color: "#AAA", marginTop: 4 },
  section: {
    backgroundColor: "#FFFFFFAA",
    borderRadius: 20,
    padding: 16,
    gap: 16,
  },
  spendButton: {
    borderWidth: 1.5,
    borderColor: "#D9534F",
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: "center",
  },
  spendButtonText: { color: "#D9534F", fontWeight: "700", fontSize: 15 },
});
