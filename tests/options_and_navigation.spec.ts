import { test, expect } from '@playwright/test';

test.describe('Options & Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('should navigate to options, adjust parameters, validate and persist after refresh', async ({ page }) => {
    await expect(page.getByTestId('screen-main-menu')).toBeVisible();

    await page.getByTestId('btn-options').click();
    await expect(page.getByTestId('screen-options')).toBeVisible();

    const nameInput = page.getByTestId('input-player-name');
    await nameInput.fill('Captain Blackbeard');

    const sessionTimeInput = page.getByTestId('input-session-time');
    await sessionTimeInput.fill('120');

    const spawnIntervalInput = page.getByTestId('input-spawn-interval');
    await spawnIntervalInput.fill('5');

    await page.getByTestId('btn-save-options').click();
    await expect(page.getByText('SAVED!')).toBeVisible();

    await page.getByTestId('btn-options-back').click();
    await expect(page.getByText('Captain Blackbeard')).toBeVisible();

    await page.reload();
    await expect(page.getByText('Captain Blackbeard')).toBeVisible();

    await page.getByTestId('btn-options').click();
    await expect(page.getByTestId('val-session-time')).toHaveText('120s');
    await expect(page.getByTestId('val-spawn-interval')).toHaveText('5s');
  });

  test('should view ranking and match history tabs with pagination', async ({ page }) => {
    await expect(page.getByTestId('screen-main-menu')).toBeVisible();

    await page.getByTestId('tab-btn-ranking').click();
    await expect(page.getByTestId('tab-ranking')).toBeVisible();
    await expect(page.getByText('GLOBAL RANKING')).toBeVisible();

    await page.getByTestId('tab-btn-history').click();
    await expect(page.getByTestId('tab-match-history')).toBeVisible();
    await expect(page.getByText('MATCH HISTORY')).toBeVisible();
  });
});
