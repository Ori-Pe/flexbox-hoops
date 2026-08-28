import { test, expect } from '@playwright/test';

// Meta-layer coverage: level nav chips, hint toggle, level indicator /
// objective text, next-level wraparound, and localStorage persistence +
// resilience. Solve mechanics themselves are covered elsewhere
// (level-flow.spec.js, level-9-direction.spec.js, level-12-wrap.spec.js,
// reset.spec.js, wrong-answer.spec.js); this file deliberately does not
// duplicate persistence.spec.js's single-level reload check.

const STORAGE_KEY = 'flexbox-hoops-progress';

// Level 1 ("baseline-drive"), per js/levels.js:
//   solution: { container: { justifyContent: 'flex-end' } }
//   goal: 'One ball, one basket on the right edge of the court. Send the ball there.'
//   hint: 'justify-content moves items along the main axis: flex-start, flex-end, center, space-between, space-around.'
const LEVEL_1_SOLUTION = 'justify-content: flex-end;';
const LEVEL_1_GOAL = 'One ball, one basket on the right edge of the court. Send the ball there.';
const LEVEL_1_HINT =
  'justify-content moves items along the main axis: flex-start, flex-end, center, space-between, space-around.';

// Level 2 ("top-of-the-key"), per js/levels.js:
//   solution: { container: { justifyContent: 'center' } }
const LEVEL_2_SOLUTION = 'justify-content: center;';

// Level 7 ("fast-break-back"), per js/levels.js:
//   goal: 'The colored rings show which ball belongs in which basket — the order is reversed.'
const LEVEL_7_GOAL = 'The colored rings show which ball belongs in which basket — the order is reversed.';

// Level 12 ("full-roster"), per js/levels.js:
//   solution: { container: { flexWrap: 'wrap', alignContent: 'space-between' } }
//   goal: 'Eight balls, two rows of baskets. They will not fit on one line.'
const LEVEL_12_SOLUTION = 'flex-wrap: wrap;\nalign-content: space-between;';
const LEVEL_12_GOAL = 'Eight balls, two rows of baskets. They will not fit on one line.';

test.describe('level nav chips', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/');
  });

  test('renders exactly 12 chips, chip 1 current, nothing solved on a fresh load', async ({ page }) => {
    const chips = page.locator('#level-nav .level-chip');
    await expect(chips).toHaveCount(12);
    await expect(chips.nth(0)).toHaveClass(/level-chip--current/);
    await expect(page.locator('#level-nav .level-chip--solved')).toHaveCount(0);
  });

  test('solving level 1 marks chip 1 solved and updates the counter + progress fill', async ({ page }) => {
    await page.locator('#editor-blocks textarea').first().fill(LEVEL_1_SOLUTION);
    await page.locator('#check-btn').click();
    await expect(page.locator('#success-overlay')).toBeVisible();

    const chips = page.locator('#level-nav .level-chip');
    await expect(chips.nth(0)).toHaveClass(/level-chip--solved/);
    await expect(page.locator('#solved-counter')).toHaveText('1 / 12 solved');

    // renderSolvedCounter: pct = Math.round((1 / 12) * 100) = 8
    const fillWidth = await page.locator('#progress-fill').evaluate((el) => el.style.width);
    expect(fillWidth).toBe('8%');
  });
});

test.describe('hint toggle', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/');
  });

  test('hint starts collapsed and toggles open/closed on click', async ({ page }) => {
    const hintText = page.locator('#hint-text');
    const hintToggle = page.locator('#hint-toggle');
    const hintLabel = page.locator('#hint-toggle-label');

    await expect(hintText).toBeHidden();
    await expect(hintToggle).toHaveAttribute('aria-expanded', 'false');
    await expect(hintLabel).toHaveText('Show hint');

    await hintToggle.click();
    await expect(hintText).toBeVisible();
    await expect(hintText).toHaveText(LEVEL_1_HINT);
    await expect(hintToggle).toHaveAttribute('aria-expanded', 'true');
    await expect(hintLabel).toHaveText('Hide hint');

    await hintToggle.click();
    await expect(hintText).toBeHidden();
    await expect(hintToggle).toHaveAttribute('aria-expanded', 'false');
    await expect(hintLabel).toHaveText('Show hint');
  });

  test('navigating to a different level via the nav collapses a hint left open', async ({ page }) => {
    const hintText = page.locator('#hint-text');
    const hintToggle = page.locator('#hint-toggle');
    const hintLabel = page.locator('#hint-toggle-label');

    await hintToggle.click();
    await expect(hintText).toBeVisible();
    await expect(hintToggle).toHaveAttribute('aria-expanded', 'true');

    await page.locator('#level-nav .level-chip').nth(1).click();
    await expect(page.locator('#level-indicator')).toHaveText('Level 2 of 12');

    await expect(hintText).toBeHidden();
    await expect(hintToggle).toHaveAttribute('aria-expanded', 'false');
    await expect(hintLabel).toHaveText('Show hint');
  });
});

