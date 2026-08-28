import { test, expect } from '@playwright/test';

// Solve-flow coverage for levels 7-12, independent of the dedicated
// single-level specs (level-9-direction.spec.js, level-12-wrap.spec.js,
// reset.spec.js). Solution shapes below are copied by hand from
// js/levels.js (index 6-11) so this file verifies the app against the
// same source of truth without importing (and therefore blindly trusting)
// the app's own module.
//
//   6  fast-break-back     container   { flexDirection: 'row-reverse' }
//   7  stack-the-rack      container   { flexDirection: 'column' }
//   8  bottom-up           container   { flexDirection: 'column-reverse', justifyContent: 'flex-end' }
//   9  sub-him-out         item[0]     { order: 1 }
//   10 one-man-down-low    item[1]     { alignSelf: 'flex-end' }  (base: { alignItems: 'flex-start' })
//   11 full-roster         container   { flexWrap: 'wrap', alignContent: 'space-between' }  (ballCount: 8)
const LEVEL_DEFS = [
  {
    number: 7,
    id: 'fast-break-back',
    ballCount: 3,
    editableTargets: [{ kind: 'container' }],
    solutionText: 'flex-direction: row-reverse;',
  },
  {
    number: 8,
    id: 'stack-the-rack',
    ballCount: 3,
    editableTargets: [{ kind: 'container' }],
    solutionText: 'flex-direction: column;',
  },
  {
    number: 9,
    id: 'bottom-up',
    ballCount: 3,
    editableTargets: [{ kind: 'container' }],
    solutionText: 'flex-direction: column-reverse;\njustify-content: flex-end;',
  },
  {
    number: 10,
    id: 'sub-him-out',
    ballCount: 3,
    editableTargets: [{ kind: 'item', index: 0 }],
    targetItemIndex: 0,
    solutionText: 'order: 1;',
  },
  {
    number: 11,
    id: 'one-man-down-low',
    ballCount: 3,
    editableTargets: [{ kind: 'item', index: 1 }],
    targetItemIndex: 1,
    solutionText: 'align-self: flex-end;',
  },
  {
    number: 12,
    id: 'full-roster',
    ballCount: 8,
    editableTargets: [{ kind: 'container' }],
    solutionText: 'flex-wrap: wrap;\nalign-content: space-between;',
  },
];

// renderEditor() in js/game.js renders exactly one css-block/<textarea>
// per entry of level.editableTargets, in that array's order. This walks
// the array rather than assuming the target we want is always the first
// (or only) textarea, so the mapping stays correct even for a level whose
// editableTargets mixes a container block with one or more item blocks.
function textareaIndexFor(level, wantKind, wantItemIndex) {
  return level.editableTargets.findIndex((target) =>
    wantKind === 'container'
      ? target.kind === 'container'
      : target.kind === 'item' && target.index === wantItemIndex
  );
}

function targetTextareaIndex(level) {
  return level.targetItemIndex !== undefined
    ? textareaIndexFor(level, 'item', level.targetItemIndex)
    : textareaIndexFor(level, 'container');
}

async function gotoLevel(page, number) {
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/');
  await page.locator('#level-nav .level-chip').nth(number - 1).click();
  await expect(page.locator('#level-indicator')).toHaveText(`Level ${number} of 12`);
}

// Independent re-check of ball/basket alignment straight from live
// geometry (getBoundingClientRect centers), using the same 6px tolerance
// as js/geometry.js's isAligned — this does not rely on the app's own
// #success-overlay flag at all.
async function assertAllAligned(page, ballCount) {
  const offsets = await page.evaluate((count) => {
    function center(el) {
      const r = el.getBoundingClientRect();
      return { x: (r.left + r.right) / 2, y: (r.top + r.bottom) / 2 };
    }
    const balls = Array.from(document.querySelectorAll('#ball-layer .ball'));
    const baskets = Array.from(document.querySelectorAll('#basket-layer .basket'));
    return balls.slice(0, count).map((ball, i) => {
      const b = center(ball);
      const k = center(baskets[i]);
      return { i, dx: Math.abs(b.x - k.x), dy: Math.abs(b.y - k.y) };
    });
  }, ballCount);

  for (const { i, dx, dy } of offsets) {
    expect(dx, `ball ${i} x-center offset from its basket`).toBeLessThanOrEqual(6);
    expect(dy, `ball ${i} y-center offset from its basket`).toBeLessThanOrEqual(6);
  }
}

