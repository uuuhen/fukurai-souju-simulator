import React from "react";
import type { WidgetTaskHandlerProps } from "react-native-android-widget";
import { SavingsWidget } from "./widgets/SavingsWidget";
import { buildWidgetSnapshot } from "@/domain/widgetData";

const nameToWidget = {
  SavingsWidget,
};

// Android側からのウィジェットライフサイクルイベント(追加/更新/リサイズ等)を処理する。
// アプリがバックグラウンド/未起動の状態でもAndroidが呼び出すヘッドレスタスク。
export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const Widget = nameToWidget[props.widgetInfo.widgetName as keyof typeof nameToWidget];
  if (!Widget) return;

  switch (props.widgetAction) {
    case "WIDGET_ADDED":
    case "WIDGET_UPDATE":
    case "WIDGET_RESIZED": {
      const snapshot = await buildWidgetSnapshot();
      props.renderWidget(<Widget snapshot={snapshot} />);
      break;
    }
    case "WIDGET_DELETED":
    case "WIDGET_CLICK":
    default:
      break;
  }
}
