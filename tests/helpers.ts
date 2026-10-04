import { Page, expect } from '@playwright/test';

/** Fresh, isolated state: clears localStorage and resets the MSW scenario. */
export async function resetAppState(page: Page) {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
    (window as any).__setMswScenario?.('SUCCESS');
    (window as any).__resetMswDatabase?.();
  });
  await page.reload();
  await expect(page.getByTestId('screen-main-menu')).toBeVisible();
}

export async function setScenario(page: Page, scenario: string) {
  await page.evaluate((sc) => (window as any).__setMswScenario?.(sc), scenario);
}

/** Installs a deterministic RNG (mulberry32) for spawn generation. */
export async function seedRng(page: Page, seed = 42) {
  await page.addInitScript((s) => {
    let t = s >>> 0;
    (window as any).__pirateRng = () => {
      t += 0x6d2b79f5;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }, seed);
}

/** Starts a match and waits for the engine to be live. */
export async function startMatch(page: Page) {
  await page.getByTestId('btn-play').click();
  await page.waitForFunction(() => (window as any).__pirateEngine?.isRunning === true);
}

export async function engineState(page: Page) {
  return page.evaluate(() => (window as any).__pirateEngine.debugGetState());
}

/** Fast-forwards the match clock to trigger TIME_EXPIRED within ~1 frame. */
export async function forceMatchEnd(page: Page, secondsLeft = 0.05) {
  await page.evaluate((s) => (window as any).__pirateEngine.debugSetTimeRemaining(s), secondsLeft);
}
