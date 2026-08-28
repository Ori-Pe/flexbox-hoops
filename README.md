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

## Running tests

```
npm test
```

Runs the pure-logic unit tests (`js/geometry.js`, `js/parser.js`,
`js/levels.js`, `js/progress.js`, `js/scoring.js`) with Node's built-in
test runner — zero dependencies to install.

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
- **Not yet opened in a real browser by an agent.** No agent in this
  project has loaded `index.html` in an actual browser, clicked through
  the levels, or watched the CSS parser/alignment check run against live
  `getBoundingClientRect()` values. Before considering this game fully
  verified, a human (or an agent with real browser access) should run
  the local server above, clear `localStorage`, and play through all 12
  levels — including at least one deliberately wrong answer and one
  "Reset" click — to confirm the UI behaves as the code implies.
