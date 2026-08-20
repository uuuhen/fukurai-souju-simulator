import { useState } from "react";
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { ConvenienceStore } from "@/types";

export function StoreManageSection({
  stores,
  onUpdate,
  onAdd,
  onRemove,
}: {
  stores: ConvenienceStore[];
  onUpdate: (id: string, updates: Partial<Pick<ConvenienceStore, "name" | "emoji" | "isVisible">>) => void;
  onAdd: (name: string, emoji: string) => void;
  onRemove: (id: string) => void;
}) {
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("🏪");

  const sorted = [...stores].sort((a, b) => a.sortOrder - b.sortOrder);

  const handleAdd = () => {
    if (!newName.trim()) return;
    onAdd(newName.trim(), newEmoji.trim() || "🏪");
    setNewName("");
    setNewEmoji("🏪");
  };

  return (
    <View style={{ gap: 10 }}>
      {sorted.map((store) => (
        <View key={store.id} style={styles.row}>
          <TextInput
            style={styles.emojiInput}
            value={store.emoji}
            onChangeText={(text) => onUpdate(store.id, { emoji: text })}
            maxLength={4}
          />
          <TextInput
            style={styles.nameInput}
            value={store.name}
            onChangeText={(text) => onUpdate(store.id, { name: text })}
          />
          <Switch value={store.isVisible} onValueChange={(value) => onUpdate(store.id, { isVisible: value })} />
          {store.isCustom && (
            <Pressable onPress={() => onRemove(store.id)} hitSlop={8}>
              <Text style={styles.remove}>削除</Text>
            </Pressable>
          )}
        </View>
      ))}

      <View style={styles.addRow}>
        <TextInput
          style={styles.emojiInput}
          value={newEmoji}
          onChangeText={setNewEmoji}
          maxLength={4}
        />
        <TextInput
          style={styles.nameInput}
          value={newName}
          onChangeText={setNewName}
          placeholder="新しいコンビニ名"
        />
        <Pressable style={styles.addButton} onPress={handleAdd}>
          <Text style={styles.addButtonText}>追加</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  emojiInput: {
    width: 40,
    textAlign: "center",
    borderWidth: 1,
    borderColor: "#EEE",
    borderRadius: 8,
    paddingVertical: 6,
  },
  nameInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#EEE",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
  },
  remove: { color: "#D9534F", fontSize: 12 },
  addRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  addButton: { backgroundColor: "#333", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  addButtonText: { color: "#FFF", fontSize: 12, fontWeight: "600" },
});
