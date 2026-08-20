import { StyleSheet, Text, TextInput, View } from "react-native";

export function AmountInput({
  value,
  onChange,
  themeColor,
}: {
  value: string;
  onChange: (value: string) => void;
  themeColor: string;
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>金額</Text>
      <View style={[styles.inputRow, { borderColor: themeColor }]}>
        <Text style={styles.yen}>¥</Text>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={(text) => onChange(text.replace(/[^0-9]/g, ""))}
          keyboardType="number-pad"
          placeholder="0"
          maxLength={7}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: { fontSize: 12, color: "#888" },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#FFF",
  },
  yen: { fontSize: 20, fontWeight: "600", marginRight: 4, color: "#555" },
  input: { fontSize: 24, fontWeight: "700", flex: 1, padding: 0 },
});
