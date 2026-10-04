import { test, expect } from '@playwright/test';
import { resetAppState, setScenario } from './helpers';

test.describe('Ranking, Match History & MSW Scenarios', () => {
  test.beforeEach(async ({ page }) => {
    await resetAppState(page);
  });

  test('scenario selector and reset button are available in the main menu', async ({ page }) => {
    await expect(page.getByTestId('select-msw-scenario')).toBeVisible();
    await expect(page.getByTestId('btn-reset-msw-db')).toBeVisible();
  });

  test('ranking shows paginated fixture players ordered by score', async ({ page }) => {
    await page.getByTestId('tab-btn-ranking').click();
    await expect(page.getByTestId('tab-ranking')).toBeVisible();

    // 12 fixtures, pageSize 5 → 3 pages; first entry is the top scorer.
    await expect(page.getByText('Blackbeard')).toBeVisible();
    await expect(page.getByText('Page 1 of 3')).toBeVisible();

    await page.getByTestId('btn-ranking-next').click();
    await expect(page.getByText('Page 2 of 3')).toBeVisible();

    await page.getByTestId('btn-ranking-prev').click();
    await expect(page.getByText('Page 1 of 3')).toBeVisible();
  });

  test('history tab loads (possibly empty) without breaking navigation', async ({ page }) => {
    await page.getByTestId('tab-btn-history').click();
    await expect(page.getByTestId('tab-match-history')).toBeVisible();
    await page.getByTestId('btn-main-menu').click();
    await page.getByTestId('tab-btn-ranking').click();
    await expect(page.getByTestId('tab-ranking')).toBeVisible();
  });

  test('empty scenario renders empty states on both tabs', async ({ page }) => {
    await page.getByTestId('select-msw-scenario').selectOption('EMPTY');

    await page.getByTestId('tab-btn-ranking').click();
    await expect(page.getByTestId('ranking-empty')).toBeVisible();

    await page.getByTestId('tab-btn-history').click();
    await expect(page.getByTestId('history-empty')).toBeVisible();
  });

  test('500 scenario shows error state on ranking while game stays usable', async ({ page }) => {
    await page.getByTestId('select-msw-scenario').selectOption('ERROR_500');
    await page.getByTestId('tab-btn-ranking').click();
    await expect(page.getByTestId('ranking-error')).toBeVisible();

    // Game still works despite API failure.
    await page.getByTestId('btn-main-menu').click();
    await page.getByTestId('btn-play').click();
    await page.waitForFunction(() => (window as any).__pirateEngine?.isRunning === true);
  });

  test('ranking-only failure does not break match history', async ({ page }) => {
    await page.getByTestId('select-msw-scenario').selectOption('RANKING_ERROR');
    await page.getByTestId('tab-btn-ranking').click();
    await expect(page.getByTestId('ranking-error')).toBeVisible();

    await page.getByTestId('tab-btn-history').click();
    await expect(page.getByTestId('tab-match-history')).toBeVisible();
    await expect(page.getByTestId('history-error')).not.toBeVisible();
  });

  test('delayed scenario resolves eventually', async ({ page }) => {
    await page.getByTestId('select-msw-scenario').selectOption('DELAYED');
    await page.getByTestId('tab-btn-ranking').click();
    await expect(page.getByText('Blackbeard')).toBeVisible({ timeout: 15_000 });
  });

  test('reset restores fixture database', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('pirate_battle_msw_db', '[]');
    });
    await page.getByTestId('btn-reset-msw-db').click();
    await page.getByTestId('tab-btn-ranking').click();
    await expect(page.getByText('Blackbeard')).toBeVisible();
  });
});
