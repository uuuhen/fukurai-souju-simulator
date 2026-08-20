import { Pressable, StyleSheet, Text, View } from "react-native";
import { ConvenienceStore } from "@/types";

export function StoreSelector({
  stores,
  selectedId,
  onSelect,
  themeColor,
}: {
  stores: ConvenienceStore[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  themeColor: string;
}) {
  const visibleStores = stores.filter((s) => s.isVisible).sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <View>
      <Text style={styles.label}>どこで？(任意)</Text>
      <View style={styles.wrap}>
        {visibleStores.map((store) => {
          const selected = store.id === selectedId;
          return (
            <Pressable
              key={store.id}
              style={[
                styles.chip,
                selected && { backgroundColor: themeColor, borderColor: themeColor },
              ]}
              onPress={() => onSelect(selected ? null : store.id)}
            >
              <Text style={styles.chipEmoji}>{store.emoji}</Text>
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{store.name}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 12, color: "#888", marginBottom: 6 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#DDD",
    backgroundColor: "#FFF",
  },
  chipEmoji: { fontSize: 14 },
  chipText: { fontSize: 13, color: "#333" },
  chipTextSelected: { color: "#FFF", fontWeight: "600" },
});
