/* Isha's Star Atlas — screens, the stage loop and all the reward moments. */
(function (W, D) {
  'use strict';

  var A = W.Atlas, Q = W.MathQ, St = W.Store, FX = W.FX;
  var S = St.load();
  FX.Sound.set(S.sound);

  var view = D.getElementById('view');
  var burst = null;
  var route = { name: 'map' };
  var run = null;          // active stage session
  var minuteTimer = null;

  function $(sel, root) { return (root || D).querySelector(sel); }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  /* ======================= HUD ======================= */
  function lookGlyph() { return S.look ? A.shopItem(S.look).glyph : '🔭'; }

  var cubMood = 'idle', cubMoodTimer = null;
  function setCubMood(m, ms) {
    cubMood = m;
    if (cubMoodTimer) clearTimeout(cubMoodTimer);
    paintCub();
    if (ms) cubMoodTimer = setTimeout(function () { cubMood = 'idle'; paintCub(); }, ms);
  }
  function paintCub() {
    var slot = $('#cubSlot');
    if (slot && W.Cub) slot.innerHTML = W.Cub.svg(St.totalStars(), cubMood, 'tiny');
  }

  /* Flash a chip when its number goes up, so earnings are felt not just shown. */
  function setChip(sel, val) {
    var el = $(sel);
    if (!el) return;
    if (el.textContent !== String(val)) {
      el.textContent = val;
      el.classList.remove('bump');
      void el.offsetWidth;
      el.classList.add('bump');
    }
  }

  function hud() {
    var need = A.xpForLevel(S.level), pct = Math.round(S.xp / need * 100);
    $('#avatarGlyph').textContent = lookGlyph();
    $('#levelNum').textContent = S.level;
    $('#keeperName').textContent = S.name + ' · ' + A.titleFor(S.level);
    $('#xpFill').style.width = pct + '%';
    $('#xpText').textContent = S.xp + ' / ' + need + ' XP';
    setChip('#chipStars', St.totalStars());
    setChip('#chipDust', S.dust);
    setChip('#chipStreak', S.streak);
    paintCub();
    $('#soundBtn').textContent = S.sound ? '🔔' : '🔕';
    $('#soundBtn').setAttribute('aria-label', S.sound ? 'Turn sound off' : 'Turn sound on');
  }

  /* ======================= routing ======================= */
  function go(name, p) {
    route = { name: name, p: p || {} };
    render();
    W.scrollTo({ top: 0, behavior: FX.reduce ? 'auto' : 'smooth' });
  }

  function render() {
    hud();
    D.querySelectorAll('.navbtn').forEach(function (b) {
      b.classList.toggle('on', b.dataset.nav === route.name || (route.name === 'region' && b.dataset.nav === 'map'));
    });
    var html = '';
    switch (route.name) {
      case 'map': html = screenMap(); break;
      case 'region': html = screenRegion(route.p.id); break;
      case 'play': html = screenPlay(); break;
      case 'result': html = screenResult(route.p); break;
      case 'blitz': html = screenBlitz(); break;
      case 'tricky': html = screenTricky(); break;
      case 'toys': html = screenToys(); break;
      case 'cub': html = screenCub(); break;
      case 'beasts': html = screenBeasts(); break;
      case 'shop': html = screenShop(); break;
      case 'grown': html = screenGrown(); break;
    }
    view.innerHTML = html;
    view.classList.remove('enter');
    void view.offsetWidth;
    view.classList.add('enter');
    if (route.name === 'result') countUp();
  }

  /* Roll the result figures up from zero — a number that moves reads as earned. */
  function countUp() {
    if (FX.reduce) return;
    D.querySelectorAll('.rs b').forEach(function (el, i) {
      var raw = el.textContent, m = /(-?\d+)/.exec(raw);
      if (!m) return;
      var target = +m[1], pre = raw.slice(0, m.index), post = raw.slice(m.index + m[1].length);
      var t0 = null, dur = 650 + i * 70;
      function step(ts) {
        if (!t0) t0 = ts;
        var k = Math.min(1, (ts - t0) / dur);
        var e = 1 - Math.pow(1 - k, 3);
        el.textContent = pre + Math.round(target * e) + post;
        if (k < 1) W.requestAnimationFrame(step);
      }
      el.textContent = pre + '0' + post;
      W.requestAnimationFrame(step);
    });
  }

  /* ======================= sky map ======================= */
  function questStrip() {
    if (!S.daily) return '';
    var rows = S.daily.list.map(function (q) {
      var pct = Math.round(Math.min(1, q.prog / q.goal) * 100);
      return '<div class="quest' + (q.done ? ' done' : '') + '">' +
        '<div class="qtop"><span>' + esc(q.text) + '</span><span class="qrew">+' + q.reward + ' ✨</span></div>' +
        '<div class="qbar"><i style="width:' + pct + '%"></i></div>' +
        (q.done && !q.claimed
          ? '<button class="claim" data-claim="' + q.id + '">Collect</button>'
          : '<div class="qnum">' + q.prog + ' / ' + q.goal + (q.claimed ? ' · collected' : '') + '</div>') +
        '</div>';
    }).join('');
    return '<section class="panel quests"><h2 class="ph">Tonight\'s quests <span class="phsub">reset each day</span></h2>' +
      '<div class="qgrid">' + rows + '</div></section>';
  }

  function weekStrip() {
    var days = St.weekDays(), done = St.weekCount();
    var dots = days.map(function (d, i) {
      return '<div class="wd' + (d.done ? ' on' : '') + (d.today ? ' now' : '') + '" style="--i:' + i + '">' +
        '<span class="wdot">' + (d.done ? '★' : '') + '</span>' +
        '<i>' + d.label + '</i></div>';
    }).join('');
    var ready = done >= 5 && S.week && !S.week.claimed;
    var note = S.week && S.week.claimed
      ? 'Weekly toy collected. Nice week.'
      : done >= 5 ? 'Five nights reached — your legendary toy is waiting.'
      : (5 - done) + ' more night' + (5 - done === 1 ? '' : 's') + ' this week for a legendary toy.';
    return '<section class="panel weekpanel">' +
      '<h2 class="ph">This week in the sky <span class="phsub">' + done + ' of 7 nights practised</span></h2>' +
      '<div class="wrow">' + dots + '</div>' +
      '<div class="wfoot"><p>' + note + '</p>' +
      (ready ? '<button class="claim wide" data-weekclaim="1">Open your legendary toy ✨</button>' : '') +
      '</div></section>';
  }

  function screenMap() {
    var cards = A.REGIONS.map(function (r, i) {
      var open = St.regionUnlocked(r.id), stars = St.regionStars(r.id), max = r.stages.length * 3 + 3;
      var beat = !!S.bossBeaten[r.id];
      if (!open) {
        var prev = A.REGIONS[i - 1];
        return '<div class="rcard locked"><div class="rglyph">🔒</div><div class="rbody">' +
          '<h3>' + esc(r.name) + '</h3><p>Finish ' + esc(prev.name) + ' to open this region.</p></div></div>';
      }
      return '<button class="rcard hue-' + r.hue + (beat ? ' beat' : '') + '" data-region="' + r.id + '">' +
        '<div class="rglyph">' + r.glyph + '</div>' +
        '<div class="rbody"><h3>' + esc(r.name) + '</h3><p>' + esc(r.skill) + '</p>' +
        '<div class="rmeta"><span class="starpill">⭐ ' + stars + ' / ' + max + '</span>' +
        (beat ? '<span class="tag">Region lit</span>' : '<span class="tag soft">' + r.stages.length + ' stages + boss</span>') +
        '</div></div></button>';
    }).join('');
    return weekStrip() + questStrip() +
      '<section class="panel"><h2 class="ph">The eight regions <span class="phsub">pick a place to practise</span></h2>' +
      '<div class="rgrid">' + cards + '</div></section>';
  }

  function screenRegion(id) {
    var r = A.region(id);
    var stages = r.stages.map(function (st, i) {
      var open = St.stageUnlocked(id, i), got = St.starsFor(id, i);
      return '<button class="scard' + (open ? '' : ' locked') + '"' + (open ? ' data-play="' + id + ':' + i + '"' : ' disabled') + '>' +
        '<span class="snum">' + (i + 1) + '</span>' +
        '<span class="sname">' + esc(st.name) + '</span>' +
        '<span class="stars">' + stars3(got) + '</span>' +
        '</button>';
    }).join('');
    var bOpen = St.bossUnlocked(id), bBeat = !!S.bossBeaten[id];
    var boss = '<button class="bosscard' + (bOpen ? '' : ' locked') + (bBeat ? ' beat' : '') + '"' +
      (bOpen ? ' data-play="' + id + ':boss"' : ' disabled') + '>' +
      '<span class="bglyph">' + (bOpen ? r.boss.glyph : '🔒') + '</span>' +
      '<span class="bbody"><b>' + esc(r.boss.name) + '</b><i>' +
      (bBeat ? 'Defeated — play again any time' : bOpen ? '12 questions · 3 hearts' : 'Earn a star on every stage first') +
      '</i></span></button>';
    return '<section class="panel">' +
      '<button class="back" data-nav="map">‹ Sky map</button>' +
      '<h2 class="ph">' + r.glyph + ' ' + esc(r.name) + ' <span class="phsub">' + esc(r.skill) + '</span></h2>' +
      '<div class="sgrid">' + stages + '</div>' + boss + '</section>';
  }

  function stars3(n) {
    var s = '';
    for (var i = 0; i < 3; i++) s += '<b class="' + (i < n ? 'lit' : '') + '">★</b>';
    return s;
  }

  /* ======================= stage loop ======================= */
  function startRun(key) {
    var parts = key.split(':'), r = A.region(parts[0]), isBoss = parts[1] === 'boss';
    var idx = isBoss ? 'boss' : +parts[1];
    var gens = isBoss ? r.boss.gens : r.stages[idx].gens;
    var n = isBoss ? 12 : 8;
    run = {
      region: r, idx: idx, isBoss: isBoss,
      title: isBoss ? r.boss.name : r.stages[idx].name,
      queue: Q.set(gens, n), gens: gens,
      i: 0, total: n, right: 0, wrong: 0,
      combo: 0, best: 0, hearts: 3, retries: 0,
      dust: 0, xp: 0, locked: false, typed: '',
      usedHint: false, doubled: S.powers.double > 0
    };
    if (run.doubled) { S.powers.double--; St.save(); }
    startClock();
    go('play');
  }

  /* Drop whatever game is running — used whenever the nav is touched. */
  function abandon() {
    if (blitz && blitz.timer) clearInterval(blitz.timer);
    blitz = null;
    run = null;
    stopClock();
  }

  function startClock() {
    if (minuteTimer) return;
    minuteTimer = setInterval(function () { S.minutes++; St.save(); }, 60000);
  }
  function stopClock() { if (minuteTimer) { clearInterval(minuteTimer); minuteTimer = null; } }

  function cur() { return run.queue[run.i]; }

  function screenPlay() {
    var q = cur();
    if (!q) return '';
    var pct = Math.round(run.i / run.total * 100);
    var head = '<div class="phead">' +
      '<button class="back small" data-nav="quit">‹ Leave</button>' +
      '<div class="pbar"><i style="width:' + pct + '%"></i></div>' +
      '<span class="pcount">' + (run.i + 1) + '/' + run.total + '</span></div>';

    var status = '<div class="pstatus">' +
      '<span class="where">' + run.region.glyph + ' ' + esc(run.title) + '</span>' +
      (run.isBoss ? '<span class="hearts">' + hearts(run.hearts) + '</span>' : '') +
      (run.combo >= 2 ? '<span class="combo">🔥 ' + run.combo + ' in a row · ×' + mult() + '</span>' : '') +
      '</div>';

    var body = '<div class="qcard">' +
      '<span class="eyebrow">' + esc(q.eyebrow) + '</span>' +
      '<div class="prompt' + (q.prompt.length > 70 ? ' long' : '') + '">' + q.prompt + '</div>' +
      (q.visual ? Q.render(q.visual) : '') +
      (q.unit ? '<div class="unit">answer in ' + esc(q.unit) + '</div>' : '') +
      '</div>';

    var input = q.choices ? choiceGrid(q) : keypad();
    var powers = powerRow(q);
    var heat = run.combo >= 10 ? ' blazing' : run.combo >= 5 ? ' hot' : run.combo >= 3 ? ' warm' : '';
    return '<section class="panel play' + heat + (run.hurt ? ' hurt' : '') + '">' + head + status + body + input + powers +
      '<div id="fb" class="fb" hidden></div></section>';
  }

  /* The first answer of the day moves the streak and lights the week chart. */
  function notePractice() {
    var p = St.markPractice();
    if (!p) return;
    toast(p.forgave
      ? '🛡️ Streak saved — your shield covered the day you missed. ' + p.streak + ' days running.'
      : p.streak > 1 ? '🔥 Day ' + p.streak + ' in a row. Nova is pleased.'
      : '🌙 First night of a new streak.');
    hud();
  }

  function toast(msg) {
    var t = D.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    D.body.appendChild(t);
    setTimeout(function () { t.classList.add('out'); }, 3200);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 3800);
  }

  function mult() { return run.combo >= 10 ? 3 : run.combo >= 5 ? 2 : 1; }
  function hearts(n) {
    var s = '';
    for (var i = 0; i < 3; i++) s += '<b class="' + (i < n ? 'full' : 'gone') + '">' + (i < n ? '❤️' : '🖤') + '</b>';
    return s;
  }

  function choiceGrid(q) {
    return '<div class="choices">' + q.choices.map(function (c, i) {
      return '<button class="choice" data-pick="' + i + '"><span>' + c.html + '</span></button>';
    }).join('') + '</div>';
  }

  function keypad() {
    var keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clr', '0', 'del'];
    return '<div class="kpwrap"><div class="kpdisplay" id="kpd">' + (run.typed || '<i>type your answer</i>') + '</div>' +
      '<div class="kp">' + keys.map(function (k) {
        if (k === 'del') return '<button class="key wide2" data-key="del">⌫</button>';
        if (k === 'clr') return '<button class="key" data-key="clr">C</button>';
        return '<button class="key" data-key="' + k + '">' + k + '</button>';
      }).join('') + '</div>' +
      '<button class="go" data-key="enter">Check it ✨</button></div>';
  }

  function powerRow(q) {
    var items = [];
    if (q.choices && S.powers.hint > 0 && !run.usedHint) items.push('<button class="power" data-power="hint">🔎 Hint <b>' + S.powers.hint + '</b></button>');
    if (S.powers.skip > 0) items.push('<button class="power" data-power="skip">☄️ Skip <b>' + S.powers.skip + '</b></button>');
    if (run.isBoss && S.powers.shield > 0) items.push('<span class="power still">🛡️ Shield <b>' + S.powers.shield + '</b></span>');
    if (run.doubled) items.push('<span class="power still">✨ Double dust on</span>');
    return items.length ? '<div class="powers">' + items.join('') + '</div>' : '';
  }

  function answer(val) {
    if (run.locked) return;
    var q = cur(), right = String(val).trim() === String(q.answer).trim();
    run.locked = true;
    run.picked = val;

    St.record(q, right, run.drill ? null : run.region.id);
    notePractice();
    setCubMood(right ? 'happy' : 'sad', right ? 1400 : 2600);
    if (right) {
      run.right++; run.combo++;
      run.best = Math.max(run.best, run.combo);
      if (run.combo > S.bestCombo) { S.bestCombo = run.combo; St.save(); }
      St.track('combo', run.combo);
      run.xp += 6 * mult();
      run.dust += 3 * mult();
      FX.Sound.right(run.combo);
    } else {
      run.wrong++; run.combo = 0;
      if (run.isBoss) {
        if (S.powers.shield > 0) { S.powers.shield--; St.save(); }
        else { run.hearts--; run.hurt = true; FX.Sound.hit(); setTimeout(function () { if (run) run.hurt = false; }, 700); }
      }
      FX.Sound.wrong();
      // Put a fresh question of the same kind back in the queue, up to three times.
      if (run.retries < 3) { run.retries++; run.queue.push(Q.make(q.gen)); run.total++; }
    }
    St.track('answers', 1);
    showFeedback(right, q);
  }

  function showFeedback(right, q) {
    render();
    var fb = $('#fb');
    if (!fb) return;
    var over = run.isBoss && run.hearts <= 0;

    if (q.choices) {
      D.querySelectorAll('.choice').forEach(function (b) {
        var c = q.choices[+b.dataset.pick];
        if (String(c.v) === String(q.answer)) b.classList.add('yes');
        else if (String(c.v) === String(run.picked)) b.classList.add('no');
      });
    }
    D.querySelectorAll('.choice, .key, .go:not(.next), .power').forEach(function (b) { b.disabled = true; });

    fb.hidden = false;
    if (right) {
      fb.className = 'fb good';
      fb.innerHTML = '<div class="fbhead">' + pickPraise() + '</div>' +
        '<button class="go next" data-next="1">' + (over ? 'See how it went' : 'Keep going') + '</button>';
      giveToy();
      if (!FX.reduce) setTimeout(function () { if (run && run.locked) advance(); }, 1250);
    } else {
      fb.className = 'fb bad fixit';
      fb.innerHTML = fixItHtml(q, over);
      fb.scrollIntoView({ block: 'nearest', behavior: FX.reduce ? 'auto' : 'smooth' });
    }
  }

  /* Unwrap a present. Toys are drawn from a shuffled bag, so each one differs
     from the last, and a first-time toy pays a small stardust bonus. */
  function giveToy() {
    if (!W.Toys) return;
    var toy = W.Toys.draw();
    var isNew = St.winToy(toy.id);
    if (isNew) St.addDust(5);
    FX.Sound.gift(isNew);
    W.Toys.reveal(toy, isNew);
    hud();
  }

  /* The repair panel: name the mistake she actually made, then walk the
     method through one step at a time. */
  function fixItHtml(q, over) {
    var why = null, i;
    if (q.choices) {
      for (i = 0; i < q.choices.length; i++) {
        if (String(q.choices[i].v) === String(run.picked)) { why = q.choices[i].why; break; }
      }
    } else if (Q.diagnoseTyped) {
      why = Q.diagnoseTyped(q, run.picked);
    }

    var steps = (q.steps && q.steps.length) ? q.steps : [q.explain];
    var stepHtml = '';
    for (i = 0; i < steps.length; i++) {
      stepHtml += '<li class="fxstep" style="--d:' + i + '"><span class="fxn">' + (i + 1) + '</span>' +
        '<p>' + steps[i] + '</p></li>';
    }

    return '<div class="fxhead">' + W.Cub.svg(St.totalStars(), 'sad', 'mini') +
      '<div class="fxtitle"><b>Let\'s relight this star</b><i>Nova will walk you through it</i></div></div>' +
      '<div class="fxpicked"><span class="fxyou">You picked</span> <b>' + pickedHtml(q) + '</b>' +
      '<p>' + (why || 'Not that one — here is how it works.') + '</p></div>' +
      '<div class="fxwalk"><span class="fxlabel">Solve it together</span>' +
      '<ol class="fxsteps">' + stepHtml + '</ol></div>' +
      '<div class="fxans"><span>The answer is</span><b>' + ansHtml(q) + '</b>' +
      (q.unit ? '<i>' + esc(q.unit) + '</i>' : '') + '</div>' +
      '<button class="go next relight" data-next="1" data-relight="1">' +
      (over ? 'See how it went' : 'I\'ve got it now') + ' <span class="plus">+2 ✨</span></button>';
  }

  function pickedHtml(q) {
    if (q.choices) {
      for (var i = 0; i < q.choices.length; i++) {
        if (String(q.choices[i].v) === String(run.picked)) return q.choices[i].html;
      }
    }
    return esc(run.picked);
  }

  function ansHtml(q) {
    if (q.choices) {
      for (var i = 0; i < q.choices.length; i++) if (String(q.choices[i].v) === String(q.answer)) return q.choices[i].html;
    }
    return esc(q.answer);
  }

  var PRAISE = ['Nice one!', 'Got it!', 'Star lit ⭐', 'Exactly right', 'Brilliant!', 'You nailed it', 'Sharp thinking', 'Yes!'];
  function pickPraise() {
    if (run.combo >= 10) return 'TEN in a row! 🔥';
    if (run.combo >= 5) return run.combo + ' in a row! 🔥';
    return PRAISE[Math.floor(Math.random() * PRAISE.length)];
  }

  function advance() {
    if (!run) return;
    run.locked = false; run.typed = ''; run.relit = false;
    // The present is deliberately NOT cleared here — it keeps playing over the
    // next question and flies off to the toy box on its own timer.
    if (run.isBoss && run.hearts <= 0) return finishRun(false);
    run.i++;
    if (run.i >= run.queue.length) return finishRun(true);
    render();
  }

  function finishRun(survived) {
    stopClock();
    var r = run, stars = 0;
    var cleared = survived && (!r.isBoss || r.hearts > 0);
    if (cleared) stars = r.wrong === 0 ? 3 : r.wrong <= 2 ? 2 : 1;

    var dust = r.dust + (cleared ? (r.isBoss ? 60 : 20) + stars * 10 : 0);
    if (r.doubled) dust *= 2;
    var xp = r.xp + (cleared ? (r.isBoss ? 70 : 25) : 5);

    var ups = St.addXp(xp);
    St.addDust(dust);
    if (cleared && !r.drill) {
      if (!r.isBoss) St.setStars(r.region.id, r.idx, stars);
      else {
        S.bossBeaten[r.region.id] = true;
        S.beasts[r.region.beast] = true;
        St.save();
      }
      St.track('stages', 1);
      if (stars === 3) St.track('perfect', 1);
    }
    var badges = St.checkBadges({ stars: stars });
    var newBeast = cleared && r.isBoss ? r.region.beast : null;
    var grew = St.cubGrew();

    if (cleared) { FX.Sound.star(); if (burst) burst.fire(stars === 3 ? 110 : 70); }
    if (ups) setTimeout(function () { FX.Sound.level(); if (burst) burst.fire(90, 120); }, 500);

    go('result', {
      cleared: cleared, stars: stars, dust: dust, xp: xp, ups: ups, badges: badges,
      beast: newBeast, grew: grew, right: r.right, wrong: r.wrong, best: r.best, drill: !!r.drill,
      region: r.region.id, idx: r.idx, isBoss: r.isBoss, title: r.title, doubled: r.doubled
    });
    run = null;
  }

  function screenResult(p) {
    var r = A.region(p.region);
    if (!r) return screenDrillResult(p);
    var nextIdx = (!p.isBoss && p.idx + 1 < r.stages.length) ? p.idx + 1 : null;
    var nextBtn = '';
    if (p.cleared && nextIdx !== null && St.stageUnlocked(p.region, nextIdx)) {
      nextBtn = '<button class="go" data-play="' + p.region + ':' + nextIdx + '">Next: ' + esc(r.stages[nextIdx].name) + ' ›</button>';
    } else if (p.cleared && !p.isBoss && St.bossUnlocked(p.region)) {
      nextBtn = '<button class="go boss" data-play="' + p.region + ':boss">Face ' + esc(r.boss.name) + ' ' + r.boss.glyph + '</button>';
    }

    var grewHtml = '';
    if (p.grew) {
      grewHtml = '<div class="newbeast grewbox"><div class="nbtag">Nova grew!</div>' +
        W.Cub.svg(St.totalStars(), 'happy', 'mid') +
        '<h3>' + esc(p.grew.name) + '</h3><p>' + esc(p.grew.blurb) + '</p></div>';
    }

    var beastHtml = '';
    if (p.beast) {
      var b = A.BEASTS[p.beast];
      beastHtml = '<div class="newbeast"><div class="nbtag">New Star Beast!</div>' +
        constellation(p.beast, true) +
        '<h3>' + esc(b.name) + '</h3><p>' + esc(b.note) + '</p></div>';
    }

    var badgeHtml = p.badges && p.badges.length
      ? '<div class="newbadges">' + p.badges.map(function (b) {
        return '<div class="nb"><span>' + b.glyph + '</span><b>' + esc(b.name) + '</b><i>' + esc(b.desc) + '</i></div>';
      }).join('') + '</div>' : '';

    var head = p.cleared
      ? '<div class="bigstars">' + stars3(p.stars) + '</div><h2 class="rtitle">' +
        (p.stars === 3 ? 'Perfect run!' : p.stars === 2 ? 'Well done!' : 'Stage cleared!') + '</h2>'
      : '<div class="bigstars sad">💫</div><h2 class="rtitle">' + esc(p.title) + ' got you this time</h2>' +
        '<p class="rsub">Your hearts ran out — but every try makes the next one easier.</p>';

    return '<section class="panel result">' + head +
      '<div class="rstats">' +
      '<div class="rs"><b>' + p.right + '</b><i>right</i></div>' +
      '<div class="rs"><b>' + p.wrong + '</b><i>missed</i></div>' +
      '<div class="rs"><b>' + p.best + '</b><i>best streak</i></div>' +
      '<div class="rs gold"><b>+' + p.xp + '</b><i>XP</i></div>' +
      '<div class="rs teal"><b>+' + p.dust + '</b><i>stardust' + (p.doubled ? ' (×2)' : '') + '</i></div>' +
      '</div>' +
      (p.ups ? '<div class="levelup">🎉 Level ' + S.level + ' — you are now a ' + A.titleFor(S.level) + '!</div>' : '') +
      grewHtml + beastHtml + badgeHtml +
      '<div class="ractions">' + nextBtn +
      '<button class="go ghost" data-play="' + p.region + ':' + (p.isBoss ? 'boss' : p.idx) + '">Play again</button>' +
      '<button class="go ghost" data-nav="region" data-rid="' + p.region + '">Back to ' + esc(r.name) + '</button>' +
      '</div></section>';
  }

  function screenDrillResult(p) {
    var left = St.trickyList().length;
    return '<section class="panel result">' +
      '<div class="bigstars">🧠</div><h2 class="rtitle">' +
      (p.wrong === 0 ? 'Every tricky fact beaten!' : 'Drill done') + '</h2>' +
      '<p class="rsub">' + (left ? left + ' fact' + (left === 1 ? '' : 's') + ' still on the list.' : 'Your tricky list is empty. That is the whole point.') + '</p>' +
      '<div class="rstats">' +
      '<div class="rs"><b>' + p.right + '</b><i>right</i></div>' +
      '<div class="rs"><b>' + p.wrong + '</b><i>missed</i></div>' +
      '<div class="rs gold"><b>+' + p.xp + '</b><i>XP</i></div>' +
      '<div class="rs teal"><b>+' + p.dust + '</b><i>stardust</i></div></div>' +
      '<div class="ractions">' +
      (left ? '<button class="go" data-tricky="1">Drill ' + Math.min(10, left) + ' more</button>' : '') +
      '<button class="go ghost" data-nav="map">Back to the sky map</button></div></section>';
  }

  /* ======================= Star Blitz ======================= */
  var blitz = null;
  function startBlitz() {
    blitz = { q: null, score: 0, miss: 0, left: 60, combo: 0, locked: false, typed: '' };
    blitz.q = blitzQ();
    St.track('blitz', 1);
    startClock();
    go('blitz');
    blitz.timer = setInterval(function () {
      if (!blitz) return;
      blitz.left--;
      var t = $('#bzTime');
      if (t) { t.textContent = blitz.left; if (blitz.left <= 10) { t.classList.add('urgent'); FX.Sound.tick(); } }
      var bar = $('#bzBar');
      if (bar) bar.style.width = (blitz.left / 60 * 100) + '%';
      if (blitz.left <= 0) endBlitz();
    }, 1000);
  }
  function blitzQ() {
    var g = ['factLow', 'factHigh', 'divFact', 'factHigh', 'divFact'][Math.floor(Math.random() * 5)];
    return Q.make(g);
  }
  function endBlitz() {
    if (!blitz) return;
    clearInterval(blitz.timer);
    stopClock();
    var score = blitz.score, fresh = score > S.blitzBest;
    var won = [], n = Math.floor(score / 5);
    for (var w = 0; w < n; w++) {
      var t2 = W.Toys.draw();
      var isNew2 = St.winToy(t2.id);
      if (isNew2) St.addDust(5);
      won.push({ toy: t2, isNew: isNew2 });
    }
    if (fresh) { S.blitzBest = score; St.save(); }
    St.addXp(Math.round(score * 2));
    St.addDust(score * 2);
    var badges = St.checkBadges({});
    if (score >= 15) { FX.Sound.star(); if (burst) burst.fire(80); }
    var miss = blitz.miss;
    blitz = null;
    view.innerHTML = '<section class="panel result">' +
      '<div class="bigstars">⚡</div><h2 class="rtitle">' + (fresh ? 'New best score!' : 'Blitz over!') + '</h2>' +
      '<div class="rstats"><div class="rs"><b>' + score + '</b><i>correct</i></div>' +
      '<div class="rs"><b>' + miss + '</b><i>missed</i></div>' +
      '<div class="rs gold"><b>' + S.blitzBest + '</b><i>your best</i></div>' +
      '<div class="rs teal"><b>+' + score * 2 + '</b><i>stardust</i></div></div>' +
      (won.length
        ? '<div class="blitztoys"><span class="fxlabel">Presents won — one for every 5 correct</span><div class="btrow">' +
          won.map(function (o) {
            return '<span class="bt r-' + o.toy.r + '" title="' + esc(o.toy.name) + '">' + o.toy.g +
              (o.isNew ? '<i>NEW</i>' : '') + '</span>';
          }).join('') + '</div></div>'
        : '<p class="lead" style="text-align:center">Get 5 correct in one blitz to win a present.</p>') +
      (badges.length ? '<div class="newbadges">' + badges.map(function (b) {
        return '<div class="nb"><span>' + b.glyph + '</span><b>' + esc(b.name) + '</b><i>' + esc(b.desc) + '</i></div>';
      }).join('') + '</div>' : '') +
      '<div class="ractions"><button class="go" data-blitz="1">Go again ⚡</button>' +
      '<button class="go ghost" data-nav="map">Sky map</button></div></section>';
    hud();
  }

  function screenBlitz() {
    if (!blitz) {
      return '<section class="panel"><h2 class="ph">⚡ Star Blitz <span class="phsub">60 seconds of × and ÷ facts</span></h2>' +
        '<p class="lead">How many can you light up before the time runs out? Wrong answers cost nothing but seconds — just keep going.</p>' +
        '<div class="rstats"><div class="rs gold"><b>' + S.blitzBest + '</b><i>your best</i></div>' +
        '<div class="rs"><b>' + S.bestCombo + '</b><i>longest streak ever</i></div></div>' +
        '<button class="go big" data-blitz="1">Start the 60 seconds</button></section>';
    }
    var q = blitz.q;
    return '<section class="panel play">' +
      '<div class="bzhead"><span class="bzlabel">Star Blitz</span>' +
      '<span class="bzscore">' + blitz.score + '</span>' +
      '<span class="bztime" id="bzTime">' + blitz.left + '</span></div>' +
      '<div class="pbar bz"><i id="bzBar" style="width:' + (blitz.left / 60 * 100) + '%"></i></div>' +
      '<div class="qcard blitzq"><div class="prompt">' + q.prompt + '</div></div>' +
      choiceGrid(q) +
      '<button class="back small center" data-nav="stopblitz">Stop early</button></section>';
  }

  function blitzAnswer(i) {
    if (!blitz || blitz.locked) return;
    var q = blitz.q, right = String(q.choices[i].v) === String(q.answer);
    St.record(q, right, null);
    notePractice();
    St.track('answers', 1);
    if (right) {
      blitz.score++; blitz.combo++;
      if (blitz.combo > S.bestCombo) { S.bestCombo = blitz.combo; St.save(); }
      St.track('combo', blitz.combo);
      FX.Sound.right(blitz.combo);
    } else {
      blitz.miss++; blitz.combo = 0; blitz.left = Math.max(1, blitz.left - 3);
      FX.Sound.wrong();
    }
    var btn = D.querySelector('[data-pick="' + i + '"]');
    if (btn) btn.classList.add(right ? 'yes' : 'no');
    blitz.locked = true;
    setTimeout(function () {
      if (!blitz) return;
      blitz.locked = false; blitz.q = blitzQ(); render();
    }, right ? 160 : 520);
  }

  /* ======================= Tricky Facts ======================= */
  function screenTricky() {
    var list = St.trickyList();
    if (!list.length) {
      return '<section class="panel"><h2 class="ph">🧠 Tricky Facts <span class="phsub">the ones worth another look</span></h2>' +
        '<p class="lead">Nothing tricky right now. Every fact you have missed has been fixed — play a few stages and this list will fill itself with exactly the facts you need.</p>' +
        '<button class="go" data-nav="map">Back to the sky map</button></section>';
    }
    var chips = list.slice(0, 24).map(function (f) {
      return '<span class="tchip" title="missed ' + f.w + ' time' + (f.w === 1 ? '' : 's') + '">' + esc(prettyFact(f.id)) + '<b>×' + f.w + '</b></span>';
    }).join('');
    return '<section class="panel"><h2 class="ph">🧠 Tricky Facts <span class="phsub">' + list.length + ' to tame</span></h2>' +
      '<p class="lead">These are the exact facts you have missed. Get one right and it leaves the list.</p>' +
      '<div class="tchips">' + chips + '</div>' +
      '<button class="go big" data-tricky="1">Drill ' + Math.min(10, list.length) + ' of them</button></section>';
  }

  function prettyFact(id) {
    var m;
    if ((m = /^mul:(\d+)x(\d+)$/.exec(id))) return m[1] + ' × ' + m[2];
    if ((m = /^div:(\d+)\/(\d+)$/.exec(id))) return m[1] + ' ÷ ' + m[2];
    if ((m = /^add:(\d+)\+(\d+)$/.exec(id))) return m[1] + ' + ' + m[2];
    if ((m = /^sub:(\d+)-(\d+)$/.exec(id))) return m[1] + ' − ' + m[2];
    return id;
  }

  function startTricky() {
    var list = St.trickyList().slice(0, 10), qs = [];
    for (var i = 0; i < list.length; i++) {
      var q = Q.fromId(list[i].id);
      if (q) qs.push(q);
    }
    if (!qs.length) { go('tricky'); return; }
    St.track('tricky', qs.length);
    run = {
      region: { id: 'tricky', glyph: '🧠', beast: null, stages: [], boss: null },
      idx: 'tricky', isBoss: false, title: 'Tricky Facts drill',
      queue: qs, gens: ['factLow'], i: 0, total: qs.length,
      right: 0, wrong: 0, combo: 0, best: 0, hearts: 3, retries: 3,
      dust: 0, xp: 0, locked: false, typed: '', usedHint: false, doubled: false,
      drill: true
    };
    startClock();
    go('play');
  }

  /* ======================= Nova ======================= */
  function screenCub() {
    var stars = St.totalStars(), form = W.Cub.formFor(stars), next = W.Cub.nextForm(stars);
    var pct = next ? Math.round((stars - form.stars) / (next.stars - form.stars) * 100) : 100;
    var fed = !St.canFeed(), canPay = S.dust >= 15;

    var stages = W.Cub.FORMS.map(function (f) {
      var got = stars >= f.stars;
      return '<div class="cstage' + (got ? ' on' : '') + (f.id === form.id ? ' here' : '') + '">' +
        '<span class="cdot"></span><b>' + esc(f.name) + '</b>' +
        '<i>' + (f.stars === 0 ? 'the beginning' : f.stars + ' stars') + '</i></div>';
    }).join('');

    return '<section class="panel cubpanel">' +
      '<h2 class="ph">🌟 Nova <span class="phsub">' + esc(form.name) + ' · bond level ' + (S.cub.bond || 0) + '</span></h2>' +
      '<div class="cubstage">' + W.Cub.svg(stars, 'idle', 'big') + '</div>' +
      '<p class="cubblurb">' + esc(form.blurb) + '</p>' +
      (next
        ? '<div class="cubnext"><div class="cnhead"><span>Next form: <b>' + esc(next.name) + '</b></span>' +
          '<span class="cnnum">' + stars + ' / ' + next.stars + ' ⭐</span></div>' +
          '<div class="qbar big"><i style="width:' + pct + '%"></i></div>' +
          '<p>Nova grows when you earn stars, so every stage you play well changes how they look.</p></div>'
        : '<div class="cubnext maxed"><b>Nova has reached their Celestial form.</b>' +
          '<p>There is nothing left to grow into — only more sky to explore together.</p></div>') +
      '<div class="cstages">' + stages + '</div>' +
      '<button class="go' + (fed || !canPay ? ' ghost' : '') + '" data-feed="1"' + (fed || !canPay ? ' disabled' : '') + '>' +
      (fed ? 'Nova has eaten today — come back tomorrow 🌙'
           : canPay ? 'Feed Nova some stardust (15 ✨)' : 'You need 15 stardust to feed Nova') +
      '</button>' +
      '</section>';
  }

  /* ======================= Toy Box ======================= */
  function screenToys() {
    var T = W.Toys, total = T.list.length, got = St.toyCount(), opened = St.toyTotal();
    var cards = T.list.map(function (t) {
      var n = S.toys[t.id] || 0;
      if (!n) {
        return '<div class="tcard locked r-' + t.r + '"><div class="tglyph">🎁</div>' +
          '<b>? ? ?</b><i>' + T.rarity[t.r].label + '</i></div>';
      }
      return '<div class="tcard r-' + t.r + '"><div class="tglyph a-' + t.anim + '">' + t.g + '</div>' +
        '<b>' + esc(t.name) + '</b><i>' + T.rarity[t.r].label + '</i>' +
        '<span class="tcount">×' + n + '</span></div>';
    }).join('');
    return '<section class="panel"><h2 class="ph">🎁 Toy Box <span class="phsub">' +
      got + ' of ' + total + ' toys found · ' + opened + ' present' + (opened === 1 ? '' : 's') + ' opened</span></h2>' +
      '<p class="lead">Every question you get right unwraps a present, and no two in a row are the same. ' +
      'The rare and legendary toys turn up less often — a brand new one pays 5 extra stardust.</p>' +
      '<div class="tgrid">' + cards + '</div></section>';
  }

  /* ======================= Star Beasts ======================= */
  function constellation(id, bright) {
    var b = A.BEASTS[id], lines = '', dots = '';
    b.edges.forEach(function (e, i) {
      var p = b.pts[e[0]], q2 = b.pts[e[1]];
      var len = Math.ceil(Math.sqrt(Math.pow(q2[0] - p[0], 2) + Math.pow(q2[1] - p[1], 2)));
      lines += '<line x1="' + p[0] + '" y1="' + p[1] + '" x2="' + q2[0] + '" y2="' + q2[1] +
        '" style="--i:' + i + ';--len:' + len + '" stroke-dasharray="' + len + '" stroke-dashoffset="' + len + '"/>';
    });
    b.pts.forEach(function (p, i) {
      dots += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + (i === 0 ? 2.8 : 2) + '" style="--i:' + i + '"/>';
    });
    return '<div class="cons' + (bright ? ' bright' : '') + '"><svg viewBox="0 0 100 72" aria-hidden="true">' +
      '<g class="clines">' + lines + '</g><g class="cdots">' + dots + '</g></svg></div>';
  }

  function screenBeasts() {
    var cards = A.REGIONS.map(function (r) {
      var b = A.BEASTS[r.beast], has = !!S.beasts[r.beast];
      if (!has) {
        return '<div class="bcard locked"><div class="cons dim"><svg viewBox="0 0 100 72" aria-hidden="true">' +
          '<g class="cdots">' + b.pts.map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="1.4"/>'; }).join('') + '</g></svg></div>' +
          '<h3>? ? ?</h3><p>Beat ' + esc(r.boss.name) + ' in ' + esc(r.name) + ' to light this constellation.</p></div>';
      }
      return '<div class="bcard">' + constellation(r.beast) +
        '<h3>' + b.glyph + ' ' + esc(b.name) + '</h3><p>' + esc(b.note) + '</p></div>';
    }).join('');

    var badges = A.BADGES.map(function (b) {
      var has = !!S.badges[b.id];
      return '<div class="badge' + (has ? '' : ' off') + '"><span>' + (has ? b.glyph : '🔘') + '</span>' +
        '<b>' + esc(b.name) + '</b><i>' + esc(b.desc) + '</i></div>';
    }).join('');

    var count = 0;
    for (var k in S.beasts) if (S.beasts[k]) count++;

    return '<section class="panel"><h2 class="ph">🦊 Star Beasts <span class="phsub">' + count + ' of 8 constellations lit</span></h2>' +
      '<div class="bgrid">' + cards + '</div></section>' +
      '<section class="panel"><h2 class="ph">🏅 Badges</h2><div class="badges">' + badges + '</div></section>';
  }

  /* ======================= Shop ======================= */
  function screenShop() {
    function card(it) {
      var owned = it.kind === 'look' && S.owned[it.id];
      var equipped = S.look === it.id;
      var can = S.dust >= it.cost;
      var btn;
      if (owned) btn = '<button class="buy' + (equipped ? ' on' : '') + '" data-equip="' + it.id + '">' + (equipped ? 'Wearing it' : 'Wear it') + '</button>';
      else btn = '<button class="buy' + (can ? '' : ' no') + '" data-buy="' + it.id + '"' + (can ? '' : ' disabled') + '>✨ ' + it.cost + '</button>';
      return '<div class="icard' + (owned ? ' owned' : '') + '"><div class="iglyph">' + it.glyph + '</div>' +
        '<b>' + esc(it.name) + '</b>' +
        (it.kind === 'power' ? '<span class="have">you have ' + (S.powers[it.id] || 0) + '</span>' : '') +
        '<i>' + esc(it.desc) + '</i>' + btn + '</div>';
    }
    var powers = A.SHOP.filter(function (i) { return i.kind === 'power'; }).map(card).join('');
    var looks = A.SHOP.filter(function (i) { return i.kind === 'look'; }).map(card).join('');
    return '<section class="panel"><h2 class="ph">✨ Stardust Shop <span class="phsub">you have ' + S.dust + ' stardust</span></h2>' +
      '<h3 class="sub">Helpers — use them in any stage</h3><div class="igrid">' + powers + '</div>' +
      '<h3 class="sub">Looks — change your Star Keeper</h3><div class="igrid">' + looks + '</div>' +
      (S.look ? '<button class="go ghost" data-equip="none">Back to the plain telescope 🔭</button>' : '') +
      '</section>';
  }

  /* ======================= Grown-ups ======================= */
  function screenGrown() {
    var rows = A.REGIONS.map(function (r) {
      var t = S.topics[r.id] || { c: 0, w: 0 }, n = t.c + t.w;
      var pct = n ? Math.round(t.c / n * 100) : null;
      var tone = pct === null ? 'none' : pct >= 85 ? 'good' : pct >= 65 ? 'ok' : 'low';
      return '<tr><td>' + r.glyph + ' ' + esc(r.name) + '</td>' +
        '<td class="num">' + n + '</td>' +
        '<td class="num">' + (pct === null ? '—' : pct + '%') + '</td>' +
        '<td><span class="acc ' + tone + '">' + (pct === null ? 'not started' : pct >= 85 ? 'solid' : pct >= 65 ? 'getting there' : 'needs practice') + '</span></td></tr>';
    }).join('');
    var tricky = St.trickyList().slice(0, 12);
    var tlist = tricky.length
      ? tricky.map(function (f) { return '<span class="tchip">' + esc(prettyFact(f.id)) + '<b>×' + f.w + '</b></span>'; }).join('')
      : '<p class="lead">No facts outstanding.</p>';

    return '<section class="panel"><h2 class="ph">👪 For grown-ups <span class="phsub">what Isha has been practising</span></h2>' +
      '<div class="rstats"><div class="rs"><b>' + S.answered + '</b><i>questions answered</i></div>' +
      '<div class="rs"><b>' + S.minutes + '</b><i>minutes of practice</i></div>' +
      '<div class="rs gold"><b>' + S.streak + '</b><i>day streak</i></div>' +
      '<div class="rs teal"><b>' + St.totalStars() + '</b><i>stars earned</i></div></div>' +
      '<div class="tablewrap"><table class="stats"><thead><tr><th>Region</th><th class="num">Qs</th><th class="num">Correct</th><th>Standing</th></tr></thead>' +
      '<tbody>' + rows + '</tbody></table></div>' +
      '<h3 class="sub">Facts still being missed</h3><div class="tchips">' + tlist + '</div>' +
      '<h3 class="sub">Curriculum</h3><p class="lead">The eight regions follow the US grade 3 standards: multiplication and division within 100, place value and rounding, addition and subtraction within 1,000, fractions as parts and on a number line, area and perimeter, time to the minute, mass and volume, picture and bar graphs, and two-step word problems with patterns.</p>' +
      '<button class="go ghost danger" data-reset="1">Erase all progress</button>' +
      '</section>';
  }

  /* ======================= events ======================= */
  D.addEventListener('click', function (ev) {
    var t = ev.target.closest('button, [data-claim]');
    if (!t) return;

    if (t.dataset.nav) {
      var n = t.dataset.nav;
      FX.Sound.tap();
      if (n === 'stopblitz') return endBlitz();
      abandon();
      if (n === 'quit') return go('map');
      if (n === 'region') return go('region', { id: t.dataset.rid });
      return go(n);
    }
    if (t.dataset.region) { FX.Sound.tap(); return go('region', { id: t.dataset.region }); }
    if (t.dataset.play) { FX.Sound.tap(); return startRun(t.dataset.play); }
    if (t.dataset.blitz) { FX.Sound.tap(); return startBlitz(); }
    if (t.dataset.tricky) { FX.Sound.tap(); return startTricky(); }
    if (t.dataset.next) {
      if (t.dataset.relight && run && !run.relit) { run.relit = true; St.addDust(2); FX.Sound.star(); }
      return advance();
    }

    if (t.dataset.pick !== undefined) {
      if (blitz) return blitzAnswer(+t.dataset.pick);
      if (run) return answer(cur().choices[+t.dataset.pick].v);
      return;
    }

    if (t.dataset.key) return keyPress(t.dataset.key);

    if (t.dataset.power) {
      var p = t.dataset.power;
      if (p === 'hint' && run && S.powers.hint > 0) {
        S.powers.hint--; run.usedHint = true; St.save();
        var q = cur(), killed = 0;
        D.querySelectorAll('.choice').forEach(function (b) {
          var c = q.choices[+b.dataset.pick];
          if (killed < 1 && String(c.v) !== String(q.answer)) { b.classList.add('out'); b.disabled = true; killed++; }
        });
        FX.Sound.tap(); hud();
        return;
      }
      if (p === 'skip' && run && S.powers.skip > 0) {
        S.powers.skip--; St.save(); FX.Sound.tap();
        run.i++;
        if (run.i >= run.queue.length) return finishRun(true);
        return render();
      }
      return;
    }

    if (t.dataset.buy) {
      var it = A.shopItem(t.dataset.buy);
      if (!St.spend(it.cost)) return;
      if (it.kind === 'power') S.powers[it.id] = (S.powers[it.id] || 0) + 1;
      else { S.owned[it.id] = true; S.look = it.id; }
      St.save(); FX.Sound.star(); if (burst) burst.fire(40, 140);
      return render();
    }
    if (t.dataset.equip) {
      S.look = t.dataset.equip === 'none' ? null : t.dataset.equip;
      St.save(); FX.Sound.tap();
      return render();
    }
    if (t.dataset.claim) {
      var got = St.claim(t.dataset.claim);
      if (got) { FX.Sound.star(); if (burst) burst.fire(45, 140); }
      return render();
    }
    if (t.dataset.wbgo) { FX.Sound.tap(); return closeWelcome(true); }
    if (t.dataset.feed) {
      if (!St.feed()) return;
      FX.Sound.gift(false);
      setCubMood('happy', 2600);
      if (burst) burst.fire(34, W.innerHeight * 0.4);
      toast('Nova munched the stardust happily. Bond level ' + S.cub.bond + '.');
      return render();
    }
    if (t.dataset.weekclaim) {
      if (!S.week || S.week.claimed || St.weekCount() < 5) return;
      S.week.claimed = true;
      var toy = W.Toys.drawRarity('legend');
      var fresh = St.winToy(toy.id);
      if (fresh) St.addDust(5);
      St.save();
      FX.Sound.gift(fresh);
      W.Toys.reveal(toy, fresh);
      return render();
    }
    if (t.dataset.reset) {
      if (W.confirm('Erase every star, beast and badge and start the atlas over?')) { St.reset(); go('map'); }
      return;
    }
    if (t.id === 'soundBtn') {
      S.sound = !S.sound; FX.Sound.set(S.sound); St.save();
      if (S.sound) FX.Sound.tap();
      return hud();
    }
  });

  function keyPress(k) {
    if (!run || run.locked) return;
    if (k === 'enter') { if (run.typed !== '') answer(run.typed); return; }
    if (k === 'del') run.typed = run.typed.slice(0, -1);
    else if (k === 'clr') run.typed = '';
    else if (run.typed.length < 5) run.typed += k;
    FX.Sound.tap();
    var d = $('#kpd');
    if (d) d.innerHTML = run.typed || '<i>type your answer</i>';
  }

  D.addEventListener('keydown', function (ev) {
    if (route.name === 'play' && run && !cur().choices) {
      if (/^[0-9]$/.test(ev.key)) { keyPress(ev.key); ev.preventDefault(); }
      else if (ev.key === 'Backspace') { keyPress('del'); ev.preventDefault(); }
      else if (ev.key === 'Enter') { keyPress('enter'); ev.preventDefault(); }
    } else if (route.name === 'play' && run && run.locked && ev.key === 'Enter') {
      advance(); ev.preventDefault();
    } else if ((route.name === 'play' || route.name === 'blitz') && /^[1-4]$/.test(ev.key)) {
      var b = D.querySelector('[data-pick="' + (+ev.key - 1) + '"]');
      if (b && !b.disabled) b.click();
    }
  });

  /* ======================= coming back ======================= */
  /* Shown once on the first open of a new day: Nova wakes up, the week so far,
     and a sky gift to open. */
  function welcomeBack() {
    if (!St.isFreshDay() || !S.lastDay) return false;
    St.clearFreshDay();

    var stars = St.totalStars(), form = W.Cub.formFor(stars);
    var dots = St.weekDays().map(function (d, i) {
      return '<div class="wd' + (d.done ? ' on' : '') + (d.today ? ' now' : '') + '" style="--i:' + i + '">' +
        '<span class="wdot">' + (d.done ? '★' : '') + '</span><i>' + d.label + '</i></div>';
    }).join('');

    var el = D.createElement('div');
    el.className = 'wbwrap';
    el.innerHTML = '<div class="wbcard">' +
      '<div class="wbcub" id="wbCub">' + W.Cub.svg(stars, 'sleep', 'mid') + '</div>' +
      '<h2 class="wbtitle">Welcome back, ' + esc(S.name) + '</h2>' +
      '<p class="wbsub" id="wbSub">Nova has been asleep in the ' + esc(form.name.toLowerCase()) + ' nest…</p>' +
      '<div class="wrow small">' + dots + '</div>' +
      '<div class="wbstats">' +
        '<span><b>' + S.streak + '</b> day streak</span>' +
        '<span><b>' + stars + '</b> stars</span>' +
        '<span><b>' + St.toyCount() + '</b> toys</span>' +
      '</div>' +
      '<button class="go" data-wbgo="1">Open tonight\'s sky gift 🎁</button>' +
      '</div>';
    D.body.appendChild(el);

    // Nova stirs, then wakes up pleased to see her.
    setTimeout(function () {
      var c = $('#wbCub'), sub = $('#wbSub');
      if (c) c.innerHTML = W.Cub.svg(stars, 'happy', 'mid');
      if (sub) sub.textContent = 'Nova woke up the moment you arrived.';
      FX.Sound.star();
    }, 1100);
    return true;
  }

  function closeWelcome(gift) {
    var el = D.querySelector('.wbwrap');
    if (el) { el.classList.add('out'); setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 350); }
    if (!gift) return;
    // Three nights in makes the sky gift a rare one.
    var toy = St.weekCount() >= 3 ? W.Toys.drawRarity(St.weekCount() >= 5 ? 'legend' : 'rare') : W.Toys.draw();
    var fresh = St.winToy(toy.id);
    if (fresh) St.addDust(5);
    St.addDust(10);
    St.save();
    setTimeout(function () { FX.Sound.gift(fresh); W.Toys.reveal(toy, fresh); hud(); }, 380);
  }

  /* ======================= boot ======================= */
  function boot() {
    new FX.Sky(D.getElementById('sky'));
    burst = new FX.Burst(D.getElementById('fx'));
    if (W.Toys) W.Toys.init(burst);
    render();
    welcomeBack();
  }

  if (W.claude && W.claude.hot) {
    W.claude.hot.snapshot(function () { return { view: route.name, rid: route.p && route.p.id }; });
    if (W.claude.hot.ready) {
      W.claude.hot.ready(function (data) {
        boot();
        if (data && data.view && data.view !== 'play' && data.view !== 'result' && data.view !== 'blitz') {
          go(data.view, { id: data.rid });
        }
      });
    } else boot();
  } else boot();
})(window, document);
