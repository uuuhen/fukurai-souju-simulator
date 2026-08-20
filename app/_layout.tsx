import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useSettingsStore } from "@/state/useSettingsStore";
import { useStoresStore } from "@/state/useStoresStore";
import { useCharacterStore } from "@/state/useCharacterStore";
import { useTransactionsStore } from "@/state/useTransactionsStore";

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    (async () => {
      await Promise.all([
        useSettingsStore.getState().load(),
        useStoresStore.getState().load(),
        useCharacterStore.getState().load(),
        useTransactionsStore.getState().load(),
      ]);
      setIsReady(true);
    })();
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#FFF7E8" }}>
        <ActivityIndicator size="large" color="#FF8A3D" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}
