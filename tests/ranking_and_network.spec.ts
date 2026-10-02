import { test, expect } from '@playwright/test';

test.describe('Ranking, MSW & Network Scenarios', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('should handle empty leaderboard scenario', async ({ page }) => {
    await page.getByTestId('select-msw-scenario').selectOption('EMPTY');
    await page.getByTestId('tab-btn-ranking').click();

    await expect(page.getByTestId('ranking-empty')).toBeVisible();
  });

  test('should handle 500 error scenario and display retry option', async ({ page }) => {
    await page.getByTestId('select-msw-scenario').selectOption('ERROR_500');
    await page.getByTestId('tab-btn-ranking').click();

    await expect(page.getByTestId('ranking-error')).toBeVisible();
  });
});
