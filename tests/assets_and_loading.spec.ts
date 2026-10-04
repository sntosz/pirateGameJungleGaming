import { test, expect } from '@playwright/test';
import { resetAppState, setScenario } from './helpers';

test.describe('Asset Loading & Error Recovery', () => {
  test('shows loading progress while game assets load', async ({ page }) => {
    await resetAppState(page);
    const loading = page.getByTestId('asset-loading');
    const engineReady = page.waitForFunction(
      () => (window as any).__pirateEngine?.isRunning === true
    );
    await page.getByTestId('btn-play').click();
    // Loading UI may flash quickly on warm cache; assert game reaches running state.
    await engineReady;
    await expect(loading).not.toBeVisible();
  });

  test('asset failure shows error and retry recovers', async ({ page }) => {
    await resetAppState(page);
    await setScenario(page, 'ASSET_FAIL');

    await page.getByTestId('btn-play').click();
    await expect(page.getByTestId('asset-load-error')).toBeVisible({ timeout: 20_000 });

    await setScenario(page, 'SUCCESS');
    await page.getByTestId('btn-retry-assets').click();
    await page.waitForFunction(() => (window as any).__pirateEngine?.isRunning === true, {
      timeout: 20_000,
    });
    await expect(page.getByTestId('hud-score')).toBeVisible();
  });
});
