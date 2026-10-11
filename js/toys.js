/* Isha's Star Atlas — the toy box.
   Every correct answer unwraps a present. Toys are drawn from a shuffled bag so
   the same one never turns up twice in a row, and each has its own motion. */
(function (W, D) {
  'use strict';

  var TOYS = [
    { id: 'teddy', name: 'Teddy Bear', g: '🧸', anim: 'hop', r: 'common' },
    { id: 'balloon', name: 'Red Balloon', g: '🎈', anim: 'float', r: 'common' },
    { id: 'ball', name: 'Bouncy Ball', g: '⚽', anim: 'bounce', r: 'common' },
    { id: 'yoyo', name: 'Yo-Yo', g: '🪀', anim: 'drop', r: 'common' },
    { id: 'duck', name: 'Rubber Duck', g: '🦆', anim: 'waddle', r: 'common' },
    { id: 'crayons', name: 'Crayon Set', g: '🖍️', anim: 'wiggle', r: 'common' },
    { id: 'puzzle', name: 'Puzzle Piece', g: '🧩', anim: 'snap', r: 'common' },
    { id: 'drum', name: 'Little Drum', g: '🥁', anim: 'beat', r: 'common' },
    { id: 'kite', name: 'Paper Kite', g: '🪁', anim: 'sway', r: 'common' },
    { id: 'bubbles', name: 'Bubble Wand', g: '🫧', anim: 'float', r: 'common' },
    { id: 'car', name: 'Toy Car', g: '🚗', anim: 'zoom', r: 'common' },
    { id: 'plane', name: 'Paper Plane', g: '✈️', anim: 'glide', r: 'common' },
    { id: 'panda', name: 'Panda Plush', g: '🐼', anim: 'wiggle', r: 'common' },
    { id: 'blocks', name: 'Rainbow Blocks', g: '🧱', anim: 'snap', r: 'common' },
    { id: 'train', name: 'Wind-Up Train', g: '🚂', anim: 'chug', r: 'rare' },
    { id: 'robot', name: 'Tin Robot', g: '🤖', anim: 'march', r: 'rare' },
    { id: 'dino', name: 'Dino Figure', g: '🦕', anim: 'stomp', r: 'rare' },
    { id: 'butterfly', name: 'Clockwork Butterfly', g: '🦋', anim: 'flutter', r: 'rare' },
    { id: 'skate', name: 'Mini Skateboard', g: '🛹', anim: 'roll', r: 'rare' },
    { id: 'lantern', name: 'Star Lantern', g: '🏮', anim: 'swing', r: 'rare' },
    { id: 'dolphin', name: 'Wind-Up Dolphin', g: '🐬', anim: 'leap', r: 'rare' },
    { id: 'music', name: 'Music Box', g: '🎶', anim: 'notes', r: 'rare' },
    { id: 'rocket', name: 'Model Rocket', g: '🚀', anim: 'launch', r: 'legend' },
    { id: 'unicorn', name: 'Glitter Unicorn', g: '🦄', anim: 'gallop', r: 'legend' },
    { id: 'wand', name: 'Magic Wand', g: '🪄', anim: 'sparkle', r: 'legend' },
    { id: 'castle', name: 'Block Castle', g: '🏰', anim: 'build', r: 'legend' },
    { id: 'kaleid', name: 'Kaleidoscope', g: '🔮', anim: 'kaleid', r: 'legend' }
  ];

  var RARITY = {
    common: { label: 'Toy', copies: 3 },
    rare: { label: 'Rare toy', copies: 2 },
    legend: { label: 'Legendary toy!', copies: 1 }
  };

  /* A shuffled bag: commons appear more often, but nothing repeats until the
     bag empties, so every present really is a different toy. */
  var bag = [];
  function refill() {
    bag = [];
    for (var i = 0; i < TOYS.length; i++) {
      for (var c = 0; c < RARITY[TOYS[i].r].copies; c++) bag.push(TOYS[i]);
    }
    for (var j = bag.length - 1; j > 0; j--) {
      var k = Math.floor(Math.random() * (j + 1)), t = bag[j]; bag[j] = bag[k]; bag[k] = t;
    }
  }
  var lastId = null;
  function draw() {
    if (!bag.length) refill();
    var toy = bag.pop();
    if (toy.id === lastId && bag.length) { bag.unshift(toy); toy = bag.pop(); }
    lastId = toy.id;
    return toy;
  }

  /* The weekly chart pays out a guaranteed legendary. */
  function drawRarity(r) {
    var pool = TOYS.filter(function (t) { return t.r === r; });
    return pool[Math.floor(Math.random() * pool.length)];
  }

  var burst = null;
  var live = null;

  function clear() {
    if (!live) return;
    [live.wrap, live.scrim].forEach(function (el) {
      if (el && el.parentNode) el.parentNode.removeChild(el);
    });
    live = null;
  }

  /* Unwrap a present in the middle of the screen. The overlay lives on <body>,
     not inside the view, so it keeps playing while the next question renders. */
  function reveal(toy, isNew) {
    clear();
    var reduced = W.FX && W.FX.reduce;
    // The spotlight sits outside the wrapper: a transformed element becomes the
    // containing block for fixed-position children, which would clip it.
    var scrim = D.createElement('div');
    scrim.className = 'giftscrim';
    scrim.setAttribute('aria-hidden', 'true');
    D.body.appendChild(scrim);

    var wrap = D.createElement('div');
    wrap.className = 'giftwrap r-' + toy.r + (reduced ? ' still' : '');
    wrap.setAttribute('aria-hidden', 'true');
    wrap.innerHTML =
      '<div class="rays"></div>' +
      '<div class="giftbox">' +
        '<div class="gb-lid"></div>' +
        '<div class="gb-body"></div>' +
        '<div class="gb-band"></div>' +
        '<div class="gb-bow">🎀</div>' +
      '</div>' +
      '<div class="toypop"><div class="toy a-' + toy.anim + '">' + toy.g + '</div></div>' +
      '<div class="toylabel">' +
        (isNew ? '<span class="newtag">NEW!</span>' : '') +
        '<b>' + toy.name + '</b>' +
        '<i>' + RARITY[toy.r].label + '</i>' +
      '</div>';
    D.body.appendChild(wrap);
    live = { wrap: wrap, scrim: scrim };

    if (!reduced && burst) setTimeout(function () { burst.fire(toy.r === 'legend' ? 46 : 26, W.innerHeight * 0.40); }, 620);
    setTimeout(function () { if (live && live.wrap === wrap) wrap.classList.add('away'); }, 1500);
    setTimeout(function () { if (live && live.wrap === wrap) clear(); }, 2100);
  }

  W.Toys = {
    list: TOYS,
    rarity: RARITY,
    init: function (b) { burst = b; },
    draw: draw,
    drawRarity: drawRarity,
    reveal: reveal,
    clear: clear,
    byId: function (id) { for (var i = 0; i < TOYS.length; i++) if (TOYS[i].id === id) return TOYS[i]; return null; }
  };
})(window, document);
