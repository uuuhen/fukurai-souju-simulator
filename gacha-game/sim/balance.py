"""千霊(仮) バランス検証シミュレータ。標準ライブラリのみで動く。

    python3 gacha-game/sim/balance.py            # すべて
    python3 gacha-game/sim/balance.py gacha      # 排出確率
    python3 gacha-game/sim/balance.py growth     # ランクアップまでの日数
    python3 gacha-game/sim/balance.py battle     # 対戦バランス

DESIGN.md に載せている数値はこのスクリプトの出力から取っている。
"""

import csv
import itertools
import random
import sys
from dataclasses import dataclass, field
from pathlib import Path

CARDS_CSV = Path(__file__).resolve().parent.parent / "data" / "cards_season1.csv"

# ---------------------------------------------------------------- くじ

# 連の単位ごとの「★5 が1枚以上出る確率」。単位ごとに固定する。
# 1回あたりに直すと 10連が一番高く、1000連が一番低い。
UNIT_SSR = {10: 0.01, 100: 0.08, 1000: 0.50}
# ★4以下は単位によらず1回あたりの排出率。★1 は残り全部
LOWER_RATES = {4: 0.010, 3: 0.050, 2: 0.240}

PITY = 3000  # ★5 が出ないまま 3000回引いたら次の1回は★5確定

# ランクアップに必要な合成値と、1枚あたりの合成値(レアリティ別)
RANK_UP_POINTS = 1000
SYNTH_POINTS = {1: 1, 2: 2, 3: 5, 4: 10, 5: 20}
STAT_RANK_CAP = 10  # 能力が伸びるのはランク10まで。それ以降は見た目と名誉のみ

# くじ枠
FREE_PER_HOUR = 200
FREE_STOCK_CAP = 9600  # 48時間分。2日に1回ログインすれば取りこぼさない
HOURLY_CAP = 1000  # 上限突破しても1時間に得られるのは1000回まで
BOOST_STEPS = [400, 300, 200]  # 100円ごとの追加。HOURLY_CAP を超える分は切り捨て
SUBSCRIPTION_PER_DAY = 4000


def ssr_rate(unit):
    """unit 連で引いたときの1回あたりの★5排出率。"""
    return 1.0 - (1.0 - UNIT_SSR[unit]) ** (1 / unit)


def rates(unit):
    r = {5: ssr_rate(unit), **LOWER_RATES}
    r[1] = 1.0 - sum(r.values())
    return r


def p_at_least_one(n, p):
    return 1.0 - (1.0 - p) ** n


def boost_ladder():
    """[(今回の追加, その1時間の合計), ...]。100円ごとに1段。"""
    total, ladder = FREE_PER_HOUR, []
    for step in BOOST_STEPS:
        added = min(step, HOURLY_CAP - total)
        if added <= 0:
            break
        total += added
        ladder.append((added, total))
    return ladder


def report_gacha():
    print("== くじ: 連の単位ごとの★5 ==")
    print("  単位    ★5が1枚以上  1回あたり  1000回あたりの★5  天井に届く確率")
    for unit, p in UNIT_SSR.items():
        print(f"  {unit:>4}連  {p:>10.2%}  {ssr_rate(unit):>9.4%}  {1000 * ssr_rate(unit):>13.2f}枚"
              f"  {(1 - p) ** (PITY / unit):>13.1%}")
    print("  ★4 {:.2%} / ★3 {:.2%} / ★2 {:.2%} (単位によらず1回あたり)".format(*LOWER_RATES.values()))
    print("  同じ1000回を引いたときに★5が1枚以上出る確率:")
    for unit, p in UNIT_SSR.items():
        print(f"    {unit:>4}連 x {1000 // unit:>3}: {p_at_least_one(1000 // unit, p):6.2%}")

    print("\n== 上限突破 (1時間ごと) ==")
    for i, (added, total) in enumerate(boost_ladder(), 1):
        print(f"  {100 * i:>3}円: その1時間 {total:>5}回 (今回 +{added}, {100 / added:.2f}円/回)")


# ------------------------------------------------------------- カード

@dataclass(frozen=True)
class Card:
    id: str
    name: str
    type: str
    attr: str
    rarity: int
    hp: int
    atk: int
    skill: str


def load_cards():
    with open(CARDS_CSV, encoding="utf-8") as f:
        return {row["name"]: Card(row["id"], row["name"], row["type"], row["attr"],
                                  int(row["rarity"]), int(row["hp"]), int(row["atk"]), row["skill"])
                for row in csv.DictReader(f)}


# ------------------------------------------------------------ 育成速度

