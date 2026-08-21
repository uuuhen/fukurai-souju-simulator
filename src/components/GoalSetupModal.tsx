import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SavingsGoal } from "@/types";

export function GoalSetupModal({
  visible,
  currentGoal,
  onCancel,
  onConfirm,
  onRemove,
}: {
  visible: boolean;
  currentGoal: SavingsGoal | null;
  onCancel: () => void;
  onConfirm: (title: string, targetAmount: number) => void;
  onRemove: () => void;
}) {
  const [title, setTitle] = useState("");
  const [amountText, setAmountText] = useState("");

  useEffect(() => {
    if (visible) {
      setTitle(currentGoal?.title ?? "");
      setAmountText(currentGoal ? String(currentGoal.targetAmount) : "");
    }
  }, [visible, currentGoal]);

  const amount = Number(amountText || "0");
  const canConfirm = title.trim().length > 0 && amount > 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>目標貯金額を設定</Text>

          <Text style={styles.label}>何のために貯める？</Text>
          <TextInput
            style={styles.textInput}
            value={title}
            onChangeText={setTitle}
            placeholder="例: 旅行費用"
          />

          <Text style={styles.label}>目標金額</Text>
          <View style={styles.inputRow}>
            <Text style={styles.yen}>¥</Text>
            <TextInput
              style={styles.input}
              value={amountText}
              onChangeText={(text) => setAmountText(text.replace(/[^0-9]/g, ""))}
              keyboardType="number-pad"
              placeholder="30000"
              maxLength={8}
            />
          </View>

          <View style={styles.buttonRow}>
            <Pressable style={[styles.button, styles.cancelButton]} onPress={onCancel}>
              <Text style={styles.cancelText}>やめる</Text>
            </Pressable>
            <Pressable
              style={[styles.button, styles.confirmButton, !canConfirm && styles.disabled]}
              onPress={() => canConfirm && onConfirm(title.trim(), amount)}
              disabled={!canConfirm}
            >
              <Text style={styles.confirmText}>設定する</Text>
            </Pressable>
          </View>

          {currentGoal && (
            <Pressable onPress={onRemove}>
              <Text style={styles.removeText}>目標をやめる</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", padding: 24 },
  sheet: { backgroundColor: "#FFF", borderRadius: 20, padding: 24, gap: 8 },
  title: { fontSize: 18, fontWeight: "700", textAlign: "center", marginBottom: 6 },
  label: { fontSize: 12, color: "#888", marginTop: 8 },
  textInput: {
    borderWidth: 1.5,
    borderColor: "#DDD",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    marginTop: 4,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FF8A3D",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 4,
  },
  yen: { fontSize: 20, fontWeight: "600", marginRight: 4, color: "#555" },
  input: { fontSize: 24, fontWeight: "700", flex: 1, padding: 0 },
  buttonRow: { flexDirection: "row", gap: 12, marginTop: 14 },
  button: { flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  cancelButton: { backgroundColor: "#EEE" },
  cancelText: { color: "#555", fontWeight: "600" },
  confirmButton: { backgroundColor: "#FF8A3D" },
  confirmText: { color: "#FFF", fontWeight: "700" },
  disabled: { opacity: 0.5 },
  removeText: { textAlign: "center", color: "#D9534F", fontSize: 12.5, marginTop: 12, fontWeight: "600" },
});
