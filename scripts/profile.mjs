/**
 * Performance profiler for Pirate Battle.
 *
 * Usage:
 *   1. Build and serve the production bundle:  npm run build && npm run preview
 *   2. In another terminal:                    node scripts/profile.mjs [--url http://localhost:4173] [--seconds 60] [--cycles 5]
 *
 * Produces profiling-report.md + profiling-report.json in ./profiling/.
 */
import { chromium } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'fs';

const args = process.argv.slice(2);
const arg = (name, dflt) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : dflt;
};
const URL_ = arg('url', 'http://localhost:4173');
const SAMPLE_SECONDS = Number(arg('seconds', 60));
const CYCLES = Number(arg('cycles', 5));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

await page.goto(URL_);
await page.evaluate(() => {
  localStorage.clear();
  (window).__setMswScenario?.('SUCCESS');
});
await page.reload();
await page.waitForSelector('[data-testid="screen-main-menu"]');

async function startMatch() {
  await page.getByTestId('btn-play').click();
  await page.waitForFunction(() => window.__pirateEngine?.isRunning === true, { timeout: 30_000 });
}

console.log(`Profiling ${URL_} — ${SAMPLE_SECONDS}s sample, ${CYCLES} memory cycles`);

// --- FPS sample during active combat ---
await startMatch();
await page.keyboard.down('KeyW'); // keep the ship moving
await page.evaluate(() => window.__pirateEngine.debugSetTimeRemaining(10000)); // avoid mid-sample end
const frameTimes = await page.evaluate(async (secs) => {
  const deltas = [];
  const t0 = performance.now();
  let last = t0;
  await new Promise((resolve) => {
    const tick = (now) => {
      deltas.push(now - last);
      last = now;
      if (now - t0 < secs * 1000) requestAnimationFrame(tick);
      else resolve();
    };
    requestAnimationFrame(tick);
  });
  return deltas;
}, SAMPLE_SECONDS);
const entityCount = await page.evaluate(() => {
  const s = window.__pirateEngine.debugGetState();
  return { enemies: s.enemies.length, projectiles: s.projectileCount };
});
await page.keyboard.up('KeyW');

frameTimes.sort((a, b) => a - b);
const avg = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
const p95 = frameTimes[Math.floor(frameTimes.length * 0.95)];
const fps = 1000 / avg;

async function abandonMatch() {
  // Defensive: the match may have ended (player died) or auto-paused.
  if (await page.getByTestId('screen-result').isVisible().catch(() => false)) {
    await page.getByTestId('btn-main-menu').click();
    await page.waitForSelector('[data-testid="screen-main-menu"]');
    return;
  }
  if (await page.getByTestId('modal-pause').isVisible().catch(() => false)) {
    await page.getByTestId('btn-abandon').click();
  } else {
    await page.getByTestId('btn-pause').click();
    await page.getByTestId('btn-abandon').click();
  }
  await page.waitForSelector('[data-testid="screen-main-menu"]');
}

// --- Memory cycles: start, play briefly, abandon; sample heap each cycle ---
await abandonMatch();

const heapSamples = [];
for (let i = 0; i < CYCLES; i++) {
  await startMatch();
  await page.waitForTimeout(2000);
  await abandonMatch();
  const mb = await page.evaluate(() =>
    performance.memory ? performance.memory.usedJSHeapSize / 1048576 : null
  );
  if (mb) heapSamples.push(mb.toFixed(1));
}

await browser.close();

const report = {
  url: URL_,
  viewport: '1280x720',
  environment: {
    platform: process.platform,
    node: process.version,
    browser: 'Chromium (Playwright, headless — software rendering)',
  },
  sampleSeconds: SAMPLE_SECONDS,
  frames: frameTimes.length,
  avgFrameMs: avg.toFixed(2),
  fps: fps.toFixed(1),
  p95FrameMs: p95.toFixed(2),
  entitiesAtSampleEnd: entityCount,
  heapAfterCyclesMB: heapSamples,
};

mkdirSync('profiling', { recursive: true });
writeFileSync('profiling/profiling-report.json', JSON.stringify(report, null, 2));
writeFileSync(
  'profiling/profiling-report.md',
  `# Profiling Report — Pirate Battle\n\n` +
    `- URL: ${URL_}\n- Viewport: 1280x720\n- Platform: ${process.platform} / Node ${process.version}\n` +
    `- Browser: Chromium (Playwright)\n- Sample duration: ${SAMPLE_SECONDS}s\n\n` +
    `> Note: headless Playwright runs with software rendering (no GPU), so FPS numbers\n` +
    `> here are a pessimistic floor. On a real browser with GPU acceleration, frame\n` +
    `> times are significantly lower. The heap cycle test is environment-independent.\n\n` +
    `## Frame metrics\n\n` +
    `- Frames: ${report.frames}\n- Average frame time: ${report.avgFrameMs} ms (~${report.fps} FPS)\n` +
    `- p95 frame time: ${report.p95FrameMs} ms\n- Entities at sample end: ${entityCount.enemies} enemies, ${entityCount.projectiles} projectiles\n\n` +
    `## Memory (${CYCLES} start/play/abandon cycles)\n\n` +
    `- JS heap after each cycle (MB): ${heapSamples.join(', ') || 'n/a (performance.memory unavailable)'}\n`
);
console.log(JSON.stringify(report, null, 2));
