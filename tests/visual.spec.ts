import { test, expect } from '@playwright/test';
import { resetAppState, seedRng, startMatch, forceMatchEnd } from './helpers';

test.describe('Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    await seedRng(page, 99);
    await resetAppState(page);
  });

  test('main menu matches baseline', async ({ page }) => {
    await expect(page.getByTestId('screen-main-menu')).toBeVisible();
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('main-menu.png');
  });

  test('arena in stable initial state matches baseline', async ({ page }) => {
    await startMatch(page);
    // Screenshot right after start: no enemies have spawned yet (seeded RNG),
    // islands and arena layout are deterministic.
    const s = await page.evaluate(() => (window as any).__pirateEngine.debugGetState());
    expect(s.enemies.length).toBe(0);
    await expect(page).toHaveScreenshot('arena-initial.png');
  });

  test('result screen matches baseline', async ({ page }) => {
    await startMatch(page);
    await forceMatchEnd(page, 0.05);
    await expect(page.getByTestId('screen-result')).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(400);
    await expect(page).toHaveScreenshot('result-screen.png', { maxDiffPixelRatio: 0.08 });
  });
});
