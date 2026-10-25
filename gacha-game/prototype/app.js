/* 千霊(仮) 試作の画面。ゲームの処理は game.js(window.Senrei)、カードは cards.js(window.SenreiCards)。 */
(function () {
  "use strict";

  const S = window.Senrei;
  const C = window.SenreiCards;
  const cards = S.indexCards(S.parseCards(C.CARDS_CSV));

  const STORE_KEY = "senrei-proto-1";
  const UI_KEY = "senrei-proto-ui";
  const TEN_COOLDOWN = 2000; // 10連は2秒あけないと次を引けない(DESIGN.md §2.2, §12)
  const ATTR_CLASS = { 水: "water", 火: "fire", 土: "earth", 雷: "thunder", 光: "light", 闇: "dark" };
  const FRAME_CLASS = { 素: "plain", 銅: "copper", 銀: "silver", 金: "gold", 虹: "rainbow", 神: "divine" };
  const FRAME_STEPS = [5, 10, 20, 50, 100];
  const VIEWS = ["draw", "result", "book", "shelf", "test"];
  const reduceMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  let state;
  const ui = { view: "draw", source: "waku", type: "all", attr: "all" };
  let busy = false;
  let tenReadyAt = 0;
  let sheetId = null;

  const $ = (id) => document.getElementById(id);
  const fmt = (n) => Math.round(n).toLocaleString("ja-JP");
  const now = () => Date.now() + state.clockOffset;
  const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);

  function readJSON(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }
  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      /* 保存できない環境でも遊べるようにする */
    }
  }
  const save = () => writeJSON(STORE_KEY, state);
  const saveUI = () => writeJSON(UI_KEY, ui);

  function duration(ms) {
    const s = Math.max(0, Math.ceil(ms / 1000));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (h) return `${h}時間${m}分`;
    return `${m}分${String(s % 60).padStart(2, "0")}秒`;
  }
  function offsetLabel(ms) {
    const days = Math.floor(ms / S.DAY);
    const hours = Math.floor((ms % S.DAY) / S.HOUR);
    return [days ? `${days}日` : "", hours ? `${hours}時間` : ""].join("") || "0時間";
  }

  let toastTimer = 0;
  function toast(text) {
    const el = $("toast");
    el.textContent = text;
    el.classList.add("on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("on"), 2200);
  }

  // ------------------------------------------------------------ カード

  function cardHTML(card, opts) {
    opts = opts || {};
    const owned = state.cards[card.id];
    const rank = owned ? owned.rank : 1;
    const frame = owned ? FRAME_CLASS[S.frameOf(rank)] : "plain";
    const cls = ["card", `r${card.rarity}`, `a-${ATTR_CLASS[card.attr]}`, `f-${frame}`];
    if (!owned) cls.push("unknown");
    if (opts.big) cls.push("big");
    const tag = opts.static ? "div" : "button";
    const attrs = opts.static ? "" : ` type="button" data-card="${card.id}" aria-label="${esc(owned ? `${card.name} ランク${rank}` : "まだ持っていないカード")}"`;
    const gauge = owned ? owned.points / S.RANK_UP_POINTS : 0;
    return `<${tag} class="${cls.join(" ")}"${attrs}>
      <span class="c-top"><span class="seal">${card.attr}</span><span class="stars">${"★".repeat(card.rarity)}</span></span>
      <span class="glyph">${owned ? esc(Array.from(card.name)[0]) : "？"}</span>
      <span class="c-name">${owned ? esc(card.name) : "？？？"}</span>
      <span class="c-meta">${card.type}${owned ? ` · R${rank}` : ""}</span>
      <span class="gauge"><i style="width:${(gauge * 100).toFixed(1)}%"></i></span>
    </${tag}>`;
  }

  function chipHTML(id, extra) {
    const card = cards.byId[id];
    return `<button type="button" class="chip r${card.rarity} a-${ATTR_CLASS[card.attr]}" data-card="${id}">` +
      `<span class="seal">${card.attr}</span>${esc(card.name)}${extra ? ` <em>${extra}</em>` : ""}</button>`;
  }

  // ------------------------------------------------------------ 帳場

  function renderWaku() {
    const t = now();
    S.sync(state, t);
    const f = state.free;
    $("w-free").textContent = fmt(f.stock);
    // 狭い画面では .wide の部分を隠して短く見せる
    const wide = (s) => `<span class="wide">${s}</span>`;
    const next = S.nextFreeIn(state, t);
    $("w-free-s").innerHTML = next === null ? `満タン${wide(`（${fmt(S.FREE_CAP)}）`)}`
      : `${wide("満タンまで ")}${duration(next + (S.FREE_CAP - f.stock - 1) * S.REGEN_MS)}`;

    const sub = state.sub;
    $("w-sub").classList.toggle("off", !sub.active);
    $("w-sub-v").textContent = sub.active ? fmt(sub.remaining) : "—";
    $("w-sub-s").innerHTML = sub.active ? `毎朝${wide("5時に")}4,000` : "未加入";

    const b = state.boost;
    $("w-boost").classList.toggle("off", !b.remaining);
    $("w-boost-v").textContent = fmt(b.remaining);
    $("w-boost-s").innerHTML = b.start === null ? `${wide("買うと")}1時間有効`
      : `残り${Math.ceil((b.start + S.BOOST_WINDOW - t) / 60000)}分`;

    const reifu = S.reifuAvailable(state);
    $("w-reifu").classList.toggle("off", !reifu);
    $("w-reifu-v").textContent = fmt(reifu);
    const soonest = state.reifu[0];
    const sEl = $("w-reifu-s");
    if (soonest) {
      const d = new Date(soonest.expiresAt);
      sEl.innerHTML = `${wide(`${d.getFullYear()}/`)}${d.getMonth() + 1}/${d.getDate()}${wide(`に${fmt(soonest.n)}枚`)}失効`;
    } else {
      sEl.innerHTML = `上限${wide(" ")}${fmt(S.REIFU_CAP)}`;
    }
    sEl.classList.toggle("warn", !!soonest && soonest.expiresAt - t < 30 * S.DAY);

    const clock = $("clock");
    clock.hidden = !state.clockOffset;
    clock.textContent = `テスト時刻 +${offsetLabel(state.clockOffset)}`;

    renderDrawControls();
  }

  function renderDrawControls() {
    for (const btn of document.querySelectorAll("[data-source]")) {
      btn.setAttribute("aria-checked", String(btn.dataset.source === ui.source));
    }
    $("src-waku").textContent = fmt(S.wakuAvailable(state));
    $("src-reifu").textContent = fmt(S.reifuAvailable(state));
    const have = S.available(state, ui.source);
    for (const unit of S.UNITS) {
      const btn = $(`unit-${unit}`);
      const cooling = unit === 10 && Date.now() < tenReadyAt;
      btn.disabled = busy || cooling || have < unit;
      $(`unit-${unit}-s`).textContent = have < unit ? `あと${fmt(unit - have)}回分` : `1回あたり ${(S.ssrRate(unit) * 100).toFixed(5)}%`;
    }
    $("pity").textContent = fmt(S.PITY - state.pity);

    const add = S.nextBoost(state);
    const b = state.boost;
    $("buy-boost").disabled = !add;
    $("buy-boost-l").textContent = add ? `上限突破 +${fmt(add)}回 ¥${S.BOOST_PRICE}` : "上限突破";
    $("buy-boost-s").textContent = add
      ? `この1時間 ${fmt(S.FREE_PER_HOUR + b.added)} → ${fmt(S.FREE_PER_HOUR + b.added + add)} / ${fmt(S.HOURLY_CAP)}回`
      : `この1時間は上限の${fmt(S.HOURLY_CAP)}回です`;
    const canReifu = S.canBuyReifu(state);
    $("buy-reifu").disabled = !canReifu;
    $("buy-reifu-s").textContent = canReifu ? "購入から6か月で失効" : `所持上限の${fmt(S.REIFU_CAP)}枚に達しています`;
    $("yen").textContent = `¥${fmt(state.stats.yen)}`;

    // 結果ページの「もう一度引く」は、前回と同じ単位・同じ引き方で引く
    const last = state.lastResult;
    $("last-link").hidden = !last;
    if (last) {
      const again = $("again");
      const short = S.available(state, last.source) < last.unit;
      again.disabled = busy || short || (last.unit === 10 && Date.now() < tenReadyAt);
      again.textContent = short ? `${last.source === "reifu" ? "霊符" : "枠"}が足りません` : `もう一度 ${last.unit}連`;
    }
  }

  function pctLabel(p) {
    return `${Number((p * 100).toPrecision(2))}%`; // 0.0005 → 0.05%, 0.03 → 3%
  }

  function renderOdds() {
    for (const unit of S.UNITS) $(`unit-${unit}-p`).textContent = `★5 ${pctLabel(S.UNIT_SSR[unit])}`;
    $("pity-note").textContent = `★5が出ないまま${fmt(S.PITY)}回引くと、次の1回は★5`;
    const head = S.UNITS.map((u) => `<th>${u}連</th>`).join("");
    const rows = [
      ["★5が1枚以上", (u) => pctLabel(S.UNIT_SSR[u])],
      ["★5（1回あたり）", (u) => `${(S.ssrRate(u) * 100).toFixed(5)}%`],
    ];
    for (const r of [4, 3, 2, 1]) rows.push([`★${r}（1回あたり）`, (u) => `${(S.rarityRates(u)[r] * 100).toFixed(2)}%`]);
    rows.push(["★5 1種あたり", (u) => `${(S.ssrRate(u) / cards.byRarity[5].length * 100).toFixed(5)}%`]);
    for (const r of [4, 3, 2, 1]) rows.push([`★${r} 1種あたり`, (u) => `${(S.rarityRates(u)[r] / cards.byRarity[r].length * 100).toFixed(3)}%`]);
    $("odds").innerHTML = `<table><thead><tr><th>第1期（${cards.list.length}種）</th>${head}</tr></thead><tbody>` +
      rows.map(([label, f]) => `<tr><td>${label}</td>${S.UNITS.map((u) => `<td>${f(u)}</td>`).join("")}</tr>`).join("") +
      "</tbody></table>";
  }

  // ------------------------------------------------------------ 結果

  function renderResult() {
    const res = state.lastResult;
    const el = $("result");
    if (!res) {
      el.innerHTML = `<h2>結果</h2><p class="empty">まだ引いていません。無料枠が2日分（9,600回）たまっているので、まずは1000連を引いてみてください。</p>`;
      return;
    }
    const counts = [5, 4, 3, 2, 1].map((r) => `<span class="cnt r${r}">★${r}<b>×${fmt(res.counts[r])}</b></span>`).join("");
    const groups = [];
    if (res.pityHit) groups.push(`<p class="note">天井に届いたので、★5が確定しました。</p>`);
    const high = Object.keys(res.high).sort((a, b) => cards.byId[b].rarity - cards.byId[a].rarity);
    if (high.length) {
      const tiles = high.map((id) => `<div class="tile">${cardHTML(cards.byId[id])}${res.high[id] > 1 ? `<span class="badge">×${res.high[id]}</span>` : ""}</div>`);
      groups.push(`<div class="group"><h3>★4以上<small>${high.length}種</small></h3><div class="tiles">${tiles.join("")}</div></div>`);
    }
    if (res.newIds.length) {
      groups.push(`<div class="group"><h3>新しく手に入れた<small>${res.newIds.length}種</small></h3><div class="chips">${res.newIds.map((id) => chipHTML(id)).join("")}</div></div>`);
    }
    if (res.rankUps.length) {
      groups.push(`<div class="group"><h3>ランクアップ<small>${res.rankUps.length}種</small></h3><div class="chips">${res.rankUps.map((u) => chipHTML(u.id, `R${u.from}→R${u.to}`)).join("")}</div></div>`);
    }
    if (res.gains.length) {
      const rows = res.gains.map((g) => {
        const card = cards.byId[g.id];
        const ranked = g.to.rank > g.from.rank;
        const from = ranked ? 0 : g.from.points / 10;
        const to = g.to.points / 10;
        return `<div class="gain"><span class="g-name">${esc(card.name)}</span>` +
          `<span class="g-bar"><i class="g-base" style="width:${from}%"></i><i class="g-add" style="left:${from}%;width:${Math.max(0, to - from)}%"></i></span>` +
          `<span class="g-val">+${fmt(g.gained)}${ranked ? ` <b>R${g.to.rank}</b>` : ""}</span></div>`;
      }).join("");
      groups.push(`<div class="group"><h3>合成値がよく伸びたカード<small>1000でランクアップ</small></h3><div class="gains">${rows}</div></div>`);
    }
    el.innerHTML = `<div class="result-head"><h2>${res.unit}連の結果</h2><span>${res.source === "reifu" ? "霊符" : "枠"}で引いた</span></div>` +
      `<div class="counts">${counts}</div>${groups.join("")}`;
  }

  // ------------------------------------------------------------ 図鑑

  function renderFilters() {
    const types = [["all", "すべて"], ...C.TYPES.map((t) => [t, t])];
    const attrs = [["all", "全属性"], ...C.ATTRS.map((a) => [a, a])];
    $("f-type").innerHTML = types.map(([v, l]) => `<button type="button" class="fchip" data-ftype="${v}" aria-pressed="${ui.type === v}">${l}</button>`).join("");
    $("f-attr").innerHTML = attrs.map(([v, l]) => `<button type="button" class="fchip" data-fattr="${v}" aria-pressed="${ui.attr === v}">${l}</button>`).join("");
  }

  function renderBook() {
    renderFilters();
    const owned = Object.keys(state.cards).length;
    $("book-count").textContent = `${owned} / ${cards.list.length}種`;
    const list = cards.list
      .filter((c) => (ui.type === "all" || c.type === ui.type) && (ui.attr === "all" || c.attr === ui.attr))
      .sort((a, b) => C.TYPES.indexOf(a.type) - C.TYPES.indexOf(b.type)
        || C.ATTRS.indexOf(a.attr) - C.ATTRS.indexOf(b.attr) || a.rarity - b.rarity);
    $("grid").innerHTML = list.map((c) => cardHTML(c)).join("");
  }

  // ------------------------------------------------------------ 霊棚

  function renderShelf() {
    $("shelf").innerHTML = state.shelf.map((id, i) => (id
      ? cardHTML(cards.byId[id])
      : `<button type="button" class="slot" data-empty-slot="${i}">空き<br>図鑑から選ぶ</button>`)).join("");

    const ownedIds = Object.keys(state.cards);
    let best = null;
    for (const id of ownedIds) {
      const c = state.cards[id];
      if (!best || c.rank > best.rank || (c.rank === best.rank && cards.byId[id].rarity > cards.byId[best.id].rarity)) {
        best = { id, rank: c.rank };
      }
    }
    const st = state.stats;
    const stats = [
      ["累計引き数", `${fmt(st.draws)}<small> 回</small>`],
      ["★5を引いた数", `${fmt(st.ssr)}<small> 枚</small>`],
      ["図鑑", `${ownedIds.length}<small> / ${cards.list.length}種</small>`],
      ["最高ランク", best ? `R${best.rank}<small> ${esc(cards.byId[best.id].name)}</small>` : "—"],
      ["引いた回数", `<small>10連 </small>${fmt(st.byUnit[10])}<small> / 100連 </small>${fmt(st.byUnit[100])}<small> / 1000連 </small>${fmt(st.byUnit[1000])}`],
      ["仮の支払い", `¥${fmt(st.yen)}`],
    ];
    $("stats").innerHTML = stats.map(([k, v]) => `<div class="stat"><dt>${k}</dt><dd>${v}</dd></div>`).join("");
    $("honors").innerHTML = S.honors(state).map((h) => `<li class="honor${h.earned ? " earned" : ""}">` +
      `<span class="mark">${h.earned ? "誉" : "未"}</span><span>${h.label}<span class="bar"><i style="width:${(h.progress * 100).toFixed(1)}%"></i></span></span>` +
      `<span class="pc">${h.earned ? "獲得" : `${Math.floor(h.progress * 100)}%`}</span></li>`).join("");
  }

  // ------------------------------------------------------------ テスト

  function renderTest() {
    $("sub-toggle").checked = state.sub.active;
  }

  function renderAll() {
    renderWaku();
    renderResult();
    if (ui.view === "book") renderBook();
    if (ui.view === "shelf") renderShelf();
    if (ui.view === "test") renderTest();
    if (sheetId) renderSheet();
  }

  function setView(view) {
    ui.view = view;
    saveUI();
    document.body.dataset.view = view; // 結果ページでは CSS で枠の表示とタブを隠す
    const tabView = view === "result" ? "draw" : view; // 結果ページはくじのタブの中の1ページ
    for (const tab of document.querySelectorAll("[data-view]")) tab.setAttribute("aria-selected", String(tab.dataset.view === tabView));
    for (const v of VIEWS) $(`view-${v}`).hidden = v !== view;
    renderAll();
    window.scrollTo(0, 0);
  }

  // ------------------------------------------------------------ カードの詳細

  function openSheet(id) {
    sheetId = id;
    renderSheet();
    $("sheet").hidden = false;
    $("sheet-close").focus();
  }
  function closeSheet() {
    sheetId = null;
    $("sheet").hidden = true;
  }

  function renderSheet() {
    const card = cards.byId[sheetId];
    const owned = state.cards[sheetId];
    const rows = [];
    let shelfHTML = "";
    if (owned) {
      const frame = S.frameOf(owned.rank);
      const nextFrame = FRAME_STEPS.find((r) => r > owned.rank);
      rows.push(["ランク", `R${owned.rank}（${frame}枠）${nextFrame ? ` · 次の枠は R${nextFrame}` : ""}`]);
      rows.push(["合成値", `${fmt(owned.points)} / ${fmt(S.RANK_UP_POINTS)} · 1枚 ${S.SYNTH_POINTS[card.rarity]}`]);
      rows.push(["持っている枚数", `${fmt(owned.copies)}枚`]);
      const g = S.growth(card.rarity, owned.rank);
      const done = owned.rank >= S.STAT_RANK_CAP ? "完成" : `完成値の${Math.round(g * 100)}%`;
      const statText = (hp, atk, plus) => [hp ? `体${plus}${fmt(hp)}` : "", atk ? `攻${plus}${fmt(atk)}` : ""].filter(Boolean).join(" · ");
      if (card.type === "精霊") {
        rows.push(["能力", `${statText(card.hpMax * g, card.atkMax * g, " ")}（${done}）`]);
      } else {
        rows.push(["付与すると", `${statText(card.hpMax * g, card.atkMax * g, "+")}（${done}。同じ属性の精霊なら×1.5）`]);
      }
      if (owned.rank < S.STAT_RANK_CAP) rows.push(["ランク10で", statText(card.hpMax, card.atkMax, card.type === "精霊" ? " " : "+")]);
      const here = state.shelf.indexOf(sheetId);
      const slots = state.shelf.map((sid, i) => `<button type="button" data-slot="${i}" aria-pressed="${sid === sheetId}">` +
        `${i + 1}: ${sid ? esc(cards.byId[sid].name) : "空き"}</button>`).join("");
      shelfHTML = `<div class="group"><h3>霊棚に飾る<small>選んだ枠に置きます</small></h3><div class="slots">${slots}` +
        `${here !== -1 ? `<button type="button" data-unshelf="1">外す</button>` : ""}</div></div>`;
    } else {
      rows.push(["状態", "まだ持っていません"]);
    }
    if (card.skill) rows.push(["スキル", `${card.skill}: ${C.SKILLS[card.skill]}`]);
    $("sheet-body").innerHTML = cardHTML(card, { big: true, static: true }) +
      `<div class="info"><h2 id="sheet-title">${owned ? esc(card.name) : "？？？"}${owned ? `<small>${esc(card.kana)}</small>` : ""}</h2>` +
      `<p class="sub">${card.type} · ${card.attr} · ${"★".repeat(card.rarity)}</p>` +
      `<dl class="kv">${rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl>${shelfHTML}</div>`;
  }

  // ------------------------------------------------------------ 演出

  let raf = 0;

  function stopParticles(clear) {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    if (clear) {
      const cv = $("show-canvas");
      cv.getContext("2d").clearRect(0, 0, cv.width, cv.height);
    }
  }

  function startParticles(opts, dur, done) {
    const cv = $("show-canvas");
    const ctx = cv.getContext("2d");
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = cv.clientWidth;
    const H = cv.clientHeight;
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (!dur) {
      done();
      return;
    }
    const swirl = opts.mode === "swirl";
    const n = swirl ? 260 : 140;
    const R = Math.max(W, H) * 0.75;
    const ps = Array.from({ length: n }, () => ({
      a: Math.random() * Math.PI * 2,
      r: R * (0.25 + Math.random() * 0.75),
      w: 0.6 + Math.random() * 2.2,
      x: Math.random() * W,
      y: -Math.random() * H,
      v: H * (0.9 + Math.random() * 1.1),
      ph: Math.random() * Math.PI * 2,
      s: 0.7 + Math.random() * 0.6,
    }));
    const t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur);
      const gold = opts.gold && (!opts.promote || k > 0.55);
      ctx.clearRect(0, 0, W, H);
      for (const p of ps) {
        let x, y, rot;
        if (swirl) {
          const r = p.r * (1 - 0.85 * k);
          const a = p.a + p.w * k * 4;
          x = W / 2 + Math.cos(a) * r;
          y = H / 2 + Math.sin(a) * r * 0.8;
          rot = a + Math.PI / 2;
        } else {
          x = p.x + Math.sin(k * 7 + p.ph) * 24;
          y = p.y + p.v * k * 1.4;
          rot = p.ph + k * 5;
        }
        drawFu(ctx, x, y, rot, p.s, gold);
      }
      if (k < 1) raf = requestAnimationFrame(step);
      else {
        raf = 0;
        done();
      }
    };
    raf = requestAnimationFrame(step);
  }

  /** 御札1枚。紙の地に朱の枠と墨の一本線。★5のときは金箔にする。 */
  function drawFu(ctx, x, y, rot, s, gold) {
    const w = 9 * s;
    const h = 22 * s;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.globalAlpha = 0.92;
    ctx.fillStyle = gold ? "#e9c76b" : "#efe7d2";
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.strokeStyle = gold ? "#8f6610" : "#b8321f";
    ctx.lineWidth = 1;
    ctx.strokeRect(-w / 2 + 1.5, -h / 2 + 1.5, w - 3, h - 3);
    ctx.fillStyle = gold ? "#5e4208" : "#2a2a33";
    ctx.fillRect(-0.6, -h / 2 + 4, 1.2, h - 8);
    ctx.restore();
  }

  function uniqueCounts(ids) {
    const m = new Map();
    for (const id of ids) m.set(id, (m.get(id) || 0) + 1);
    return [...m.entries()].map(([id, n]) => ({ id, n }));
  }

  function runShow(opts) {
    return new Promise((resolve) => {
      const el = $("show");
      const title = $("show-title");
      const stage = $("show-stage");
      const reveals = uniqueCounts(opts.reveal);
      let phase = "anim";
      let idx = 0;
      let finished = false;
      el.className = `show${opts.gold && !opts.promote ? " gold" : ""}`;
      el.hidden = false;
      title.textContent = opts.title || "";
      stage.innerHTML = "";

      const finish = () => {
        if (finished) return;
        finished = true;
        stopParticles(true);
        el.hidden = true;
        el.onclick = null;
        resolve();
      };
      const next = () => {
        if (idx >= reveals.length) return finish();
        const { id, n } = reveals[idx];
        idx += 1;
        phase = "reveal";
        el.classList.add("gold");
        title.textContent = "★5";
        const card = cards.byId[id];
        const more = idx < reveals.length ? "タップで次へ" : "タップで結果へ";
        stage.innerHTML = `<div class="reveal">${cardHTML(card, { big: true, static: true })}` +
          `<p class="rv-name">${esc(card.name)}${n > 1 ? ` ×${n}` : ""}</p><p class="rv-hint">${more}</p></div>`;
      };
      el.onclick = () => {
        if (phase === "anim") stopParticles(false);
        next();
      };
      $("show-skip").onclick = (e) => {
        e.stopPropagation();
        finish();
      };
      const dur = reduceMotion ? 0 : opts.mode === "swirl" ? 1700 : 1200;
      startParticles(opts, dur, () => {
        if (phase !== "anim" || finished) return;
        if (reveals.length) next();
        else setTimeout(finish, reduceMotion ? 300 : 350);
      });
    });
  }

  function banner(ids) {
    return new Promise((resolve) => {
      const el = $("banner");
      const names = ids.map((id) => cards.byId[id].name).slice(0, 3).join("・");
      el.textContent = `★4 ${names}${ids.length > 3 ? " ほか" : ""}`;
      el.hidden = false;
      el.style.animation = "none";
      void el.offsetWidth; // アニメーションを最初からやり直す
      el.style.animation = "";
      setTimeout(() => {
        el.hidden = true;
        resolve();
      }, reduceMotion ? 500 : 900);
    });
  }

  function playShow(res) {
    if (res.unit === 1000) {
      return runShow({ mode: "swirl", gold: res.counts[5] > 0, title: "千引き", reveal: res.ssrOrder });
    }
    if (res.counts[5] > 0) {
      // ときどき★4のような銀色で始まり、途中で金に化ける(昇格演出)
      return runShow({ mode: "fall", gold: true, promote: Math.random() < 0.3, title: "", reveal: res.ssrOrder });
    }
    const fours = Object.keys(res.high);
    if (fours.length) return banner(fours);
    return Promise.resolve();
  }

  // ------------------------------------------------------------ 操作

  async function onDraw(unit, source) {
    source = source || ui.source;
    if (busy) return;
    if (unit === 10 && Date.now() < tenReadyAt) return;
    const res = S.draw(state, cards, unit, source, now());
    if (!res) {
      toast(source === "reifu" ? "霊符が足りません" : "枠が足りません");
      return;
    }
    save();
    if (unit === 10) {
      tenReadyAt = Date.now() + TEN_COOLDOWN;
      const btn = $("unit-10");
      btn.classList.remove("cooling");
      void btn.offsetWidth;
      btn.classList.add("cooling");
      setTimeout(() => {
        btn.classList.remove("cooling");
        renderDrawControls();
      }, TEN_COOLDOWN);
    }
    busy = true;
    renderDrawControls();
    await playShow(res);
    busy = false;
    setView("result");
  }

  function skipTime(ms) {
    state.clockOffset += ms;
    S.sync(state, now());
    save();
    renderAll();
    toast(`${offsetLabel(ms)}進めました`);
  }

  function simulate(days) {
    const total = S.simulateDays(state, cards, days, Date.now());
    save();
    renderAll();
    $("sim-result").textContent = `${days}日分進めて、1000連を${fmt(total.pulls)}回（${fmt(total.draws)}回）引きました。` +
      `★5 ×${fmt(total.ssr)}、ランクアップ ${fmt(total.rankUps)}回、新しく手に入れたカード ${total.newIds.length}種。`;
  }

  function bind() {
    document.addEventListener("click", (e) => {
      const t = e.target.closest("button, input");
      if (!t) {
        if (e.target === $("sheet")) closeSheet();
        return;
      }
      const d = t.dataset;
      if (d.view) setView(d.view);
      else if (d.source) {
        ui.source = d.source;
        saveUI();
        renderDrawControls();
      } else if (d.unit) onDraw(Number(d.unit));
      else if (d.card) openSheet(d.card);
      else if (d.emptySlot !== undefined) setView("book");
      else if (d.slot !== undefined) {
        S.setShelf(state, Number(d.slot), sheetId);
        save();
        renderAll();
        toast(`霊棚の${Number(d.slot) + 1}番に飾りました`);
      } else if (d.unshelf) {
        S.setShelf(state, state.shelf.indexOf(sheetId), null);
        save();
        renderAll();
      } else if (d.ftype) {
        ui.type = d.ftype;
        saveUI();
        renderBook();
      } else if (d.fattr) {
        ui.attr = d.fattr;
        saveUI();
        renderBook();
      } else if (d.skip) skipTime(Number(d.skip));
    });

    $("sheet-close").addEventListener("click", closeSheet);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && sheetId) closeSheet();
    });

    $("buy-boost").addEventListener("click", () => {
      const add = S.buyBoost(state, now());
      if (!add) return;
      save();
      renderAll();
      toast(`この1時間の枠が${fmt(add)}回増えました`);
    });
    $("buy-reifu").addEventListener("click", () => {
      if (!S.buyReifu(state, now())) return;
      save();
      renderAll();
      toast("霊符を1,000枚買いました");
    });
    $("sub-toggle").addEventListener("change", (e) => {
      S.setSubscription(state, e.target.checked, now());
      save();
      renderAll();
    });
    $("again").addEventListener("click", () => {
      const last = state.lastResult;
      if (last) onDraw(last.unit, last.source);
    });
    $("back").addEventListener("click", () => setView("draw"));
    $("last-link").addEventListener("click", () => setView("result"));
    $("sim7").addEventListener("click", () => simulate(7));
    $("sim30").addEventListener("click", () => simulate(30));
    $("reset").addEventListener("click", () => {
      $("reset").hidden = true;
      $("reset-confirm").hidden = false;
    });
    $("reset-no").addEventListener("click", () => {
      $("reset").hidden = false;
      $("reset-confirm").hidden = true;
    });
    $("reset-yes").addEventListener("click", () => {
      state = S.newState(Date.now());
      save();
      $("reset").hidden = false;
      $("reset-confirm").hidden = true;
      $("sim-result").textContent = "";
      setView(ui.view === "result" ? "draw" : ui.view);
      toast("データを消しました");
    });
  }

  function start(data) {
    state = data && data.state ? data.state : S.restore(readJSON(STORE_KEY), Date.now());
    Object.assign(ui, readJSON(UI_KEY) || {}, data && data.ui ? data.ui : {});
    if (!VIEWS.includes(ui.view) || (ui.view === "result" && !state.lastResult)) ui.view = "draw";
    if (ui.source !== "reifu") ui.source = "waku";
    renderOdds();
    bind();
    setView(ui.view);
    setInterval(renderWaku, 1000);
    try {
      if (window.claude && window.claude.hot && window.claude.hot.snapshot) {
        window.claude.hot.snapshot(() => ({ state, ui }));
      }
    } catch (e) {
      /* 開発用の仕組みなので、なくても動く */
    }
  }

  const hot = window.claude && window.claude.hot;
  if (hot && hot.ready) hot.ready(start);
  else start(hot && hot.data ? hot.data : {});
})();
