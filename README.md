# Isha's Star Atlas

**Play it: https://jaganreddy314.github.io/isha-star-atlas/**

A gamified grade-3 maths game. Isha plays a Star Keeper who lights up
constellations by solving maths problems. Eight regions of the night sky, each
covering one strand of the US grade 3 curriculum, with four stages and a boss.

## Run it

```sh
python3 -m http.server 8744
# then open http://localhost:8744
```

No build step and no dependencies — plain HTML, CSS and ES5 JavaScript.

## What it covers

| Region | Maths |
| --- | --- |
| Multiplication Meadow | equal groups, arrays, repeated addition, ×0–×5 |
| Times Table Tower | ×6–×12, missing factors, commutativity, doubling |
| Division Dunes | fair shares, grouping, ÷ facts, the ×/÷ link |
| Number Nebula | rounding to 10 and 100, + and − within 1,000, ×tens |
| Fraction Falls | naming, equivalence, comparing, fractions on a number line |
| Shape Shore | area by tiling and formula, perimeter, missing sides, quadrilaterals |
| Clockwork Mesa | time to the minute, elapsed time, mass and volume, bar and picture graphs |
| Puzzle Peaks | two-step word problems, number patterns, odd/even, brackets |

## How the game works

- **Stars** — 3 for a clean run, 2 for one or two slips, 1 otherwise. A stage
  unlocks the next; all four unlock the region boss.
- **Bosses** — 12 questions, 3 hearts. Beat one and its Star Beast constellation
  joins the collection.
- **Combos** — 5 in a row doubles XP and stardust, 10 in a row triples it.
- **Presents** — every correct answer unwraps a toy, drawn from a shuffled bag
  so no two in a row match. 27 toys across three rarities, each with its own
  animation, collected in the Toy Box. A first-time toy pays 5 extra stardust.
  Star Blitz is too fast for one per answer, so it awards a toy per 5 correct
  at the end.
- **The repair panel** — a missed answer opens "Let's relight this star": it
  names the specific mistake behind the answer she picked, walks the method
  through step by step, then shows the answer. Clicking "I've got it now"
  pays 2 stardust. Multiple-choice distractors each carry their own reason;
  typed answers are diagnosed for dropped carries, borrowing the wrong way
  round, digit swaps and off-by-one slips.
- **Tricky Facts** — every missed fact is recorded by id and can be drilled
  directly. One correct answer retires one miss.
- **Star Blitz** — 60 seconds of × and ÷ facts, with a personal best.
- **Stardust Shop** — helpers (hint, skip, shield, double dust) and looks.
- **Daily quests and a day streak** reset each day.
- **Grown-ups tab** — per-region accuracy, minutes practised and the current
  tricky list.

Wrong answers always show a short explanation of the method, and a fresh
question of the same type is added back into the stage.

## Deploying

The site is plain static files served by GitHub Pages from the `main` branch
root. Push to `main` and the live site updates a minute or so later.

`index.html` is a standalone HTML document, which is what Pages needs. Claude
Artifacts supply their own `<head>`, so republishing there uses a stripped copy:

```sh
./scripts/make-artifact.sh   # writes build/, publish build/index.html
```

## Files

```
index.html       page shell (standalone document)
styles.css       the whole night-sky look
js/data.js       regions, stages, constellations, shop, badges, quests
js/questions.js  47 question generators, their SVG visuals, worked steps,
                 per-distractor reasons and the typed-answer diagnostics
js/state.js      saved progress (localStorage, guarded)
js/fx.js         starfield, celebration bursts, WebAudio chimes
js/toys.js       the toy roster and the present-unwrapping animation
js/app.js        screens and the stage loop
scripts/         make-artifact.sh, for the Claude Artifact variant
```

Progress saves to `localStorage` under `isha-star-atlas-v1`. "Erase all
progress" lives at the bottom of the Grown-ups tab.
