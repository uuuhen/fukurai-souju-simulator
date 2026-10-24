// node --test gacha-game/prototype/test/*.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const S = require("../game.js");
const { CARDS_CSV, SKILLS } = require("../cards.js");

const cards = S.indexCards(S.parseCards(CARDS_CSV));
const T0 = new Date(2026, 9, 23, 12, 0, 0).getTime();

function seeded(seed) {
  // mulberry32
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 枠を気にせず引く(毎回、無料枠を満タンに戻してから引く)
function pull(s, unit, rng) {
  s.free.stock = S.FREE_CAP;
  return S.draw(s, cards, unit, "waku", T0, rng);
}

test("カードデータは data/cards_season1.csv と同じ", () => {
  const csv = fs.readFileSync(path.join(__dirname, "../../data/cards_season1.csv"), "utf8");
  assert.equal(CARDS_CSV, csv);
  assert.equal(cards.list.length, 52);
  const counts = [1, 2, 3, 4, 5].map((r) => cards.byRarity[r].length);
  assert.deepEqual(counts, [20, 14, 10, 6, 2]);
  for (const c of cards.list) if (c.skill) assert.ok(SKILLS[c.skill], `${c.skill} の説明がない`);
});

test("1回あたりの★5排出率から、単位ごとの確率に戻る", () => {
  for (const unit of S.UNITS) {
    const back = 1 - Math.pow(1 - S.ssrRate(unit), unit);
    assert.ok(Math.abs(back - S.UNIT_SSR[unit]) < 1e-12);
  }
  const r = S.rarityRates(1000);
  assert.ok(Math.abs(r[1] + r[2] + r[3] + r[4] + r[5] - 1) < 1e-12);
  assert.equal(r[4], 0.0046);
});

test("★5が1枚以上出る割合が単位ごとの確率に近い", () => {
  const rng = seeded(7);
  for (const [unit, trials, tolerance] of [[1000, 3000, 0.03], [100, 6000, 0.01], [10, 30000, 0.002]]) {
    const s = S.newState(T0);
    let hit = 0;
    for (let i = 0; i < trials; i += 1) {
      s.pity = 0; // 天井の影響を外して確率だけを見る
      if (pull(s, unit, rng).counts[5] > 0) hit += 1;
    }
    const rate = hit / trials;
    assert.ok(Math.abs(rate - S.UNIT_SSR[unit]) < tolerance, `${unit}連: ${rate}`);
  }
});

test("★5が出ないまま3000回引くと、次の1回が★5になる", () => {
  const s = S.newState(T0);
  const never = () => 0.999; // ★5 にならない乱数
  for (let i = 0; i < 300; i += 1) pull(s, 10, never);
  assert.equal(s.pity, 3000);
  const r = pull(s, 10, never);
  assert.equal(r.counts[5], 1);
  assert.equal(r.pityHit, true);
  assert.equal(s.pity, 9);
});

test("かぶりは合成値になり、1000ごとにランクが上がる", () => {
  const s = S.newState(T0);
  const one = cards.byRarity[1][0];
  const five = cards.byRarity[5][0];
  // 乱数を固定して、狙ったカードだけを引く
  const pick = (card) => {
    const pool = cards.byRarity[card.rarity];
    const p5 = S.ssrRate(10);
    const x = card.rarity === 5 ? 0 : 0.9999;
    const y = (pool.indexOf(card) + 0.5) / pool.length;
    let n = 0;
    return () => (n++ % 2 === 0 ? x : y);
  };
  for (let i = 0; i < 100; i += 1) pull(s, 10, pick(one));
  assert.deepEqual(s.cards[one.id], { copies: 1000, points: 999, rank: 1 });
  const r = pull(s, 10, pick(one));
  assert.deepEqual(s.cards[one.id], { copies: 1010, points: 9, rank: 2 });
  assert.deepEqual(r.rankUps, [{ id: one.id, from: 1, to: 2 }]);

  for (let i = 0; i < 6; i += 1) pull(s, 10, pick(five));
  // ★5 は1枚23。1枚目は入手、残り59枚で 1357 → ランク2・余り357
  assert.deepEqual(s.cards[five.id], { copies: 60, points: 357, rank: 2 });
});

test("ランク枠と能力の伸び方(ランク1は完成値の6〜8割、ランク10で完成)", () => {
  assert.deepEqual([1, 4, 5, 9, 10, 19, 20, 49, 50, 99, 100, 500].map(S.frameOf),
    ["素", "素", "銅", "銅", "銀", "銀", "金", "金", "虹", "虹", "神", "神"]);
  assert.equal(S.growth(1, 1), 0.6);
  assert.equal(S.growth(5, 1), 0.79);
  assert.ok(Math.abs(S.growth(1, 4) - 0.6 - 0.4 / 3) < 1e-12);
  for (const r of [1, 2, 3, 4, 5]) {
    assert.equal(S.growth(r, 10), 1);
    assert.equal(S.growth(r, 30), 1); // ランク11以降は見た目と名誉だけ
  }
});

test("無料枠は18秒に1回分回復し、9600で止まる", () => {
  const s = S.newState(T0);
  assert.equal(s.free.stock, 9600);
  S.draw(s, cards, 1000, "waku", T0, seeded(1));
  assert.equal(s.free.stock, 8600);
  S.sync(s, T0 + S.HOUR);
  assert.equal(s.free.stock, 8800);
  assert.equal(S.nextFreeIn(s, T0 + S.HOUR + 5000), 13000);
  S.sync(s, T0 + 10 * S.DAY);
  assert.equal(s.free.stock, 9600);
  assert.equal(S.nextFreeIn(s, T0 + 10 * S.DAY), null);
});

test("上限突破は +400 → +300 → +100 で1時間1000回まで。1時間たつと消える", () => {
  const s = S.newState(T0);
  assert.deepEqual([1, 2, 3, 4].map(() => S.buyBoost(s, T0)), [400, 300, 100, 0]);
  assert.equal(s.boost.remaining, 800);
  assert.equal(s.stats.yen, 300);
  S.sync(s, T0 + S.HOUR);
  assert.equal(s.boost.remaining, 0);
  assert.equal(S.buyBoost(s, T0 + S.HOUR), 400);
});

test("枠は 上限突破 → サブスク → 無料 の順に使う", () => {
  const s = S.newState(T0);
  S.setSubscription(s, true, T0);
  S.buyBoost(s, T0);
  assert.equal(S.wakuAvailable(s), 400 + 4000 + 9600);
  S.draw(s, cards, 1000, "waku", T0, seeded(2));
  assert.deepEqual([s.boost.remaining, s.sub.remaining, s.free.stock], [0, 3400, 9600]);
  // 翌朝5時にサブスク枠が4000に戻る
  const nextMorning = new Date(2026, 9, 24, 5, 0, 0).getTime();
  S.sync(s, nextMorning);
  assert.equal(s.sub.remaining, 4000);
});

test("霊符は12,000枚まで買えて、購入から6か月で失効し、期限の近いものから使う", () => {
  const s = S.newState(T0);
  for (let i = 0; i < 12; i += 1) assert.equal(S.buyReifu(s, T0 + i * S.DAY), true);
  assert.equal(S.buyReifu(s, T0), false);
  assert.equal(S.reifuAvailable(s), 12000);
  assert.equal(s.stats.yen, 12000);

  S.draw(s, cards, 100, "reifu", T0 + S.DAY, seeded(3));
  assert.equal(s.reifu[0].n, 900);
  assert.equal(s.reifu[0].boughtAt, T0);

  const expiry = S.addMonths(T0, 6);
  assert.equal(new Date(expiry).getMonth(), 3); // 10月 → 4月
  S.sync(s, expiry);
  assert.equal(S.reifuAvailable(s), 11000);
  assert.equal(S.draw(s, cards, 1000, "reifu", expiry, seeded(3)).source, "reifu");
});

test("枠が足りなければ引けない", () => {
  const s = S.newState(T0);
  s.free.stock = 999;
  s.free.at = T0;
  assert.equal(S.draw(s, cards, 1000, "waku", T0, seeded(4)), null);
  assert.equal(s.free.stock, 999);
  assert.equal(S.draw(s, cards, 10, "reifu", T0, seeded(4)), null);
});

test("霊棚は5枠。持っているカードだけ飾れて、同じカードは1か所にだけ置ける", () => {
  const s = S.newState(T0);
  pull(s, 1000, seeded(5));
  const [a, b] = Object.keys(s.cards);
  assert.equal(S.setShelf(s, 0, a), true);
  assert.equal(S.setShelf(s, 3, a), true);
  assert.deepEqual(s.shelf, [null, null, null, a, null]);
  assert.equal(S.setShelf(s, 5, b), false);
  const notOwned = cards.list.find((c) => !s.cards[c.id]);
  if (notOwned) assert.equal(S.setShelf(s, 1, notOwned.id), false);
});

test("7日分を1000連で引くと、毎日4,800回分を使い切る", () => {
  const s = S.newState(T0);
  s.free.stock = 0;
  s.free.at = T0;
  const total = S.simulateDays(s, cards, 7, T0, seeded(6));
  // 1000連単位なので、毎日の端数は翌日に回り、最後に1000未満が残る
  assert.equal(total.draws + s.free.stock, 7 * 4800);
  assert.ok(s.free.stock < 1000);
  assert.equal(s.stats.draws, total.draws);
});