test.beforeEach(async ({ page }) => {
  page.on('pageerror', (err) => console.log(`[pageerror] ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') console.log(`[console.error] ${msg.text()}`);
  });
});

for (const level of LEVEL_DEFS) {
  if (level.number === 10) continue; // covered by the dedicated deep-dive test below.

  test(`level ${level.number} ("${level.id}"): typing the exact solution solves it and every ball lines up with its basket`, async ({ page }) => {
    await gotoLevel(page, level.number);

    const idx = targetTextareaIndex(level);
    expect(idx, 'editableTargets should contain the expected target for this level').toBeGreaterThanOrEqual(0);

    await page.locator('#editor-blocks textarea').nth(idx).fill(level.solutionText);
    await page.locator('#check-btn').click();

    await expect(page.locator('#success-overlay')).toBeVisible();

    // Don't just trust the success flag - re-derive it from live geometry.
    await assertAllAligned(page, level.ballCount);
  });
}

test('level 9 ("bottom-up"): flex-direction alone, without justify-content, is not a solution', async ({ page }) => {
  const level = LEVEL_DEFS.find((l) => l.number === 9);
  await gotoLevel(page, 9);

  const idx = targetTextareaIndex(level);
  const textarea = page.locator('#editor-blocks textarea').nth(idx);
  const court = page.locator('#court');

  // Only the flex-direction half of the two-declaration solution.
  await textarea.fill('flex-direction: column-reverse;');
  await page.locator('#check-btn').click();

  await expect(court).toHaveClass(/court--wrong/);
  await expect(page.locator('#success-overlay')).toBeHidden();

  // Completing it with justify-content: flex-end; solves it.
  await textarea.fill(level.solutionText);
  await page.locator('#check-btn').click();
  await expect(page.locator('#success-overlay')).toBeVisible();
  await assertAllAligned(page, level.ballCount);
});

test('level 12 ("full-roster"): flex-wrap alone, without align-content, is not a solution', async ({ page }) => {
  const level = LEVEL_DEFS.find((l) => l.number === 12);
  await gotoLevel(page, 12);

  const idx = targetTextareaIndex(level);
  const textarea = page.locator('#editor-blocks textarea').nth(idx);
  const court = page.locator('#court');

  // Known important regression case: flex-wrap alone lets the 8 balls
  // break onto two lines, but without align-content the two lines are not
  // spaced the way the target baskets are, so it must still read as wrong.
  await textarea.fill('flex-wrap: wrap;');
  await page.locator('#check-btn').click();

  await expect(court).toHaveClass(/court--wrong/);
  await expect(page.locator('#success-overlay')).toBeHidden();

  // Adding align-content: space-between; alongside it solves it.
  await textarea.fill(level.solutionText);
  await page.locator('#check-btn').click();
  await expect(page.locator('#success-overlay')).toBeVisible();
  await assertAllAligned(page, level.ballCount);
});

test('level 10 ("sub-him-out"): the order fix is scoped to the targeted ball only, the other two are never touched', async ({ page }) => {
  const level = LEVEL_DEFS.find((l) => l.number === 10);
  await gotoLevel(page, 10);

  const idx = targetTextareaIndex(level);
  expect(idx, 'the single editable target for this level should be item index 0').toBe(0);

  const balls = page.locator('#ball-layer .ball');

  // Before typing anything, no ball has an inline `order` style at all -
  // applyUserStyles() has not written anything for any of the 3 balls yet.
  for (let i = 0; i < 3; i++) {
    const orderValue = await balls.nth(i).evaluate((el) => el.style.order);
    expect(orderValue, `ball ${i} inline order before typing`).toBe('');
  }

  // Ball 0 (the targeted ball) is clearly out of place relative to its
  // basket before the fix - this is the level's whole premise.
  const ball0Offset = await page.evaluate(() => {
    function center(el) {
      const r = el.getBoundingClientRect();
      return { x: (r.left + r.right) / 2, y: (r.top + r.bottom) / 2 };
    }
    const ball0 = document.querySelectorAll('#ball-layer .ball')[0];
    const basket0 = document.querySelectorAll('#basket-layer .basket')[0];
    const b = center(ball0);
    const k = center(basket0);
    return Math.hypot(b.x - k.x, b.y - k.y);
  });
  expect(ball0Offset, 'ball 0 should start visibly misaligned from basket 0').toBeGreaterThan(6);

  // Note on the other two balls' geometry at this point: because CSS
  // `order` reorders every item sharing the flex container (not just the
  // one item that declares it), giving basket 0 an order of 1 shifts
  // baskets 1 and 2 one slot earlier than balls 1 and 2 (still order: 0)
  // currently sit. So balls 1 and 2 are ALSO visually offset from their
  // baskets before the fix - not because anything targets them, but as a
  // side effect of basket 0's reordering reflowing the whole row. That is
  // correct, expected flexbox behavior (confirmed empirically against the
  // live app), not a clobbering bug - the real "no clobbering" guarantee
  // is that their own inline styles stay untouched, asserted below.

  // Type the solution into the correct (and only) textarea for this level.
  await page.locator('#editor-blocks textarea').nth(idx).fill(level.solutionText);

  // The typed `order: 1;` must land on ball 0 only - balls 1 and 2 must
  // not pick up an order value of their own from the same edit.
  expect(await balls.nth(0).evaluate((el) => el.style.order)).toBe('1');
  expect(await balls.nth(1).evaluate((el) => el.style.order), 'ball 1 must be untouched').toBe('');
  expect(await balls.nth(2).evaluate((el) => el.style.order), 'ball 2 must be untouched').toBe('');

  await page.locator('#check-btn').click();
  await expect(page.locator('#success-overlay')).toBeVisible();

  // Independent geometric re-check: every ball - not just the targeted
  // one - now lines up with its basket.
  await assertAllAligned(page, level.ballCount);
});
