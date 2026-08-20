import { StyleSheet, Text, TextInput, View } from "react-native";

export function NumberField({
  label,
  value,
  onChangeValue,
  suffix,
}: {
  label: string;
  value: number;
  onChangeValue: (value: number) => void;
  suffix: string;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <TextInput
          style={styles.input}
          value={String(value)}
          keyboardType="number-pad"
          onChangeText={(text) => {
            const parsed = Number(text.replace(/[^0-9]/g, ""));
            onChangeValue(Number.isFinite(parsed) ? parsed : 0);
          }}
        />
        <Text style={styles.suffix}>{suffix}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  label: { fontSize: 14, color: "#333" },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
  },
  input: { fontSize: 15, fontWeight: "600", minWidth: 50, textAlign: "right", padding: 0 },
  suffix: { fontSize: 12, color: "#888" },
});
