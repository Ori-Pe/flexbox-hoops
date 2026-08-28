import { test, expect } from '@playwright/test';

// Level 9 ("bottom-up"), per js/levels.js:
//   editableTargets: [{ kind: 'container' }]
//   solution: { container: { flexDirection: 'column-reverse', justifyContent: 'flex-end' } }
// Goal text: "Stacked, reversed, and pushed to the top of the court."
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/');
  await page.locator('#level-nav .level-chip').nth(8).click();
  await expect(page.locator('#level-indicator')).toHaveText('Level 9 of 12');
});

test('level 9 solution stacks balls toward the top of the court', async ({ page }) => {
  const textarea = page.locator('#editor-blocks textarea').first();
  await textarea.fill('flex-direction: column-reverse;\njustify-content: flex-end;');

  // Screenshot before checking, for visual confirmation of ball placement.
  await page.screenshot({ path: 'test-results/level-9-before-check.png' });

  await page.locator('#check-btn').click();
  await expect(page.locator('#success-overlay')).toBeVisible();

  // Geometric confirmation: every ball should be aligned with its basket
  // (already asserted by success), and the balls should sit in the upper
  // portion of the court, not the lower portion.
  const courtBox = await page.locator('#court').boundingBox();
  const ballBoxes = await page.locator('#ball-layer .ball').evaluateAll((els) =>
    els.map((el) => el.getBoundingClientRect().top)
  );
  const courtMidY = courtBox.y + courtBox.height / 2;
  for (const ballTop of ballBoxes) {
    expect(ballTop).toBeLessThan(courtMidY);
  }
});
