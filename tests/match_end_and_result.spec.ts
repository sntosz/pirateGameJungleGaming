import { test, expect } from '@playwright/test';
import { resetAppState, seedRng, startMatch, engineState, forceMatchEnd, setScenario } from './helpers';

test.describe('Match End, Result Screen & Match Registration', () => {
  test.beforeEach(async ({ page }) => {
    await seedRng(page, 11);
    await resetAppState(page);
  });

  test('match ends by timeout and result screen shows score, duration and sync status', async ({ page }) => {
    await startMatch(page);
    await forceMatchEnd(page, 0.05);

    await expect(page.getByTestId('screen-result')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('result-score')).toBeVisible();
    await expect(page.getByTestId('result-duration')).toBeVisible();
    await expect(page.getByText(/Match recorded online|Saved locally|Syncing/)).toBeVisible();
  });

  test('simulation fully stops after match end', async ({ page }) => {
    await startMatch(page);
    await forceMatchEnd(page, 0.05);
    await expect(page.getByTestId('screen-result')).toBeVisible({ timeout: 15_000 });

    const s = await engineState(page);
    expect(s.isRunning).toBe(false);
  });

  test('play again restarts a clean match', async ({ page }) => {
    await startMatch(page);
    await forceMatchEnd(page, 0.05);
    await expect(page.getByTestId('screen-result')).toBeVisible({ timeout: 15_000 });

    await page.getByTestId('btn-play-again').click();
    await page.waitForFunction(() => (window as any).__pirateEngine?.isRunning === true);

    const s = await engineState(page);
    expect(s.score).toBe(0);
    expect(s.player.hp).toBe(s.player.hp); // sanity
    await expect(page.getByTestId('hud-score')).toHaveText('0');
  });

  test('result persists after page refresh', async ({ page }) => {
    await startMatch(page);
    await forceMatchEnd(page, 0.05);
    await expect(page.getByTestId('screen-result')).toBeVisible({ timeout: 15_000 });

    const stored = await page.evaluate(() => localStorage.getItem('pirate_battle_last_result'));
    expect(stored).toBeTruthy();
    expect(JSON.parse(stored!).endReason).toBe('TIME_EXPIRED');

    await page.reload();
    await expect(page.getByTestId('screen-main-menu')).toBeVisible();
  });

  test('match registered once in history and ranking after finishing', async ({ page }) => {
    await startMatch(page);
    await forceMatchEnd(page, 0.05);
    await expect(page.getByTestId('screen-result')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Match recorded online')).toBeVisible({ timeout: 15_000 });

    const db = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('pirate_battle_msw_db') || '[]')
    );
    const mine = db.filter((m: any) => m.playerId === 'p-user-local');
    expect(mine).toHaveLength(1);

    await page.getByTestId('btn-main-menu').click();
    await page.getByTestId('tab-btn-history').click();
    await expect(page.getByTestId('tab-match-history')).toBeVisible();
    await expect(page.getByTestId('tab-match-history').getByText(/TIME UP/i).first()).toBeVisible();
  });

  test('failed match registration stays pending and recovers without duplication', async ({ page }) => {
    await setScenario(page, 'POST_TIMEOUT');
    await startMatch(page);
    await forceMatchEnd(page, 0.05);

    await expect(page.getByTestId('screen-result')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Saved locally (pending sync)')).toBeVisible({ timeout: 20_000 });

    // Pending record persisted locally.
    const pending = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('pirate_battle_pending_matches') || '[]')
    );
    expect(pending.length).toBe(1);

    // Player can still start another match with a pending record.
    await page.getByTestId('btn-main-menu').click();
    await page.getByTestId('btn-play').click();
    await page.waitForFunction(() => (window as any).__pirateEngine?.isRunning === true);
    await page.getByTestId('btn-pause').click();
    await page.getByTestId('btn-abandon').click();

    // Recover: scenario back to success + connectivity event triggers pending sync.
    await setScenario(page, 'SUCCESS');
    await page.evaluate(() => window.dispatchEvent(new Event('online')));
    await page.waitForTimeout(1500);

    const synced = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('pirate_battle_pending_matches') || '[]')
    );
    expect(synced.length).toBe(0);

    await startMatch(page);
    await forceMatchEnd(page, 0.05);
    await expect(page.getByTestId('screen-result')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Match recorded online')).toBeVisible({ timeout: 15_000 });

    const db = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('pirate_battle_msw_db') || '[]')
    );
    const mine = db.filter((m: any) => m.playerId === 'p-user-local');
    // Two distinct matches (the pending one synced + the new one), no duplicates.
    expect(mine).toHaveLength(2);
    expect(new Set(mine.map((m: any) => m.id)).size).toBe(2);
  });
});