FREE_PER_DAY = FREE_PER_HOUR * 24
BOOST_PER_HOUR = sum(added for added, _ in boost_ladder())
PROFILES = {
    "無課金(2日に1回以上ログイン)": FREE_PER_DAY,
    "サブスク": FREE_PER_DAY + SUBSCRIPTION_PER_DAY,
    f"重課金(サブスク+上限突破を1日4時間, {4 * 100 * len(boost_ladder())}円/日)":
        FREE_PER_DAY + SUBSCRIPTION_PER_DAY + 4 * BOOST_PER_HOUR,
}


def report_growth(cards):
    counts = {r: sum(1 for c in cards.values() if c.rarity == r) for r in range(1, 6)}
    print("== 育成: 1日に引ける回数 ==")
    for name, n in PROFILES.items():
        print(f"  {name:<44} {n:>6,} 回/日"
              + "".join(f"  {unit}連なら{n // unit:>4}回" for unit in UNIT_SSR))

    print(f"\n== 特定の1枚をランク+1するまでの日数 (第1期 {len(cards)}種) ==")
    print("  [合成値: " + " ".join(f"★{r}={SYNTH_POINTS[r]}" for r in sorted(SYNTH_POINTS)) + "]")
    print("  " + " " * 44 + "".join(f"{'★' + str(r):>7}" for r in range(1, 5))
          + "".join(f"{'★5(' + str(u) + '連)':>11}" for u in UNIT_SSR))

    def days(rate, rarity, n):
        return RANK_UP_POINTS / (rate / counts[rarity] * n * SYNTH_POINTS[rarity])

    for name, n in PROFILES.items():
        lower = [days(rates(1000)[r], r, n) for r in range(1, 5)]
        top = [days(ssr_rate(u), 5, n) for u in UNIT_SSR]
        print(f"  {name:<44}" + "".join(f"{d:>7.1f}" for d in lower) + "".join(f"{d:>11.1f}" for d in top))
    print("  (★1-★4 は単位による差がほぼない。ランク10 = ランクアップ9回分)")

    print("\n== 図鑑: 第1期の全52種がそろうまで (無課金, すべて1000連) ==")
    n, r = PROFILES["無課金(2日に1回以上ログイン)"], rates(1000)
    for d in (1, 2, 3, 7):
        expected = sum(counts[k] * p_at_least_one(n * d, r[k] / counts[k]) for k in r)
        print(f"  {d}日目: 平均 {expected:.1f} 種")


# --------------------------------------------------------------- 対戦

BEATS = {"水": "火", "火": "土", "土": "雷", "雷": "水", "光": "闇", "闇": "光"}
ADVANTAGE, DISADVANTAGE = 1.1, 0.92
MAX_ROUNDS = 20
DMG_SPREAD = 0.3  # ダメージの乱数幅 (0.3 なら ±30%)。格下にも勝ち目を残すため大きめ
CRIT_RATE, CRIT_MULT = 0.2, 1.5  # 会心
RANK_STEP = 0.03  # ランク1つにつき体・攻 +3%
RESONANCE = 1.5  # 霊獣・霊具が精霊と同じ属性なら補正値 x1.5


def affinity(att, dfn):
    if BEATS[att] == dfn:
        return ADVANTAGE
    if BEATS[dfn] == att and att not in "光闇":
        return DISADVANTAGE
    return 1.0


def rank_mult(rank):
    return 1.0 + RANK_STEP * (min(rank, STAT_RANK_CAP) - 1)


@dataclass
class Unit:
    """精霊1体に霊獣1体・霊具1つを付与したもの。"""
    spirit: Card
    beast: Card | None = None
    tool: Card | None = None
    rank: int = 1  # 3枚とも同じランクとして扱う
    hp: float = 0
    atk: float = 0
    skills: set = field(default_factory=set)

    def __post_init__(self):
        m = rank_mult(self.rank)
        self.hp, self.atk = self.spirit.hp * m, self.spirit.atk * m
        self.skills = {self.spirit.skill} - {""}
        for gear in (self.beast, self.tool):
            if gear is None:
                continue
            resonance = RESONANCE if gear.attr == self.spirit.attr else 1.0
            self.hp += gear.hp * m * resonance
            self.atk += gear.atk * m * resonance
            if gear.skill:
                self.skills.add(gear.skill)

    @property
    def attr(self):
        return self.spirit.attr


class Fighter:
    def __init__(self, unit):
        self.u, self.hp, self.atk_mod = unit, unit.hp, 1.0
        self.rounds, self.curse, self.guts_used = 0, 0, False

    def has(self, skill):
        return skill in self.u.skills


