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
      var w = wrongs[i];
      if (w === null || w === undefined || seen[String(w)]) continue;
      if (typeof w === 'number' && (w < 0 || !isFinite(w))) continue;
      seen[String(w)] = 1;
      out.push({ v: w, html: fmt(w) });
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

  /* ================= generators ================= */
  var G = {};

  /* --- Multiplication Meadow --- */
  G.eqGroups = function () {
    var g = ri(2, 6), p = ri(2, 5), th = pick(THINGS);
    return {
      eyebrow: 'Equal groups',
      prompt: g + ' groups of ' + p + ' ' + th[0] + '. How many in all?',
      visual: { type: 'groups', groups: g, per: p },
      answer: g * p,
      choices: mc(g * p, [g + p, g * p + p, g * p - p, g * (p + 1)]),
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
      choices: mc(r * c, [r + c, r * c + r, r * c - c, (r + 1) * c]),
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
      choices: mc(ans, [ans + step, ans - step + 1, ans + 1, ans + step * 2]),
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
      choices: mc(right, [num + ' × ' + num, times + ' + ' + num, (times + 1) + ' × ' + num]),
      explain: num + ' is added ' + times + ' times, and that is exactly ' + times + ' × ' + num + ' = ' + (times * num) + '.'
    };
  };

  G.missFactorLow = function () {
    var a = ri(2, 5), b = ri(2, 9), p = a * b;
    return {
      eyebrow: 'Missing factor',
      prompt: a + ' × <span class="blank">?</span> = ' + p,
      answer: b,
      choices: mc(b, [b + 1, b - 1, p - a, b + 2]),
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
      choices: mc(a * b, [a * b + a, a * b - a, a * b + b, a + b]),
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
      choices: mc(a * b, [a * b + a, a * b - a, a * b + b, a * b - b]),
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
      choices: mc(b, [b + 1, b - 1, b + 2, p - a]),
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
      choices: mc(a, [b, a * b, a + b, a + 1]),
      explain: 'Order never changes a product, so ' + b + ' × ' + a + ' is the same as ' + a + ' × ' + b + ' = ' + (a * b) + '.'
    };
  };

  G.doubleStrategy = function () {
    var half = ri(3, 6), b = ri(4, 9), a = half * 2;
    return {
      eyebrow: 'Doubling trick',
      prompt: 'You know ' + half + ' × ' + b + ' = ' + (half * b) + '.<br>So what is ' + a + ' × ' + b + '?',
      answer: a * b,
      choices: mc(a * b, [half * b + b, half * b, a * b + b, half * b * 3]),
      explain: a + ' is double ' + half + ', so double the answer too: ' + (half * b) + ' + ' + (half * b) + ' = ' + (a * b) + '.'
    };
  };

  G.multWord = function () {
    var cont = pick(CONTAINERS), th = pick(THINGS), n = ri(4, 9), per = ri(5, 12), who = pick(NAMES);
    return {
      eyebrow: 'Word problem',
      prompt: who + ' has ' + n + ' ' + cont[0] + ' of ' + th[0] + '. Each ' + cont[1] + ' holds ' + per + '.<br>How many ' + th[0] + ' is that?',
      answer: n * per,
      choices: mc(n * per, [n + per, n * per + per, n * per - n, (n + 1) * per]),
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
      choices: mc(q, [q + 1, q - 1, a - b, b]),
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
      choices: mc(each, [each + 1, each - 1, total - kids, kids]),
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
      choices: mc(groups, [groups + 1, groups - 1, per, total - per]),
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
      choices: mc(a, [b, p - b, a + 1, a - 1]),
      explain: 'Multiplication and division undo each other, so ' + p + ' ÷ ' + b + ' = ' + a + '.'
    };
  };

  G.missDividend = function () {
    var b = ri(3, 9), q = ri(3, 9), a = b * q;
    return {
      eyebrow: 'Missing number',
      prompt: '<span class="blank">?</span> ÷ ' + b + ' = ' + q,
      answer: a,
      choices: mc(a, [b + q, a + b, a - b, b * q + 1]),
      explain: 'Work backwards by multiplying: ' + b + ' × ' + q + ' = ' + a + '.'
    };
  };

  /* --- Number Nebula --- */
  G.round10 = function () {
    var n = ri(112, 989);
    while (n % 10 === 0) n = ri(112, 989);
    var ans = Math.round(n / 10) * 10;
    if (n % 10 === 5) ans = (Math.floor(n / 10) + 1) * 10;
    return {
      eyebrow: 'Rounding',
      prompt: 'Round ' + n + ' to the nearest ten.',
      answer: ans,
      choices: mc(ans, [ans + 10, ans - 10, Math.round(n / 100) * 100, ans + 1]),
      explain: 'The ones digit is ' + (n % 10) + '. ' + ((n % 10) >= 5 ? '5 or more rounds up' : 'less than 5 rounds down') + ', so ' + n + ' → ' + ans + '.'
    };
  };

  G.round100 = function () {
    var n = ri(112, 979);
    var ans = Math.round(n / 100) * 100;
    if (n % 100 === 50) ans = (Math.floor(n / 100) + 1) * 100;
    return {
      eyebrow: 'Rounding',
      prompt: 'Round ' + n + ' to the nearest hundred.',
      answer: ans,
      choices: mc(ans, [ans + 100, ans - 100, Math.round(n / 10) * 10]),
      explain: 'Look at the tens digit, ' + Math.floor((n % 100) / 10) + '. That makes ' + n + ' closer to ' + ans + '.'
    };
  };

  G.add3 = function () {
    var a = ri(118, 679), b = ri(118, 679);
    return {
      eyebrow: 'Add within 1,000',
      prompt: commas(a) + ' + ' + commas(b),
      answer: a + b,
      explain: 'Add ones, then tens, then hundreds, carrying when a column passes 9: ' + a + ' + ' + b + ' = ' + (a + b) + '.',
      id: 'add:' + a + '+' + b,
      hintChoices: true
    };
  };

  G.sub3 = function () {
    var a = ri(320, 985), b = ri(118, a - 40);
    return {
      eyebrow: 'Subtract within 1,000',
      prompt: commas(a) + ' − ' + commas(b),
      answer: a - b,
      explain: 'Line up the places and borrow when the top digit is too small: ' + a + ' − ' + b + ' = ' + (a - b) + '.',
      id: 'sub:' + a + '-' + b,
      hintChoices: true
    };
  };

  G.multTens = function () {
    var a = ri(2, 9), t = ri(2, 9) * 10;
    return {
      eyebrow: 'Multiply by tens',
      prompt: a + ' × ' + t,
      answer: a * t,
      choices: mc(a * t, [a * t / 10, a * t * 10, a * t + 10, a * (t / 10)]),
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
        explain: 'More arriving means add: ' + a + ' + ' + b + ' = ' + (a + b) + '.'
      };
    }
    var big = a + b;
    return {
      eyebrow: 'Word problem',
      prompt: 'The sky library had ' + big + ' ' + th[0] + '. ' + b + ' were taken home.<br>How many are left?',
      answer: a,
      explain: 'Taken away means subtract: ' + big + ' − ' + b + ' = ' + a + '.'
    };
  };

  /* --- Fraction Falls --- */
  G.idFraction = function () {
    var d = pick([2, 3, 4, 5, 6, 8]), n = ri(1, d - 1);
    return {
      eyebrow: 'Name the fraction',
      prompt: 'What fraction of the bar is lit?',
      visual: { type: 'fracbar', parts: d, shaded: n },
      answer: fracStr(n, d),
      choices: mc(fracStr(n, d), [fracStr(d, n), fracStr(n + 1, d), fracStr(n, d + 1), fracStr(d - n, d)],
        function (v) { var p = String(v).split('/'); return frac(p[0], p[1]); }),
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
      choices: mc(fracStr(1, d), [fracStr(d, 1), fracStr(1, d - 1), fracStr(2, d), fracStr(1, d + 1)],
        function (v) { var p = String(v).split('/'); return frac(p[0], p[1]); }),
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
      choices: mc(n * k, [n, n * k + 1, n * k - 1, d * k - n * k]),
      explain: 'Each of the ' + d + ' parts was cut into ' + k + ', so the lit parts also multiply by ' + k + ': ' + n + ' × ' + k + ' = ' + (n * k) + '.'
    };
  };

  G.cmpSameDen = function () {
    var d = pick([4, 5, 6, 8]), a = ri(1, d - 1), b = ri(1, d - 1);
    while (b === a) b = ri(1, d - 1);
    var hi = Math.max(a, b);
    return {
      eyebrow: 'Compare fractions',
      prompt: 'Which fraction is greater?',
      visual: { type: 'fracbars', bars: [{ parts: d, shaded: a, label: a + '/' + d }, { parts: d, shaded: b, label: b + '/' + d }] },
      answer: fracStr(hi, d),
      choices: shuffle([{ v: fracStr(a, d), html: frac(a, d) }, { v: fracStr(b, d), html: frac(b, d) }]),
      explain: 'The parts are the same size, so more parts wins: ' + hi + '/' + d + ' is greater.'
    };
  };

  G.cmpSameNum = function () {
    var n = ri(1, 3), d1 = pick([2, 3, 4]), d2 = pick([6, 8, 10]);
    if (n >= d1) n = 1;
    return {
      eyebrow: 'Compare fractions',
      prompt: 'Same number of parts, different sizes.<br>Which fraction is greater?',
      visual: { type: 'fracbars', bars: [{ parts: d1, shaded: n, label: n + '/' + d1 }, { parts: d2, shaded: n, label: n + '/' + d2 }] },
      answer: fracStr(n, d1),
      choices: shuffle([{ v: fracStr(n, d1), html: frac(n, d1) }, { v: fracStr(n, d2), html: frac(n, d2) }]),
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
      choices: mc(fracStr(n, d), [fracStr(n + 1, d), fracStr(d, n), fracStr(n - 1, d), fracStr(n, d + 1)],
        function (v) { var p = String(v).split('/'); return frac(p[0], p[1]); }),
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
        choices: mc(1, [d, 0, 2, d * 2]),
        explain: 'All ' + d + ' of the ' + d + ' parts are lit, and that is one whole: ' + d + '/' + d + ' = 1.'
      };
    }
    var k = ri(2, 5);
    return {
      eyebrow: 'Whole numbers as fractions',
      prompt: 'Which fraction equals ' + k + '?',
      answer: fracStr(k, 1),
      choices: mc(fracStr(k, 1), [fracStr(1, k), fracStr(k, k), fracStr(k, 2)],
        function (v) { var p = String(v).split('/'); return frac(p[0], p[1]); }),
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
      choices: mc(r * c, [2 * (r + c), r + c, r * c + c, (r + 1) * c]),
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
      choices: mc(a * b, [2 * (a + b), a + b, a * b + a, (a + 1) * b]),
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
      choices: mc(2 * (a + b), [a * b, a + b, 2 * a + b, 2 * (a + b) + 2]),
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
      choices: mc(b, [a * b - a, b + 1, b - 1, a]),
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
    var winner = p0 > p1 ? 0 : 1;
    var lbl = function (t) { return t[0] + ' by ' + t[1]; };
    return {
      eyebrow: 'Same area, different shape',
      prompt: 'Both rectangles have an area of ' + area + ' square cm.<br>Which one has the <b>longer</b> perimeter?',
      answer: lbl(two[winner]),
      choices: shuffle([{ v: lbl(two[0]), html: lbl(two[0]) }, { v: lbl(two[1]), html: lbl(two[1]) }]),
      explain: lbl(two[0]) + ' goes around ' + p0 + ' cm and ' + lbl(two[1]) + ' goes around ' + p1 + ' cm. Long thin rectangles have bigger perimeters.'
    };
  };

  G.quadName = function () {
    var kinds = ['square', 'rectangle', 'rhombus', 'trapezoid', 'parallelogram', 'hexagon', 'pentagon', 'triangle'];
    var k = pick(kinds);
    var wrong = shuffle(kinds.filter(function (x) { return x !== k; })).slice(0, 3).map(function (x) { return SHAPES[x].name; });
    return {
      eyebrow: 'Name the shape',
      prompt: 'What is this shape called?',
      visual: { type: 'shape', kind: k },
      answer: SHAPES[k].name,
      choices: mc(SHAPES[k].name, wrong),
      explain: 'It is a ' + SHAPES[k].name.toLowerCase() + '.' +
        (k === 'rhombus' ? ' Four equal sides, but tilted.' : k === 'trapezoid' ? ' Exactly one pair of parallel sides.' : '')
    };
  };

  /* --- Clockwork Mesa --- */
  G.readClock = function () {
    var h = ri(1, 12), m = ri(0, 11) * 5 + pick([0, 0, 1, 2, 3, 4]);
    if (m > 59) m = 55;
    var ans = timeStr(h, m);
    var alt = [timeStr(h === 12 ? 1 : h + 1, m), timeStr(h, (m + 5) % 60), timeStr(h, (m + 30) % 60), timeStr(h === 1 ? 12 : h - 1, m)];
    return {
      eyebrow: 'Tell the time',
      prompt: 'What time is it?',
      visual: { type: 'clock', h: h, m: m },
      answer: ans,
      choices: mc(ans, alt),
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
      choices: mc(durStr(dur), [durStr(dur + 5), durStr(dur + 60), durStr(Math.max(5, dur - 10)), durStr(dur + 15)]),
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
      choices: mc(ans, [timeStr(eh, (em + 5) % 60), timeStr(eh === 12 ? 1 : eh + 1, em), timeStr(h, (m + dur) % 60), timeStr(eh, (em + 30) % 60)]),
      explain: timeStr(h, m) + ' plus ' + dur + ' minutes lands on ' + ans + '.'
    };
  };

  G.massVol = function () {
    var items = [
      { q: 'A single paper clip weighs about…', a: '1 gram', w: ['1 kilogram', '100 grams', '1 litre'] },
      { q: 'A big watermelon weighs about…', a: '4 kilograms', w: ['4 grams', '40 grams', '4 litres'] },
      { q: 'A water bottle holds about…', a: '500 millilitres', w: ['500 litres', '5 millilitres', '500 grams'] },
      { q: 'A bathtub holds about…', a: '200 litres', w: ['200 millilitres', '2 litres', '200 grams'] },
      { q: 'A teaspoon holds about…', a: '5 millilitres', w: ['5 litres', '500 millilitres', '5 grams'] },
      { q: 'A third grader weighs about…', a: '30 kilograms', w: ['30 grams', '300 kilograms', '30 litres'] },
      { q: 'A strawberry weighs about…', a: '12 grams', w: ['12 kilograms', '1 kilogram', '12 litres'] }
    ];
    var it = pick(items);
    return {
      eyebrow: 'Measure sense',
      prompt: it.q,
      answer: it.a,
      choices: mc(it.a, it.w),
      explain: 'Grams are tiny, kilograms are about a bag of rice; millilitres are a sip, litres fill a bottle. The answer is ' + it.a + '.'
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
        choices: mc(t, [t - step, t + step, t - cats[0].val, t + cats[0].val]),
        explain: 'Add every bar: ' + cats.map(function (c) { return c.val; }).join(' + ') + ' = ' + t + '.'
      };
    }
    if (mode === 'most') {
      var best = cats[0];
      for (var i = 1; i < cats.length; i++) if (cats[i].val > best.val) best = cats[i];
      return {
        eyebrow: 'Read the graph', prompt: 'Which night had the most stars?',
        visual: { type: 'bargraph', cats: cats, step: step }, answer: best.name,
        choices: shuffle(cats.map(function (c) { return { v: c.name, html: c.name }; })),
        explain: best.name + ' has the tallest bar at ' + best.val + ' stars.'
      };
    }
    var a = cats[0], b = cats[1];
    if (a.val === b.val) b.val += step;
    var d = Math.abs(a.val - b.val);
    return {
      eyebrow: 'Read the graph', prompt: 'How many more stars on ' + (a.val > b.val ? a.name : b.name) + ' than ' + (a.val > b.val ? b.name : a.name) + '?',
      visual: { type: 'bargraph', cats: cats, step: step }, answer: d,
      choices: mc(d, [a.val + b.val, d + step, Math.max(a.val, b.val), d - step]),
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
        choices: mc(who.count * per, [who.count, who.count * per + per, who.count + per, who.count * per - per]),
        explain: who.name + ' has ' + who.count + ' pictures and each one is worth ' + per + ', so ' + who.count + ' × ' + per + ' = ' + (who.count * per) + '.'
      };
    }
    var a = cats[0], b = cats[1];
    if (a.count === b.count) b.count += 1;
    var d = Math.abs(a.count - b.count) * per;
    return {
      eyebrow: 'Picture graph', prompt: 'How many more did ' + (a.count > b.count ? a.name : b.name) + ' collect than ' + (a.count > b.count ? b.name : a.name) + '?',
      visual: { type: 'picto', cats: cats, icon: icon, per: per }, answer: d,
      choices: mc(d, [Math.abs(a.count - b.count), d + per, d - per, (a.count + b.count) * per]),
      explain: 'The difference is ' + Math.abs(a.count - b.count) + ' picture' + (Math.abs(a.count - b.count) === 1 ? '' : 's') + ', worth ' + per + ' each: ' + d + '.'
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
      choices: mc(ans, [start + packs + per, packs * per, ans - per, start + per]),
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
      choices: mc(ans, [total - taken, taken * per, per, ans - per]),
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
      choices: mc(ans, [ans + step, ans - step + 1, ans + 1, ans + step * 2]),
      explain: 'Each number grows by ' + step + '. ' + seq[n - 1] + ' + ' + step + ' = ' + ans + '.'
    };
  };

  G.oddEven = function () {
    var a = ri(2, 9), b = ri(2, 9), p = a * b;
    var ans = p % 2 === 0 ? 'Even' : 'Odd';
    return {
      eyebrow: 'Odd or even',
      prompt: 'Is ' + a + ' × ' + b + ' odd or even?',
      answer: ans,
      choices: shuffle([{ v: 'Even', html: 'Even' }, { v: 'Odd', html: 'Odd' }]),
      explain: a + ' × ' + b + ' = ' + p + ', which is ' + ans.toLowerCase() + '. Any product with an even factor is even.'
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
        choices: mc(ans, [a * b + c, a + b + c, a * b * c, ans + a]),
        explain: 'Brackets first: ' + b + ' + ' + c + ' = ' + (b + c) + '. Then ' + a + ' × ' + (b + c) + ' = ' + ans + '.'
      };
    }
    var big = Math.max(b, c), sml = Math.min(b, c);
    var diff = big - sml === 0 ? 1 : big - sml;
    return {
      eyebrow: 'Brackets first',
      prompt: a + ' × (' + big + ' − ' + sml + ')',
      answer: a * diff,
      choices: mc(a * diff, [a * big - sml, big - sml, a * big, a * diff + a]),
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
      choices: mc(d, [a + b, d + 1, b, a]),
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
      return { gen: 'factLow', eyebrow: 'Tricky fact', prompt: a + ' × ' + b, answer: a * b, id: id,
        choices: mc(a * b, [a * b + a, a * b - a, a * b + b, a + b]), explain: a + ' × ' + b + ' = ' + (a * b) + '.' };
    }
    if ((m = /^div:(\d+)\/(\d+)$/.exec(id))) {
      var p = +m[1], d = +m[2];
      return { gen: 'divFact', eyebrow: 'Tricky fact', prompt: p + ' ÷ ' + d, answer: p / d, id: id,
        choices: mc(p / d, [p / d + 1, p / d - 1, d, p - d]), explain: d + ' × ' + (p / d) + ' = ' + p + '.' };
    }
    if ((m = /^add:(\d+)\+(\d+)$/.exec(id))) {
      return { gen: 'add3', eyebrow: 'Tricky fact', prompt: commas(+m[1]) + ' + ' + commas(+m[2]), answer: +m[1] + +m[2], id: id,
        explain: m[1] + ' + ' + m[2] + ' = ' + (+m[1] + +m[2]) + '.' };
    }
    if ((m = /^sub:(\d+)-(\d+)$/.exec(id))) {
      return { gen: 'sub3', eyebrow: 'Tricky fact', prompt: commas(+m[1]) + ' − ' + commas(+m[2]), answer: +m[1] - +m[2], id: id,
        explain: m[1] + ' − ' + m[2] + ' = ' + (+m[1] - +m[2]) + '.' };
    }
    return null;
  }

  W.MathQ = { make: make, set: set, render: render, fromId: fromId, gens: G, frac: frac };
})(window);
