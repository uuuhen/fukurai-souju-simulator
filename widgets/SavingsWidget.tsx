import React from "react";
import { FlexWidget, TextWidget } from "react-native-android-widget";
import { WidgetSnapshot } from "@/domain/widgetData";

const BG = "#FFF7E8";
const ACCENT = "#FF8A3D";
const TEXT = "#2B2319";
const TEXT_DIM = "#8C7F6C";

// Android ホーム画面ウィジェット。react-native-android-widget は通常の
// View/Text ではなく専用のプリミティブ(FlexWidget/TextWidget)で描画する。
export function SavingsWidget({ snapshot }: { snapshot: WidgetSnapshot }) {
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: "match_parent",
        width: "match_parent",
        backgroundColor: BG,
        borderRadius: 24,
        padding: 16,
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <TextWidget text={snapshot.characterEmoji} style={{ fontSize: 36 }} />
      <TextWidget
        text={`¥${snapshot.netTotal.toLocaleString("ja-JP")}`}
        style={{ fontSize: 22, fontWeight: "700", color: TEXT, marginTop: 4 }}
      />
      <TextWidget text={snapshot.characterLabel} style={{ fontSize: 11, color: TEXT_DIM, marginTop: 2 }} />
      {snapshot.goalTitle && snapshot.goalProgressRatio !== null && (
        <FlexWidget
          style={{
            width: "match_parent",
            height: 6,
            flexDirection: "row",
            backgroundColor: "#F1E7D4",
            borderRadius: 3,
            marginTop: 8,
          }}
        >
          <FlexWidget
            style={{
              height: "match_parent",
              flex: Math.max(0.02, snapshot.goalProgressRatio),
              backgroundColor: ACCENT,
              borderRadius: 3,
            }}
          />
          <FlexWidget style={{ height: "match_parent", flex: Math.max(0.02, 1 - snapshot.goalProgressRatio) }} />
        </FlexWidget>
      )}
    </FlexWidget>
  );
}
