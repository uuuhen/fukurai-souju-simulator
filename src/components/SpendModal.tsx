import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

export function SpendModal({
  visible,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  onCancel: () => void;
  onConfirm: (amount: number) => void;
}) {
  const [amountText, setAmountText] = useState("");
  const amount = Number(amountText || "0");

  const handleConfirm = () => {
    if (amount <= 0) return;
    onConfirm(amount);
    setAmountText("");
  };

  const handleCancel = () => {
    setAmountText("");
    onCancel();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleCancel}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>いくら使っちゃった？</Text>
          <View style={styles.inputRow}>
            <Text style={styles.yen}>¥</Text>
            <TextInput
              style={styles.input}
              value={amountText}
              onChangeText={(text) => setAmountText(text.replace(/[^0-9]/g, ""))}
              keyboardType="number-pad"
              placeholder="0"
              autoFocus
              maxLength={7}
            />
          </View>
          <Text style={styles.note}>貯金からその分マイナスされます</Text>
          <View style={styles.buttonRow}>
            <Pressable style={[styles.button, styles.cancelButton]} onPress={handleCancel}>
              <Text style={styles.cancelText}>やめる</Text>
            </Pressable>
            <Pressable
              style={[styles.button, styles.confirmButton, amount <= 0 && styles.disabled]}
              onPress={handleConfirm}
              disabled={amount <= 0}
            >
              <Text style={styles.confirmText}>記録する</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", padding: 24 },
  sheet: { backgroundColor: "#FFF", borderRadius: 20, padding: 24, gap: 12 },
  title: { fontSize: 18, fontWeight: "700", textAlign: "center" },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#D9534F",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  yen: { fontSize: 20, fontWeight: "600", marginRight: 4, color: "#555" },
  input: { fontSize: 24, fontWeight: "700", flex: 1, padding: 0 },
  note: { fontSize: 12, color: "#888", textAlign: "center" },
  buttonRow: { flexDirection: "row", gap: 12, marginTop: 8 },
  button: { flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  cancelButton: { backgroundColor: "#EEE" },
  cancelText: { color: "#555", fontWeight: "600" },
  confirmButton: { backgroundColor: "#D9534F" },
  confirmText: { color: "#FFF", fontWeight: "700" },
  disabled: { opacity: 0.5 },
});
