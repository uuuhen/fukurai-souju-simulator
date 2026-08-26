import "expo-router/entry";
import { registerWidgetTaskHandler } from "react-native-android-widget";
import { widgetTaskHandler } from "./widget-task-handler";

// Android: ホーム画面ウィジェットの更新をアプリ本体とは別プロセスで処理できるようにする
registerWidgetTaskHandler(widgetTaskHandler);
