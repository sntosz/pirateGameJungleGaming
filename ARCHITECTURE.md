# ARCHITECTURE.md — Pirate Battle Naval Shooter

## Overview

This document describes the architecture, design decisions, data flow, and performance evidence for **Pirate Battle**.

---

## 1. React & PixiJS Integration

- **Separation of concerns**: React renders all menus, forms, dialogs, tabs and HUD overlays. PixiJS (`GameEngine`) owns the canvas, entities, physics, collisions and effects.
- **Bridge**: `GameCanvas` mounts `GameEngine` in an `useEffect` (StrictMode-safe: `init()` is async and guarded by `isMounted`/`isDestroyed`; `destroy()` fully tears down on unmount). The HUD syncs through a per-frame `onStatsUpdate` callback that calls `setState` in React — Pixi runs the simulation; React never re-renders canvas content.
- **Lifecycle**: `destroy()` removes all window listeners (keydown/keyup/blur/visibility/resize), stops the ticker, destroys sprites/containers, and calls `app.destroy()`.

## 2. Simulation Loop

- **Delta-time**: `update(dt)` uses `ticker.deltaMS` clamped to 100ms — movement, cooldowns, timers and spawns are framerate-independent.
- **Entities**: `Player`, `Enemy` (CHASER/SHOOTER AI with island avoidance steering), `Projectile`, `Island`, `EffectManager`, `SpawnManager`, `HealthBar`.
- **Collisions**: circle–polygon (ships/projectiles vs islands) and circle–circle (ship vs ship/projectile) in `MathUtils.ts`.
- **Spawning**: `SpawnManager` picks random points respecting `spawnDistanceMin` from the player, island clearance and minimum spacing between enemies; type selection via `chaserSpawnRatio`.
- **Pause**: `isPaused` freezes the update entirely — timers, cooldowns, motion and spawns stop; inputs are zeroed on pause.

## 3. Config & Balance

All gameplay parameters live in the typed `GameConfig` / `DEFAULT_GAME_CONFIG` (`src/types/game.ts`): session time, spawn interval and ratio, speeds, turn rates, damages, ranges, projectile speeds and cooldowns. Each match receives a snapshot (`config` prop copied into `MatchResult.config`), so changing options mid-session only affects new matches.

## 4. Responsive & Mobile

- **Scaling**: Pixi renderer uses `resizeTo` + `devicePixelRatio` (`autoDensity`); `handleResize` letterbox-scales `gameLayer` to preserve the 1280×720 arena aspect.
- **UI scaling**: `useFitScale(designW, designH)` computes `min(1, vw/W, vh/H)` and applies `transform: scale()` to fixed-design-size panels (menu 800/1490×760, options 760×680, modals) — the same markup serves desktop and phone without reflow bugs.
- **Landscape enforcement**: `screen.orientation.lock('landscape')` is attempted on game start (Android); on iOS an overlay (`RotateOverlay`, `portrait:` variant) prompts rotation and the match auto-pauses via `matchMedia('(orientation: portrait)')`.
- **Touch**: `TouchControls` uses per-button touch handlers (multi-touch capable), `touchcancel` cleanup, `safe-area-inset` padding and `contextmenu` suppression.

## 5. Remote State (TanStack Query + Axios + MSW)

- **API**: Axios instance (`/api`, 8s timeout). Endpoints: `GET /ranking` (paginated, filtered by the current `sessionTime`/`enemySpawnInterval` so only same-config matches are compared), `GET /history`, `POST /matches`.
- **Tie-breaking** (deterministic): score desc → duration asc → date asc → playerId.
- **Cache**: `useRanking`/`useMatchHistory` keyed by page + config; `useRegisterMatch` invalidates both. Global `retry: 2`, `refetchOnWindowFocus`.
- **Idempotency**: matches carry unique ids; the mock returns the existing record on re-POST → no duplicates on retry.
- **Offline queue**: failed submissions go to `pirate_battle_pending_matches` in localStorage; `useOfflineSync` retries on mount and on the `online` event.

## 6. MSW Layer

`src/mocks/handlers.ts` holds fixtures (12 players), a localStorage-backed DB (`pirate_battle_msw_db`), and a scenario engine (`applyScenario`) shared by dev, preview and tests. Scenarios: SUCCESS, EMPTY, DELAYED, FLAKY, TIMEOUT, POST_TIMEOUT, ERROR_400, ERROR_500, RANKING_ERROR, HISTORY_ERROR, ASSET_FAIL. Scenario persists in `localStorage`; `window.__setMswScenario`/`__resetMswDatabase` allow external control (tests, QA). The UI selector lives in the main menu with a DB **Reset** button.

## 7. Asset Loading

`TextureManager` (singleton) preloads 28 textures with a progress callback → `GameCanvas` shows a progress bar. Any failure throws before combat starts; the UI offers **Retry** (cache-busted reload). The `ASSET_FAIL` MSW scenario makes failures reproducible.

## 8. Accessibility

- `role="dialog"` + `aria-modal` on modals, `useFocusTrap` (Tab cycling, initial focus, focus restore) on Pause/Options/Result.
- `aria-label` on every control; keyboard-navigable menus; visible focus rings.
- `aria-live="polite"` HUD region announces score/health/time once per second (no per-frame announcements).
- Game keys are captured only while a match engine is running and not paused.

## 9. Testing

- **Playwright config**: two projects — `chromium-desktop` (1280×720) and `chromium-mobile` (Pixel 7 UA, 915×412 landscape, touch). HTML report, traces/screenshots/video on failure, auto dev-server.
- **Determinism**: `seedRng` installs mulberry32 as `__pirateRng`; `debugSetTimeRemaining` controls the clock; `debugGetState` observes the simulation.
- **Coverage**: options validation+persistence, asset loading/error/retry, movement/rotation/arena bounds, front/broadside firing + cooldown (via `shotsFired` counter), enemy spawn, end-by-time, clean restart, pause + auto-pause on visibility loss without clock drift, abandon, touch controls, result persistence after refresh, ranking/history pagination + empty/error states, scenario switching, single registration + pending recovery without duplication, and visual regression baselines (menu, arena, result) per project.

## 10. Performance Evidence

See `profiling/profiling-report.md` (generated by `scripts/profile.mjs`):

- Frame metrics collected in the **production build** via `requestAnimationFrame` deltas during live combat: avg frame time, FPS and p95.
- Memory: JS heap sampled after 5 start/play/abandon cycles — stable (~10.7 MB), no continuous growth; `destroy()` releases all entities/listeners.
- **Limitation**: headless Chromium uses software rendering, so reported FPS is a pessimistic floor; on GPU-backed browsers it is substantially higher.

## Limitations & Decisions

- Spawn positions use `Math.random` by default (seeded only in tests).
- Landscape-only on phones; portrait shows the rotate prompt.
- Bundle is a single ~850KB chunk (PixiJS + MSW included) — could be code-split later.
