# E2E Test Report — Flexbox Hoops

Branch: `add-e2e-tests`. Real Playwright/Chromium browser automation was used
throughout — every assertion below reflects an actual page load, click, or
typed input in a headless Chromium instance, not a static read of the source.

## Setup

1. `npm install -D @playwright/test` — succeeded, no network/sandbox issues.
   `@playwright/test@1.62.1` added to `devDependencies`; `package-lock.json`
   created.
2. `npx playwright install chromium` — succeeded. Chromium 1234 (and its
   headless-shell variant) installed to `~/Library/Caches/ms-playwright`.
   Only Chromium was installed, per instructions (not Firefox/WebKit).
3. `playwright.config.js` created using the built-in `webServer` option
   (`python3 -m http.server 8000`, `reuseExistingServer: false`). Verified
   with a throwaway trivial spec (`page.goto('/'); expect toHaveTitle(...)`)
   that Playwright actually starts the server before the test and there is
   no leftover process on port 8000 afterward (`lsof -i :8000` empty
   post-run). The trivial spec was deleted once confirmed.
4. `package.json` gained `"test:e2e": "playwright test"` alongside the
   existing `"test": "node --test"`, which was not touched.

## Spec files

All specs live in `e2e/`. Each was written, run against the real page, and
iterated until green. Full final run output is at the bottom of this report.

### 1. `e2e/level-flow.spec.js` — smoke test
Loads the page, asserts the header reads "Level 1 of 12" and 12 level-nav
chips exist. Confirmed level 1's exact solution by reading `js/levels.js`
(`{ container: { justifyContent: 'flex-end' } }`, not assumed) and typed
`justify-content: flex-end;` into the textarea, clicked **Check Solution**,
asserted the success overlay becomes visible. Clicked **Next Level →**,
asserted "Level 2 of 12". Clicked level-nav chip "5", asserted "Level 5 of
12". Also carries a regression assertion (see Visual spot-check below) that
the basket backboard renders fully inside the court's border.

**Result:** passed on the first real run — no app bug found here.

### 2. `e2e/reset.spec.js` — Reset clears stale inline styles (levels 10, 11)
For level 10 (`sub-him-out`, item 0, `order: 1;`) and level 11
(`one-man-down-low`, item 1, `align-self: flex-end;`): navigated via the
level-nav chip, typed the solving declaration, clicked **Check Solution**,
confirmed success. Then, to get a *truly fresh, unsolved* instance of the
same level for the second half of the test, called `page.reload()` (which
resets all in-memory JS state, since the game keeps everything in a single
module-level `state` object with no other persistence mechanism for the
editor/DOM itself) and re-clicked the same level-nav chip — confirmed via
`expect(textarea).toHaveValue('')` that this really is a blank instance.
Typed the solving declaration again, clicked **Reset** *before* checking,
then read the actual ball element's inline style directly via
`page.evaluate` (`el.style.order` / `el.style.alignSelf`) and asserted it is
now `''` (empty) — not just visually reset, but genuinely cleared at the
DOM level. Also asserted the textarea itself is cleared, and that clicking
**Check Solution** afterward correctly reports failure (level genuinely
unsolved).

**Result:** passed on the first real run for both levels. This directly
re-verifies the Critical "stale inline styles breaking Reset" bug from the
earlier static code review — `applyUserStyles()` in `js/game.js` calls
`ballEl.removeAttribute('style')` on every ball before reapplying only the
(now-empty) parsed styles, which is the correct fix, and the E2E test
confirms it holds in a real browser.

### 3. `e2e/wrong-answer.spec.js` — wrong-state class lifecycle
On level 1, clicked **Check Solution** with an empty textarea: asserted
`#court` gains class `court--wrong` (confirmed by reading `js/game.js` and
`css/styles.css` — the class is literally `court--wrong`) and
`#check-message` becomes visible with text matching `/not quite/i` and class
`check-message--error`. Then typed the correct solution and clicked **Check
Solution** again: asserted success overlay visible AND asserted
`court--wrong` is now **removed** from `#court`.

