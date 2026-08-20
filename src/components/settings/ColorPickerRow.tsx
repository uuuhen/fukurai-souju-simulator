import { Pressable, StyleSheet, View } from "react-native";
import { THEME_COLOR_PRESETS } from "@/constants/theme";

export function ColorPickerRow({ selected, onSelect }: { selected: string; onSelect: (color: string) => void }) {
  return (
    <View style={styles.row}>
      {THEME_COLOR_PRESETS.map((preset) => (
        <Pressable
          key={preset.id}
          onPress={() => onSelect(preset.color)}
          style={[
            styles.swatch,
            { backgroundColor: preset.color },
            selected === preset.color && styles.swatchSelected,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
  swatch: { width: 36, height: 36, borderRadius: 18 },
  swatchSelected: { borderWidth: 3, borderColor: "#333" },
});
