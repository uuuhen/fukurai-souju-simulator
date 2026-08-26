import { StyleSheet, Text, View } from "react-native";
import { CharacterState } from "@/types";
import { CHARACTERS, POINTS_PER_LEVEL } from "@/constants/characters";

export function CharacterCard({ character }: { character: CharacterState }) {
  const def = CHARACTERS[character.species];
  const stageDef = def.stages.find((s) => s.stage === character.stage) ?? def.stages[0];
  const isSick = character.lastAction === "spend";
  const emoji = isSick ? def.sickEmoji : stageDef.emoji;
  const pointsIntoLevel = character.points - (character.level - 1) * POINTS_PER_LEVEL;
  const progress = Math.max(0, Math.min(1, pointsIntoLevel / POINTS_PER_LEVEL));

  return (
    <View style={styles.card}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.name}>
        {def.displayName}・{stageDef.name}
      </Text>
      <Text style={styles.level}>Lv. {character.level}</Text>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>
      <Text style={styles.points}>累計貯金 {character.points.toLocaleString()} 円相当</Text>
      {isSick && <Text style={styles.sickText}>使いすぎで元気がないみたい…次は貯金してあげよう</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    gap: 4,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  emoji: { fontSize: 72 },
  name: { fontSize: 16, fontWeight: "600", marginTop: 4 },
  level: { fontSize: 14, color: "#666" },
  progressTrack: {
    width: "100%",
    height: 8,
    backgroundColor: "#EEE",
    borderRadius: 4,
    marginTop: 8,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: "#FF8A3D" },
  points: { fontSize: 13, color: "#888", marginTop: 6 },
  sickText: { fontSize: 12, color: "#D9534F", marginTop: 6, textAlign: "center" },
});