def hit(a, d, rng):
    """このラウンドに a が d に与えるダメージ。"""
    mult = affinity(a.u.attr, d.u.attr)
    if mult > 1 and a.has("看破"):
        mult = 1.25
    if mult < 1 and a.has("逆境"):
        mult = 1.0
    strikes = 2 if a.has("連撃") and rng.random() < 0.15 else 1
    total = 0.0
    for _ in range(strikes):
        dmg = a.u.atk * a.atk_mod * mult * rng.uniform(1 - DMG_SPREAD, 1 + DMG_SPREAD)
        if rng.random() < CRIT_RATE + (0.3 if a.has("雷光") else 0.0):
            dmg *= CRIT_MULT
        total += dmg
    if a.rounds == 0 and a.has("一閃"):
        total *= 1.5
    total *= 1.15 if a.has("業火") else 1.0
    total *= 1.12 if a.has("冥呪") else 1.0
    for skill, cut in (("不動", 0.87), ("鉄壁", 0.9), ("天光", 0.88)):
        if d.has(skill):
            total *= cut
    return total


def after_round(f, foe, dealt):
    if f.hp <= 0 and f.has("加護") and not f.guts_used:
        f.hp, f.guts_used = 1, True
    if f.hp > 0:
        if f.has("吸魂"):
            f.hp += dealt * 0.2
        for skill, heal in (("大海", 0.06), ("回生", 0.04), ("天光", 0.05)):
            if f.has(skill):
                f.hp += f.u.hp * heal
        f.hp = min(f.hp, f.u.hp)
    if f.has("冥呪") and f.curse < 3:
        foe.atk_mod *= 0.92
        f.curse += 1
    f.rounds += 1


def duel(ua, ub, rng):
    """1対1。毎ラウンド両者が同時に攻撃する。ua が勝てば True。"""
    a, b = Fighter(ua), Fighter(ub)
    if a.has("呪縛"):
        b.atk_mod *= 0.85
    if b.has("呪縛"):
        a.atk_mod *= 0.85
    for _ in range(MAX_ROUNDS):
        da, db = hit(a, b, rng), hit(b, a, rng)
        b.hp -= da
        a.hp -= db
        after_round(a, b, da)
        after_round(b, a, db)
        if a.hp <= 0 or b.hp <= 0:
            break
    # 相打ちや時間切れは残り体力の割合で判定
    return a.hp / a.u.hp > b.hp / b.u.hp


def winrate(ua, ub, n=4000, seed=1):
    rng = random.Random(seed)
    return sum(duel(ua, ub, rng) for _ in range(n)) / n


def match(team_a, order_a, team_b, order_b, rng):
    """三番勝負(先鋒・中堅・大将)。2勝した方の勝ち。"""
    wins = sum(duel(team_a[i], team_b[j], rng) for i, j in zip(order_a, order_b))
    return wins >= 2


def team_winrate(team_a, team_b, n=3000, seed=2):
    """お互いに並び順をランダムに選んだときの勝率。"""
    rng = random.Random(seed)
    perms = list(itertools.permutations(range(3)))
    return sum(match(team_a, rng.choice(perms), team_b, rng.choice(perms), rng)
               for _ in range(n)) / n


