/* Isha's Star Atlas — the live sky behind the app, celebration bursts,
   and short WebAudio chimes. No external assets. */
(function (W, D) {
  'use strict';

  var reduce = W.matchMedia && W.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- starfield ---------------- */
  function Sky(canvas) {
    var ctx = canvas.getContext('2d'), stars = [], w = 0, h = 0, dpr = 1;

    function size() {
      dpr = Math.min(2, W.devicePixelRatio || 1);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = Math.round(Math.min(220, (w * h) / 7000));
      stars = [];
      for (var i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * w, y: Math.random() * h,
          r: Math.random() * 1.5 + 0.35,
          a: Math.random() * 0.6 + 0.2,
          tw: Math.random() * 0.02 + 0.004,
          p: Math.random() * Math.PI * 2,
          drift: Math.random() * 0.05 + 0.01
        });
      }
    }

    function frame() {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        s.p += s.tw;
        var a = s.a + Math.sin(s.p) * 0.28;
        s.y -= s.drift;
        if (s.y < -2) { s.y = h + 2; s.x = Math.random() * w; }
        ctx.globalAlpha = Math.max(0.05, a);
        ctx.fillStyle = i % 11 === 0 ? '#FF79C4' : (i % 7 === 0 ? '#FFC94A' : '#DDE6FF');
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, 6.2832);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (!reduce) W.requestAnimationFrame(frame);
    }

    size();
    W.addEventListener('resize', size);
    frame();
  }

  /* ---------------- celebration bursts ---------------- */
  function Burst(canvas) {
    var ctx = canvas.getContext('2d'), bits = [], running = false, w = 0, h = 0, dpr = 1;
    var COLORS = ['#FFC94A', '#45E0C0', '#FF79C4', '#9B8BFF', '#FFF3CF'];

    function size() {
      dpr = Math.min(2, W.devicePixelRatio || 1);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    W.addEventListener('resize', size);

    function loop() {
      ctx.clearRect(0, 0, w, h);
      var alive = 0;
      for (var i = 0; i < bits.length; i++) {
        var b = bits[i];
        if (b.life <= 0) continue;
        alive++;
        b.life -= 1;
        b.vy += 0.16;
        b.x += b.vx; b.y += b.vy; b.rot += b.vr;
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.rot);
        ctx.globalAlpha = Math.max(0, Math.min(1, b.life / 28));
        ctx.fillStyle = b.c;
        if (b.star) {
          ctx.beginPath();
          for (var k = 0; k < 10; k++) {
            var rad = k % 2 ? b.s * 0.45 : b.s;
            var ang = (Math.PI / 5) * k - Math.PI / 2;
            ctx[k ? 'lineTo' : 'moveTo'](Math.cos(ang) * rad, Math.sin(ang) * rad);
          }
          ctx.closePath(); ctx.fill();
        } else {
          ctx.fillRect(-b.s / 2, -b.s / 4, b.s, b.s / 2);
        }
        ctx.restore();
      }
      if (alive) W.requestAnimationFrame(loop);
      else { running = false; bits = []; ctx.clearRect(0, 0, w, h); }
    }

    function fire(n, originY) {
      if (reduce) return;
      if (!w) size();
      n = n || 60;
      var cx = w / 2, cy = originY === undefined ? h * 0.38 : originY;
      for (var i = 0; i < n; i++) {
        var ang = Math.random() * Math.PI * 2, sp = Math.random() * 7 + 2.5;
        bits.push({
          x: cx + (Math.random() - 0.5) * 70, y: cy,
          vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 4,
          s: Math.random() * 7 + 4, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3,
          c: COLORS[Math.floor(Math.random() * COLORS.length)],
          life: 50 + Math.random() * 30, star: Math.random() < 0.45
        });
      }
      if (!running) { running = true; W.requestAnimationFrame(loop); }
    }

    size();
    return { fire: fire };
  }

  /* ---------------- sound ---------------- */
  var actx = null;
  function ac() {
    if (!actx) {
      var C = W.AudioContext || W.webkitAudioContext;
      if (!C) return null;
      try { actx = new C(); } catch (e) { return null; }
    }
    if (actx.state === 'suspended') actx.resume();
    return actx;
  }

  function tone(freq, start, dur, type, gain) {
    var c = ac(); if (!c) return;
    var o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, c.currentTime + start);
    g.gain.linearRampToValueAtTime(gain === undefined ? 0.16 : gain, c.currentTime + start + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0008, c.currentTime + start + dur);
    o.connect(g); g.connect(c.destination);
    o.start(c.currentTime + start);
    o.stop(c.currentTime + start + dur + 0.02);
  }

  var on = true;
  var Sound = {
    set: function (v) { on = !!v; },
    tap: function () { if (on) tone(620, 0, 0.07, 'triangle', 0.08); },
    right: function (combo) {
      if (!on) return;
      var base = 523.25 * Math.pow(2, Math.min(7, combo || 0) / 12);
      tone(base, 0, 0.12, 'triangle', 0.14);
      tone(base * 1.5, 0.07, 0.16, 'sine', 0.1);
    },
    wrong: function () { if (on) { tone(207, 0, 0.16, 'sawtooth', 0.07); tone(164, 0.08, 0.2, 'sine', 0.07); } },
    star: function () {
      if (!on) return;
      [523, 659, 784, 1047].forEach(function (f, i) { tone(f, i * 0.09, 0.3, 'triangle', 0.13); });
    },
    level: function () {
      if (!on) return;
      [392, 523, 659, 784, 1047, 1319].forEach(function (f, i) { tone(f, i * 0.08, 0.38, 'sine', 0.13); });
    },
    gift: function (isNew) {
      if (!on) return;
      // A quick ribbon-pull, then the toy's chime.
      tone(300, 0, 0.06, 'triangle', 0.06);
      [659, 784, 1047].forEach(function (f, i) { tone(f, 0.1 + i * 0.07, 0.26, 'triangle', 0.12); });
      if (isNew) [1319, 1568].forEach(function (f, i) { tone(f, 0.34 + i * 0.08, 0.34, 'sine', 0.11); });
    },
    hit: function () { if (on) { tone(140, 0, 0.22, 'square', 0.08); } },
    tick: function () { if (on) tone(880, 0, 0.04, 'sine', 0.05); }
  };

  W.FX = { Sky: Sky, Burst: Burst, Sound: Sound, reduce: reduce };
})(window, document);
