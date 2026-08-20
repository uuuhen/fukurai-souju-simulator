import { Pressable, StyleSheet, Text, View } from "react-native";
import { CharacterSpecies } from "@/types";
import { CHARACTERS } from "@/constants/characters";

export function CharacterSelectScreen({
  onSelect,
  isRestart,
}: {
  onSelect: (species: CharacterSpecies) => void;
  isRestart: boolean;
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isRestart ? "新しい相棒を選ぼう" : "貯金の相棒を選ぼう"}</Text>
      <Text style={styles.subtitle}>
        {isRestart
          ? "使いすぎで前の子はいなくなってしまいました。気持ちを切り替えて、また育てよう。"
          : "貯金するたびに一緒に育っていくキャラクターです"}
      </Text>
      {Object.values(CHARACTERS).map((def) => (
        <Pressable key={def.species} style={styles.card} onPress={() => onSelect(def.species)}>
          <Text style={styles.emoji}>{def.stages[0].emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{def.displayName}</Text>
            <Text style={styles.description}>{def.description}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 12, justifyContent: "center" },
  title: { fontSize: 20, fontWeight: "700", textAlign: "center" },
  subtitle: { fontSize: 13, color: "#666", textAlign: "center", marginBottom: 12 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
  },
  emoji: { fontSize: 48 },
  name: { fontSize: 16, fontWeight: "600" },
  description: { fontSize: 12, color: "#777", marginTop: 2 },
});
