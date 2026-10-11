/* Isha's Star Atlas — saved progress. Everything lives in one localStorage key
   and every read and write is guarded, so a blocked or cleared store just means
   a fresh atlas rather than a broken page. */
(function (W) {
  'use strict';

  var KEY = 'isha-star-atlas-v1';
  var A = W.Atlas;

  function today() {
    var d = new Date();
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }
  function daysBetween(a, b) {
    return Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000);
  }

  function blank() {
    return {
      name: 'Isha',
      level: 1, xp: 0, dust: 60,
      stars: {},            // "region:stageIdx" -> 0..3
      bossBeaten: {},       // regionId -> true
      beasts: {},           // beastId -> true
      badges: {},           // badgeId -> true
      owned: {},            // cosmetic id -> true
      toys: {},             // toy id -> how many won
      powers: { hint: 1, skip: 0, shield: 0, double: 0 },
      look: null,           // equipped cosmetic id
      facts: {},            // factId -> {s: seen, w: wrong}
      topics: {},           // regionId -> {c: correct, w: wrong}
      answered: 0, bestCombo: 0, blitzBest: 0,
      minutes: 0,
      streak: 0, lastDay: null,
      daily: null,
      sound: true
    };
  }

  var S = blank();

  function load() {
    try {
      var raw = W.localStorage.getItem(KEY);
      if (raw) {
        var o = JSON.parse(raw);
        for (var k in S) if (Object.prototype.hasOwnProperty.call(o, k)) S[k] = o[k];
        if (!S.powers) S.powers = blank().powers;
      }
    } catch (e) { /* no store available — play unsaved */ }
    rollDay();
    return S;
  }

  var saveTimer = null;
  function save() {
    if (saveTimer) return;
    saveTimer = setTimeout(function () {
      saveTimer = null;
      try { W.localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignore */ }
    }, 120);
  }

  /* ---------- daily streak and quests ---------- */
  function rollDay() {
    var t = today();
    if (S.lastDay !== t) {
      if (S.lastDay) {
        var gap = daysBetween(S.lastDay, t);
        S.streak = gap === 1 ? S.streak + 1 : 1;
      } else S.streak = 1;
      S.lastDay = t;
      S.daily = null;
    }
    if (!S.daily || S.daily.date !== t) {
      // Pick three quests deterministically from the date so they stay put all day.
      var seed = 0, i;
      for (i = 0; i < t.length; i++) seed = (seed * 31 + t.charCodeAt(i)) % 100000;
      var pool = A.QUESTS.slice(), chosen = [];
      while (chosen.length < 3 && pool.length) {
        seed = (seed * 1103515245 + 12345) % 2147483648;
        chosen.push(pool.splice(seed % pool.length, 1)[0]);
      }
      S.daily = {
        date: t,
        list: chosen.map(function (q) {
          return { id: q.id, text: q.text, goal: q.goal, reward: q.reward, track: q.track, prog: 0, done: false, claimed: false };
        })
      };
    }
    save();
  }

  /* Push progress at the day's quests. Returns quests that just completed. */
  function track(what, value) {
    var done = [];
    if (!S.daily) return done;
    S.daily.list.forEach(function (q) {
      if (q.done || q.track !== what) return;
      q.prog = what === 'combo' ? Math.max(q.prog, value) : q.prog + value;
      if (q.prog >= q.goal) { q.prog = q.goal; q.done = true; done.push(q); }
    });
    if (done.length) save();
    return done;
  }

  function claim(id) {
    var got = 0;
    if (!S.daily) return 0;
    S.daily.list.forEach(function (q) {
      if (q.id === id && q.done && !q.claimed) { q.claimed = true; got = q.reward; S.dust += got; }
    });
    if (got) save();
    return got;
  }

  /* ---------- XP, dust, levels ---------- */
  function addXp(n) {
    S.xp += n;
    var ups = 0;
    while (S.xp >= A.xpForLevel(S.level)) { S.xp -= A.xpForLevel(S.level); S.level++; S.dust += 25; ups++; }
    save();
    return ups;
  }
  function addDust(n) { S.dust += n; save(); }
  function spend(n) { if (S.dust < n) return false; S.dust -= n; save(); return true; }

  /* ---------- per-question records ---------- */
  function record(q, right, regionId) {
    S.answered++;
    if (q.id) {
      // Only missed facts are kept, and one correct answer retires one miss.
      var f = S.facts[q.id];
      if (!right) { f = f || { s: 0, w: 0 }; f.s++; f.w++; S.facts[q.id] = f; }
      else if (f) { f.s++; f.w--; if (f.w <= 0) delete S.facts[q.id]; else S.facts[q.id] = f; }
    }
    if (regionId) {
      var t = S.topics[regionId] || { c: 0, w: 0 };
      if (right) t.c++; else t.w++;
      S.topics[regionId] = t;
    }
    save();
  }

  /* Weakest facts first — the Tricky Facts list. */
  function trickyList() {
    var out = [];
    for (var id in S.facts) if (S.facts[id].w > 0) out.push({ id: id, w: S.facts[id].w, s: S.facts[id].s });
    out.sort(function (a, b) { return b.w - a.w; });
    return out;
  }

  /* ---------- progression ---------- */
  function starsFor(regionId, idx) { return S.stars[regionId + ':' + idx] || 0; }
  function setStars(regionId, idx, n) {
    var k = regionId + ':' + idx;
    if ((S.stars[k] || 0) < n) S.stars[k] = n;
    save();
  }
  function regionStars(regionId) {
    var r = A.region(regionId), t = 0;
    for (var i = 0; i < r.stages.length; i++) t += starsFor(regionId, i);
    if (S.bossBeaten[regionId]) t += 3;
    return t;
  }
  function stageUnlocked(regionId, idx) {
    if (idx === 0) return true;
    return starsFor(regionId, idx - 1) > 0;
  }
  function bossUnlocked(regionId) {
    var r = A.region(regionId);
    for (var i = 0; i < r.stages.length; i++) if (!starsFor(regionId, i)) return false;
    return true;
  }
  function regionUnlocked(regionId) {
    var list = A.REGIONS, i;
    for (i = 0; i < list.length; i++) {
      if (list[i].id === regionId) return i === 0 ? true : !!S.bossBeaten[list[i - 1].id] || regionStars(list[i - 1].id) >= 8;
    }
    return false;
  }
  function totalStars() {
    var t = 0;
    for (var i = 0; i < A.REGIONS.length; i++) t += regionStars(A.REGIONS[i].id);
    return t;
  }

  /* ---------- the toy box ---------- */
  function winToy(id) {
    var isNew = !S.toys[id];
    S.toys[id] = (S.toys[id] || 0) + 1;
    save();
    return isNew;
  }
  function toyCount() { var n = 0; for (var k in S.toys) if (S.toys[k]) n++; return n; }
  function toyTotal() { var n = 0; for (var k in S.toys) n += S.toys[k]; return n; }

  /* ---------- badges ---------- */
  function checkBadges(ctx) {
    ctx = ctx || {};
    var won = [];
    function give(id) { if (!S.badges[id]) { S.badges[id] = true; won.push(A.BADGES.filter(function (b) { return b.id === id; })[0]); } }
    if (totalStars() > 0) give('firstlight');
    if (ctx.stars === 3) give('perfect');
    if (S.bestCombo >= 10) give('combo10');
    var anyBoss = false;
    for (var k in S.bossBeaten) if (S.bossBeaten[k]) anyBoss = true;
    if (anyBoss) give('boss1');
    if (S.blitzBest >= 25) give('blitz25');
    if (S.answered >= 100) give('hundred');
    if (S.streak >= 7) give('streak7');
    if (S.answered >= 30 && trickyList().length === 0) give('tricky0');
    if (S.bossBeaten.falls) give('frac');
    if (W.Toys && toyCount() >= W.Toys.list.length) give('toybox');
    var all = true;
    for (var i = 0; i < A.REGIONS.length; i++) if (!S.bossBeaten[A.REGIONS[i].id]) all = false;
    if (all) give('atlas');
    if (won.length) { S.dust += won.length * 30; save(); }
    return won;
  }

  W.Store = {
    s: S, load: load, save: save, today: today,
    addXp: addXp, addDust: addDust, spend: spend,
    record: record, trickyList: trickyList,
    winToy: winToy, toyCount: toyCount, toyTotal: toyTotal,
    starsFor: starsFor, setStars: setStars, regionStars: regionStars,
    stageUnlocked: stageUnlocked, bossUnlocked: bossUnlocked,
    regionUnlocked: regionUnlocked, totalStars: totalStars,
    checkBadges: checkBadges, track: track, claim: claim, rollDay: rollDay,
    reset: function () { var b = blank(); for (var k in b) S[k] = b[k]; rollDay(); save(); }
  };
})(window);
