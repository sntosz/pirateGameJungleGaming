import { test, expect } from '@playwright/test';
import { resetAppState, seedRng, startMatch, engineState } from './helpers';

test.describe('Combat & Gameplay Mechanics', () => {
  test.beforeEach(async ({ page }) => {
    await seedRng(page, 7);
    await resetAppState(page);
  });

  test('should start match, render arena canvas and HUD, shoot and pause match', async ({ page }) => {
    await page.getByTestId('btn-play').click();

    await expect(page.getByTestId('hud-score')).toHaveText('0');
    await expect(page.getByTestId('hud-timer')).toBeVisible();
    await expect(page.getByTestId('game-canvas-container')).toBeVisible();

    await page.keyboard.press('KeyW');
    await page.keyboard.press('Space');
    await page.keyboard.press('KeyQ');
    await page.keyboard.press('KeyE');

    await page.getByTestId('btn-pause').click();
    await expect(page.getByTestId('modal-pause')).toBeVisible();

    await page.getByTestId('btn-resume').click();
    await expect(page.getByTestId('modal-pause')).not.toBeVisible();
  });

  test('player ship moves forward and rotates with keyboard input', async ({ page }) => {
    await startMatch(page);
    const before = await engineState(page);

    await page.keyboard.down('KeyW');
    await page.keyboard.down('KeyD');
    await page.waitForTimeout(800);
    await page.keyboard.up('KeyW');
    await page.keyboard.up('KeyD');

    const after = await engineState(page);
    const moved =
      Math.abs(after.player.x - before.player.x) + Math.abs(after.player.y - before.player.y);
    expect(moved).toBeGreaterThan(5);
    expect(Math.abs(after.player.rotation - before.player.rotation)).toBeGreaterThan(0.3);
  });

  test('player stays inside arena bounds', async ({ page }) => {
    await startMatch(page);

    // Hold thrust + turn for a while, then verify the ship never left the arena.
    await page.keyboard.down('KeyW');
    for (let i = 0; i < 10; i++) {
      await page.waitForTimeout(600);
      const s = await engineState(page);
      expect(s.player.x).toBeGreaterThanOrEqual(0);
      expect(s.player.x).toBeLessThanOrEqual(1280);
      expect(s.player.y).toBeGreaterThanOrEqual(0);
      expect(s.player.y).toBeLessThanOrEqual(720);
    }
    await page.keyboard.up('KeyW');
  });

  test('front cannon fires a projectile and respects cooldown', async ({ page }) => {
    // Use a longer cooldown (2s) via persisted config so timing is deterministic
    // even on slower emulated devices.
    await page.addInitScript(() => {
      localStorage.setItem('pirate_battle_config', JSON.stringify({ frontCannonCooldown: 2 }));
    });
    await page.reload();
    await expect(page.getByTestId('screen-main-menu')).toBeVisible();
    await startMatch(page);

    await page.keyboard.press('Space');
    await expect
      .poll(async () => (await engineState(page)).shotsFired, { timeout: 3000 })
      .toBe(1);

    // A second shot within the cooldown window is blocked.
    await page.keyboard.press('Space');
    await page.waitForTimeout(300);
    expect((await engineState(page)).shotsFired).toBe(1);

    // After the cooldown elapses, firing works again.
    await page.waitForTimeout(2000);
    await page.keyboard.press('Space');
    await expect
      .poll(async () => (await engineState(page)).shotsFired, { timeout: 3000 })
      .toBe(2);
  });

  test('broadside fires three parallel projectiles', async ({ page }) => {
    await startMatch(page);
    await page.keyboard.press('KeyQ');
    await expect
      .poll(async () => (await engineState(page)).shotsFired, { timeout: 3000 })
      .toBe(3);
  });

  test('enemies spawn over time (seeded)', async ({ page }) => {
    await startMatch(page);
    // Spawn interval default is 3s (first spawn at ~1.5s).
    await expect
      .poll(async () => (await engineState(page)).enemies.length, { timeout: 10_000 })
      .toBeGreaterThan(0);
  });

  test('pause suspends the match clock and resume does not advance it', async ({ page }) => {
    await startMatch(page);
    await page.waitForTimeout(500);

    await page.getByTestId('btn-pause').click();
    await expect(page.getByTestId('modal-pause')).toBeVisible();

    const paused = await engineState(page);
    await page.waitForTimeout(1200);
    const stillPaused = await engineState(page);
    expect(stillPaused.timeRemaining).toBeCloseTo(paused.timeRemaining, 1);
    expect(stillPaused.isPaused).toBe(true);

    await page.getByTestId('btn-resume').click();
    await page.waitForTimeout(400);
    const resumed = await engineState(page);
    expect(resumed.isPaused).toBe(false);
    expect(resumed.timeRemaining).toBeLessThanOrEqual(paused.timeRemaining);
  });

  test('losing tab visibility auto-pauses the match', async ({ page }) => {
    await startMatch(page);
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { value: true, configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect(page.getByTestId('modal-pause')).toBeVisible();
    const s = await engineState(page);
    expect(s.isPaused).toBe(true);
  });

  test('should handle abandon match from pause menu', async ({ page }) => {
    await startMatch(page);
    await page.getByTestId('btn-pause').click();
    await page.getByTestId('btn-abandon').click();
    await expect(page.getByTestId('screen-main-menu')).toBeVisible();
  });

  test('touch controls move the ship and fire cannons', async ({ page }, testInfo) => {
    test.skip(!testInfo.project.name.includes('mobile'), 'touch-only test');
    await startMatch(page);

    const before = await engineState(page);
    const thrust = page.getByLabel('Thrust Forward');
    await thrust.dispatchEvent('touchstart');
    await page.waitForTimeout(600);
    await thrust.dispatchEvent('touchend');

    const after = await engineState(page);
    const moved =
      Math.abs(after.player.x - before.player.x) + Math.abs(after.player.y - before.player.y);
    expect(moved).toBeGreaterThan(2);

    await page.getByLabel('Fire Front Cannon').dispatchEvent('touchstart');
    await expect
      .poll(async () => (await engineState(page)).shotsFired, { timeout: 3000 })
      .toBeGreaterThanOrEqual(1);
  });
});
