import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";

function formatRemaining(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function SaveButton({
  onPress,
  remainingMs,
  themeColor,
}: {
  onPress: () => void;
  remainingMs: number;
  themeColor: string;
}) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setTick(0);
    if (remainingMs <= 0) return;
    const interval = setInterval(() => setTick((t) => t + 1000), 1000);
    return () => clearInterval(interval);
  }, [remainingMs]);

  const displayRemaining = Math.max(0, remainingMs - tick);
  const disabled = displayRemaining > 0;

  return (
    <Pressable
      style={[styles.button, { backgroundColor: disabled ? "#CCC" : themeColor }]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.text}>{disabled ? `あと ${formatRemaining(displayRemaining)}` : "貯金する"}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 24,
    paddingVertical: 20,
    alignItems: "center",
  },
  text: { color: "#FFF", fontSize: 20, fontWeight: "700" },
});
