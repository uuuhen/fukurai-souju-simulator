import { Platform } from "react-native";
import { buildWidgetSnapshot } from "@/domain/widgetData";

// ウィジェット表示に使うキー。iOS側(App Group UserDefaults)・Android側の
// どちらのネイティブコードからもこの名前で参照する想定。
export const WIDGET_STORAGE_KEY = "konbini_chokin_widget_snapshot";
export const ANDROID_WIDGET_NAME = "SavingsWidget";

// 貯金/買っちゃったの操作が終わるたびに呼び出し、ホーム画面ウィジェットに
// 最新の要約データを反映させる。ウィジェット未追加時やネイティブモジュール
// 未対応環境(Expo Go等)でも落ちないよう、失敗は握りつぶす。
export async function syncWidgets(): Promise<void> {
  try {
    const snapshot = await buildWidgetSnapshot();
    if (Platform.OS === "android") {
      await syncAndroidWidget(snapshot);
    } else if (Platform.OS === "ios") {
      await syncIosWidget(snapshot);
    }
  } catch (error) {
    if (__DEV__) {
      console.warn("[widgetSync] failed to sync widget", error);
    }
  }
}

async function syncAndroidWidget(snapshot: Awaited<ReturnType<typeof buildWidgetSnapshot>>): Promise<void> {
  // react-native-android-widget: ホーム画面に追加済みのウィジェットへ即時再描画をリクエストする。
  const { requestWidgetUpdate } = await import("react-native-android-widget");
  const React = await import("react");
  const { SavingsWidget } = await import("../../widgets/SavingsWidget");

  await requestWidgetUpdate({
    widgetName: ANDROID_WIDGET_NAME,
    renderWidget: () => React.createElement(SavingsWidget, { snapshot }),
    widgetNotFound: () => {
      // ホーム画面にウィジェットが追加されていない場合は何もしない
    },
  });
}

async function syncIosWidget(snapshot: Awaited<ReturnType<typeof buildWidgetSnapshot>>): Promise<void> {
  // expo-apple-targets: App Group の共有領域(UserDefaults)にJSONを書き込み、
  // WidgetKit 側のタイムラインをリロードする。
  // NOTE: ExtensionStorage の正確なAPIはライブラリのバージョンで変わることがあるため、
  // `npx expo install expo-apple-targets` 後に公式READMEでAPIを確認してください。
  const { ExtensionStorage } = await import("expo-apple-targets");
  const storage = new ExtensionStorage("group.com.konbinichokin.app");
  storage.set(WIDGET_STORAGE_KEY, JSON.stringify(snapshot));
  ExtensionStorage.reloadWidget();
}
