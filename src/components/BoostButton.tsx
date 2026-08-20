import { Alert, Pressable, StyleSheet, Text } from "react-native";
import { POINTS_PER_LEVEL } from "@/constants/characters";

export const BOOST_POINTS = POINTS_PER_LEVEL * 3;

// TODO: 本番リリース時は react-native-iap 等で App Store / Google Play の
// 実際の課金商品(消費型アイテム)と接続すること。ここでは購入完了後の
// 反映処理のみを先に実装している。
export function BoostButton({ onBoost }: { onBoost: () => void }) {
  const handlePress = () => {
    Alert.alert(
      "レベルアップ購入",
      `課金して相棒を一気に成長させますか？(+${BOOST_POINTS}pt 相当)`,
      [
        { text: "やめる", style: "cancel" },
        { text: "購入する", onPress: onBoost },
      ]
    );
  };

  return (
    <Pressable style={styles.button} onPress={handlePress}>
      <Text style={styles.text}>💎 課金してレベルアップ</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 16,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#F0E6FF",
  },
  text: { color: "#8A5DFF", fontWeight: "700", fontSize: 13 },
});
