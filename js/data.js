/* Isha's Star Atlas — content map, rewards and collection data.
   Grade 3 math, organized as eight regions of the night sky. */
(function (W) {
  'use strict';

  /* ---------- Regions: 4 stages + 1 boss each ---------- */
  var REGIONS = [
    {
      id: 'meadow', name: 'Multiplication Meadow', glyph: '🌾', hue: 'teal',
      skill: 'Equal groups, arrays, ×0 to ×5',
      stages: [
        { name: 'Equal Groups', gens: ['eqGroups', 'arrayCount'] },
        { name: 'Skip Counting', gens: ['skipCount', 'repeatedAdd', 'arrayCount'] },
        { name: 'Missing Pieces', gens: ['missFactorLow', 'eqGroups', 'repeatedAdd'] },
        { name: 'Fast Facts', gens: ['factLow', 'missFactorLow'] }
      ],
      boss: { name: 'The Glow-Moth Swarm', glyph: '🦋', gens: ['factLow', 'eqGroups', 'missFactorLow', 'arrayCount', 'skipCount'] },
      beast: 'fox'
    },
    {
      id: 'tower', name: 'Times Table Tower', glyph: '🗼', hue: 'gold',
      skill: 'The ×6 to ×12 facts and smart strategies',
      stages: [
        { name: 'Sixes & Sevens', gens: ['factHigh', 'doubleStrategy'] },
        { name: 'Eights & Nines', gens: ['factHigh', 'missFactorHigh'] },
        { name: 'Flip It Around', gens: ['commutative', 'factHigh'] },
        { name: 'Tower Top', gens: ['multWord', 'factHigh', 'missFactorHigh'] }
      ],
      boss: { name: 'Twelve-Eyed Owl', glyph: '🦉', gens: ['factHigh', 'missFactorHigh', 'commutative', 'multWord', 'doubleStrategy'] },
      beast: 'owlbear'
    },
    {
      id: 'dunes', name: 'Division Dunes', glyph: '🏜️', hue: 'magenta',
      skill: 'Sharing, grouping and division facts',
      stages: [
        { name: 'Fair Shares', gens: ['shareWord', 'divFact'] },
        { name: 'How Many Groups', gens: ['groupsWord', 'divFact'] },
        { name: 'Two Sides of One Fact', gens: ['relateMulDiv', 'missDividend'] },
        { name: 'Dune Dash', gens: ['divFact', 'missDividend', 'shareWord'] }
      ],
      boss: { name: 'Sandscale Serpent', glyph: '🐍', gens: ['divFact', 'shareWord', 'groupsWord', 'relateMulDiv', 'missDividend'] },
      beast: 'dragon'
    },
    {
      id: 'nebula', name: 'Number Nebula', glyph: '🌌', hue: 'violet',
      skill: 'Rounding, and + − within 1,000',
      stages: [
        { name: 'Round About', gens: ['round10', 'round100'] },
        { name: 'Carry the Ten', gens: ['add3', 'round10'] },
        { name: 'Borrow a Hundred', gens: ['sub3', 'add3'] },
        { name: 'Tens at Warp Speed', gens: ['multTens', 'nebulaWord'] }
      ],
      boss: { name: 'Comet Thousand', glyph: '☄️', gens: ['add3', 'sub3', 'round100', 'multTens', 'nebulaWord'] },
      beast: 'whale'
    },
    {
      id: 'falls', name: 'Fraction Falls', glyph: '💧', hue: 'teal',
      skill: 'Naming, comparing and placing fractions',
      stages: [
        { name: 'Name the Part', gens: ['idFraction', 'shapeUnitFrac'] },
        { name: 'Same Size, New Name', gens: ['equivFrac', 'idFraction'] },
        { name: 'Which Is Bigger?', gens: ['cmpSameDen', 'cmpSameNum'] },
        { name: 'Fractions on the Line', gens: ['fracNumline', 'wholeFrac'] }
      ],
      boss: { name: 'Mistfall Koi', glyph: '🐟', gens: ['idFraction', 'equivFrac', 'cmpSameDen', 'cmpSameNum', 'fracNumline', 'wholeFrac'] },
      beast: 'dolphin'
    },
    {
      id: 'shore', name: 'Shape Shore', glyph: '🐚', hue: 'gold',
      skill: 'Area, perimeter and quadrilaterals',
      stages: [
        { name: 'Tile the Floor', gens: ['areaTile', 'areaFormula'] },
        { name: 'All the Way Around', gens: ['perimRect', 'areaFormula'] },
        { name: 'Find the Missing Side', gens: ['missingSide', 'areaVsPerim'] },
        { name: 'Four-Sided Friends', gens: ['quadName', 'shapeUnitFrac'] }
      ],
      boss: { name: 'Hexa the Crab', glyph: '🦀', gens: ['areaTile', 'areaFormula', 'perimRect', 'missingSide', 'quadName', 'areaVsPerim'] },
      beast: 'swan'
    },
    {
      id: 'mesa', name: 'Clockwork Mesa', glyph: '⏰', hue: 'magenta',
      skill: 'Time to the minute, measurement and graphs',
      stages: [
        { name: 'Read the Sky Clock', gens: ['readClock'] },
        { name: 'How Long Was That?', gens: ['elapsed', 'endTime'] },
        { name: 'Grams, Kilos, Litres', gens: ['massVol', 'compareWord'] },
        { name: 'Graph Canyon', gens: ['barGraph', 'pictoGraph'] }
      ],
      boss: { name: 'Tick-Tock Tortoise', glyph: '🐢', gens: ['readClock', 'elapsed', 'endTime', 'massVol', 'barGraph', 'pictoGraph'] },
      beast: 'lion'
    },
    {
      id: 'peaks', name: 'Puzzle Peaks', glyph: '⛰️', hue: 'violet',
      skill: 'Two-step word problems and number patterns',
      stages: [
        { name: 'Two Steps Up', gens: ['twoStepMulAdd'] },
        { name: 'Share, Then Subtract', gens: ['twoStepDivSub', 'twoStepMulAdd'] },
        { name: 'Pattern Ridge', gens: ['patternNext', 'oddEven'] },
        { name: 'Order of Moves', gens: ['parens', 'patternNext'] }
      ],
      boss: { name: 'Riddle Roc', glyph: '🦅', gens: ['twoStepMulAdd', 'twoStepDivSub', 'patternNext', 'oddEven', 'parens', 'compareWord'] },
      beast: 'phoenix'
    }
  ];

  /* ---------- Star Beasts: constellations drawn on a 100 x 72 field ---------- */
  var BEASTS = {
    fox: {
      name: 'Vela the Fox', glyph: '🦊',
      note: 'Nine stars. Her tail points at the north wind.',
      pts: [[12, 50], [25, 42], [22, 28], [36, 36], [52, 32], [68, 38], [74, 44], [90, 26], [31, 62], [64, 62]],
      edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [1, 8], [5, 9], [1, 4]]
    },
    owlbear: {
      name: 'Hoot the Owl', glyph: '🦉',
      note: 'Two bright eyes that never blink.',
      pts: [[38, 20], [62, 20], [50, 34], [28, 36], [72, 36], [34, 56], [66, 56], [50, 64]],
      edges: [[0, 2], [1, 2], [0, 3], [1, 4], [3, 5], [4, 6], [5, 7], [6, 7], [2, 7]]
    },
    dragon: {
      name: 'Ember the Dragon', glyph: '🐉',
      note: 'A long winding river of stars.',
      pts: [[10, 58], [24, 46], [40, 52], [56, 40], [70, 46], [84, 34], [92, 22], [60, 24], [46, 30]],
      edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [3, 8], [8, 7]]
    },
    whale: {
      name: 'Nimbus the Whale', glyph: '🐋',
      note: 'The biggest beast in the atlas.',
      pts: [[10, 44], [22, 32], [48, 28], [74, 38], [90, 24], [90, 52], [46, 56], [20, 52]],
      edges: [[0, 1], [1, 2], [2, 3], [3, 4], [3, 5], [0, 7], [7, 6], [6, 3]]
    },
    dolphin: {
      name: 'Splash the Dolphin', glyph: '🐬',
      note: 'Leaps once every hundred years.',
      pts: [[18, 46], [34, 32], [52, 30], [66, 42], [82, 30], [84, 52], [48, 52]],
      edges: [[0, 1], [1, 2], [2, 3], [3, 4], [3, 5], [0, 6], [6, 3]]
    },
    swan: {
      name: 'Lyra the Swan', glyph: '🦢',
      note: 'Wings stretched right across the sky.',
      pts: [[50, 12], [50, 28], [50, 44], [22, 40], [78, 40], [50, 64]],
      edges: [[0, 1], [1, 2], [2, 3], [2, 4], [2, 5]]
    },
    lion: {
      name: 'Rua the Lion', glyph: '🦁',
      note: 'A curved sickle of six stars.',
      pts: [[20, 54], [28, 38], [42, 28], [58, 26], [72, 34], [84, 48], [56, 50]],
      edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 0]]
    },
    phoenix: {
      name: 'Cinder the Phoenix', glyph: '🔥',
      note: 'Only lights up for a true puzzle solver.',
      pts: [[50, 18], [50, 36], [30, 26], [14, 42], [70, 26], [86, 42], [42, 56], [58, 56]],
      edges: [[0, 1], [0, 2], [2, 3], [0, 4], [4, 5], [1, 6], [1, 7]]
    }
  };

  /* ---------- Shop ---------- */
  var SHOP = [
    { id: 'hint', kind: 'power', name: 'Hint Glass', glyph: '🔎', cost: 20, desc: 'Removes one wrong answer. Stacks up.' },
    { id: 'skip', kind: 'power', name: 'Comet Skip', glyph: '☄️', cost: 30, desc: 'Jump past one question with no mistake.' },
    { id: 'shield', kind: 'power', name: 'Star Shield', glyph: '🛡️', cost: 45, desc: 'Blocks one boss hit.' },
    { id: 'double', kind: 'power', name: 'Double Dust', glyph: '✨', cost: 55, desc: 'Doubles the stardust from your next stage.' },
    { id: 'fox', kind: 'look', name: 'Fox Hood', glyph: '🦊', cost: 70, desc: 'A warm hood for cold nights.' },
    { id: 'cat', kind: 'look', name: 'Sky Cat', glyph: '🐱', cost: 90, desc: 'Purrs in zero gravity.' },
    { id: 'moon', kind: 'look', name: 'Moon Crown', glyph: '🌙', cost: 140, desc: 'Glows softly while you think.' },
    { id: 'uni', kind: 'look', name: 'Star Unicorn', glyph: '🦄', cost: 200, desc: 'Rare. Leaves a trail of sparks.' },
    { id: 'dragon', kind: 'look', name: 'Dragon Wings', glyph: '🐲', cost: 280, desc: 'For Star Keepers who beat bosses.' },
    { id: 'nova', kind: 'look', name: 'Nova Crown', glyph: '👑', cost: 400, desc: 'The brightest thing in the atlas.' }
  ];

  /* ---------- Badges ---------- */
  var BADGES = [
    { id: 'firstlight', name: 'First Light', glyph: '🌟', desc: 'Finish your first stage.' },
    { id: 'perfect', name: 'Perfect Orbit', glyph: '🎯', desc: 'Earn 3 stars on a stage.' },
    { id: 'combo10', name: 'Combo Comet', glyph: '🔥', desc: 'Get 10 right in a row.' },
    { id: 'boss1', name: 'Boss Breaker', glyph: '🗡️', desc: 'Defeat any boss.' },
    { id: 'blitz25', name: 'Lightning Hands', glyph: '⚡', desc: 'Score 25 in one Star Blitz.' },
    { id: 'hundred', name: 'Century Club', glyph: '💯', desc: 'Answer 100 questions.' },
    { id: 'streak7', name: 'Week of Stars', glyph: '📅', desc: 'Practise 7 days in a row.' },
    { id: 'tricky0', name: 'Tricky Tamer', glyph: '🧠', desc: 'Clear every tricky fact.' },
    { id: 'frac', name: 'Fraction Friend', glyph: '💧', desc: 'Finish all of Fraction Falls.' },
    { id: 'atlas', name: 'Atlas Complete', glyph: '🗺️', desc: 'Light up all eight regions.' },
    { id: 'toybox', name: 'Toy Collector', glyph: '🎁', desc: 'Win every toy in the toy box.' },
    { id: 'celestial', name: 'Nova Risen', glyph: '🌟', desc: 'Raise Nova to their Celestial form.' },
    { id: 'week5', name: 'Five Nights', glyph: '🌙', desc: 'Practise on five days in one week.' }
  ];

  /* ---------- Levels ---------- */
  var TITLES = ['Star Spotter', 'Star Scout', 'Sky Tracker', 'Comet Rider', 'Nebula Navigator',
    'Constellation Keeper', 'Moon Captain', 'Galaxy Guide', 'Supernova Scholar', 'Grand Astronomer'];

  function xpForLevel(l) { return 80 + (l - 1) * 45; }
  function titleFor(l) { return TITLES[Math.min(TITLES.length - 1, Math.floor((l - 1) / 3))]; }

  /* ---------- Daily quests ---------- */
  var QUESTS = [
    { id: 'q20', text: 'Answer 20 questions', goal: 20, reward: 25, track: 'answers' },
    { id: 'q35', text: 'Answer 35 questions', goal: 35, reward: 40, track: 'answers' },
    { id: 'c6', text: 'Get 6 right in a row', goal: 6, reward: 25, track: 'combo' },
    { id: 'c12', text: 'Get 12 right in a row', goal: 12, reward: 45, track: 'combo' },
    { id: 's1', text: 'Finish any stage', goal: 1, reward: 30, track: 'stages' },
    { id: 's2', text: 'Finish 2 stages', goal: 2, reward: 50, track: 'stages' },
    { id: 'p1', text: 'Earn 3 stars on a stage', goal: 1, reward: 45, track: 'perfect' },
    { id: 'b1', text: 'Play one Star Blitz', goal: 1, reward: 20, track: 'blitz' },
    { id: 't5', text: 'Practise 5 tricky facts', goal: 5, reward: 35, track: 'tricky' }
  ];

  W.Atlas = {
    REGIONS: REGIONS, BEASTS: BEASTS, SHOP: SHOP, BADGES: BADGES,
    QUESTS: QUESTS, xpForLevel: xpForLevel, titleFor: titleFor,
    region: function (id) { for (var i = 0; i < REGIONS.length; i++) if (REGIONS[i].id === id) return REGIONS[i]; return null; },
    shopItem: function (id) { for (var i = 0; i < SHOP.length; i++) if (SHOP[i].id === id) return SHOP[i]; return null; }
  };
})(window);