def report_battle(cards):
    c = cards
    gear = {  # 属性ごとの標準の付与素材(各属性で手に入りやすい霊獣・霊具)
        "土": (c["石熊"], c["岩槌"]), "火": (c["炎狐"], c["焔扇"]),
        "水": (c["河童"], c["水鏡"]), "雷": (c["鵺"], c["雷太鼓"]),
        "光": (c["白兎"], c["白鏡"]), "闇": (c["夜鴉"], c["呪い釘"]),
    }
    spirits = {(s.attr, s.rarity): s for s in c.values() if s.type == "精霊"}

    def std(attr, rarity, rank=1):
        return Unit(spirits[(attr, rarity)], *gear[attr], rank=rank)

    def pct(xs):
        return "".join(f"{x:>7.0%}" for x in xs)

    print(f"== 対戦: 属性相性 (有利 x{ADVANTAGE} / 不利 x{DISADVANTAGE}, 標準の付与, ランク1) ==")
    print("  同じ★どうしの勝率。行が自分、列が相手")
    for k in (1, 4):
        print(f"  ★{k}       " + "".join(f"{'vs' + a:>6}" for a in "土火水雷"))
        for a in "土火水雷":
            print(f"    {a}     " + pct(winrate(std(a, k), std(b, k), n=2000) for b in "土火水雷"))

    print("\n== 対戦: ★の差 (ランク1) ==")
    print("  水★i vs 土★j (相性なし)      " + "".join(f"{'土★' + str(j):>6}" for j in range(1, 5)))
    for i in range(1, 5):
        print(f"    水★{i}                     " + pct(winrate(std("水", i), std("土", j)) for j in range(1, 5)))
    print("  水★i vs 火★j (水が有利)      " + "".join(f"{'火★' + str(j):>6}" for j in range(1, 5)))
    for i in range(1, 5):
        print(f"    水★{i}                     " + pct(winrate(std("水", i), std("火", j)) for j in range(1, 5)))

    print("\n== 対戦: ランク (水どうし) ==")
    for rank in (4, 7, 10):
        same = winrate(std("水", 2, rank), std("水", 2))
        print(f"  ★2 R{rank:<2} vs ★2 R1: {same:.0%}   "
              f"★1 R{rank:<2} vs ★2/★3/★4 R1: "
              + " / ".join(f"{winrate(std('水', 1, rank), std('水', j)):.0%}" for j in range(2, 5)))

    print("\n== 対戦: ★5 (ランク1) ==")
    for five in ("光", "闇"):
        print(f"  {spirits[(five, 5)].name} vs ★4 土/火/水/雷: "
              + " / ".join(f"{winrate(std(five, 5), std(a, 4)):.0%}" for a in "土火水雷"))
    print(f"  光輪天女 vs 黄泉津姫: {winrate(std('光', 5), std('闇', 5)):.0%}")

    print("\n== 対戦: 霊獣・霊具 (海神 R1 vs 標準の付与をした海神 R1) ==")
    for label, unit in (("付与なし", Unit(c["海神"])),
                        ("同じ★で属性違い(火)", Unit(c["海神"], c["炎狐"], c["焔扇"])),
                        ("★3の水の付与(蛟+潮満玉)", Unit(c["海神"], c["蛟"], c["潮満玉"]))):
        print(f"  {label:<20} {winrate(unit, std('水', 4)):.0%}")

    print("\n== 対戦: 三番勝負 (先鋒・中堅・大将の2本先取) ==")
    deck_a = [(c["霧姫"], c["蛟"], c["潮満玉"]), (c["炎舞姫"], c["炎狐"], c["焔扇"]),
              (c["山姫"], c["大地亀"], c["地鎮の鉾"])]
    deck_b = [(c["光輪天女"], c["白兎"], c["白鏡"]), (c["焔王"], c["鳳凰"], c["焔扇"]),
              (c["雷帝"], c["鵺"], c["雷切"])]
    deck_c = [(c["海神"], c["蛟"], c["潮満玉"]),  # 焔王に有利
              (c["大地媛"], c["大地亀"], c["地鎮の鉾"]),  # 雷帝に有利
              (c["黄泉津姫"], c["夜鴉"], c["呪い釘"])]  # 光輪天女に有利

    def deck(cards3, rank):
        return [Unit(*trio, rank=rank) for trio in cards3]

    def read_winrate(team_a, team_b, n=3000):
        # C の並び (海神, 大地媛, 黄泉津姫) が B の並び (焔王, 雷帝, 光輪天女) にぴったり当たった場合
        rng = random.Random(3)
        return sum(match(team_a, (0, 1, 2), team_b, (1, 2, 0), rng) for _ in range(n)) / n

    print("  A=★3中心(霧姫・炎舞姫・山姫) B=★4-5中心(光輪天女・焔王・雷帝) C=Bの相性を突く(海神・大地媛・黄泉津姫)")
    print("  並び順がお互いランダムのときの、左側の勝率")
    for (na, da, ra), (nb, db, rb) in ((("A", deck_a, 4), ("B", deck_b, 4)),
                                       (("A", deck_a, 10), ("B", deck_b, 4)),
                                       (("A", deck_a, 10), ("B", deck_b, 7)),
                                       (("A", deck_a, 10), ("B", deck_b, 10)),
                                       (("C", deck_c, 7), ("B", deck_b, 10)),
                                       (("C", deck_c, 10), ("B", deck_b, 10))):
        print(f"    {na} R{ra:<2} vs {nb} R{rb:<2}: {team_winrate(deck(da, ra), deck(db, rb)):.0%}")
    for rc in (7, 10):
        print(f"  C R{rc} が B R10 の並び順を読み切った場合: {read_winrate(deck(deck_c, rc), deck(deck_b, 10)):.0%}")


def main():
    what = sys.argv[1] if len(sys.argv) > 1 else "all"
    cards = load_cards()
    if what in ("gacha", "all"):
        report_gacha()
        print()
    if what in ("growth", "all"):
        report_growth(cards)
        print()
    if what in ("battle", "all"):
        report_battle(cards)


if __name__ == "__main__":
    main()
