import { Tabs } from "expo-router";
import { Text } from "react-native";
import { useSettingsStore } from "@/state/useSettingsStore";

function TabIcon({ emoji }: { emoji: string }) {
  return <Text style={{ fontSize: 20 }}>{emoji}</Text>;
}

export default function TabsLayout() {
  const themeColor = useSettingsStore((s) => s.settings.themeColor);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: themeColor,
        tabBarInactiveTintColor: "#999",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "ホーム", tabBarIcon: () => <TabIcon emoji="🏠" /> }}
      />
      <Tabs.Screen
        name="history"
        options={{ title: "履歴", tabBarIcon: () => <TabIcon emoji="📅" /> }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: "設定", tabBarIcon: () => <TabIcon emoji="⚙️" /> }}
      />
    </Tabs>
  );
}
