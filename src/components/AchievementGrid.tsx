import { StyleSheet, Text, View } from "react-native";
import { AchievementId } from "@/types";
import { ACHIEVEMENTS } from "@/constants/achievements";

export function AchievementGrid({ unlockedIds }: { unlockedIds: Set<AchievementId> }) {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>実績</Text>
        <Text style={styles.count}>
          {unlockedIds.size} / {ACHIEVEMENTS.length}
        </Text>
      </View>
      <View style={styles.grid}>
        {ACHIEVEMENTS.map((a) => {
          const unlocked = unlockedIds.has(a.id);
          return (
            <View key={a.id} style={[styles.badge, !unlocked && styles.badgeLocked]}>
              <Text style={[styles.badgeEmoji, !unlocked && styles.badgeEmojiLocked]}>{a.emoji}</Text>
              <Text style={[styles.badgeTitle, !unlocked && styles.badgeTitleLocked]} numberOfLines={1}>
                {a.title}
              </Text>
              <Text style={styles.badgeDesc} numberOfLines={2}>
                {a.description}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 14 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 14, fontWeight: "800" },
  count: { fontSize: 12, color: "#8C7F6C", fontWeight: "600" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  badge: {
    width: "31%",
    backgroundColor: "#FFF7E8",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: "center",
  },
  badgeLocked: { backgroundColor: "#F5F2EC", opacity: 0.55 },
  badgeEmoji: { fontSize: 24 },
  badgeEmojiLocked: { opacity: 0.5 },
  badgeTitle: { fontSize: 10.5, fontWeight: "700", marginTop: 4, textAlign: "center" },
  badgeTitleLocked: { color: "#999" },
  badgeDesc: { fontSize: 8.5, color: "#A79A83", textAlign: "center", marginTop: 2, lineHeight: 11 },
});
