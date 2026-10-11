/* Isha's Star Atlas — question generators and the SVG visuals that go with them.
   Every generator returns:
     { prompt, eyebrow, visual?, answer, choices?, explain, id? , unit? }
   Choices are {v, html}. No choices means the answer is typed on the keypad.
   `id` marks a drillable fact so weak ones can come back in Tricky Facts. */
(function (W) {
  'use strict';

  /* ================= helpers ================= */
  function ri(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function commas(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

  /* Build four choices: the answer plus three distinct wrong ones. */
  function mc(answer, wrongs, fmt) {
    fmt = fmt || function (v) { return esc(v); };
    var seen = {}, out = [{ v: answer, html: fmt(answer) }];
    seen[String(answer)] = 1;
    for (var i = 0; i < wrongs.length && out.length < 4; i++) {
      var w = wrongs[i], why = null;
      // A wrong answer may arrive as [value, "why this is tempting but wrong"].
      if (Object.prototype.toString.call(w) === '[object Array]') { why = w[1]; w = w[0]; }
      if (w === null || w === undefined || seen[String(w)]) continue;
      if (typeof w === 'number' && (w < 0 || !isFinite(w))) continue;
      seen[String(w)] = 1;
      out.push({ v: w, html: fmt(w), why: why });
    }
    // Pad with near misses if the list ran short.
    var pad = 1;
    while (out.length < 4 && typeof answer === 'number') {
      var c = answer + pad * (pad % 2 ? 1 : -1) * ri(1, 3);
      pad++;
      if (c < 0 || seen[String(c)]) continue;
      seen[String(c)] = 1;
      out.push({ v: c, html: fmt(c) });
    }
    return shuffle(out);
  }

  function frac(n, d) {
    return '<span class="frac"><span class="fn">' + n + '</span><span class="fb"></span><span class="fd">' + d + '</span></span>';
  }
  function fracStr(n, d) { return n + '/' + d; }

  function timeStr(h, m) { return h + ':' + (m < 10 ? '0' + m : m); }
  function durStr(mins) {
    var h = Math.floor(mins / 60), m = mins % 60;
    if (h === 0) return m + ' minutes';
    if (m === 0) return h + (h === 1 ? ' hour' : ' hours');
    return h + (h === 1 ? ' hour ' : ' hours ') + m + ' minutes';
  }

  var NAMES = ['Isha', 'Maya', 'Leo', 'Priya', 'Noah', 'Zara', 'Arjun', 'Mia', 'Kai', 'Ana'];
  var THINGS = [
    ['stickers', '🌟'], ['shells', '🐚'], ['marbles', '🔵'], ['crayons', '🖍️'],
    ['cookies', '🍪'], ['beads', '📿'], ['acorns', '🌰'], ['books', '📚'], ['pencils', '✏️']
  ];
  var CONTAINERS = [['boxes', 'box'], ['bags', 'bag'], ['jars', 'jar'], ['baskets', 'basket'], ['shelves', 'shelf'], ['packs', 'pack']];

  /* ================= SVG visuals ================= */
  function svg(w, h, body, cls) {
    return '<div class="vis" style="max-width:' + w + 'px"><svg viewBox="0 0 ' + w + ' ' + h +
      '" class="sv ' + (cls || '') + '" role="img" aria-hidden="true" preserveAspectRatio="xMidYMid meet">' +
      body + '</svg></div>';
  }

  function vArray(rows, cols) {
    var gap = 22, pad = 16, r = 7, b = '';
    var w = pad * 2 + (cols - 1) * gap, h = pad * 2 + (rows - 1) * gap;
    for (var y = 0; y < rows; y++) for (var x = 0; x < cols; x++) {
      b += '<circle class="sv-dot" cx="' + (pad + x * gap) + '" cy="' + (pad + y * gap) + '" r="' + r + '"/>';
    }
    return svg(w, h, b);
  }

  function vGroups(groups, per) {
    var cw = 74, ch = 74, gap = 10, cols = Math.min(groups, 4);
    var rows = Math.ceil(groups / cols);
    var w = cols * cw + (cols - 1) * gap, h = rows * ch + (rows - 1) * gap, b = '';
    for (var g = 0; g < groups; g++) {
      var gx = (g % cols) * (cw + gap), gy = Math.floor(g / cols) * (ch + gap);
      b += '<rect class="sv-ring" x="' + (gx + 2) + '" y="' + (gy + 2) + '" width="' + (cw - 4) + '" height="' + (ch - 4) + '" rx="18"/>';
      var c = Math.min(3, per), rws = Math.ceil(per / c);
      for (var i = 0; i < per; i++) {
        var col = i % c, row = Math.floor(i / c);
        var cx = gx + cw / 2 + (col - (Math.min(c, per - row * c) - 1) / 2) * 20;
        var cy = gy + ch / 2 + (row - (rws - 1) / 2) * 20;
        b += '<circle class="sv-dot" cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="6.5"/>';
      }
    }
    return svg(w, h, b);
  }

  function vFracBar(parts, shaded, label) {
    var w = 300, bh = 46, b = '', pw = w / parts;
    for (var i = 0; i < parts; i++) {
      b += '<rect class="' + (i < shaded ? 'sv-on' : 'sv-off') + '" x="' + (i * pw + 1) + '" y="1" width="' + (pw - 2) + '" height="' + (bh - 2) + '" rx="4"/>';
    }
    b += '<rect class="sv-ring" x="0.5" y="0.5" width="' + (w - 1) + '" height="' + (bh - 1) + '" rx="6"/>';
    var h = bh;
    if (label) { b += '<text class="sv-txt" x="' + (w / 2) + '" y="' + (bh + 18) + '" text-anchor="middle">' + esc(label) + '</text>'; h = bh + 24; }
    return svg(w, h, b);
  }

  function vFracBars(list) {
    var w = 300, bh = 42, gap = 30, b = '';
    for (var k = 0; k < list.length; k++) {
      var o = list[k], y = k * (bh + gap), pw = w / o.parts;
      for (var i = 0; i < o.parts; i++) {
        b += '<rect class="' + (i < o.shaded ? 'sv-on' : 'sv-off') + '" x="' + (i * pw + 1) + '" y="' + (y + 1) + '" width="' + (pw - 2) + '" height="' + (bh - 2) + '" rx="4"/>';
      }
      b += '<rect class="sv-ring" x="0.5" y="' + (y + 0.5) + '" width="' + (w - 1) + '" height="' + (bh - 1) + '" rx="6"/>';
      b += '<text class="sv-txt" x="' + (w / 2) + '" y="' + (y + bh + 19) + '" text-anchor="middle">' + esc(o.label) + '</text>';
    }
    return svg(w, list.length * (bh + gap) - 6, b);
  }

  function vNumLine(parts, mark) {
    var w = 300, y = 34, b = '', pad = 14, span = w - pad * 2;
    b += '<line class="sv-line" x1="' + pad + '" y1="' + y + '" x2="' + (w - pad) + '" y2="' + y + '"/>';
    for (var i = 0; i <= parts; i++) {
      var x = pad + span * i / parts, big = (i === 0 || i === parts);
      b += '<line class="sv-line" x1="' + x.toFixed(1) + '" y1="' + (y - (big ? 11 : 7)) + '" x2="' + x.toFixed(1) + '" y2="' + (y + (big ? 11 : 7)) + '"/>';
      if (big) b += '<text class="sv-txt" x="' + x.toFixed(1) + '" y="' + (y + 30) + '" text-anchor="middle">' + (i === 0 ? '0' : '1') + '</text>';
    }
    var mx = pad + span * mark / parts;
    b += '<polygon class="sv-mark" points="' + mx.toFixed(1) + ',' + (y - 4) + ' ' + (mx - 8).toFixed(1) + ',' + (y - 22) + ' ' + (mx + 8).toFixed(1) + ',' + (y - 22) + '"/>';
    b += '<text class="sv-mtxt" x="' + mx.toFixed(1) + '" y="' + (y - 27) + '" text-anchor="middle">?</text>';
    return svg(w, 70, b);
  }

  function vGrid(rows, cols) {
    var u = Math.min(26, Math.floor(260 / cols)), b = '';
    for (var y = 0; y < rows; y++) for (var x = 0; x < cols; x++) {
      b += '<rect class="sv-on" x="' + (x * u + 1) + '" y="' + (y * u + 1) + '" width="' + (u - 2) + '" height="' + (u - 2) + '" rx="2"/>';
    }
    return svg(cols * u, rows * u, b);
  }

  function vRect(a, bside, unit) {
    var scale = Math.min(26, Math.floor(230 / Math.max(a, bside)));
    var w = a * scale, h = bside * scale, pad = 34;
    var body = '<rect class="sv-face" x="' + pad + '" y="16" width="' + w + '" height="' + h + '" rx="6"/>' +
      '<text class="sv-txt" x="' + (pad + w / 2) + '" y="10" text-anchor="middle">' + a + ' ' + unit + '</text>' +
      '<text class="sv-txt" x="' + (pad - 8) + '" y="' + (16 + h / 2 + 4) + '" text-anchor="end">' + bside + ' ' + unit + '</text>';
    return svg(pad + w + 12, h + 26, body);
  }

  function vClock(h, m) {
    var c = 76, R = 70, b = '';
    b += '<circle class="sv-face" cx="' + c + '" cy="' + c + '" r="' + R + '"/>';
    b += '<circle class="sv-ring" cx="' + c + '" cy="' + c + '" r="' + R + '"/>';
    for (var i = 0; i < 60; i++) {
      var a = i * 6 * Math.PI / 180, big = i % 5 === 0, L = big ? 11 : 5;
      b += '<line class="' + (big ? 'sv-line' : 'sv-tick') + '" x1="' + (c + (R - 3) * Math.sin(a)).toFixed(1) + '" y1="' + (c - (R - 3) * Math.cos(a)).toFixed(1) +
        '" x2="' + (c + (R - 3 - L) * Math.sin(a)).toFixed(1) + '" y2="' + (c - (R - 3 - L) * Math.cos(a)).toFixed(1) + '"/>';
    }
    for (var n = 1; n <= 12; n++) {
      var an = n * 30 * Math.PI / 180, rr = R - 26;
      b += '<text class="sv-num" x="' + (c + rr * Math.sin(an)).toFixed(1) + '" y="' + (c - rr * Math.cos(an) + 6).toFixed(1) + '" text-anchor="middle">' + n + '</text>';
    }
    var ha = ((h % 12) * 30 + m * 0.5) * Math.PI / 180, ma = m * 6 * Math.PI / 180;
    b += '<line class="sv-hour" x1="' + c + '" y1="' + c + '" x2="' + (c + 33 * Math.sin(ha)).toFixed(1) + '" y2="' + (c - 33 * Math.cos(ha)).toFixed(1) + '"/>';
    b += '<line class="sv-min" x1="' + c + '" y1="' + c + '" x2="' + (c + 50 * Math.sin(ma)).toFixed(1) + '" y2="' + (c - 50 * Math.cos(ma)).toFixed(1) + '"/>';
    b += '<circle class="sv-pin" cx="' + c + '" cy="' + c + '" r="4"/>';
    return svg(152, 152, b);
  }

  function vBarGraph(cats, step) {
    var bw = 44, gap = 22, padL = 32, padB = 28, hMax = 130;
    var top = 0;
    for (var i = 0; i < cats.length; i++) top = Math.max(top, cats[i].val);
    var ticks = Math.ceil(top / step) * step;
    var w = padL + cats.length * (bw + gap), h = hMax + padB + 10, b = '';
    for (var t = 0; t <= ticks; t += step) {
      var y = 10 + hMax - hMax * t / ticks;
      b += '<line class="sv-tick" x1="' + padL + '" y1="' + y.toFixed(1) + '" x2="' + w + '" y2="' + y.toFixed(1) + '"/>';
      b += '<text class="sv-txt" x="' + (padL - 7) + '" y="' + (y + 4).toFixed(1) + '" text-anchor="end">' + t + '</text>';
    }
    for (var k = 0; k < cats.length; k++) {
      var bh = hMax * cats[k].val / ticks, x = padL + 10 + k * (bw + gap);
      b += '<rect class="sv-bar" x="' + x + '" y="' + (10 + hMax - bh).toFixed(1) + '" width="' + bw + '" height="' + bh.toFixed(1) + '" rx="4"/>';
      b += '<text class="sv-txt" x="' + (x + bw / 2) + '" y="' + (hMax + 28) + '" text-anchor="middle">' + esc(cats[k].name) + '</text>';
    }
    b += '<line class="sv-line" x1="' + padL + '" y1="' + (10 + hMax) + '" x2="' + w + '" y2="' + (10 + hMax) + '"/>';
    return svg(w + 4, h, b);
  }

  function vPicto(cats, icon, per) {
    var rowH = 34, w = 300, b = '';
    for (var k = 0; k < cats.length; k++) {
      var y = k * rowH;
      b += '<text class="sv-txt sv-left" x="0" y="' + (y + 22) + '">' + esc(cats[k].name) + '</text>';
      for (var i = 0; i < cats[k].count; i++) {
        b += '<text class="sv-icon" x="' + (74 + i * 26) + '" y="' + (y + 24) + '">' + icon + '</text>';
      }
    }
    b += '<text class="sv-key" x="0" y="' + (cats.length * rowH + 18) + '">Key: each ' + icon + ' = ' + per + '</text>';
    return svg(w, cats.length * rowH + 26, b);
  }

  var SHAPES = {
    square: { pts: '30,14 122,14 122,106 30,106', name: 'Square' },
    rectangle: { pts: '12,24 140,24 140,96 12,96', name: 'Rectangle' },
    rhombus: { pts: '76,10 142,60 76,110 10,60', name: 'Rhombus' },
    trapezoid: { pts: '38,22 114,22 142,98 10,98', name: 'Trapezoid' },
    parallelogram: { pts: '34,22 146,22 112,98 2,98', name: 'Parallelogram' },
    pentagon: { pts: '76,10 140,56 116,112 36,112 12,56', name: 'Pentagon' },
    hexagon: { pts: '48,14 104,14 138,60 104,106 48,106 14,60', name: 'Hexagon' },
    triangle: { pts: '76,14 142,106 10,106', name: 'Triangle' }
  };
  function vShape(kind) {
    return svg(152, 120, '<polygon class="sv-face" points="' + SHAPES[kind].pts + '"/><polygon class="sv-ring" points="' + SHAPES[kind].pts + '"/>');
  }

  function render(v) {
    if (!v) return '';
    switch (v.type) {
      case 'array': return vArray(v.rows, v.cols);
      case 'groups': return vGroups(v.groups, v.per);
      case 'fracbar': return vFracBar(v.parts, v.shaded, v.label);
      case 'fracbars': return vFracBars(v.bars);
      case 'numline': return vNumLine(v.parts, v.mark);
      case 'grid': return vGrid(v.rows, v.cols);
      case 'rect': return vRect(v.a, v.b, v.unit);
      case 'clock': return vClock(v.h, v.m);
      case 'bargraph': return vBarGraph(v.cats, v.step);
      case 'picto': return vPicto(v.cats, v.icon, v.per);
      case 'shape': return vShape(v.kind);
      default: return '';
    }
  }

  /* ================= generators =================
     Every generator supplies `steps` — the worked solution, revealed one line
     at a time when an answer is missed — and, where the mistake is a known one,
     a reason attached to each tempting wrong answer. */
  var G = {};

  /* --- Multiplication Meadow --- */
  G.eqGroups = function () {
    var g = ri(2, 6), p = ri(2, 5), th = pick(THINGS);
    return {
      eyebrow: 'Equal groups',
      prompt: g + ' groups of ' + p + ' ' + th[0] + '. How many in all?',
      visual: { type: 'groups', groups: g, per: p },
      answer: g * p,
      choices: mc(g * p, [
        [g + p, 'That is ' + g + ' + ' + p + '. Adding the two numbers counts each one only once — we need ' + g + ' whole groups of ' + p + '.'],
        [g * p + p, 'That is one group too many. Count the rings again.'],
        [g * p - p, 'That is one group short. Every ring counts.'],
        [g * (p + 1), 'That would be right if each group held ' + (p + 1) + ', but each one holds ' + p + '.']
      ]),
      steps: [
        'There are ' + g + ' groups, and every group holds ' + p + '.',
        'Equal groups means multiply: ' + g + ' × ' + p + '.',
        g + ' × ' + p + ' = ' + (g * p) + '.'
      ],
      explain: g + ' groups of ' + p + ' means ' + g + ' × ' + p + ' = ' + (g * p) + '.'
    };
  };

  G.arrayCount = function () {
    var r = ri(2, 6), c = ri(2, 6);
    return {
      eyebrow: 'Arrays',
      prompt: r + ' rows of ' + c + '. What is ' + r + ' × ' + c + '?',
      visual: { type: 'array', rows: r, cols: c },
      answer: r * c,
      choices: mc(r * c, [
        [r + c, 'That is ' + r + ' + ' + c + '. An array asks how many dots altogether, not how many across plus down.'],
        [r * c + r, 'That is one extra row of dots.'],
        [r * c - c, 'That is one row missing.'],
        [(r + 1) * c, 'That counts ' + (r + 1) + ' rows. There are ' + r + '.']
      ]),
      steps: [
        'Each row has ' + c + ' dots, and there are ' + r + ' rows.',
        'Add ' + c + ' to itself ' + r + ' times, or just multiply.',
        r + ' × ' + c + ' = ' + (r * c) + ' dots.'
      ],
      explain: 'Count by rows: ' + c + ' added ' + r + ' times is ' + (r * c) + '.',
      id: 'mul:' + Math.min(r, c) + 'x' + Math.max(r, c)
    };
  };

  G.skipCount = function () {
    var step = pick([2, 3, 4, 5, 10]), start = step * ri(1, 4), n = 4;
    var seq = [], i;
    for (i = 0; i < n; i++) seq.push(start + i * step);
    var ans = start + n * step;
    return {
      eyebrow: 'Skip counting',
      prompt: seq.join(',  ') + ',  <span class="blank">?</span>',
      answer: ans,
      choices: mc(ans, [
        [ans + step, 'That is two jumps ahead. We only need one more.'],
        [ans - step + 1, 'That breaks the pattern — the gaps would stop being equal.'],
        [ans + 1, 'The pattern jumps by ' + step + ' each time, not by 1.'],
        [ans + step * 2, 'That jumps three times instead of once.']
      ]),
      steps: [
        'Look at the gaps: ' + seq[0] + ' to ' + seq[1] + ' is ' + step + '.',
        'Every jump is the same size, so add ' + step + ' once more.',
        seq[n - 1] + ' + ' + step + ' = ' + ans + '.'
      ],
      explain: 'The pattern counts up by ' + step + ' each time, so next is ' + seq[n - 1] + ' + ' + step + ' = ' + ans + '.'
    };
  };

  G.repeatedAdd = function () {
    var times = ri(3, 5), num = ri(3, 8);
    var sum = [], i;
    for (i = 0; i < times; i++) sum.push(num);
    var right = times + ' × ' + num;
    return {
      eyebrow: 'Repeated addition',
      prompt: 'Which multiplication means the same as<br>' + sum.join(' + ') + '?',
      answer: right,
      choices: mc(right, [
        [num + ' × ' + num, 'That uses ' + num + ' twice. The number being added is ' + num + ', but it appears ' + times + ' times.'],
        [times + ' + ' + num, 'That is still an addition. We want the multiplication that replaces it.'],
        [(times + 1) + ' × ' + num, 'Count the ' + num + 's again — there are ' + times + ', not ' + (times + 1) + '.']
      ]),
      steps: [
        'Count how many numbers are being added: ' + times + ' of them.',
        'They are all the same number: ' + num + '.',
        'So it is ' + times + ' lots of ' + num + ' — that is ' + times + ' × ' + num + ' = ' + (times * num) + '.'
      ],
      explain: num + ' is added ' + times + ' times, and that is exactly ' + times + ' × ' + num + ' = ' + (times * num) + '.'
    };
  };

  G.missFactorLow = function () {
    var a = ri(2, 5), b = ri(2, 9), p = a * b;
    return {
      eyebrow: 'Missing factor',
      prompt: a + ' × <span class="blank">?</span> = ' + p,
      answer: b,
      choices: mc(b, [
        [b + 1, 'Close, but ' + a + ' × ' + (b + 1) + ' = ' + (a * (b + 1)) + ', which overshoots ' + p + '.'],
        [b - 1, 'Close, but ' + a + ' × ' + (b - 1) + ' = ' + (a * (b - 1)) + ', which falls short of ' + p + '.'],
        [p - a, 'That subtracts instead of divides. The box is a factor, not a difference.'],
        [b + 2, a + ' × ' + (b + 2) + ' = ' + (a * (b + 2)) + ', too big.']
      ]),
      steps: [
        'The box is asking: how many ' + a + 's make ' + p + '?',
        'Division undoes multiplication, so work out ' + p + ' ÷ ' + a + '.',
        p + ' ÷ ' + a + ' = ' + b + ', and checking: ' + a + ' × ' + b + ' = ' + p + '.'
      ],
      explain: 'Ask "how many ' + a + 's make ' + p + '?" — ' + p + ' ÷ ' + a + ' = ' + b + '.',
      id: 'mul:' + Math.min(a, b) + 'x' + Math.max(a, b)
    };
  };

  G.factLow = function () {
    var a = ri(2, 5), b = ri(2, 10);
    return {
      eyebrow: 'Quick fact',
      prompt: a + ' × ' + b,
      answer: a * b,
      choices: mc(a * b, [
        [a * b + a, 'That is one ' + a + ' too many — it is ' + a + ' × ' + (b + 1) + '.'],
        [a * b - a, 'That is one ' + a + ' short — it is ' + a + ' × ' + (b - 1) + '.'],
        [a * b + b, 'That is ' + (a + 1) + ' × ' + b + ', one group too many.'],
        [a + b, 'That is ' + a + ' + ' + b + '. The × sign means groups, not a total of the two numbers.']
      ]),
      steps: [
        'Read it as ' + a + ' groups of ' + b + '.',
        'Count up in ' + b + 's, ' + a + ' times.',
        a + ' × ' + b + ' = ' + (a * b) + '.'
      ],
      explain: a + ' × ' + b + ' = ' + (a * b) + '.',
      id: 'mul:' + Math.min(a, b) + 'x' + Math.max(a, b)
    };
  };

  /* --- Times Table Tower --- */
  G.factHigh = function () {
    var a = ri(6, 12), b = ri(2, 12);
    return {
      eyebrow: 'Quick fact',
      prompt: a + ' × ' + b,
      answer: a * b,
      choices: mc(a * b, [
        [a * b + a, 'One ' + a + ' too many — that is ' + a + ' × ' + (b + 1) + '.'],
        [a * b - a, 'One ' + a + ' short — that is ' + a + ' × ' + (b - 1) + '.'],
        [a * b + b, 'One ' + b + ' too many — that is ' + (a + 1) + ' × ' + b + '.'],
        [a * b - b, 'One ' + b + ' short — that is ' + (a - 1) + ' × ' + b + '.']
      ]),
      steps: [
        'A friendly way in: ' + a + ' × ' + (b > 1 ? b - 1 : 1) + ' = ' + (a * (b > 1 ? b - 1 : 1)) + '.',
        'Then add one more ' + a + ': ' + (a * (b > 1 ? b - 1 : 1)) + ' + ' + a + '.',
        a + ' × ' + b + ' = ' + (a * b) + '.'
      ],
      explain: a + ' × ' + b + ' = ' + (a * b) + '.',
      id: 'mul:' + Math.min(a, b) + 'x' + Math.max(a, b)
    };
  };

  G.missFactorHigh = function () {
    var a = ri(6, 12), b = ri(3, 9), p = a * b;
    return {
      eyebrow: 'Missing factor',
      prompt: '<span class="blank">?</span> × ' + a + ' = ' + p,
      answer: b,
      choices: mc(b, [
        [b + 1, (b + 1) + ' × ' + a + ' = ' + ((b + 1) * a) + ', which is past ' + p + '.'],
        [b - 1, (b - 1) + ' × ' + a + ' = ' + ((b - 1) * a) + ', which is short of ' + p + '.'],
        [b + 2, (b + 2) + ' × ' + a + ' = ' + ((b + 2) * a) + ', too big.'],
        [p - a, 'That subtracts. The box is a factor being multiplied, not taken away.']
      ]),
      steps: [
        'How many ' + a + 's fit into ' + p + '?',
        'Divide to find out: ' + p + ' ÷ ' + a + '.',
        'The answer is ' + b + ', because ' + b + ' × ' + a + ' = ' + p + '.'
      ],
      explain: p + ' ÷ ' + a + ' = ' + b + ', so the missing factor is ' + b + '.',
      id: 'mul:' + Math.min(a, b) + 'x' + Math.max(a, b)
    };
  };

  G.commutative = function () {
    var a = ri(4, 12), b = ri(4, 12);
    while (b === a) b = ri(4, 12);
    return {
      eyebrow: 'Flip the factors',
      prompt: a + ' × ' + b + ' = ' + b + ' × <span class="blank">?</span>',
      answer: a,
      choices: mc(a, [
        [b, b + ' is already on that side. The box needs the number that moved across.'],
        [a * b, 'That is the answer to the multiplication, not the missing factor.'],
        [a + b, 'That adds the two factors instead of swapping them.'],
        [a + 1, 'The same two numbers come back, just in the other order.']
      ]),
      steps: [
        'Both sides have to use the same two factors.',
        'The left side uses ' + a + ' and ' + b + '. The right side already shows ' + b + '.',
        'So the box is ' + a + ' — and both sides equal ' + (a * b) + '.'
      ],
      explain: 'Order never changes a product, so ' + b + ' × ' + a + ' is the same as ' + a + ' × ' + b + ' = ' + (a * b) + '.'
    };
  };

  G.doubleStrategy = function () {
    var half = ri(3, 6), b = ri(4, 9), a = half * 2;
    return {
      eyebrow: 'Doubling trick',
      prompt: 'You know ' + half + ' × ' + b + ' = ' + (half * b) + '.<br>So what is ' + a + ' × ' + b + '?',
      answer: a * b,
      choices: mc(a * b, [
        [half * b + b, 'That adds one more ' + b + '. We need ' + half + ' more ' + b + 's, because ' + a + ' is double ' + half + '.'],
        [half * b, 'That is the fact you started from. ' + a + ' is twice ' + half + ', so the answer doubles too.'],
        [a * b + b, 'That is one ' + b + ' too many.'],
        [half * b * 3, 'That triples it. ' + a + ' is double ' + half + ', not triple.']
      ]),
      steps: [
        a + ' is double ' + half + '.',
        'If the factor doubles, the answer doubles too.',
        (half * b) + ' + ' + (half * b) + ' = ' + (a * b) + '.'
      ],
      explain: a + ' is double ' + half + ', so double the answer too: ' + (half * b) + ' + ' + (half * b) + ' = ' + (a * b) + '.'
    };
  };

  G.multWord = function () {
    var cont = pick(CONTAINERS), th = pick(THINGS), n = ri(4, 9), per = ri(5, 12), who = pick(NAMES);
    return {
      eyebrow: 'Word problem',
      prompt: who + ' has ' + n + ' ' + cont[0] + ' of ' + th[0] + '. Each ' + cont[1] + ' holds ' + per + '.<br>How many ' + th[0] + ' is that?',
      answer: n * per,
      choices: mc(n * per, [
        [n + per, 'That adds the two numbers. There are ' + n + ' separate ' + cont[0] + ', each with ' + per + ' inside.'],
        [n * per + per, 'That counts an extra ' + cont[1] + '.'],
        [n * per - n, 'Each ' + cont[1] + ' holds the full ' + per + ' — none are short.'],
        [(n + 1) * per, 'That uses ' + (n + 1) + ' ' + cont[0] + '. There are ' + n + '.']
      ]),
      steps: [
        'Every ' + cont[1] + ' holds the same amount: ' + per + '.',
        'Same-sized groups means multiply: ' + n + ' × ' + per + '.',
        'That gives ' + (n * per) + ' ' + th[0] + '.'
      ],
      explain: n + ' ' + cont[0] + ' × ' + per + ' each = ' + (n * per) + ' ' + th[0] + '.'
    };
  };

  /* --- Division Dunes --- */
  G.divFact = function () {
    var b = ri(2, 10), q = ri(2, 10), a = b * q;
    return {
      eyebrow: 'Quick fact',
      prompt: a + ' ÷ ' + b,
      answer: q,
      choices: mc(q, [
        [q + 1, b + ' × ' + (q + 1) + ' = ' + (b * (q + 1)) + ', which is more than ' + a + '.'],
        [q - 1, b + ' × ' + (q - 1) + ' = ' + (b * (q - 1)) + ', which is less than ' + a + '.'],
        [a - b, 'That takes ' + b + ' away once. Dividing asks how many ' + b + 's fit in altogether.'],
        [b, 'That is the number we are dividing by, not how many times it fits.']
      ]),
      steps: [
        'Ask: how many ' + b + 's fit inside ' + a + '?',
        'Use the times table you know: ' + b + ' × ' + q + ' = ' + a + '.',
        'So ' + a + ' ÷ ' + b + ' = ' + q + '.'
      ],
      explain: b + ' × ' + q + ' = ' + a + ', so ' + a + ' ÷ ' + b + ' = ' + q + '.',
      id: 'div:' + a + '/' + b
    };
  };

  G.shareWord = function () {
    var kids = ri(3, 8), each = ri(3, 9), total = kids * each, th = pick(THINGS), who = pick(NAMES);
    return {
      eyebrow: 'Fair shares',
      prompt: who + ' shares ' + total + ' ' + th[0] + ' equally between ' + kids + ' friends.<br>How many does each friend get?',
      answer: each,
      choices: mc(each, [
        [each + 1, 'If everyone took ' + (each + 1) + ', that would need ' + (kids * (each + 1)) + ' ' + th[0] + ' — more than there are.'],
        [each - 1, 'If everyone took ' + (each - 1) + ', there would be ' + th[0] + ' left over, so the sharing is not finished.'],
        [total - kids, 'That subtracts the friends. Sharing splits the whole pile into equal piles instead.'],
        [kids, 'That is the number of friends, not what each one gets.']
      ]),
      steps: [
        'The ' + total + ' ' + th[0] + ' are split into ' + kids + ' equal piles.',
        'Equal sharing means divide: ' + total + ' ÷ ' + kids + '.',
        'Each friend gets ' + each + '.'
      ],
      explain: 'Sharing equally is division: ' + total + ' ÷ ' + kids + ' = ' + each + ' each.',
      id: 'div:' + total + '/' + kids
    };
  };

  G.groupsWord = function () {
    var per = ri(3, 9), groups = ri(3, 8), total = per * groups, cont = pick(CONTAINERS), th = pick(THINGS);
    return {
      eyebrow: 'How many groups',
      prompt: 'There are ' + total + ' ' + th[0] + '. Each ' + cont[1] + ' holds ' + per + '.<br>How many ' + cont[0] + ' are needed?',
      answer: groups,
      choices: mc(groups, [
        [groups + 1, 'That many ' + cont[0] + ' would hold ' + ((groups + 1) * per) + ' — one would come out empty.'],
        [groups - 1, 'That many ' + cont[0] + ' only hold ' + ((groups - 1) * per) + ', so some ' + th[0] + ' would have nowhere to go.'],
        [per, 'That is how many fit in one ' + cont[1] + ', not how many ' + cont[0] + ' are needed.'],
        [total - per, 'That fills just one ' + cont[1] + ' and subtracts. Keep filling until nothing is left.']
      ]),
      steps: [
        'Each ' + cont[1] + ' takes ' + per + ' away from the pile.',
        'Ask how many ' + per + 's fit in ' + total + ': that is ' + total + ' ÷ ' + per + '.',
        'You need ' + groups + ' ' + cont[0] + '.'
      ],
      explain: 'Count how many ' + per + 's fit in ' + total + ': ' + total + ' ÷ ' + per + ' = ' + groups + '.',
      id: 'div:' + total + '/' + per
    };
  };

  G.relateMulDiv = function () {
    var a = ri(3, 9), b = ri(3, 9), p = a * b;
    return {
      eyebrow: 'Two sides of one fact',
      prompt: 'You know ' + a + ' × ' + b + ' = ' + p + '.<br>So what is ' + p + ' ÷ ' + b + '?',
      answer: a,
      choices: mc(a, [
        [b, b + ' is the number we are dividing by. Taking it out leaves the other factor, ' + a + '.'],
        [p - b, 'That subtracts. Division undoes multiplication rather than taking one away.'],
        [a + 1, 'Only the two factors ' + a + ' and ' + b + ' belong in this fact family.'],
        [a - 1, 'Only the two factors ' + a + ' and ' + b + ' belong in this fact family.']
      ]),
      steps: [
        a + ', ' + b + ' and ' + p + ' are one fact family.',
        'Multiplying puts the factors together; dividing takes one back out.',
        'Take ' + b + ' out of ' + p + ' and ' + a + ' is what remains.'
      ],
      explain: 'Multiplication and division undo each other, so ' + p + ' ÷ ' + b + ' = ' + a + '.'
    };
  };

  G.missDividend = function () {
    var b = ri(3, 9), q = ri(3, 9), a = b * q;
    return {
      eyebrow: 'Missing number',
      prompt: '<span class="blank">?</span> ÷ ' + b + ' = ' + q,
      answer: a,
      choices: mc(a, [
        [b + q, 'That adds the two numbers. The box is the big number we started with, before dividing.'],
        [a + b, 'That is one ' + b + ' too many — it would divide to ' + (q + 1) + '.'],
        [a - b, 'That is one ' + b + ' short — it would divide to ' + (q - 1) + '.'],
        [b * q + 1, 'That would not divide evenly by ' + b + '.']
      ]),
      steps: [
        'The box was split into ' + q + ' groups of ' + b + '.',
        'To get back to the start, multiply: ' + b + ' × ' + q + '.',
        'The box is ' + a + '.'
      ],
      explain: 'Work backwards by multiplying: ' + b + ' × ' + q + ' = ' + a + '.'
    };
  };

  /* --- Number Nebula --- */
  G.round10 = function () {
    var n = ri(112, 989);
    while (n % 10 === 0) n = ri(112, 989);
    var ones = n % 10;
    var ans = ones >= 5 ? (Math.floor(n / 10) + 1) * 10 : Math.floor(n / 10) * 10;
    return {
      eyebrow: 'Rounding',
      prompt: 'Round ' + n + ' to the nearest ten.',
      answer: ans,
      choices: mc(ans, [
        [ones >= 5 ? ans - 10 : ans + 10, 'That rounds the wrong way. The ones digit is ' + ones + ', so ' + n + ' is nearer ' + ans + '.'],
        [Math.round(n / 100) * 100, 'That rounds to the nearest hundred. This question asks for the nearest ten.'],
        [ans + 10, 'That skips a whole ten past the closest one.'],
        [ans - 10, 'That lands a whole ten below the closest one.']
      ]),
      steps: [
        n + ' sits between ' + (Math.floor(n / 10) * 10) + ' and ' + ((Math.floor(n / 10) + 1) * 10) + '.',
        'Look at the ones digit: ' + ones + '. Five or more rounds up, less than five rounds down.',
        'So ' + n + ' rounds to ' + ans + '.'
      ],
      explain: 'The ones digit is ' + ones + '. ' + (ones >= 5 ? '5 or more rounds up' : 'Less than 5 rounds down') + ', so ' + n + ' → ' + ans + '.'
    };
  };

  G.round100 = function () {
    var n = ri(112, 979);
    var tens = Math.floor((n % 100) / 10);
    var ans = (n % 100) >= 50 ? (Math.floor(n / 100) + 1) * 100 : Math.floor(n / 100) * 100;
    return {
      eyebrow: 'Rounding',
      prompt: 'Round ' + n + ' to the nearest hundred.',
      answer: ans,
      choices: mc(ans, [
        [(n % 100) >= 50 ? ans - 100 : ans + 100, 'That rounds the wrong way. The tens digit is ' + tens + ', so ' + n + ' is nearer ' + ans + '.'],
        [Math.round(n / 10) * 10, 'That rounds to the nearest ten. This question asks for the nearest hundred.'],
        [ans + 100, 'That overshoots by a whole hundred.'],
        [ans - 100, 'That undershoots by a whole hundred.']
      ]),
      steps: [
        n + ' sits between ' + (Math.floor(n / 100) * 100) + ' and ' + ((Math.floor(n / 100) + 1) * 100) + '.',
        'Look at the tens digit: ' + tens + '. Five or more rounds up, less than five rounds down.',
        'So ' + n + ' rounds to ' + ans + '.'
      ],
      explain: 'Look at the tens digit, ' + tens + '. That makes ' + n + ' closer to ' + ans + '.'
    };
  };

  G.add3 = function () {
    var a = ri(118, 679), b = ri(118, 679);
    return {
      eyebrow: 'Add within 1,000',
      prompt: commas(a) + ' + ' + commas(b),
      answer: a + b,
      steps: [
        'Ones: ' + (a % 10) + ' + ' + (b % 10) + ' = ' + ((a % 10) + (b % 10)) + ((a % 10) + (b % 10) >= 10 ? ' — write ' + (((a % 10) + (b % 10)) % 10) + ' and carry 1.' : '.'),
        'Tens: ' + (Math.floor(a / 10) % 10) + ' + ' + (Math.floor(b / 10) % 10) + (((a % 10) + (b % 10)) >= 10 ? ' + the carried 1' : '') + '.',
        'Hundreds last, then read it off: ' + a + ' + ' + b + ' = ' + (a + b) + '.'
      ],
      explain: 'Add ones, then tens, then hundreds, carrying when a column passes 9: ' + a + ' + ' + b + ' = ' + (a + b) + '.',
      id: 'add:' + a + '+' + b
    };
  };

  G.sub3 = function () {
    var a = ri(320, 985), b = ri(118, a - 40);
    return {
      eyebrow: 'Subtract within 1,000',
      prompt: commas(a) + ' − ' + commas(b),
      answer: a - b,
      steps: [
        'Start with the ones: ' + (a % 10) + ' − ' + (b % 10) + ((a % 10) < (b % 10) ? '. The top digit is smaller, so borrow ten from the tens column.' : '.'),
        'Then the tens, then the hundreds, borrowing again whenever the top digit is too small.',
        a + ' − ' + b + ' = ' + (a - b) + '.'
      ],
      explain: 'Line up the places and borrow when the top digit is too small: ' + a + ' − ' + b + ' = ' + (a - b) + '.',
      id: 'sub:' + a + '-' + b
    };
  };

  G.multTens = function () {
    var a = ri(2, 9), t = ri(2, 9) * 10;
    return {
      eyebrow: 'Multiply by tens',
      prompt: a + ' × ' + t,
      answer: a * t,
      choices: mc(a * t, [
        [a * t / 10, 'That is ' + a + ' × ' + (t / 10) + '. You still need the ten times at the end.'],
        [a * t * 10, 'That multiplies by ten one time too many.'],
        [a * t + 10, 'Ten gets multiplied here, not added on.'],
        [a + (t / 10), 'That adds the digits instead of multiplying them.']
      ]),
      steps: [
        'Split off the zero: ' + t + ' is ' + (t / 10) + ' × 10.',
        'Do the easy fact first: ' + a + ' × ' + (t / 10) + ' = ' + (a * t / 10) + '.',
        'Now times ten — the digits shift up one place: ' + (a * t) + '.'
      ],
      explain: a + ' × ' + (t / 10) + ' = ' + (a * t / 10) + ', then multiply by 10 → ' + (a * t) + '.'
    };
  };

  G.nebulaWord = function () {
    var a = ri(140, 480), b = ri(120, 420), up = Math.random() < 0.5;
    var th = pick(THINGS);
    if (up) {
      return {
        eyebrow: 'Word problem',
        prompt: 'The sky library had ' + a + ' ' + th[0] + '. Then ' + b + ' more arrived.<br>How many now?',
        answer: a + b,
        steps: [
          '"More arrived" means the pile grew, so this is an addition.',
          'Put the two amounts together: ' + a + ' + ' + b + '.',
          'There are now ' + (a + b) + ' ' + th[0] + '.'
        ],
        explain: 'More arriving means add: ' + a + ' + ' + b + ' = ' + (a + b) + '.'
      };
    }
    var big = a + b;
    return {
      eyebrow: 'Word problem',
      prompt: 'The sky library had ' + big + ' ' + th[0] + '. ' + b + ' were taken home.<br>How many are left?',
      answer: a,
      steps: [
        '"Taken home" means the pile shrank, so this is a subtraction.',
        'Start from the whole amount and take the ' + b + ' away: ' + big + ' − ' + b + '.',
        'There are ' + a + ' ' + th[0] + ' left.'
      ],
      explain: 'Taken away means subtract: ' + big + ' − ' + b + ' = ' + a + '.'
    };
  };

  /* --- Fraction Falls --- */
  function fracFmt(v) { var p = String(v).split('/'); return frac(p[0], p[1]); }

  G.idFraction = function () {
    var d = pick([2, 3, 4, 5, 6, 8]), n = ri(1, d - 1);
    return {
      eyebrow: 'Name the fraction',
      prompt: 'What fraction of the bar is lit?',
      visual: { type: 'fracbar', parts: d, shaded: n },
      answer: fracStr(n, d),
      choices: mc(fracStr(n, d), [
        [fracStr(d, n), 'Those numbers are upside down. The total number of parts always goes on the bottom.'],
        [fracStr(n + 1, d), 'That counts one lit part too many. There are ' + n + '.'],
        [fracStr(n, d + 1), 'That says the bar has ' + (d + 1) + ' parts. Count them again — there are ' + d + '.'],
        [fracStr(d - n, d), 'That is the dark part of the bar. The question asks about the lit part.']
      ], fracFmt),
      steps: [
        'Count all the equal parts in the bar: ' + d + '. That is the bottom number.',
        'Count the lit parts: ' + n + '. That is the top number.',
        'The fraction is ' + n + '/' + d + '.'
      ],
      explain: 'The bar has ' + d + ' equal parts (the bottom number) and ' + n + ' are lit (the top number): ' + n + '/' + d + '.'
    };
  };

  G.shapeUnitFrac = function () {
    var d = pick([3, 4, 6, 8]);
    return {
      eyebrow: 'Unit fractions',
      prompt: 'This shape is split into ' + d + ' equal parts.<br>What fraction is one part?',
      visual: { type: 'fracbar', parts: d, shaded: 1 },
      answer: fracStr(1, d),
      choices: mc(fracStr(1, d), [
        [fracStr(d, 1), 'That is upside down, and it means ' + d + ' whole shapes rather than one slice.'],
        [fracStr(1, d - 1), 'That says the shape has ' + (d - 1) + ' parts. It has ' + d + '.'],
        [fracStr(2, d), 'That is two parts. We only lit one.'],
        [fracStr(1, d + 1), 'That says the shape has ' + (d + 1) + ' parts. It has ' + d + '.']
      ], fracFmt),
      steps: [
        'The whole shape is cut into ' + d + ' equal parts.',
        'One single part out of ' + d + ' is written with 1 on top.',
        'So one part is 1/' + d + '.'
      ],
      explain: 'One of ' + d + ' equal parts is 1/' + d + '.'
    };
  };

  G.equivFrac = function () {
    var small = pick([[1, 2], [1, 3], [1, 4], [2, 3], [3, 4], [2, 5]]);
    var k = ri(2, 3), n = small[0], d = small[1];
    return {
      eyebrow: 'Equivalent fractions',
      prompt: frac(n, d) + ' is the same amount as ' + frac('?', d * k) + '<br>What is the missing top number?',
      visual: { type: 'fracbars', bars: [{ parts: d, shaded: n, label: n + '/' + d }, { parts: d * k, shaded: n * k, label: '? / ' + (d * k) }] },
      answer: n * k,
      choices: mc(n * k, [
        [n, 'The top number stays only if the bottom stays. The bottom was multiplied by ' + k + ', so the top must be too.'],
        [n * k + 1, 'One part too many — the two bars would not match.'],
        [n * k - 1, 'One part too few — the two bars would not match.'],
        [d * k - n * k, 'That counts the dark parts instead of the lit ones.']
      ]),
      steps: [
        'The bottom number went from ' + d + ' to ' + (d * k) + ', so every part was cut into ' + k + '.',
        'Each lit part became ' + k + ' smaller lit parts.',
        n + ' × ' + k + ' = ' + (n * k) + ', so ' + n + '/' + d + ' = ' + (n * k) + '/' + (d * k) + '.'
      ],
      explain: 'Each of the ' + d + ' parts was cut into ' + k + ', so the lit parts also multiply by ' + k + ': ' + n + ' × ' + k + ' = ' + (n * k) + '.'
    };
  };

  G.cmpSameDen = function () {
    var d = pick([4, 5, 6, 8]), a = ri(1, d - 1), b = ri(1, d - 1);
    while (b === a) b = ri(1, d - 1);
    var hi = Math.max(a, b), lo = Math.min(a, b);
    var opts = [
      { v: fracStr(a, d), html: frac(a, d) },
      { v: fracStr(b, d), html: frac(b, d) }
    ];
    for (var i = 0; i < 2; i++) if (opts[i].v === fracStr(lo, d)) opts[i].why = 'Both fractions have ' + d + ' parts, so the pieces are the same size. ' + lo + ' pieces is fewer than ' + hi + '.';
    return {
      eyebrow: 'Compare fractions',
      prompt: 'Which fraction is greater?',
      visual: { type: 'fracbars', bars: [{ parts: d, shaded: a, label: a + '/' + d }, { parts: d, shaded: b, label: b + '/' + d }] },
      answer: fracStr(hi, d),
      choices: shuffle(opts),
      steps: [
        'Both bars are cut into ' + d + ' equal parts, so every piece is exactly the same size.',
        'Now it is just counting: ' + hi + ' pieces against ' + lo + ' pieces.',
        hi + '/' + d + ' is the greater fraction.'
      ],
      explain: 'The parts are the same size, so more parts wins: ' + hi + '/' + d + ' is greater.'
    };
  };

  G.cmpSameNum = function () {
    var n = ri(1, 3), d1 = pick([2, 3, 4]), d2 = pick([6, 8, 10]);
    if (n >= d1) n = 1;
    var opts = [
      { v: fracStr(n, d1), html: frac(n, d1) },
      { v: fracStr(n, d2), html: frac(n, d2), why: 'A bigger bottom number means the whole was cut into more pieces, so each piece is smaller. ' + n + ' small pieces is less than ' + n + ' big ones.' }
    ];
    return {
      eyebrow: 'Compare fractions',
      prompt: 'Same number of parts, different sizes.<br>Which fraction is greater?',
      visual: { type: 'fracbars', bars: [{ parts: d1, shaded: n, label: n + '/' + d1 }, { parts: d2, shaded: n, label: n + '/' + d2 }] },
      answer: fracStr(n, d1),
      choices: shuffle(opts),
      steps: [
        'Both fractions light up the same number of parts: ' + n + '.',
        'But cutting a whole into ' + d2 + ' makes smaller pieces than cutting it into ' + d1 + '.',
        'Same count of bigger pieces wins, so ' + n + '/' + d1 + ' is greater.'
      ],
      explain: 'Splitting into ' + d2 + ' makes smaller pieces than splitting into ' + d1 + '. Same count of bigger pieces is more, so ' + n + '/' + d1 + ' wins.'
    };
  };

  G.fracNumline = function () {
    var d = pick([3, 4, 5, 6, 8]), n = ri(1, d - 1);
    return {
      eyebrow: 'Fractions on a number line',
      prompt: 'Which fraction does the arrow point to?',
      visual: { type: 'numline', parts: d, mark: n },
      answer: fracStr(n, d),
      choices: mc(fracStr(n, d), [
        [fracStr(n + 1, d), 'That counts the tick marks instead of the jumps between them. Start counting from 0.'],
        [fracStr(d, n), 'Those numbers are upside down. The number of jumps in the whole line goes on the bottom.'],
        [fracStr(n - 1, d), 'That is one jump short of the arrow.'],
        [fracStr(n, d + 1), 'That says the line has ' + (d + 1) + ' jumps. Count again — there are ' + d + '.']
      ], fracFmt),
      steps: [
        'The line from 0 to 1 is cut into ' + d + ' equal jumps, so the bottom number is ' + d + '.',
        'Count the jumps from 0 up to the arrow: ' + n + '.',
        'The arrow is at ' + n + '/' + d + '.'
      ],
      explain: '0 to 1 is cut into ' + d + ' equal jumps. The arrow is after ' + n + ' jump' + (n === 1 ? '' : 's') + ', so it is ' + n + '/' + d + '.'
    };
  };

  G.wholeFrac = function () {
    var d = pick([2, 3, 4, 5, 6, 8]);
    if (Math.random() < 0.5) {
      return {
        eyebrow: 'Whole numbers as fractions',
        prompt: 'How much is ' + frac(d, d) + '?',
        visual: { type: 'fracbar', parts: d, shaded: d },
        answer: 1,
        choices: mc(1, [
          [d, 'That counts the pieces. All ' + d + ' pieces together rebuild exactly one whole bar.'],
          [0, 'The bar is completely lit, so there is a whole one there.'],
          [2, 'There is only one bar, and it is full.'],
          [d * 2, 'That doubles the pieces. One full bar is one whole.']
        ]),
        steps: [
          'The bar has ' + d + ' equal parts and every single one is lit.',
          'Nothing is left over, so the whole bar is covered.',
          d + '/' + d + ' = 1.'
        ],
        explain: 'All ' + d + ' of the ' + d + ' parts are lit, and that is one whole: ' + d + '/' + d + ' = 1.'
      };
    }
    var k = ri(2, 5);
    return {
      eyebrow: 'Whole numbers as fractions',
      prompt: 'Which fraction equals ' + k + '?',
      answer: fracStr(k, 1),
      choices: mc(fracStr(k, 1), [
        [fracStr(1, k), 'That is upside down — it means one piece out of ' + k + ', which is less than a whole.'],
        [fracStr(k, k), 'That equals 1, not ' + k + '.'],
        [fracStr(k, 2), 'That is ' + k + ' halves, which is only ' + (k / 2) + '.']
      ], fracFmt),
      steps: [
        'The bottom number says how many pieces each whole is cut into.',
        'A bottom number of 1 means the pieces are not cut at all — they are whole ones.',
        'So ' + k + '/1 = ' + k + '.'
      ],
      explain: 'A bottom number of 1 means whole pieces, so ' + k + '/1 = ' + k + '.'
    };
  };

  /* --- Shape Shore --- */
  G.areaTile = function () {
    var r = ri(2, 6), c = ri(3, 9);
    return {
      eyebrow: 'Area by tiling',
      prompt: 'Each tile is 1 square unit. What is the area?',
      visual: { type: 'grid', rows: r, cols: c },
      answer: r * c,
      unit: 'square units',
      choices: mc(r * c, [
        [2 * (r + c), 'That is the perimeter — the distance around the edge. Area is how many tiles fill the inside.'],
        [r + c, 'That adds one row to one column. Area counts every tile.'],
        [r * c + c, 'That is one row of tiles too many.'],
        [(r + 1) * c, 'That counts ' + (r + 1) + ' rows. There are ' + r + '.']
      ]),
      steps: [
        'Count one row across: ' + c + ' tiles.',
        'Count how many rows there are: ' + r + '.',
        'Area is rows × tiles in a row: ' + r + ' × ' + c + ' = ' + (r * c) + ' square units.'
      ],
      explain: 'Count the rows of tiles: ' + r + ' × ' + c + ' = ' + (r * c) + ' square units.'
    };
  };

  G.areaFormula = function () {
    var a = ri(3, 9), b = ri(3, 8), u = pick(['cm', 'ft', 'm']);
    return {
      eyebrow: 'Area of a rectangle',
      prompt: 'What is the area of this rectangle?',
      visual: { type: 'rect', a: a, b: b, unit: u },
      answer: a * b,
      unit: 'square ' + u,
      choices: mc(a * b, [
        [2 * (a + b), 'That is the perimeter, the walk around the outside. Area is the space inside.'],
        [a + b, 'That adds the two sides. Area multiplies them.'],
        [a * b + a, 'That is one extra row of squares.'],
        [(a + 1) * b, 'That uses a length of ' + (a + 1) + '. The label says ' + a + '.']
      ]),
      steps: [
        'Imagine filling the rectangle with 1 ' + u + ' squares.',
        'Each row holds ' + a + ' squares, and there are ' + b + ' rows.',
        'Area = length × width = ' + a + ' × ' + b + ' = ' + (a * b) + ' square ' + u + '.'
      ],
      explain: 'Area is length × width: ' + a + ' × ' + b + ' = ' + (a * b) + ' square ' + u + '.'
    };
  };

  G.perimRect = function () {
    var a = ri(3, 12), b = ri(2, 9), u = pick(['cm', 'ft', 'm']);
    return {
      eyebrow: 'Perimeter',
      prompt: 'What is the perimeter — the whole way around?',
      visual: { type: 'rect', a: a, b: b, unit: u },
      answer: 2 * (a + b),
      unit: u,
      choices: mc(2 * (a + b), [
        [a * b, 'That is the area, the space inside. Perimeter is the walk around the edge.'],
        [a + b, 'That walks along only two sides. A rectangle has four.'],
        [2 * a + b, 'That misses one side out. Both lengths and both widths count.'],
        [2 * (a + b) + 2, 'That adds a little extra — walk each of the four sides exactly once.']
      ]),
      steps: [
        'A rectangle has two sides of ' + a + ' ' + u + ' and two of ' + b + ' ' + u + '.',
        'Walk all the way round: ' + a + ' + ' + b + ' + ' + a + ' + ' + b + '.',
        'That is ' + (2 * (a + b)) + ' ' + u + '.'
      ],
      explain: 'Add all four sides: ' + a + ' + ' + b + ' + ' + a + ' + ' + b + ' = ' + (2 * (a + b)) + ' ' + u + '.'
    };
  };

  G.missingSide = function () {
    var a = ri(3, 9), b = ri(3, 9), u = pick(['cm', 'ft', 'm']);
    return {
      eyebrow: 'Missing side',
      prompt: 'A rectangle has an area of ' + (a * b) + ' square ' + u + '.<br>One side is ' + a + ' ' + u + '. How long is the other side?',
      answer: b,
      unit: u,
      choices: mc(b, [
        [a * b - a, 'That subtracts. Area was made by multiplying, so undo it by dividing.'],
        [b + 1, a + ' × ' + (b + 1) + ' = ' + (a * (b + 1)) + ', which is more area than we have.'],
        [b - 1, a + ' × ' + (b - 1) + ' = ' + (a * (b - 1)) + ', which is less area than we have.'],
        [a, 'That is the side we already know.']
      ]),
      steps: [
        'Area came from multiplying the two sides together.',
        'So divide the area by the side you know: ' + (a * b) + ' ÷ ' + a + '.',
        'The missing side is ' + b + ' ' + u + '.'
      ],
      explain: 'Area ÷ known side = missing side: ' + (a * b) + ' ÷ ' + a + ' = ' + b + ' ' + u + '.'
    };
  };

  G.areaVsPerim = function () {
    var area = pick([16, 12, 36, 24]);
    var opts = [];
    for (var a = 1; a <= area; a++) if (area % a === 0 && a <= area / a) opts.push([a, area / a]);
    if (opts.length < 2) { area = 16; opts = [[1, 16], [2, 8], [4, 4]]; }
    var two = shuffle(opts.slice()).slice(0, 2);
    var p0 = 2 * (two[0][0] + two[0][1]), p1 = 2 * (two[1][0] + two[1][1]);
    var winner = p0 > p1 ? 0 : 1, loser = 1 - winner;
    var lbl = function (t) { return t[0] + ' by ' + t[1]; };
    var choices = [
      { v: lbl(two[0]), html: lbl(two[0]) },
      { v: lbl(two[1]), html: lbl(two[1]) }
    ];
    choices[loser].why = lbl(two[loser]) + ' is the squarer shape. Walking round it is ' +
      (loser === 0 ? p0 : p1) + ' cm, while the long thin one is ' + (winner === 0 ? p0 : p1) + ' cm.';
    return {
      eyebrow: 'Same area, different shape',
      prompt: 'Both rectangles have an area of ' + area + ' square cm.<br>Which one has the <b>longer</b> perimeter?',
      answer: lbl(two[winner]),
      choices: shuffle(choices),
      steps: [
        'Area being equal does not make the perimeters equal.',
        lbl(two[0]) + ' goes around ' + p0 + ' cm; ' + lbl(two[1]) + ' goes around ' + p1 + ' cm.',
        'Long thin rectangles have more edge, so ' + lbl(two[winner]) + ' wins.'
      ],
      explain: lbl(two[0]) + ' goes around ' + p0 + ' cm and ' + lbl(two[1]) + ' goes around ' + p1 + ' cm. Long thin rectangles have bigger perimeters.'
    };
  };

  G.quadName = function () {
    var kinds = ['square', 'rectangle', 'rhombus', 'trapezoid', 'parallelogram', 'hexagon', 'pentagon', 'triangle'];
    var k = pick(kinds);
    var sides = { square: 4, rectangle: 4, rhombus: 4, trapezoid: 4, parallelogram: 4, pentagon: 5, hexagon: 6, triangle: 3 };
    var wrong = shuffle(kinds.filter(function (x) { return x !== k; })).slice(0, 3).map(function (x) {
      return [SHAPES[x].name, sides[x] !== sides[k]
        ? 'A ' + SHAPES[x].name.toLowerCase() + ' has ' + sides[x] + ' sides. Count the sides on this one — there are ' + sides[k] + '.'
        : 'Close — that also has ' + sides[k] + ' sides, but look at whether the sides are equal and the corners square.'];
    });
    var notes = {
      square: 'four equal sides and four square corners',
      rectangle: 'four square corners, with opposite sides equal',
      rhombus: 'four equal sides, but tilted corners',
      trapezoid: 'exactly one pair of parallel sides',
      parallelogram: 'two pairs of parallel sides, pushed over',
      pentagon: 'five sides',
      hexagon: 'six sides',
      triangle: 'three sides'
    };
    return {
      eyebrow: 'Name the shape',
      prompt: 'What is this shape called?',
      visual: { type: 'shape', kind: k },
      answer: SHAPES[k].name,
      choices: mc(SHAPES[k].name, wrong),
      steps: [
        'Count the sides first: this one has ' + sides[k] + '.',
        'Then look at the corners and whether the sides match.',
        'It has ' + notes[k] + ', so it is a ' + SHAPES[k].name.toLowerCase() + '.'
      ],
      explain: 'It is a ' + SHAPES[k].name.toLowerCase() + ' — ' + notes[k] + '.'
    };
  };

  /* --- Clockwork Mesa --- */
  G.readClock = function () {
    var h = ri(1, 12), m = ri(0, 11) * 5 + pick([0, 0, 1, 2, 3, 4]);
    if (m > 59) m = 55;
    var ans = timeStr(h, m);
    var nextH = h === 12 ? 1 : h + 1, prevH = h === 1 ? 12 : h - 1;
    return {
      eyebrow: 'Tell the time',
      prompt: 'What time is it?',
      visual: { type: 'clock', h: h, m: m },
      answer: ans,
      choices: mc(ans, [
        [timeStr(nextH, m), 'The short hand has not reached ' + nextH + ' yet — it is still just past ' + h + '.'],
        [timeStr(h, (m + 30) % 60), 'That reads the long hand half a turn out. Count the small marks from the 12.'],
        [timeStr(prevH, m), 'The short hand is already past ' + h + ', so the hour is ' + h + '.'],
        [timeStr(h, (m + 5) % 60), 'That is five minutes out — count the little marks one by one.']
      ]),
      steps: [
        'The short hand gives the hour: it is just past ' + h + '.',
        'The long hand gives the minutes. Count in fives from the 12, then the small marks.',
        'That lands on ' + m + ' minutes, so the time is ' + ans + '.'
      ],
      explain: 'The short hand is just past ' + h + ', and the long hand is on ' + m + ' minutes, so it is ' + ans + '.'
    };
  };

  G.elapsed = function () {
    var h = ri(1, 9), m = ri(0, 11) * 5, dur = ri(3, 18) * 5;
    var tot = h * 60 + m + dur, eh = Math.floor(tot / 60), em = tot % 60;
    if (eh > 12) eh -= 12;
    return {
      eyebrow: 'Elapsed time',
      prompt: 'Star practice began at ' + timeStr(h, m) + ' and ended at ' + timeStr(eh, em) + '.<br>How long was it?',
      answer: durStr(dur),
      choices: mc(durStr(dur), [
        [durStr(dur + 60), 'That counts an extra whole hour.'],
        [durStr(dur + 5), 'That is five minutes too many — check the minute count.'],
        [durStr(Math.max(5, dur - 10)), 'That is ten minutes short.'],
        [durStr(dur + 15), 'That overshoots by a quarter of an hour.']
      ]),
      steps: [
        'Start at ' + timeStr(h, m) + ' and count forward in whole hours first.',
        'Then count the leftover minutes up to ' + timeStr(eh, em) + '.',
        'Altogether that is ' + durStr(dur) + '.'
      ],
      explain: 'Count forward from ' + timeStr(h, m) + ' in hours, then minutes — that is ' + durStr(dur) + '.'
    };
  };

  G.endTime = function () {
    var h = ri(1, 9), m = ri(0, 11) * 5, dur = ri(3, 14) * 5;
    var tot = h * 60 + m + dur, eh = Math.floor(tot / 60), em = tot % 60;
    if (eh > 12) eh -= 12;
    var ans = timeStr(eh, em);
    return {
      eyebrow: 'Time forward',
      prompt: 'A sky show starts at ' + timeStr(h, m) + ' and lasts ' + dur + ' minutes.<br>What time does it end?',
      visual: { type: 'clock', h: h, m: m },
      answer: ans,
      choices: mc(ans, [
        [timeStr(h, (m + dur) % 60), 'The minutes rolled past 60, so the hour has to tick forward too.'],
        [timeStr(eh === 12 ? 1 : eh + 1, em), 'That adds an extra hour on top.'],
        [timeStr(eh, (em + 5) % 60), 'Five minutes out — recount the minutes you added.'],
        [timeStr(eh, (em + 30) % 60), 'That adds half an hour too much.']
      ]),
      steps: [
        'Start at ' + timeStr(h, m) + ' and add ' + dur + ' minutes.',
        (m + dur >= 60 ? 'The minutes pass 60, so one whole hour rolls over to the next hour.' : 'The minutes stay under 60, so the hour does not change.'),
        'The show ends at ' + ans + '.'
      ],
      explain: timeStr(h, m) + ' plus ' + dur + ' minutes lands on ' + ans + '.'
    };
  };

  G.massVol = function () {
    var items = [
      { q: 'A single paper clip weighs about…', a: '1 gram', w: [['1 kilogram', 'A kilogram is about a bag of sugar — far too heavy for a paper clip.'], ['100 grams', 'That is about an apple. A paper clip is much lighter.'], ['1 litre', 'Litres measure liquid, not weight.']] },
      { q: 'A big watermelon weighs about…', a: '4 kilograms', w: [['4 grams', 'Four grams is lighter than a coin.'], ['40 grams', 'That is about one strawberry.'], ['4 litres', 'Litres measure how much liquid fits, not weight.']] },
      { q: 'A water bottle holds about…', a: '500 millilitres', w: [['500 litres', 'That would fill a bathtub twice over.'], ['5 millilitres', 'That is one teaspoon.'], ['500 grams', 'Grams measure weight. How much fits inside is measured in millilitres.']] },
      { q: 'A bathtub holds about…', a: '200 litres', w: [['200 millilitres', 'That is less than a cup.'], ['2 litres', 'That is one big bottle of lemonade.'], ['200 grams', 'Grams measure weight, not how much liquid fits.']] },
      { q: 'A teaspoon holds about…', a: '5 millilitres', w: [['5 litres', 'Five litres is a small bucket.'], ['500 millilitres', 'That is a whole water bottle.'], ['5 grams', 'Grams measure weight. Liquid inside a spoon is measured in millilitres.']] },
      { q: 'A third grader weighs about…', a: '30 kilograms', w: [['30 grams', 'Thirty grams is about a slice of bread.'], ['300 kilograms', 'That is heavier than a big motorbike.'], ['30 litres', 'Litres measure liquid, not how heavy someone is.']] },
      { q: 'A strawberry weighs about…', a: '12 grams', w: [['12 kilograms', 'Twelve kilograms is about a large dog.'], ['1 kilogram', 'A kilogram is about a bag of sugar.'], ['12 litres', 'Litres measure liquid, not weight.']] }
    ];
    var it = pick(items);
    return {
      eyebrow: 'Measure sense',
      prompt: it.q,
      answer: it.a,
      choices: mc(it.a, it.w),
      steps: [
        'First decide what is being measured: weight uses grams and kilograms, liquid uses millilitres and litres.',
        'Then picture something you know: a paper clip is about 1 gram, a bag of sugar about 1 kilogram, a water bottle about 500 millilitres.',
        'The sensible answer is ' + it.a + '.'
      ],
      explain: 'Grams are tiny, kilograms are about a bag of sugar; millilitres are a sip, litres fill a bottle. The answer is ' + it.a + '.'
    };
  };

  G.barGraph = function () {
    var names = shuffle(['Mon', 'Tue', 'Wed', 'Thu']).slice(0, 4);
    var step = pick([2, 5]);
    var cats = names.map(function (n) { return { name: n, val: ri(1, 6) * step }; });
    var mode = pick(['total', 'diff', 'most']);
    if (mode === 'total') {
      var t = cats.reduce(function (s, c) { return s + c.val; }, 0);
      return {
        eyebrow: 'Read the graph', prompt: 'How many stars were spotted altogether?',
        visual: { type: 'bargraph', cats: cats, step: step }, answer: t,
        choices: mc(t, [
          [t - cats[0].val, 'That leaves one bar out. Every night counts.'],
          [t - step, 'One bar was read one line too low. Each gridline is ' + step + '.'],
          [t + step, 'One bar was read one line too high. Each gridline is ' + step + '.'],
          [t + cats[0].val, 'That counts one bar twice.']
        ]),
        steps: [
          'Read each bar against the scale — every gridline is ' + step + '.',
          'The four nights are ' + cats.map(function (c) { return c.val; }).join(', ') + '.',
          'Add them all: ' + cats.map(function (c) { return c.val; }).join(' + ') + ' = ' + t + '.'
        ],
        explain: 'Add every bar: ' + cats.map(function (c) { return c.val; }).join(' + ') + ' = ' + t + '.'
      };
    }
    if (mode === 'most') {
      var best = cats[0], i;
      for (i = 1; i < cats.length; i++) if (cats[i].val > best.val) best = cats[i];
      return {
        eyebrow: 'Read the graph', prompt: 'Which night had the most stars?',
        visual: { type: 'bargraph', cats: cats, step: step }, answer: best.name,
        choices: shuffle(cats.map(function (c) {
          return c.name === best.name ? { v: c.name, html: c.name }
            : { v: c.name, html: c.name, why: c.name + ' reached ' + c.val + ', but ' + best.name + ' went higher at ' + best.val + '.' };
        })),
        steps: [
          '"Most" means the tallest bar.',
          'Compare the tops: ' + cats.map(function (c) { return c.name + ' ' + c.val; }).join(', ') + '.',
          best.name + ' is tallest with ' + best.val + '.'
        ],
        explain: best.name + ' has the tallest bar at ' + best.val + ' stars.'
      };
    }
    var a = cats[0], b = cats[1];
    if (a.val === b.val) b.val += step;
    var d = Math.abs(a.val - b.val);
    return {
      eyebrow: 'Read the graph', prompt: 'How many more stars on ' + (a.val > b.val ? a.name : b.name) + ' than ' + (a.val > b.val ? b.name : a.name) + '?',
      visual: { type: 'bargraph', cats: cats, step: step }, answer: d,
      choices: mc(d, [
        [a.val + b.val, 'That adds the two bars. "How many more" asks for the gap between them.'],
        [Math.max(a.val, b.val), 'That is just the taller bar on its own.'],
        [d + step, 'That is one gridline too many — each line is ' + step + '.'],
        [d - step, 'That is one gridline short — each line is ' + step + '.']
      ]),
      steps: [
        'Read both bars: ' + Math.max(a.val, b.val) + ' and ' + Math.min(a.val, b.val) + '.',
        '"How many more" means find the difference, so subtract.',
        Math.max(a.val, b.val) + ' − ' + Math.min(a.val, b.val) + ' = ' + d + '.'
      ],
      explain: Math.max(a.val, b.val) + ' − ' + Math.min(a.val, b.val) + ' = ' + d + '.'
    };
  };

  G.pictoGraph = function () {
    var per = pick([2, 5, 10]), icon = pick(['⭐', '🚀', '🪐']);
    var cats = shuffle(['Ava', 'Ben', 'Cleo', 'Dev']).slice(0, 3).map(function (n) { return { name: n, count: ri(2, 6) }; });
    var who = pick(cats);
    var mode = Math.random() < 0.5 ? 'one' : 'diff';
    if (mode === 'one') {
      return {
        eyebrow: 'Picture graph', prompt: 'How many did ' + who.name + ' collect?',
        visual: { type: 'picto', cats: cats, icon: icon, per: per }, answer: who.count * per,
        choices: mc(who.count * per, [
          [who.count, 'That counts the pictures. Each picture is worth ' + per + ', so they have to be multiplied.'],
          [who.count + per, 'That adds the key instead of multiplying by it.'],
          [who.count * per + per, 'That counts one picture too many.'],
          [who.count * per - per, 'That counts one picture too few.']
        ]),
        steps: [
          'Check the key at the bottom: each ' + icon + ' stands for ' + per + '.',
          who.name + ' has ' + who.count + ' pictures.',
          who.count + ' × ' + per + ' = ' + (who.count * per) + '.'
        ],
        explain: who.name + ' has ' + who.count + ' pictures and each one is worth ' + per + ', so ' + who.count + ' × ' + per + ' = ' + (who.count * per) + '.'
      };
    }
    var a = cats[0], b = cats[1];
    if (a.count === b.count) b.count += 1;
    var gap = Math.abs(a.count - b.count), d = gap * per;
    return {
      eyebrow: 'Picture graph', prompt: 'How many more did ' + (a.count > b.count ? a.name : b.name) + ' collect than ' + (a.count > b.count ? b.name : a.name) + '?',
      visual: { type: 'picto', cats: cats, icon: icon, per: per }, answer: d,
      choices: mc(d, [
        [gap, 'That is the difference in pictures. Each picture is worth ' + per + ', so multiply by ' + per + '.'],
        [(a.count + b.count) * per, 'That adds the two rows together instead of comparing them.'],
        [d + per, 'That is one picture too many.'],
        [d - per, 'That is one picture too few.']
      ]),
      steps: [
        'Count the pictures in each row: ' + Math.max(a.count, b.count) + ' and ' + Math.min(a.count, b.count) + '.',
        'The gap is ' + gap + ' picture' + (gap === 1 ? '' : 's') + '.',
        'Each picture is worth ' + per + ', so ' + gap + ' × ' + per + ' = ' + d + '.'
      ],
      explain: 'The difference is ' + gap + ' picture' + (gap === 1 ? '' : 's') + ', worth ' + per + ' each: ' + d + '.'
    };
  };

  /* --- Puzzle Peaks --- */
  G.twoStepMulAdd = function () {
    var start = ri(12, 40), packs = ri(3, 6), per = ri(4, 9), th = pick(THINGS), who = pick(NAMES), cont = pick(CONTAINERS);
    var ans = start + packs * per;
    return {
      eyebrow: 'Two-step problem',
      prompt: who + ' already had ' + start + ' ' + th[0] + '. Then ' + who + ' found ' + packs + ' ' + cont[0] + ' with ' + per + ' in each ' + cont[1] + '.<br>How many ' + th[0] + ' now?',
      answer: ans,
      choices: mc(ans, [
        [packs * per, 'That is only the new ' + th[0] + '. The ' + start + ' from the start still count.'],
        [start + packs + per, 'That adds all three numbers. The ' + packs + ' ' + cont[0] + ' hold ' + per + ' each, so they multiply first.'],
        [start + per, 'That adds only one ' + cont[1] + '. There are ' + packs + '.'],
        [ans - per, 'That leaves one ' + cont[1] + ' out.']
      ]),
      steps: [
        'Step 1 — the new ' + th[0] + ': ' + packs + ' ' + cont[0] + ' × ' + per + ' each = ' + (packs * per) + '.',
        'Step 2 — add what ' + who + ' already had: ' + start + ' + ' + (packs * per) + '.',
        'Altogether that is ' + ans + '.'
      ],
      explain: 'Step 1: ' + packs + ' × ' + per + ' = ' + (packs * per) + '. Step 2: ' + start + ' + ' + (packs * per) + ' = ' + ans + '.'
    };
  };

  G.twoStepDivSub = function () {
    var boxes = ri(4, 8), per = ri(4, 9), total = boxes * per, taken = ri(1, boxes - 2);
    var th = pick(THINGS), who = pick(NAMES), cont = pick(CONTAINERS);
    var ans = (boxes - taken) * per;
    return {
      eyebrow: 'Two-step problem',
      prompt: total + ' ' + th[0] + ' are packed equally into ' + boxes + ' ' + cont[0] + '. ' + who + ' takes ' + taken + ' ' + (taken === 1 ? cont[1] : cont[0]) + ' away.<br>How many ' + th[0] + ' are left?',
      answer: ans,
      choices: mc(ans, [
        [total - taken, 'That takes away ' + taken + ' single ' + th[0] + '. Whole ' + cont[0] + ' left, each holding ' + per + '.'],
        [taken * per, 'That is how many ' + who + ' took away, not how many stayed.'],
        [per, 'That is what one ' + cont[1] + ' holds. There are ' + (boxes - taken) + ' ' + cont[0] + ' left.'],
        [ans - per, 'That leaves one more ' + cont[1] + ' out than it should.']
      ]),
      steps: [
        'Step 1 — what is in one ' + cont[1] + ': ' + total + ' ÷ ' + boxes + ' = ' + per + '.',
        'Step 2 — how many ' + cont[0] + ' are left: ' + boxes + ' − ' + taken + ' = ' + (boxes - taken) + '.',
        'Step 3 — multiply them: ' + (boxes - taken) + ' × ' + per + ' = ' + ans + '.'
      ],
      explain: 'Step 1: ' + total + ' ÷ ' + boxes + ' = ' + per + ' per ' + cont[1] + '. Step 2: ' + (boxes - taken) + ' ' + cont[0] + ' left × ' + per + ' = ' + ans + '.'
    };
  };

  G.patternNext = function () {
    var step = ri(3, 9), start = ri(1, 9), n = 4, seq = [], i;
    for (i = 0; i < n; i++) seq.push(start + i * step);
    var ans = start + n * step;
    return {
      eyebrow: 'Number pattern',
      prompt: 'What comes next?<br>' + seq.join(',  ') + ',  <span class="blank">?</span>',
      answer: ans,
      choices: mc(ans, [
        [ans + step, 'That jumps twice. Only one more step is needed.'],
        [ans + 1, 'The pattern grows by ' + step + ' each time, not by 1.'],
        [ans - step + 1, 'That breaks the pattern — the gaps stop being equal.'],
        [ans + step * 2, 'That jumps three times instead of once.']
      ]),
      steps: [
        'Find the gap between two numbers: ' + seq[1] + ' − ' + seq[0] + ' = ' + step + '.',
        'Check it holds: ' + seq[2] + ' − ' + seq[1] + ' = ' + step + '. The rule is "add ' + step + '".',
        'Apply it once more: ' + seq[n - 1] + ' + ' + step + ' = ' + ans + '.'
      ],
      explain: 'Each number grows by ' + step + '. ' + seq[n - 1] + ' + ' + step + ' = ' + ans + '.'
    };
  };

  G.oddEven = function () {
    var a = ri(2, 9), b = ri(2, 9), p = a * b;
    var even = p % 2 === 0;
    var ans = even ? 'Even' : 'Odd';
    var opts = [{ v: 'Even', html: 'Even' }, { v: 'Odd', html: 'Odd' }];
    opts[even ? 1 : 0].why = even
      ? a + ' × ' + b + ' = ' + p + ', and ' + p + ' splits into two equal halves, so it is even. Any product with an even factor is even.'
      : a + ' × ' + b + ' = ' + p + ', and ' + p + ' cannot split into two equal whole halves. Odd times odd is always odd.';
    return {
      eyebrow: 'Odd or even',
      prompt: 'Is ' + a + ' × ' + b + ' odd or even?',
      answer: ans,
      choices: shuffle(opts),
      steps: [
        'Work out the product: ' + a + ' × ' + b + ' = ' + p + '.',
        'Even numbers end in 0, 2, 4, 6 or 8. This one ends in ' + (p % 10) + '.',
        'So ' + p + ' is ' + ans.toLowerCase() + (even ? ' — and any product with an even factor is even.' : ' — odd times odd is always odd.')
      ],
      explain: a + ' × ' + b + ' = ' + p + ', which is ' + ans.toLowerCase() + '.'
    };
  };

  G.parens = function () {
    var a = ri(2, 9), b = ri(2, 9), c = ri(2, 9);
    if (Math.random() < 0.5) {
      var ans = a * (b + c);
      return {
        eyebrow: 'Brackets first',
        prompt: a + ' × (' + b + ' + ' + c + ')',
        answer: ans,
        choices: mc(ans, [
          [a * b + c, 'That multiplied before adding. The brackets have to be sorted out first.'],
          [a + b + c, 'That adds everything. The ' + a + ' is multiplying the bracket, not joining it.'],
          [a * b * c, 'That multiplies all three. Inside the bracket it is a plus.'],
          [ans + a, 'One extra ' + a + ' slipped in.']
        ]),
        steps: [
          'Brackets always go first: ' + b + ' + ' + c + ' = ' + (b + c) + '.',
          'Now the sum is ' + a + ' × ' + (b + c) + '.',
          'That gives ' + ans + '.'
        ],
        explain: 'Brackets first: ' + b + ' + ' + c + ' = ' + (b + c) + '. Then ' + a + ' × ' + (b + c) + ' = ' + ans + '.'
      };
    }
    var big = Math.max(b, c), sml = Math.min(b, c);
    var diff = big - sml === 0 ? 1 : big - sml;
    return {
      eyebrow: 'Brackets first',
      prompt: a + ' × (' + big + ' − ' + sml + ')',
      answer: a * diff,
      choices: mc(a * diff, [
        [a * big - sml, 'That multiplied before subtracting. Sort the bracket out first.'],
        [big - sml, 'That is only the bracket. It still has to be multiplied by ' + a + '.'],
        [a * big, 'That ignores the subtraction inside the bracket.'],
        [a * diff + a, 'One extra ' + a + ' slipped in.']
      ]),
      steps: [
        'Brackets always go first: ' + big + ' − ' + sml + ' = ' + diff + '.',
        'Now the sum is ' + a + ' × ' + diff + '.',
        'That gives ' + (a * diff) + '.'
      ],
      explain: 'Brackets first: ' + big + ' − ' + sml + ' = ' + diff + '. Then ' + a + ' × ' + diff + ' = ' + (a * diff) + '.'
    };
  };

  G.compareWord = function () {
    var a = ri(12, 48), d = ri(3, 19), b = a + d;
    var unit = pick(['kg', 'litres', 'cm', 'grams']);
    var t1 = pick(['A husky', 'A sky melon', 'A comet rock', 'A pumpkin']), t2 = pick(['a kitten', 'a sky apple', 'a moon pebble', 'a lemon']);
    return {
      eyebrow: 'Compare amounts',
      prompt: t1 + ' measures ' + b + ' ' + unit + '. Also, ' + t2 + ' measures ' + a + ' ' + unit + '.<br>How much more is ' + t1.toLowerCase() + '?',
      answer: d,
      unit: unit,
      choices: mc(d, [
        [a + b, 'That puts them together. "How much more" asks for the gap between them.'],
        [b, 'That is the whole measurement, not the difference.'],
        [a, 'That is the smaller measurement, not the difference.'],
        [d + 1, 'One out — check the subtraction again.']
      ]),
      steps: [
        'The two amounts are ' + b + ' and ' + a + ' ' + unit + '.',
        '"How much more" means find the difference, so subtract the smaller from the bigger.',
        b + ' − ' + a + ' = ' + d + ' ' + unit + '.'
      ],
      explain: '"How much more" means subtract: ' + b + ' − ' + a + ' = ' + d + ' ' + unit + '.'
    };
  };

  /* ================= building sets ================= */
  function make(name) {
    var q = G[name] ? G[name]() : G.factLow();
    q.gen = name;
    return q;
  }

  /* Draw `n` questions from a list of generator names, avoiding repeats. */
  function set(gens, n) {
    var out = [], tries = 0, seen = {};
    while (out.length < n && tries < n * 14) {
      tries++;
      var q = make(gens[out.length % gens.length]);
      var key = q.prompt;
      if (seen[key]) continue;
      seen[key] = 1;
      out.push(q);
    }
    return shuffle(out);
  }

  /* Rebuild a question from a saved fact id, for Tricky Facts drilling. */
  function fromId(id) {
    var m;
    if ((m = /^mul:(\d+)x(\d+)$/.exec(id))) {
      var a = +m[1], b = +m[2];
      if (Math.random() < 0.5) { var t = a; a = b; b = t; }
      var q1 = G.factLow();
      q1.eyebrow = 'Tricky fact'; q1.id = id; q1.answer = a * b;
      q1.prompt = a + ' × ' + b;
      q1.choices = mc(a * b, [
        [a * b + a, 'One ' + a + ' too many — that is ' + a + ' × ' + (b + 1) + '.'],
        [a * b - a, 'One ' + a + ' short — that is ' + a + ' × ' + (b - 1) + '.'],
        [a * b + b, 'One group too many.'],
        [a + b, 'That is ' + a + ' + ' + b + '. The × sign means ' + a + ' groups of ' + b + '.']
      ]);
      q1.steps = ['Read it as ' + a + ' groups of ' + b + '.', 'Count up in ' + b + 's, ' + a + ' times.', a + ' × ' + b + ' = ' + (a * b) + '.'];
      q1.explain = a + ' × ' + b + ' = ' + (a * b) + '.';
      return q1;
    }
    if ((m = /^div:(\d+)\/(\d+)$/.exec(id))) {
      var p = +m[1], d = +m[2], qq = p / d;
      return { gen: 'divFact', eyebrow: 'Tricky fact', prompt: p + ' ÷ ' + d, answer: qq, id: id,
        choices: mc(qq, [
          [qq + 1, d + ' × ' + (qq + 1) + ' = ' + (d * (qq + 1)) + ', past ' + p + '.'],
          [qq - 1, d + ' × ' + (qq - 1) + ' = ' + (d * (qq - 1)) + ', short of ' + p + '.'],
          [d, 'That is the number we are dividing by.'],
          [p - d, 'That takes ' + d + ' away once instead of counting how many fit.']
        ]),
        steps: ['How many ' + d + 's fit inside ' + p + '?', 'Use the fact ' + d + ' × ' + qq + ' = ' + p + '.', 'So ' + p + ' ÷ ' + d + ' = ' + qq + '.'],
        explain: d + ' × ' + qq + ' = ' + p + ', so ' + p + ' ÷ ' + d + ' = ' + qq + '.' };
    }
    if ((m = /^add:(\d+)\+(\d+)$/.exec(id))) {
      var a2 = +m[1], b2 = +m[2];
      return { gen: 'add3', eyebrow: 'Tricky fact', prompt: commas(a2) + ' + ' + commas(b2), answer: a2 + b2, id: id,
        steps: ['Ones first, carrying any extra ten into the next column.', 'Then the tens, then the hundreds.', a2 + ' + ' + b2 + ' = ' + (a2 + b2) + '.'],
        explain: a2 + ' + ' + b2 + ' = ' + (a2 + b2) + '.' };
    }
    if ((m = /^sub:(\d+)-(\d+)$/.exec(id))) {
      var a3 = +m[1], b3 = +m[2];
      return { gen: 'sub3', eyebrow: 'Tricky fact', prompt: commas(a3) + ' − ' + commas(b3), answer: a3 - b3, id: id,
        steps: ['Ones first — borrow from the tens if the top digit is too small.', 'Then the tens, then the hundreds.', a3 + ' − ' + b3 + ' = ' + (a3 - b3) + '.'],
        explain: a3 + ' − ' + b3 + ' = ' + (a3 - b3) + '.' };
    }
    return null;
  }

  /* Name the mistake behind a typed answer. These are the classic grade-3
     slips — dropped carries, borrowing the wrong way round, digit swaps. */
  function digitsOf(n) { return String(n).split('').map(Number); }
  function padTo(arr, len) { while (arr.length < len) arr.unshift(0); return arr; }

  function noCarryAdd(a, b) {
    var x = digitsOf(a), y = digitsOf(b), n = Math.max(x.length, y.length);
    padTo(x, n); padTo(y, n);
    var out = '';
    for (var i = 0; i < n; i++) out += (x[i] + y[i]) % 10;
    return Number(out);
  }
  function noBorrowSub(a, b) {
    var x = digitsOf(a), y = digitsOf(b), n = Math.max(x.length, y.length);
    padTo(x, n); padTo(y, n);
    var out = '';
    for (var i = 0; i < n; i++) out += Math.abs(x[i] - y[i]);
    return Number(out);
  }

  function diagnoseTyped(q, picked) {
    var p = Number(picked), m;
    if (!isFinite(p) || p === q.answer) return null;
    if (q.id && (m = /^add:(\d+)\+(\d+)$/.exec(q.id))) {
      var a = +m[1], b = +m[2];
      if (p === noCarryAdd(a, b)) return 'You added each column on its own and left the carries behind. When a column goes past 9, the extra ten has to move across to the next column.';
      if (p === a - b || p === b - a) return 'That is a subtraction. The sign here is a plus.';
    }
    if (q.id && (m = /^sub:(\d+)-(\d+)$/.exec(q.id))) {
      var c = +m[1], d = +m[2];
      if (p === noBorrowSub(c, d)) return 'In each column you took the smaller digit away from the bigger one. When the top digit is smaller, borrow a ten from the column to its left instead of flipping them round.';
      if (p === c + d) return 'That is an addition. The sign here is a minus.';
    }
    if (Math.abs(p - q.answer) === 1) return 'Only one away — the method was right, so something slipped in the very last step.';
    if (Math.abs(p - q.answer) === 10) return 'Ten out. That usually means one carry or borrow went missing in the tens column.';
    if (Math.abs(p - q.answer) === 100) return 'A hundred out — check the hundreds column again.';
    if (String(p).split('').reverse().join('') === String(q.answer)) return 'Those are the right digits in the wrong order.';
    return null;
  }

  W.MathQ = { make: make, set: set, render: render, fromId: fromId, gens: G, frac: frac, diagnoseTyped: diagnoseTyped };
})(window);
