# Flexbox Hoops

A 12-level basketball-themed game for learning CSS Flexbox. Arrange balls
on the court by editing real CSS declarations — when your flex properties
match the level's target, the balls land in the baskets.

## Running locally

No build step, no dependencies. From this directory:

```
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

The page must be served over HTTP — opening `index.html` directly via
`file://` will show a blank page, because ES modules
(`<script type="module">`) are blocked by CORS under the `file://`
protocol.

## Running tests

```
npm test
```

Runs the pure-logic unit tests (`js/geometry.js`, `js/parser.js`,
`js/levels.js`, `js/progress.js`, `js/scoring.js`) with Node's built-in
test runner — zero dependencies to install.

### End-to-end tests

```
npm install -D @playwright/test
npx playwright install chromium
npm run test:e2e
```

Runs a real, browser-driven Playwright suite (`e2e/*.spec.js`) against
`index.html` served over HTTP — Playwright's `webServer` option starts and
stops `python3 -m http.server 8000` automatically for the test run. Covers:

- **`level-flow.spec.js`** — page load, header/level-nav rendering, solving
  level 1, advancing to the next level, jumping via a level-nav chip, and a
  regression check that the basket backboard art renders fully inside the
  court's border.
- **`reset.spec.js`** — levels 10 (`order`) and 11 (`align-self`): solving
  them, then on a fresh instance, typing the solving declaration and
  clicking **Reset** before checking, confirming the affected ball's inline
  style is actually cleared.
- **`wrong-answer.spec.js`** — an empty/wrong submission flags the court
  (`court--wrong`) and shows an error message; a subsequent correct
  submission both succeeds and removes the wrong-state class.
- **`level-12-wrap.spec.js`** — level 12 genuinely requires both
  `flex-wrap: wrap` and `align-content: space-between` together; `flex-wrap`
  alone does not solve it.
- **`level-9-direction.spec.js`** — level 9's `column-reverse` +
  `justify-content: flex-end` solution lands the balls in the top half of
  the court, matching its "pushed to the top" goal text.
- **`persistence.spec.js`** — solved progress survives a page reload
  (level-nav chip stays marked solved, solved-counter updates).
- **`responsive.spec.js`** — at a 375×667 viewport, `.court` stays a fixed
  480px wide (relying on horizontal scroll) and the side panel stacks below
  the court instead of beside it.

This suite is what caught a real bug: the basket backboard art rendered
~11px above the court's own top edge and was silently clipped by
`.court-wrapper`'s overflow. Fixed in `css/styles.css` by giving
`.court-layer` more top padding. See `e2e-report.md` for the full writeup,
including a visual spot-check of basket-art bounds and ball-to-hoop
alignment.

## Project structure

- `index.html`, `css/styles.css` — page shell and all styling.
- `js/levels.js` — the 12 level definitions and a validator that checks
  them against the assignment's own rules.
- `js/parser.js` — parses the CSS declarations typed into the editor.
- `js/geometry.js` — the ball/basket alignment check.
- `js/progress.js`, `js/scoring.js` — localStorage persistence and
  attempt counting.
- `js/game.js`, `js/main.js` — DOM rendering, event wiring, bootstrap.
- `tests/` — one test file per pure module above.
- `e2e/`, `playwright.config.js` — browser-driven Playwright end-to-end
  tests (`npm run test:e2e`); see "End-to-end tests" above.
- `docs/superpowers/` (and the gitignored `.superpowers/`) — this
  project's planning/process artifacts (design spec, implementation plan,
  SDD ledger). Not part of the shipped game itself, which is
  `index.html`, `css/`, and `js/`.

## Status

- **Automated tests: passing.** `npm test` runs 30/30 tests across all
  five pure-logic modules (`geometry`, `parser`, `levels`, `progress`,
  `scoring`).
- **Code review: complete.** Every module was implemented and reviewed
  task-by-task against the implementation plan, including a byte-level
  check of `js/game.js` and `js/main.js` against the spec and a wiring
  trace of DOM event handlers across multiple review passes.
- **Static end-to-end trace: done, not a substitute for a real run.**
  With no browser available in the implementation environment, the
  game-logic chain (`userStyles()` → `applyUserStyles()` →
  `isLevelSolved()` → `isAligned()`) was traced by hand for three levels
  (`baseline-drive`, `center-court`, `full-roster`) using each level's
  own `solution` from `js/levels.js`, confirming that typing the exact
  solution text would satisfy `isLevelSolved()`, and that an incomplete
  or wrong value would not. This is a logic trace, not a rendered page.
- **Browser-driven E2E: passing.** `npm run test:e2e` runs 8 real
  Playwright tests across 7 spec files in `e2e/`, against Chromium,
  covering the level-solve flow, level-nav jumps, Reset clearing item-level
  inline styles (levels 10 and 11), wrong-answer/success class handling,
  level 12's combined `flex-wrap` + `align-content` requirement, level 9's
  `column-reverse` direction, progress persistence across reload, and the
  narrow-viewport responsive layout. This is a real agent with browser
  access clicking through the actual rendered page — not a logic trace.
- **One real bug found and fixed by the E2E suite.** A visual spot-check
  (full-page screenshot + `getBoundingClientRect()` measurements of level
  1's default state) showed the basket backboard art rendering ~11px above
  the court's own top edge, silently clipped by `.court-wrapper`'s
  overflow. Fixed in `css/styles.css` by increasing `.court-layer`'s top
  padding from 16px to 34px, with a screenshot re-check confirming the
  backboard now renders fully inside the court's border. Ball-to-hoop
  vertical alignment was checked the same way and found correct — no fix
  needed there. Full details in `e2e-report.md`.