**Result:** passed on the first real run. `handleSuccess()` in `js/game.js`
explicitly calls `els.court.classList.remove('court--wrong')`, so the
earlier "wrong-state border leaks through after success" bug is confirmed
fixed and stays fixed.

### 4. `e2e/level-12-wrap.spec.js` — level 12 needs both properties
Navigated to level 12 (`full-roster`). Typed only `flex-wrap: wrap;` and
clicked **Check Solution**: asserted the success overlay stays hidden (it
does — level 12's actual solution per `js/levels.js` is
`{ flexWrap: 'wrap', alignContent: 'space-between' }`, both required).
Then added `align-content: space-between;` to the same textarea (level 12
has a single container-level editable target) and clicked **Check
Solution** again: asserted success.

**Result:** passed on the first real run — confirms the recent fix (level 12
requiring both properties, not just `flex-wrap`) is still correct.

### 5. `e2e/level-9-direction.spec.js` — level 9 direction/goal correctness
Navigated to level 9 (`bottom-up`). Read the exact solution from
`js/levels.js` (`{ flexDirection: 'column-reverse', justifyContent:
'flex-end' }`), typed it, took a screenshot before checking (see Visual
spot-check), clicked **Check Solution**, asserted success. Added a geometric
assertion beyond the visual check: read every ball's `getBoundingClientRect().top`
and asserted all are above the court's vertical midpoint.

**Result:** passed on the first real run. The screenshot (described below)
visually confirms the balls land stacked at the top of the court, matching
the corrected goal text "Stacked, reversed, and pushed to the top of the
court." — no bug found, the recent direction fix holds.

### 6. `e2e/persistence.spec.js` — solved progress survives reload
Solved level 1 fully (type solution, check, confirm success overlay).
Reloaded the page. Asserted the level 1 nav chip still has class
`level-chip--solved` and the solved-counter text matches
`/^([1-9]\d*) \/ 12 solved$/` (i.e., at least 1 solved).

Note: this test deliberately does **not** use `page.addInitScript(() =>
localStorage.clear())` the way the other specs do, because that hook fires
on every navigation including the mid-test `page.reload()`, which would
wipe the very progress the test is trying to verify persists. Caught this
in my own first run (a test-authoring bug, not an app bug — see below) and
fixed it by clearing `localStorage` once via `page.evaluate` before the
test body runs instead.

**Result:** failed on the first run (test-authoring bug as above, not an
app bug), fixed, passed on the second run.

### 7. `e2e/responsive.spec.js` — fixed-width court, stacked layout on narrow viewports
Set viewport to 375×667. Loaded the page. Read `.court`'s actual
`getBoundingClientRect().width` via `page.evaluate` and asserted it is
exactly `480` (not shrunk). Compared bounding boxes of `.court` and
`.side-panel` and asserted the panel's `y` is `>=` the court's `y + height`
(visually stacked below, not beside).

**Result:** passed on the first real run — `css/styles.css`'s
`@media (max-width: 760px) { .game-main { flex-direction: column; } }` and
the court's fixed `width: 480px` behave as designed.

## Visual spot-check

Per the task, took a full-page screenshot of level 1 in its default
(unsolved) state and looked at it directly.

**Before any fix**, measured via `page.evaluate` + `getBoundingClientRect()`:

```
court outer top:      56px  (viewport y)
court border-top:       3px
court inner top:       59px  (56 + 3)
basket__backboard top: 45px
```

`45 < 56` — **the backboard's top edge sits 11px above the court's own outer
edge**, i.e. genuinely outside the court box. The screenshot confirmed this
visually: the top-right basket's backboard/rim/net art was visibly cropped
— only a thin cross-section of the backboard and rim was rendering, cut off
by `.court-wrapper`'s implicit `overflow-y: auto` (a side effect of the
explicit `overflow-x: auto` on that element — per the CSS spec, when only
one of `overflow-x`/`overflow-y` is set to non-`visible`, the other computes
to `auto` rather than staying `visible`). This is exactly the risk flagged
by the prior static review as unverifiable without a real browser, and it
was real.

