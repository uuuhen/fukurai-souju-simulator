import WidgetKit
import SwiftUI

// App Group 経由でReact Native側(src/domain/widgetSync.ts)が書き込むJSONのミラー。
// フィールドを変更する場合は widgetData.ts の WidgetSnapshot と揃えること。
private struct SavingsSnapshot: Decodable {
    let netTotal: Int
    let characterEmoji: String
    let characterLabel: String
    let goalTitle: String?
    let goalProgressRatio: Double?
}

struct SavingsEntry: TimelineEntry {
    let date: Date
    let netTotal: Int
    let characterEmoji: String
    let characterLabel: String
    let goalTitle: String?
    let goalProgress: Double?
}

struct SavingsProvider: TimelineProvider {
    private let appGroup = "group.com.konbinichokin.app"
    private let storageKey = "konbini_chokin_widget_snapshot"

    private var fallbackEntry: SavingsEntry {
        SavingsEntry(
            date: Date(),
            netTotal: 0,
            characterEmoji: "🐷",
            characterLabel: "貯金をはじめよう",
            goalTitle: nil,
            goalProgress: nil
        )
    }

    func placeholder(in context: Context) -> SavingsEntry {
        fallbackEntry
    }

    func getSnapshot(in context: Context, completion: @escaping (SavingsEntry) -> Void) {
        completion(loadEntry())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<SavingsEntry>) -> Void) {
        let entry = loadEntry()
        // アプリ側で操作があるたびに reloadWidget() を呼ぶので、ここでの再取得は保険的に30分間隔。
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 30, to: Date()) ?? Date()
        completion(Timeline(entries: [entry], policy: .after(nextUpdate)))
    }

    private func loadEntry() -> SavingsEntry {
        guard
            let defaults = UserDefaults(suiteName: appGroup),
            let jsonString = defaults.string(forKey: storageKey),
            let data = jsonString.data(using: .utf8),
            let snapshot = try? JSONDecoder().decode(SavingsSnapshot.self, from: data)
        else {
            return fallbackEntry
        }
        return SavingsEntry(
            date: Date(),
            netTotal: snapshot.netTotal,
            characterEmoji: snapshot.characterEmoji,
            characterLabel: snapshot.characterLabel,
            goalTitle: snapshot.goalTitle,
            goalProgress: snapshot.goalProgressRatio
        )
    }
}

private let backgroundColor = Color(red: 1.0, green: 0.969, blue: 0.910)
private let textColor = Color(red: 0.169, green: 0.137, blue: 0.098)
private let textDimColor = Color(red: 0.549, green: 0.498, blue: 0.424)
private let accentColor = Color(red: 1.0, green: 0.541, blue: 0.239)

struct SavingsWidgetView: View {
    var entry: SavingsProvider.Entry

    var body: some View {
        VStack(spacing: 6) {
            Text(entry.characterEmoji)
                .font(.system(size: 34))
            Text("¥\(entry.netTotal)")
                .font(.system(size: 20, weight: .bold))
                .foregroundColor(textColor)
            Text(entry.characterLabel)
                .font(.system(size: 11))
                .foregroundColor(textDimColor)

            if let title = entry.goalTitle, let progress = entry.goalProgress {
                VStack(spacing: 3) {
                    ProgressView(value: progress)
                        .tint(accentColor)
                    Text(title)
                        .font(.system(size: 9))
                        .foregroundColor(textDimColor)
                        .lineLimit(1)
                }
                .padding(.horizontal, 10)
                .padding(.top, 2)
            }
        }
        .padding()
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(backgroundColor)
    }
}

struct SavingsWidget: Widget {
    let kind: String = "SavingsWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: SavingsProvider()) { entry in
            SavingsWidgetView(entry: entry)
        }
        .configurationDisplayName("コンビニ貯金")
        .description("貯金額と育成中のキャラクターを表示します")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

@main
struct SavingsWidgetBundle: WidgetBundle {
    var body: some Widget {
        SavingsWidget()
    }
}
