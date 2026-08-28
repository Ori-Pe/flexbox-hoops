# Flexbox Hoops — Design Spec

**Date:** 2026-08-28
**Source assignment:** `מטלה 2.pdf` (תרגיל מספר 2 — משחק ללימוד Flexbox)
**Status:** Approved for planning

## 1. Overview

A single-page basketball-themed game that teaches CSS Flexbox. Each of 12
levels shows a fixed-size court containing one or more balls (flex items,
inside a real flex container the player controls) and the same number of
faded target baskets (a second, identical-geometry flex container rendered
underneath, permanently styled with that level's *correct* flex properties).
The player edits raw CSS declarations in a small code-block textarea; when
their properties make each ball's rendered position coincide with its
paired basket, the level is solved.

This directly follows the mechanic of Flexbox Froggy (frog → lilypad) with
an original theme (ball → basket) and original level set — no design,
characters, or stage content copied from Froggy, per the assignment's
constraint.

## 2. Goals / non-goals

**Goals:** meet every minimum requirement in the assignment; exceed it with
extra levels, scoring, persistence, and animated feedback (the assignment's
own suggestions for a higher grade); keep the whole thing pure HTML/CSS/JS
with zero external libraries and zero build step, since it ships as a
static site to GitHub Pages.

**Non-goals:** no backend, no accounts, no level editor, no drag-and-drop
(properties are set via the CSS editor, not by dragging balls), no support
for browsers without ES module `<script type="module">` support.

## 3. Architecture

Static site, no bundler, no runtime dependencies. Game logic is split into
ES modules so the *same* source files load in the browser and in Node's
built-in test runner — no duplication, no build step to keep in sync.

```
task2/
  index.html
  css/
    styles.css
  js/
    levels.js       pure data — the 12 level definitions
    parser.js       parse(text) -> {property: value}, whitelist-filtered
    geometry.js     isAligned(rectA, rectB, tolerance) -> boolean (pure)
    progress.js     localStorage read/write, plus pure serialize/parse helpers
    scoring.js       pure attempt-counter helpers
    game.js         DOM rendering, event wiring, state machine
    main.js         bootstrap (DOMContentLoaded -> game.init())
  tests/
    parser.test.js
    levels.test.js   validates level data against the assignment's own rules
    geometry.test.js
    progress.test.js
    scoring.test.js
  package.json       "type":"module", scripts.test = "node --test"
  README.md
  .gitignore
```

**Testability boundary:** `parser.js`, `levels.js` (as data + a
`validateLevels()` function), `geometry.js`, `progress.js`'s pure
helpers, and `scoring.js` are plain functions with no DOM access — these
are unit tested with `node --test` / `node:assert`, zero dependencies.
`game.js` and `main.js` own all DOM/rendering/event-handling and are
verified by hand in the browser, since flexbox visual correctness is
inherently a visual check, not something worth faking a DOM for.

## 4. Data model

```js
// levels.js
export const LEVELS = [
  {
    id: 'baseline-drive',
    title: 'Baseline Drive',
    goal: 'One ball, one basket on the right edge of the court. Send the ball there.',
    hint: 'justify-content moves items along the main axis: flex-start, flex-end, center, space-between, space-around.',
    ballCount: 1,
    base: {},                                    // preset container styles, always applied
    editableTargets: [{ kind: 'container' }],     // which CSS block(s) the player edits
    solution: { container: { justifyContent: 'flex-end' } },
  },
  // ... 11 more, see table below
];
```

Each level: `id`, `title`, `goal` (instruction text shown to the player),
`hint` (optional, revealed on demand), `ballCount`, `base` (container
styles applied unconditionally, e.g. a fixed `gap`), `editableTargets`
(one entry per CSS block the player can edit — either the shared
`container` or one specific `{ kind: 'item', index }`), and `solution`
(the property values that make it correct, in the same shape).

### Level list (12 — 2× the assignment's minimum of 6)

| # | Title | Balls | Solution | Combines >1 property? |
|---|-------|-------|----------|---|
| 1 | Baseline Drive | 1 | `justify-content: flex-end` | |
| 2 | Top of the Key | 1 | `justify-content: center` | |
| 3 | Spread the Floor | 3 | `justify-content: space-between` | |
| 4 | Even Spacing | 3 | `justify-content: space-around` | |
| 5 | Low Post | 1 | `align-items: flex-end` | |
| 6 | Center Court | 1 | `justify-content: center` + `align-items: center` | ✓ |
| 7 | Fast Break Back | 3 | `flex-direction: row-reverse` | |
| 8 | Stack the Rack | 3 | `flex-direction: column` | |
| 9 | Bottom Up | 3 | `flex-direction: column-reverse` + `justify-content: flex-end` | ✓ |
| 10 | Sub Him Out | 3 | ball 0: `order: 1` | |
| 11 | One Man Down Low | 3 | base `align-items: flex-start` + ball 1: `align-self: flex-end` | ✓ |
| 12 | Full Roster | 8 | `flex-wrap: wrap` (base `gap`, `align-content: space-between`) | |

Covers every required property (`display: flex` implicitly always-on,
`flex-direction` in 7/8/9, `justify-content` in 1/2/3/4/6/9, `align-items`
in 5/6, `flex-wrap` in 12) and hits the ≥3-combined-properties requirement
exactly at levels 6, 9, 11. Levels 10–11 use `order`/`align-self` — bonus
properties beyond the required list, and the assignment's "additional
varied levels" grading bonus.

## 5. Controls & correctness check

**Editing:** each level renders one or more small code-block panels
(`.court { }` style), each backed by a `<textarea>`. Input is parsed live
by `parser.js`: split on `;`/newline, `prop: value` pairs, kebab-case
converted to camelCase, filtered against a fixed property whitelist
(`display`, `flexDirection`, `flexWrap`, `justifyContent`, `alignItems`,
`alignContent`, `alignSelf`, `order`, `gap`, `flex`, …). Unrecognized or
malformed lines are silently dropped, not errored — matches how a real
CSS parser tolerates typos. Parsed styles are applied live to the real
ball flex container (or the targeted item), so the board visually reflects
every keystroke.

**Checking:** unlike continuous auto-check, this game requires an explicit
**Check Solution** button — needed because the assignment requires a
distinct wrong-answer message (auto-checking on every keystroke has no
clean "wrong" moment to hang that on), and because attempt-counting needs
a discrete event to count. On click: for every ball/basket pair, measure
`getBoundingClientRect()` on both and pass the two rects to
`geometry.isAligned(rectA, rectB, tolerance)` (tolerance ≈ 6px, matching
sub-pixel flex rounding). All pairs aligned → solved. Any pair not aligned
→ wrong-answer path.

This is why the assignment requires the board to be a **fixed pixel size
at every viewport** — it's what makes a pixel-proximity check deterministic
regardless of screen resolution, rather than needing to compare raw
property-value strings (which would fail to recognize equivalent-looking
results from different property combinations).

## 6. Feedback & animation

- **Success:** full-board overlay animation — player silhouette hops and
  shoots, ball arcs (translate + rotate keyframes) into the basket, net
  swishes, "Nothing but net" message, Next Level button. Also updates the
  level-chip nav (see §7) and persists progress.
- **Wrong:** board does a brief shake + red-pulse border (~300ms CSS
  keyframe), plus an inline "Not quite — try again" message. Attempt
  counter for the level increments. Player keeps editing; no reset forced.
- **Reset button:** clears the level's textarea(s) back to empty/default,
  reverting the ball layer to its unstyled starting position.

## 7. UI layout

Header: game title, level indicator ("Level 3 of 12"), row of numbered
level-chips (click to jump to any level — satisfies the "revisit completed
stages" bonus; solved chips are visually marked). Main area: the court
board (ghost basket layer underneath, live ball layer on top, both
absolutely-positioned flex containers sharing the same base styles so a
correct guess is reachable by the real layout algorithm, not faked).
Side/below panel: objective text, optional hint reveal, one CSS-editor
block per editable target, Check Solution + Reset buttons, "N/12 solved"
counter.

**Responsive handling:** the court board has a fixed pixel size (480×320)
at every viewport, per the assignment's requirement that the solution not
depend on screen resolution. It sits inside an `overflow-x: auto` wrapper
so on narrow phones it scrolls horizontally instead of shrinking (the page
itself never scrolls horizontally). Everything else — header, side panel,
buttons — reflows to a stacked single-column layout under a mobile
breakpoint.

## 8. Persistence & scoring

`progress.js` reads/writes a single `localStorage` key holding
`{ currentLevel, solved: { [id]: true }, attempts: { [id]: number } }`.
Pure helpers `serializeProgress(state)` / `parseProgress(raw)` handle the
JSON round-trip and default to a fresh state on missing/corrupt data —
these are what's unit tested; the actual `localStorage.getItem/setItem`
calls are a thin, untested wrapper around them. Reloading the page resumes
at the player's last level with prior solves and attempt counts intact.

## 9. Requirements compliance checklist

| Assignment requirement | Met by |
|---|---|
| ≥6 levels | 12 levels (§4) |
| Items inside a flex container per level | ball layer, real flex container |
| Clear instruction per level | `goal` text, always shown |
| Flexbox properties set via HTML controls | CSS-block textarea (assignment explicitly allows "another option of your choosing") |
| Changes applied via JS | `parser.js` + live style application in `game.js` |
| Player can check correctness | Check Solution button |
| Success message + advance | success overlay + Next Level (§6) |
| Wrong message + retry | shake/red-pulse + message, no lockout (§6) |
| "Level N of 6" indicator | level-chip header (§7), generalizes to N of 12 |
| Reset stage to default | Reset button clears textarea(s) |
| Uses display:flex, flex-direction, justify-content, align-items | all four, see level table §4 |
| ≥1 level uses flex-wrap | level 12 |
| Stages require varied combinations, not just center/flex-start | level table §4 spans direction, alignment, per-item order/align-self, wrap |
| ≥3 levels combine >1 property | levels 6, 9, 11 |
| Valid HTML structure | `index.html`, semantic elements |
| CSS for styling + flexbox structure | `css/styles.css` |
| JS for interactivity/logic | `js/*.js` |
| No full-page navigation between levels | single `index.html`, JS-driven level switch |
| Responsive, works on mobile and large screens | §7 responsive handling |
| Board fixed width/height at all screen sizes | 480×320 fixed, §7 |
| Pure HTML/CSS/JS, no external JS libraries | ES modules, no framework, no CDN scripts |
| No CSS Grid for puzzle solving | flexbox only |
| No Froggy design/stage copy | original basketball theme and level set |

## 10. Testing strategy (feeds the `/tdd` breakdown)

Each pure module gets its own small test file, written before the
implementation:

- **`parser.test.js`** — valid single/multi declaration blocks, `;` vs
  newline separators, kebab→camelCase conversion, case-insensitivity,
  unknown properties dropped, malformed lines dropped, `order` parsed as
  integer, empty input → `{}`.
- **`levels.test.js`** — `LEVELS.length >= 6`; every level has required
  fields; every level's `solution` indices are within `ballCount`; across
  all levels, `flex-direction`/`justify-content`/`align-items`/`flex-wrap`
  each appear at least once; at least 3 levels have a `solution` spanning
  more than one property (across `container`+`items` combined); no two
  levels are identical solutions.
- **`geometry.test.js`** — identical rects → aligned; within tolerance →
  aligned; just outside tolerance → not aligned; independent per axis.
- **`progress.test.js`** — round-trip serialize/parse; corrupt/missing
  JSON → default state; solved-set and attempts survive round-trip.
- **`scoring.test.js`** — attempt increments per level id; independent
  counters per level; reset clears a single level's count without
  affecting others.

## 11. Out of scope for this spec

GitHub upload, GitHub Pages publishing, and the submission ZIP are
deliberately excluded — this repo stays local-only until the user
explicitly asks to push, per their instruction for this phase.