**Root cause:** `.basket__backboard` is positioned `top: -30px` relative to
its `.basket` element's own top edge (part of the intentional "hoop hangs
above the landing zone" art), but `.court-layer` (the flex container both
the basket layer and ball layer live in) only had `padding: 16px` on every
side — not enough headroom for a basket sitting at the very top row of the
court to keep its backboard inside the visible box.

**Fix applied** in `css/styles.css`, `.court-layer`:

```diff
-  padding: 16px;
+  /* Extra top clearance: .basket__backboard sits 30px above its basket's
+     own top edge (see below), so a basket flush with the top of this
+     layer needs more than 16px of headroom or its backboard renders
+     outside the court and gets clipped by .court-wrapper's overflow. */
+  padding: 34px 16px 16px;
```

This is a minimal, safe change: both the basket layer and ball layer share
the `.court-layer` class, so the padding changes identically for both,
preserving the ball/basket alignment geometry that `isAligned()` depends on
(confirmed by all 8 E2E tests, including the ones that check exact ball
positions for levels 9, 10, 11, still passing after the fix). Re-measured
after the fix:

```
backboard top: 63px   (was 45px)
court inner top: 59px
```

`63 >= 59` — now safely inside the court. Re-screenshotted level 1's default
state: the backboard (grey rounded rectangle), rim (orange oval), and net
now render fully inside the court's rounded border, with no clipping.

**Ball-to-hoop alignment** (level 1, live preview after typing the solution
but before clicking Check, so the ball is already positioned by the solved
CSS): measured via the same technique —

```
ball center Y:   119px
basket center Y: 119px   (exact match — this is what isAligned() checks)
rim center Y:     91px
ball top:         93px
rim bottom:       97px
```

The ball's top 4px overlaps the rim's bottom band, and the rest of the
ball's body sits inside `.basket__net`'s visual bounds (net spans roughly
91–121px, ball spans 93–145px). Visually and numerically this reads as "ball
resting in the net just below the rim" — a normal, intentional-looking
basketball composition, not a ball floating oddly far above or below the
hoop. **No bug here** — the alignment check (`isAligned()`, which compares
the ball's and basket's own 52×52 bounding-box centers, not the rim
specifically) is a reasonable proxy for "landed in this basket," and the
decorative rim/net art lines up sensibly with it. I looked at both the
before- and after-fix screenshots and confirm the ball-to-hoop relationship
looks correct in both — this fix only affected basket art clipping, not
ball/hoop vertical alignment.

## Full final test run

`npm test` (unchanged, still the pure-logic suite):

```
ℹ tests 30
ℹ suites 0
ℹ pass 30
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

`npx playwright test` (all 7 spec files, 8 tests, Chromium only):

```
Running 8 tests using 6 workers

  ✓  1 [chromium] › e2e/level-flow.spec.js:12:1 › smoke: loads, solves level 1, advances, and jumps via level nav
  ✓  2 [chromium] › e2e/reset.spec.js:30:3 › level 10: Reset clears the item-level inline style before checking
  ✓  3 [chromium] › e2e/reset.spec.js:30:3 › level 11: Reset clears the item-level inline style before checking
  ✓  4 [chromium] › e2e/wrong-answer.spec.js:12:1 › wrong answer flags the court, correct answer clears the flag
  ✓  5 [chromium] › e2e/level-12-wrap.spec.js:13:1 › level 12 requires both flex-wrap and align-content, not just flex-wrap
  ✓  6 [chromium] › e2e/level-9-direction.spec.js:14:1 › level 9 solution stacks balls toward the top of the court
  ✓  7 [chromium] › e2e/persistence.spec.js:17:1 › solved progress survives a page reload
  ✓  8 [chromium] › e2e/responsive.spec.js:9:1 › narrow viewport keeps the court fixed-size and stacks the panel below it

  8 passed (1.9s)
