# コンビニ貯金

「コンビニで無駄なものを買わなかったら、その分だけ貯金したのと一緒」という考え方で、
我慢できた金額を記録して貯めていくアプリです。なるべくワンタップで完結するように設計しています。

- 「貯金する」ボタンをワンタップで、日時付きの記録として貯金額を積み立てます
- 「買っちゃった」ボタンで使った金額を記録すると、貯金額からその実額をマイナスします
- 貯金するほど育つキャラクター（3種類 × 4段階進化）が相棒になります。使いすぎるとランクダウンし、使いすぎ続けると相棒がいなくなり、また最初から育て直しになります
- iOS (Apple App Store) / Android (Google Play) の両ストアへの公開を想定した React Native (Expo) アプリです

## 技術スタック

- [Expo](https://expo.dev/) (React Native + TypeScript) / [expo-router](https://docs.expo.dev/router/introduction/) によるファイルベースルーティング
- [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/) でスマホ本体にローカル保存（サーバー送信なし）
- [zustand](https://github.com/pmndrs/zustand) による状態管理
- CSV出力は `expo-file-system` + `expo-sharing`

## ディレクトリ構成

```
app/                  画面 (expo-router)
  (tabs)/index.tsx     ホーム画面
  (tabs)/history.tsx   履歴画面(月別)
  (tabs)/settings.tsx  設定画面
src/
  db/                 SQLiteアクセス層 (テーブル定義・CRUD)
  state/              zustandストア (settings / stores / character / transactions)
  domain/             ドメインロジック (成長計算・月別集計・CSV生成・日付整形)
  components/         UIコンポーネント
  constants/          コンビニ初期リスト、キャラクター定義、テーマカラー
  types/              共通の型定義
```

## セットアップ

このリポジトリのコードは作成しましたが、**開発に使ったセッションのネットワークポリシーで
npm registry へのアクセスがブロックされていたため、`npm install` や実機/シミュレータでの
起動確認はこのセッションでは実施できていません。** お手元の環境で以下を実行してください。

```bash
npm install
npx expo install --fix   # Expo SDKに合わせて依存バージョンを自動調整
npm run start             # Expo Dev Server 起動 (iOS/Android/Webを選択)
npm run typecheck         # tsc --noEmit で型チェック
```

もし依存バージョンの不整合でエラーが出た場合は `npx expo install --fix` で解消してください。

## ストアへの公開

[EAS Build](https://docs.expo.dev/build/introduction/) / [EAS Submit](https://docs.expo.dev/submit/introduction/) の利用を想定しています。

```bash
npm install -g eas-cli
eas login
eas build --platform ios
eas build --platform android
eas submit --platform ios
eas submit --platform android
```

`app.json` の `ios.bundleIdentifier` / `android.package` は仮の値 (`com.konbinichokin.app`) です。
実際に申請する際は、開発者アカウントで確保した一意な識別子に差し替えてください。
`assets/icon.png` などのアイコン・スプラッシュ画像もプレースホルダー（単色の円）なので、
本番前に正式なデザインへ差し替える必要があります。

## データ保存・容量について

全データはサーバーに送らず、端末内の SQLite (`expo-sqlite`) にのみ保存します。

**「1日18回登録 × 365日 × 100年」でも保存できるか？**

- 1件あたりの記録は日時・種別(貯金/使った)・金額・コンビニ名・メモ程度で、SQLite上では
  インデックスも含めて安全側に見積もって概ね200バイト程度
- 100年分の件数: 18回 × 365日 × 100年 = 657,000件
- 想定データ量: 657,000件 × 約200バイト ≈ **125〜150MB程度**（インデックス込みでも200MB未満）

現在のスマートフォンの空き容量（数十〜数百GB）から見て無視できるレベルのため、
「100年分保存」という想定はそのまま採用しています。想定の変更は不要です。

## 育成ロジックの初期パラメータ

`src/constants/characters.ts` にまとまっています。ゲームバランスとして調整しやすいよう定数化しています。

- 成長ポイント = 純貯金額(円)をそのままポイントとして扱う（1円 = 1ポイント）
- 500ポイントごとに1レベルアップ (`POINTS_PER_LEVEL`)
- 進化: Lv1(たまご) → Lv5(段階2) → Lv15(段階3) → Lv30(段階4)
- 「買っちゃった」でポイントが減り、レベルダウン・見た目が不健康になる
- 累計が -3,000pt を下回ると相棒が消滅し、キャラクター選び直しになる (`DISAPPEAR_THRESHOLD`)
- 課金ブースト（`src/components/BoostButton.tsx`）は仮に「+1,500pt（3レベル相当）」としています

## 未実装・要差し替えの項目

- **課金（アプリ内課金）**: `BoostButton` は購入確認 → ポイント付与までのロジックのみ実装したモックです。
  本番では [`react-native-iap`](https://github.com/hyochan/react-native-iap) 等で
  App Store Connect / Google Play Console 側の消費型アイテムと接続してください。
- **アイコン・スプラッシュ画像**: プレースホルダーです。正式なデザインに差し替えてください。
- **依存パッケージのインストール確認・実機動作確認**: 前述の通りネットワーク制約により未実施です。

## 設定できる項目

- テーマカラー（プリセットから選択）
- 貯金ボタンのデフォルト金額
- 貯金するボタンの連打防止時間（デフォルト60分）
- コンビニの名前・アイコン・表示/非表示・追加/削除（カスタム分のみ削除可）
- 履歴の全削除
- CSV出力（今月 / 先月 / 全期間 / 期間を指定、して共有シートから保存）
