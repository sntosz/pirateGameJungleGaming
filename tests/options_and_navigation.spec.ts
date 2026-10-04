import { test, expect } from '@playwright/test';

test.describe('Options & Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('should adjust options with steppers and persist on return to menu', async ({ page }) => {
    await expect(page.getByTestId('screen-main-menu')).toBeVisible();

    await page.getByTestId('btn-options').click();
    await expect(page.getByTestId('screen-options')).toBeVisible();

    for (let step = 0; step < 6; step++) {
      await page.getByTestId('btn-session-increase').click();
    }
    for (let step = 0; step < 4; step++) {
      await page.getByTestId('btn-spawn-increase').click();
    }

    await expect(page.getByTestId('val-session-time')).toHaveText('120 s');
    await expect(page.getByTestId('val-spawn-interval')).toHaveText('5 s');

    await page.getByTestId('btn-options-back').click();
    await expect(page.getByTestId('screen-main-menu')).toBeVisible();

    await page.reload();
    await page.getByTestId('btn-options').click();
    await expect(page.getByTestId('val-session-time')).toHaveText('120 s');
    await expect(page.getByTestId('val-spawn-interval')).toHaveText('5 s');
  });

  test('should view ranking and match history tabs with pagination', async ({ page }) => {
    await expect(page.getByTestId('screen-main-menu')).toBeVisible();

    await page.getByTestId('tab-btn-ranking').click();
    await expect(page.getByTestId('tab-ranking')).toBeVisible();
    await expect(page.getByText('Blackbeard')).toBeVisible();
    await expect(page.getByText('Page 1 of 3')).toBeVisible();

    await page.getByTestId('btn-ranking-next').click();
    await expect(page.getByText('Page 2 of 3')).toBeVisible();

    await page.getByTestId('tab-btn-history').click();
    await expect(page.getByTestId('tab-match-history')).toBeVisible();
    await expect(page.getByText(/recent battles/i)).toBeVisible();
  });
});