```

## Files changed

- `playwright.config.js` — new. Playwright config with `webServer` auto
  start/stop, Chromium-only project.
- `e2e/level-flow.spec.js` — new.
- `e2e/reset.spec.js` — new.
- `e2e/wrong-answer.spec.js` — new.
- `e2e/level-12-wrap.spec.js` — new.
- `e2e/level-9-direction.spec.js` — new.
- `e2e/persistence.spec.js` — new.
- `e2e/responsive.spec.js` — new.
- `css/styles.css` — `.court-layer` padding changed from `16px` to
  `34px 16px 16px` to fix the basket-art clipping bug.
- `package.json` — added `"test:e2e": "playwright test"` script and
  `@playwright/test` devDependency; existing `"test"` script untouched.
- `package-lock.json` — new, from `npm install`.
- `.gitignore` — added `playwright-report/` and `test-results/`
  (`node_modules/` was already present).
- `README.md` — added an "End-to-end tests" subsection under "Running
  tests", updated "Project structure" to mention `e2e/` and
  `playwright.config.js`, and updated "Status" to describe the new E2E
  coverage and the one real bug found and fixed.
- `e2e-report.md` — this file.

No changes were made to `tests/*.test.js`, any `js/*.js` file, or
`index.html`.

## Self-review findings

- Re-read every spec file after writing it and confirmed each assertion
  reads the real solution/class names from `js/levels.js`, `js/game.js`,
  and `css/styles.css` rather than assuming them (e.g. level 1's solution,
  the `court--wrong` class name, level 10/11's exact target index and
  property).
- Caught and fixed one test-authoring mistake myself before reporting:
  `persistence.spec.js`'s first draft used the same
  `page.addInitScript(() => localStorage.clear())` pattern as the other
  specs, which silently defeated the test's own purpose (it re-clears
  storage on the mid-test `reload()`). Fixed by clearing once via
  `page.evaluate` before the test body instead. This was a bug in my test,
  not in the game — flagging it explicitly for transparency.
- Verified the CSS fix is dimensionally safe for all 12 levels, not just
  the ones directly exercised by these specs: `.court-layer`'s padding
  change applies identically to both the basket layer and the ball layer
  (both share the `.court-layer` class), so it shifts both layers by the
  same absolute offset and cannot change any level's ball-to-basket
  alignment math. The reduced available content height (270px vs. the
  previous 288px) was checked against the most space-hungry level,
  `full-roster` (2 rows × 52px + 20px gap = 124px required), and there is
  ample margin.
- Confirmed `tests/*.test.js` and `package.json`'s existing `"test"` script
  were not touched, per the constraint.
- Confirmed the dev server started by Playwright's `webServer` option
  actually tears down after a run (`lsof -i :8000` empty post-run).
- Deleted the throwaway trivial config-verification spec and the throwaway
  `_visual-check.spec.js` (used only to gather screenshots/measurements for
  this report) before the final commit; folded the one measurement worth
  keeping as a permanent regression check into `level-flow.spec.js`
  (backboard-inside-court-border assertion).
- Confirmed no screenshot images or the Playwright HTML report are staged
  for commit (`test-results/`, `playwright-report/` are gitignored; verified
  with `git check-ignore -v`).

## Concerns

- None blocking. The only two things worth flagging for awareness:
  1. The chosen `34px` top padding is a safety-margined value (backboard
     needs ≥30px of headroom); it wasn't tuned to be visually "tight" —
     someone doing further visual polish might want to eyeball whether
     34px vs. 30px vs. something else looks best, but functionally either
     works.
  2. `e2e/` tests run with `fullyParallel: true` and 6 workers by default;
     each spec clears `localStorage` per-test via `page.addInitScript`
     (except `persistence.spec.js`, by design — see above), and each test
     gets its own browser context by default in Playwright, so there's no
     cross-test state leakage even under parallelism. Confirmed by the
     final full-suite run above passing with all workers in parallel.
