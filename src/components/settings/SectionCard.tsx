import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

export function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#FFF", borderRadius: 16, padding: 16, gap: 12 },
  title: { fontSize: 14, fontWeight: "700", color: "#444" },
});
