import { test, expect } from '@playwright/test';

test.describe('Combat & Gameplay Mechanics', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('should start match, render arena canvas and HUD, shoot and pause match', async ({ page }) => {
    await expect(page.getByTestId('screen-main-menu')).toBeVisible();

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

  test('should handle abandon match from pause menu', async ({ page }) => {
    await page.getByTestId('btn-play').click();
    await expect(page.getByTestId('hud-score')).toBeVisible();

    await page.getByTestId('btn-pause').click();
    await page.getByTestId('btn-abandon').click();

    await expect(page.getByTestId('screen-main-menu')).toBeVisible();
  });
});
