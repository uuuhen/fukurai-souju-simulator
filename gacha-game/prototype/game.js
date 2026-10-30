/* 千霊(仮) 試作のゲームロジック。
 * DOM には触らない処理だけを置き、ブラウザでは window.Senrei、Node では require() で使う。
 * 数値は DESIGN.md / sim/balance.py と同じ。時刻はすべて引数で受け取る(テスト用に時間を進められるように)。
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.Senrei = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  // ------------------------------------------------------------ くじ
  const UNITS = [10, 100, 1000];
  // ★5が1枚以上出る確率(単位ごとに固定)。★4と同じく「最大課金で2ヶ月たつと全カードがランク10に
  // そろう確率が約98%」に合わせた値。1回あたりに直すと10連が一番高い
  const UNIT_SSR = { 10: 0.0005, 100: 0.004, 1000: 0.03 };
  // 単位によらず1回あたり。★1は残り。★4は「最大課金で2ヶ月たつと全カードがランク10にそろう確率が約98%」になる値
  const LOWER_RATES = { 4: 0.0046, 3: 0.05, 2: 0.24 };
  const PITY = 70000; // ★5が出ないまま70,000回引いたら次の1回は★5

  // ------------------------------------------------------------ 合成
  const SYNTH_POINTS = { 1: 1, 2: 2, 3: 5, 4: 10, 5: 1000 }; // ★5は1枚でランク+1(10枚でランク10)
  const RANK_UP_POINTS = 1000;
  const STAT_RANK_CAP = 10;
  // ランク1の能力は、ランク10(完成値)の何割か。★が低いほど伸びしろが大きく、ランク10ではどのカードもほぼ並ぶ
  const START_RATIO = { 1: 0.6, 2: 0.64, 3: 0.68, 4: 0.73, 5: 0.79 };
  const FRAMES = [
    { from: 100, name: "神" },
    { from: 50, name: "虹" },
    { from: 20, name: "金" },
    { from: 10, name: "銀" },
    { from: 5, name: "銅" },
    { from: 1, name: "素" },
  ];

  // ------------------------------------------------------------ くじ枠
  const HOUR = 3600 * 1000;
  const DAY = 24 * HOUR;
  const FREE_PER_HOUR = 200;
  const FREE_CAP = 9600; // 48時間分
  const REGEN_MS = HOUR / FREE_PER_HOUR; // 18秒で1回分
  const HOURLY_CAP = 1000; // 上限突破しても1時間に得られるのは1000回まで(無料200回込み)
  const BOOST_STEPS = [400, 300, 200];
  const BOOST_PRICE = 100;
  const BOOST_WINDOW = HOUR;
  const SUB_PER_DAY = 4000;
  const DAY_START_HOUR = 5; // サブスク枠は朝5時に戻る
  const REIFU_PACK = 1000;
  const REIFU_PRICE = 1000;
  const REIFU_CAP = 12000;
  const REIFU_MONTHS = 6;
  const SHELF_SLOTS = 5;

  function parseCards(csv) {
    const [header, ...lines] = csv.trim().split(/\r?\n/);
    const keys = header.split(",");
    return lines.map((line) => {
      const row = Object.fromEntries(line.split(",").map((v, i) => [keys[i], v]));
      return {
        id: row.id, name: row.name, kana: row.kana, type: row.type, attr: row.attr,
        rarity: Number(row.rarity), hpMax: Number(row.hp_max), atkMax: Number(row.atk_max), skill: row.skill,
      };
    });
  }

  function indexCards(cards) {
    const byId = {};
    const byRarity = { 1: [], 2: [], 3: [], 4: [], 5: [] };
    for (const c of cards) {
      byId[c.id] = c;
      byRarity[c.rarity].push(c);
    }
    return { list: cards, byId, byRarity };
  }

  /** unit 連で引くときの1回あたりの★5排出率。 */
  function ssrRate(unit) {
    return 1 - Math.pow(1 - UNIT_SSR[unit], 1 / unit);
  }

  function rarityRates(unit) {
    const r = { 5: ssrRate(unit), 4: LOWER_RATES[4], 3: LOWER_RATES[3], 2: LOWER_RATES[2] };
    r[1] = 1 - r[5] - r[4] - r[3] - r[2];
    return r;
  }

  function pickRarity(p5, x) {
    if (x < p5) return 5;
    let acc = p5;
    for (const k of [4, 3, 2]) {
      acc += LOWER_RATES[k];
      if (x < acc) return k;
    }
    return 1;
  }

  function frameOf(rank) {
    return FRAMES.find((f) => rank >= f.from).name;
  }

  /** ランク rank での能力が完成値(ランク10)の何倍か。 */
  function growth(rarity, rank) {
    const s = START_RATIO[rarity];
    return s + (1 - s) * (Math.min(rank, STAT_RANK_CAP) - 1) / (STAT_RANK_CAP - 1);
  }

  function dayKey(t) {
    const d = new Date(t - DAY_START_HOUR * HOUR);
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }

  function addMonths(t, months) {
    const d = new Date(t);
    const day = d.getDate();
    d.setMonth(d.getMonth() + months);
    if (d.getDate() < day) d.setDate(0); // 8/31 + 6か月 → 2/28 など、月末に寄せる
    return d.getTime();
  }

  function newState(now) {
    return {
      version: 1,
      clockOffset: 0,
      free: { stock: FREE_CAP, at: now }, // 初回は2日分たまった状態から始まる
      boost: { start: null, bought: 0, added: 0, remaining: 0 },
      sub: { active: false, day: null, remaining: 0 },
      reifu: [], // [{ n, boughtAt, expiresAt }] 失効の早い順
      pity: 0,
      cards: {}, // id -> { copies, points, rank }
      shelf: Array(SHELF_SLOTS).fill(null),
      stats: { draws: 0, ssr: 0, yen: 0, byUnit: { 10: 0, 100: 0, 1000: 0 } },
      lastResult: null,
    };
  }

  // ---------------------------------------------------------- 枠の更新

  function syncFree(state, now) {
    const f = state.free;
    if (f.stock >= FREE_CAP) {
      f.stock = FREE_CAP;
      f.at = now;
      return;
    }
    const gained = Math.floor((now - f.at) / REGEN_MS);
    if (gained <= 0) return;
    if (f.stock + gained >= FREE_CAP) {
      f.stock = FREE_CAP;
      f.at = now;
    } else {
      f.stock += gained;
      f.at += gained * REGEN_MS;
    }
  }

  function sync(state, now) {
    syncFree(state, now);
    const b = state.boost;
    if (b.start !== null && now >= b.start + BOOST_WINDOW) {
      state.boost = { start: null, bought: 0, added: 0, remaining: 0 };
    }
    const s = state.sub;
    if (s.active && s.day !== dayKey(now)) {
      s.day = dayKey(now);
      s.remaining = SUB_PER_DAY;
    }
    state.reifu = state.reifu.filter((r) => r.expiresAt > now && r.n > 0);
  }

  function nextFreeIn(state, now) {
    if (state.free.stock >= FREE_CAP) return null;
    return Math.max(0, state.free.at + REGEN_MS - now);
  }

  function wakuAvailable(state) {
    return state.boost.remaining + (state.sub.active ? state.sub.remaining : 0) + state.free.stock;
  }

  function reifuAvailable(state) {
    return state.reifu.reduce((sum, r) => sum + r.n, 0);
  }

  function available(state, source) {
    return source === "reifu" ? reifuAvailable(state) : wakuAvailable(state);
  }

  // ---------------------------------------------------------- 課金(試作では額を記録するだけ)

  /** 次に上限突破したときに増える回数。もう増やせなければ 0。 */
  function nextBoost(state) {
    const b = state.boost;
    if (b.bought >= BOOST_STEPS.length) return 0;
    return Math.max(0, Math.min(BOOST_STEPS[b.bought], HOURLY_CAP - FREE_PER_HOUR - b.added));
  }

  function buyBoost(state, now) {
    sync(state, now);
    const add = nextBoost(state);
    if (!add) return 0;
    const b = state.boost;
    if (b.start === null) b.start = now;
    b.bought += 1;
    b.added += add;
    b.remaining += add;
    state.stats.yen += BOOST_PRICE;
    return add;
  }

  function canBuyReifu(state) {
    return reifuAvailable(state) + REIFU_PACK <= REIFU_CAP;
  }

  function buyReifu(state, now) {
    sync(state, now);
    if (!canBuyReifu(state)) return false;
    state.reifu.push({ n: REIFU_PACK, boughtAt: now, expiresAt: addMonths(now, REIFU_MONTHS) });
    state.reifu.sort((a, b) => a.expiresAt - b.expiresAt);
    state.stats.yen += REIFU_PRICE;
    return true;
  }

  function setSubscription(state, active, now) {
    const s = state.sub;
    if (active && !s.active) {
      s.active = true;
      s.day = dayKey(now);
      s.remaining = SUB_PER_DAY;
    } else if (!active) {
      state.sub = { active: false, day: null, remaining: 0 };
    }
  }

  // ---------------------------------------------------------- くじを引く

  function spend(state, source, n) {
    if (source === "reifu") {
      for (const r of state.reifu) {
        const take = Math.min(r.n, n);
        r.n -= take;
        n -= take;
        if (!n) break;
      }
      state.reifu = state.reifu.filter((r) => r.n > 0);
      return;
    }
    // 消えるのが早い順: 上限突破 → サブスク → 無料
    const fromBoost = Math.min(state.boost.remaining, n);
    state.boost.remaining -= fromBoost;
    n -= fromBoost;
    if (state.sub.active) {
      const fromSub = Math.min(state.sub.remaining, n);
      state.sub.remaining -= fromSub;
      n -= fromSub;
    }
    state.free.stock -= n;
  }

  function obtain(state, card) {
    const owned = state.cards[card.id];
    if (!owned) {
      state.cards[card.id] = { copies: 1, points: 0, rank: 1 };
      return { isNew: true, rankUps: 0 };
    }
    owned.copies += 1;
    owned.points += SYNTH_POINTS[card.rarity];
    let rankUps = 0;
    while (owned.points >= RANK_UP_POINTS) {
      owned.points -= RANK_UP_POINTS;
      owned.rank += 1;
      rankUps += 1;
    }
    return { isNew: false, rankUps };
  }

  /**
   * unit 連を1回引く。足りなければ null。
   * 結果は画面のまとめ表示に必要なものだけを集計して返す(1回ずつの記録は残さない)。
   */
  function draw(state, cards, unit, source, now, rng) {
    rng = rng || Math.random;
    sync(state, now);
    if (!UNIT_SSR[unit] || available(state, source) < unit) return null;
    spend(state, source, unit);

    const p5 = ssrRate(unit);
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const high = {}; // ★4以上: id -> 枚数
    const ssrOrder = []; // ★5 を引いた順
    const newIds = [];
    const before = {}; // このくじで初めて触ったカードの、引く前の状態
    let pityHit = false;

    for (let i = 0; i < unit; i += 1) {
      let rarity;
      if (state.pity >= PITY) {
        rarity = 5;
        pityHit = true;
      } else {
        rarity = pickRarity(p5, rng());
      }
      state.pity = rarity === 5 ? 0 : state.pity + 1;

      const pool = cards.byRarity[rarity];
      const card = pool[Math.floor(rng() * pool.length)];
      if (!(card.id in before)) {
        const o = state.cards[card.id];
        before[card.id] = o ? { rank: o.rank, points: o.points } : null;
      }
      const got = obtain(state, card);
      counts[rarity] += 1;
      if (got.isNew) newIds.push(card.id);
      if (rarity >= 4) high[card.id] = (high[card.id] || 0) + 1;
      if (rarity === 5) ssrOrder.push(card.id);
    }

    const rankUps = [];
    const gains = [];
    for (const id of Object.keys(before)) {
      const b = before[id];
      const a = state.cards[id];
      if (b && a.rank > b.rank) rankUps.push({ id, from: b.rank, to: a.rank });
      if (b) {
        const gained = (a.rank - b.rank) * RANK_UP_POINTS + a.points - b.points;
        gains.push({ id, gained, from: b, to: { rank: a.rank, points: a.points } });
      }
    }
    gains.sort((x, y) => y.gained - x.gained);

    state.stats.draws += unit;
    state.stats.ssr += counts[5];
    state.stats.byUnit[unit] += 1;
    const result = {
      unit, source, at: now, counts, high, ssrOrder, newIds, pityHit,
      rankUps: rankUps.sort((x, y) => cards.byId[y.id].rarity - cards.byId[x.id].rarity),
      gains: gains.slice(0, 5),
    };
    state.lastResult = result;
    return result;
  }

  /** テスト用: 1日ずつ時間を進め、枠を全部1000連で引く。 */
  function simulateDays(state, cards, days, realNow, rng) {
    const total = { days, pulls: 0, draws: 0, ssr: 0, rankUps: 0, newIds: [] };
    for (let d = 0; d < days; d += 1) {
      state.clockOffset += DAY;
      const now = realNow + state.clockOffset;
      sync(state, now);
      while (wakuAvailable(state) >= 1000) {
        const r = draw(state, cards, 1000, "waku", now, rng);
        total.pulls += 1;
        total.draws += 1000;
        total.ssr += r.counts[5];
        total.rankUps += r.rankUps.reduce((s, u) => s + (u.to - u.from), 0);
        total.newIds.push(...r.newIds);
      }
    }
    state.lastResult = null;
    return total;
  }

  // ---------------------------------------------------------- 霊棚・名誉

  function setShelf(state, slot, id) {
    if (slot < 0 || slot >= SHELF_SLOTS) return false;
    if (id !== null && !state.cards[id]) return false;
    if (id !== null) {
      const old = state.shelf.indexOf(id);
      if (old !== -1) state.shelf[old] = null;
    }
    state.shelf[slot] = id;
    return true;
  }

  function honors(state) {
    const maxRank = Object.values(state.cards).reduce((m, c) => Math.max(m, c.rank), 0);
    const d = state.stats.draws;
    return [
      { label: "累計10万回", earned: d >= 1e5, progress: Math.min(1, d / 1e5) },
      { label: "累計100万回", earned: d >= 1e6, progress: Math.min(1, d / 1e6) },
      { label: "累計1000万回", earned: d >= 1e7, progress: Math.min(1, d / 1e7) },
      { label: "初めてのランク10", earned: maxRank >= 10, progress: Math.min(1, maxRank / 10) },
      { label: "初めてのランク100", earned: maxRank >= 100, progress: Math.min(1, maxRank / 100) },
    ];
  }

  function restore(saved, now) {
    if (!saved || saved.version !== 1 || typeof saved.cards !== "object") return newState(now);
    return saved;
  }

  return {
    UNITS, UNIT_SSR, LOWER_RATES, PITY, SYNTH_POINTS, RANK_UP_POINTS, STAT_RANK_CAP, START_RATIO,
    HOUR, DAY, FREE_PER_HOUR, FREE_CAP, REGEN_MS, HOURLY_CAP, BOOST_STEPS, BOOST_PRICE, BOOST_WINDOW,
    SUB_PER_DAY, REIFU_PACK, REIFU_PRICE, REIFU_CAP, REIFU_MONTHS, SHELF_SLOTS,
    parseCards, indexCards, ssrRate, rarityRates, frameOf, growth, addMonths, dayKey,
    newState, restore, sync, nextFreeIn, wakuAvailable, reifuAvailable, available,
    nextBoost, buyBoost, canBuyReifu, buyReifu, setSubscription,
    draw, simulateDays, setShelf, honors,
  };
});
