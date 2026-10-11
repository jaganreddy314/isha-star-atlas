/* Isha's Star Atlas — Nova, the Star Cub.
   Nova hatches from the first cleared stage and grows a new form at each star
   milestone, so the creature is a picture of what Isha has actually learned.
   Drawn as SVG at every stage, with moods the rest of the app can set. */
(function (W, D) {
  'use strict';

  /* Growth is keyed to stars earned — doing well, not just playing long. */
  var FORMS = [
    { id: 0, name: 'Star Egg', stars: 0, blurb: 'Something is moving in there. Clear a stage to wake it.' },
    { id: 1, name: 'Hatchling', stars: 1, blurb: 'Newly hatched and already curious about numbers.' },
    { id: 2, name: 'Star Cub', stars: 8, blurb: 'Ears up, tail out. Nova follows you everywhere now.' },
    { id: 3, name: 'Glow Cub', stars: 20, blurb: 'Nova has started to shine on their own.' },
    { id: 4, name: 'Starwing', stars: 36, blurb: 'Wings! Nova can reach the high constellations with you.' },
    { id: 5, name: 'Celestial', stars: 60, blurb: 'A full constellation creature. Few Star Keepers get this far.' }
  ];

  function formFor(stars) {
    var f = FORMS[0];
    for (var i = 0; i < FORMS.length; i++) if (stars >= FORMS[i].stars) f = FORMS[i];
    return f;
  }
  function nextForm(stars) {
    for (var i = 0; i < FORMS.length; i++) if (FORMS[i].stars > stars) return FORMS[i];
    return null;
  }

  /* ---------- the drawing ---------- */
  function egg(mood) {
    return '<g class="cub-egg">' +
      '<ellipse class="eg-shell" cx="60" cy="68" rx="30" ry="37"/>' +
      '<path class="eg-spot" d="M44 60a7 7 0 1 0 .1 0z"/>' +
      '<path class="eg-spot" d="M74 80a5 5 0 1 0 .1 0z"/>' +
      '<path class="eg-spot" d="M68 52a4 4 0 1 0 .1 0z"/>' +
      '<path class="eg-crack" d="M38 70 L50 64 L44 78 L58 72 L52 86"/>' +
      '</g>' + (mood === 'happy' ? sparkles() : '');
  }

  function sparkles() {
    var s = '', pts = [[22, 40], [98, 44], [30, 92], [92, 90], [60, 14]];
    for (var i = 0; i < pts.length; i++) {
      s += '<path class="cub-spark" style="--i:' + i + '" d="M' + pts[i][0] + ' ' + (pts[i][1] - 7) +
        ' l2.2 5.2 5.2 2.2 -5.2 2.2 -2.2 5.2 -2.2 -5.2 -5.2 -2.2 5.2 -2.2z"/>';
    }
    return '<g class="cub-sparks">' + s + '</g>';
  }

  function body(form, mood) {
    var f = form.id, s = '';

    /* wings appear at Starwing */
    if (f >= 4) {
      s += '<g class="cub-wings">' +
        '<path class="cw" d="M40 66 C24 60 9 45 4 26 C22 31 36 44 44 58z"/>' +
        '<path class="cw cw-r" d="M80 66 C96 60 111 45 116 26 C98 31 84 44 76 58z"/>' +
        '</g>';
    }

    /* tail from Star Cub onward, longer each form */
    if (f >= 2) {
      var tl = f >= 4 ? 'M86 80 C104 80 112 64 108 48' : 'M86 80 C100 80 106 70 104 58';
      s += '<g class="cub-tail"><path class="ct" d="' + tl + '"/>' +
        '<path class="ct-star" d="M' + (f >= 4 ? '108 42' : '104 52') +
        ' l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z"/></g>';
    }

    s += '<g class="cub-main">';

    /* ears — stubby at first, tall and tufted later */
    var earH = [0, 14, 22, 26, 30, 34][f];
    s += '<path class="cb-ear" d="M44 50 L' + (40 - earH * 0.25) + ' ' + (50 - earH) + ' L56 44z"/>';
    s += '<path class="cb-ear" d="M76 50 L' + (80 + earH * 0.25) + ' ' + (50 - earH) + ' L64 44z"/>';
    s += '<path class="cb-ear-in" d="M46 50 L' + (43 - earH * 0.2) + ' ' + (52 - earH * 0.78) + ' L54 46z"/>';
    s += '<path class="cb-ear-in" d="M74 50 L' + (77 + earH * 0.2) + ' ' + (52 - earH * 0.78) + ' L66 46z"/>';

    /* body */
    s += '<ellipse class="cb-body" cx="60" cy="70" rx="30" ry="28"/>';
    s += '<ellipse class="cb-belly" cx="60" cy="78" rx="19" ry="16"/>';

    /* face */
    if (mood === 'sleep') {
      s += '<path class="cb-lid" d="M44 66 q6 6 12 0"/><path class="cb-lid" d="M64 66 q6 6 12 0"/>';
    } else if (mood === 'happy') {
      s += '<path class="cb-lid" d="M44 68 q6 -8 12 0"/><path class="cb-lid" d="M64 68 q6 -8 12 0"/>';
    } else {
      s += '<g class="cub-eyes">' +
        '<ellipse class="cb-eye" cx="50" cy="66" rx="5.6" ry="6.4"/>' +
        '<ellipse class="cb-eye" cx="70" cy="66" rx="5.6" ry="6.4"/>' +
        '<circle class="cb-glint" cx="52" cy="63.5" r="2"/>' +
        '<circle class="cb-glint" cx="72" cy="63.5" r="2"/>' +
        '</g>';
    }
    s += '<ellipse class="cb-cheek" cx="39" cy="76" rx="6" ry="4"/>';
    s += '<ellipse class="cb-cheek" cx="81" cy="76" rx="6" ry="4"/>';
    s += mood === 'sad'
      ? '<path class="cb-mouth" d="M55 82 q5 -4 10 0"/>'
      : '<path class="cb-mouth" d="M55 78 q5 6 10 0"/>';

    /* a forehead star from Glow Cub, a crown at Celestial */
    if (f >= 3) s += '<path class="cb-mark" d="M60 50 l2.4 5.4 5.4 2.4 -5.4 2.4 -2.4 5.4 -2.4 -5.4 -5.4 -2.4 5.4 -2.4z"/>';
    if (f >= 5) s += '<path class="cb-crown" d="M42 36 L50 24 L60 33 L70 24 L78 36 z"/>';

    s += '</g>';
    if (mood === 'happy') s += sparkles();
    if (mood === 'sleep') s += '<g class="cub-zzz"><text class="cz" x="88" y="40" style="--i:0">z</text>' +
      '<text class="cz" x="97" y="30" style="--i:1">z</text><text class="cz" x="105" y="21" style="--i:2">z</text></g>';
    return s;
  }

  /* `mood`: idle | happy | sad | sleep */
  function svg(stars, mood, cls) {
    var form = formFor(stars);
    var inner = form.id === 0 ? egg(mood) : body(form, mood);
    return '<div class="cub f' + form.id + ' m-' + mood + ' ' + (cls || '') + '">' +
      '<svg viewBox="0 0 120 120" aria-hidden="true">' +
      '<g class="cub-float">' + inner + '</g>' +
      '</svg></div>';
  }

  W.Cub = { FORMS: FORMS, formFor: formFor, nextForm: nextForm, svg: svg };
})(window, document);