test.describe('level indicator + objective text', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/');
  });

  test('jumping via chips (12, 1, 7) updates the indicator and objective text', async ({ page }) => {
    const chips = page.locator('#level-nav .level-chip');
    const indicator = page.locator('#level-indicator');
    const objective = page.locator('#objective-text');

    await chips.nth(11).click();
    await expect(indicator).toHaveText('Level 12 of 12');
    await expect(objective).toHaveText(LEVEL_12_GOAL);

    await chips.nth(0).click();
    await expect(indicator).toHaveText('Level 1 of 12');
    await expect(objective).toHaveText(LEVEL_1_GOAL);

    await chips.nth(6).click();
    await expect(indicator).toHaveText('Level 7 of 12');
    await expect(objective).toHaveText(LEVEL_7_GOAL);
  });
});

test.describe('goToNextLevel wraparound', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/');
  });

  test('solving level 12 and clicking Next Level wraps back to level 1', async ({ page }) => {
    await page.locator('#level-nav .level-chip').nth(11).click();
    await expect(page.locator('#level-indicator')).toHaveText('Level 12 of 12');

    await page.locator('#editor-blocks textarea').first().fill(LEVEL_12_SOLUTION);
    await page.locator('#check-btn').click();
    await expect(page.locator('#success-overlay')).toBeVisible();

    await page.locator('#next-level-btn').click();
    await expect(page.locator('#level-indicator')).toHaveText('Level 1 of 12');
  });
});

test.describe('persistence across reload', () => {
  test.beforeEach(async ({ page }) => {
    // Deliberately not using addInitScript (matches persistence.spec.js's
    // convention): this test reloads mid-test and needs progress to
    // actually persist across that reload rather than being wiped on
    // every navigation.
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('solving levels 1 and 2 via Next Level persists solved state and current level', async ({ page }) => {
    await page.locator('#editor-blocks textarea').first().fill(LEVEL_1_SOLUTION);
    await page.locator('#check-btn').click();
    await expect(page.locator('#success-overlay')).toBeVisible();
    await page.locator('#next-level-btn').click();
    await expect(page.locator('#level-indicator')).toHaveText('Level 2 of 12');

    await page.locator('#editor-blocks textarea').first().fill(LEVEL_2_SOLUTION);
    await page.locator('#check-btn').click();
    await expect(page.locator('#success-overlay')).toBeVisible();
    await page.locator('#next-level-btn').click();
    await expect(page.locator('#level-indicator')).toHaveText('Level 3 of 12');

    await page.reload();

    await expect(page.locator('#solved-counter')).toHaveText('2 / 12 solved');
    const chips = page.locator('#level-nav .level-chip');
    await expect(chips.nth(0)).toHaveClass(/level-chip--solved/);
    await expect(chips.nth(1)).toHaveClass(/level-chip--solved/);
    // goToLevel/goToNextLevel saves currentLevel on every navigation, so
    // after two Next-Level clicks the saved currentLevel is level index 2.
    await expect(page.locator('#level-indicator')).toHaveText('Level 3 of 12');
  });
});

test.describe('corrupted / malformed localStorage resilience', () => {
  test('invalid JSON falls back gracefully to a fresh game (no crash)', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(err));

    await page.addInitScript(
      ({ key, raw }) => localStorage.setItem(key, raw),
      { key: STORAGE_KEY, raw: 'not valid json{{{' }
    );
    await page.goto('/');

    await expect(page.locator('#level-indicator')).toHaveText('Level 1 of 12');
    await expect(page.locator('#solved-counter')).toHaveText('0 / 12 solved');
    const chips = page.locator('#level-nav .level-chip');
    await expect(chips.nth(0)).toHaveClass(/level-chip--current/);
    await expect(page.locator('#level-nav .level-chip--solved')).toHaveCount(0);

    expect(pageErrors).toEqual([]);
  });

  test('valid JSON with the wrong shape falls back gracefully to a fresh game (no crash)', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(err));

    await page.addInitScript(
      ({ key, raw }) => localStorage.setItem(key, raw),
      { key: STORAGE_KEY, raw: JSON.stringify({ foo: 1 }) }
    );
    await page.goto('/');

    await expect(page.locator('#level-indicator')).toHaveText('Level 1 of 12');
    await expect(page.locator('#solved-counter')).toHaveText('0 / 12 solved');

    expect(pageErrors).toEqual([]);
  });
});

test.describe('out-of-range currentLevel resilience', () => {
  test('currentLevel far beyond the last level clamps to the last level instead of crashing', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(err));

    const raw = JSON.stringify({ currentLevel: 999, solved: {}, attempts: {} });
    await page.addInitScript(
      ({ key, raw }) => localStorage.setItem(key, raw),
      { key: STORAGE_KEY, raw }
    );
    await page.goto('/');

    // Math.min(Math.max(999, 0), LEVELS.length - 1) === 11 -> "Level 12 of 12"
    await expect(page.locator('#level-indicator')).toHaveText('Level 12 of 12');
    const chips = page.locator('#level-nav .level-chip');
    await expect(chips.nth(11)).toHaveClass(/level-chip--current/);

    expect(pageErrors).toEqual([]);
  });
});
