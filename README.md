# Pirate Battle — 2D Top-Down Naval Shooter

A 2D top-down naval shooter game built with **React**, **TypeScript (Strict Mode)**, **PixiJS**, **TanStack Query**, **Axios**, **MSW**, and **Playwright**.

---

## Features

- **2D Top-Down Gameplay**: forward thrust and smooth rotational steering, restricted to the visible arena.
- **Armament Systems**: frontal cannon (1 projectile) and left/right broadsides (3 parallel projectiles each) with independent cooldowns.
- **Enemy AI**:
  - **Chaser**: pursues the player and explodes on collision (no score for self-destruction).
  - **Shooter**: approaches the player, keeps attack range, and fires frontal cannonballs.
- **Arena & Obstacles**: tiled ocean and islands that block ships and destroy projectiles.
- **Pause & Resume**: manual pause plus automatic pause on window blur / tab hide / device rotation to portrait; the clock and simulation never advance while paused.
- **Options**: Game Session Time (60–180s) and Enemy Spawn Interval (1–10s) with validation and `localStorage` persistence.
- **Global Ranking & Match History**: paginated REST endpoints mocked with MSW, consumed via Axios + TanStack Query with deterministic tie-breaking and same-config comparison.
- **Offline & Pending Match Sync**: failed registrations are queued in `localStorage` and retried without duplication; the player can keep playing with pending records.
- **MSW Scenario Control**: live scenario selector + database reset in the main menu.
- **Mobile (Landscape)**: forced-landscape experience with on-screen controls, fit-to-screen UI scaling, auto-pause when rotating to portrait, and a "rotate device" prompt.
- **Asset Loading**: visible progress bar while loading, plus error state with Retry on failure.

---

## Technical Stack

| Component | Technology |
| --- | --- |
| UI & Screens | React 18 |
| Language | TypeScript (Strict Mode) |
| Game Engine / Renderer | PixiJS 8 |
| Remote State & Cache | TanStack Query 5 |
| HTTP Client | Axios |
| Mock Service Worker | MSW 2 |
| Audio | Howler.js |
| Styling | Tailwind CSS |
| E2E & Visual Testing | Playwright |
| Lint | ESLint 9 (flat config) |

---

## Getting Started

### Prerequisites

- Node.js >= 18
- npm >= 9

### Installation & Setup

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. MSW is active in development **and** in the production build/preview.

No environment variables are required — the game runs entirely in the browser with mocked APIs.

---

## Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start Vite dev server (with MSW) |
| `npm run build` | Typecheck + production build |
| `npm run preview` | Serve the production build at `:4173` |
| `npm run lint` | ESLint over `src/` |
| `npm run typecheck` | TypeScript check (no emit) |
| `npm run test:e2e` | Playwright E2E + visual regression (desktop + mobile projects) |
| `npx playwright test --update-snapshots` | Regenerate visual baselines |
| `npx playwright show-report` | Open the HTML test report |
| `npm run profile` | FPS + memory profiling against the preview build |

For profiling: run `npm run build && npm run preview` first, then `npm run profile` (options: `--seconds`, `--cycles`, `--url`). Output lands in `profiling/`.

---

## Controls

### Keyboard
- `W` / `↑` — Forward thrust
- `A` / `←`, `D` / `→` — Turn left / right
- `Space` / `I` — Front cannon
- `Q` / `U` — Left broadside (3 shots)
- `E` / `O` — Right broadside (3 shots)

### Touch
On-screen buttons (turn / thrust on the left, broadsides + front cannon on the right). The game is designed for **landscape** orientation — rotating to portrait pauses the match and shows a rotate prompt.

---

## MSW Network Scenarios

Use the **Network** selector (top-left of the main menu) plus the **Reset** button to restore the fixture database:

| Scenario | Behavior |
| --- | --- |
| Success | Normal API responses |
| Empty Lists | Empty ranking and history |
| High Latency | +1.5s delay on all API calls |
| Flaky | Variable latency (0.2–2s), out-of-order responses |
| Timeout (All APIs) | Every request times out (504 after 9s) |
| Timeout on Match Register | Only `POST /api/matches` times out → match stays pending locally |
| Client Error (400) | All APIs return 400 |
| Server Error (500) | All APIs return 500 |
| Ranking API Down | Only ranking fails (503); history still works |
| History API Down | Only history fails (503) |
| Asset Loading Failure | Game PNG assets return 500 → exercises the loading error/retry UI |

The chosen scenario persists across reloads (`localStorage`). To reproduce a pending-match recovery: select **Timeout on Match Register**, finish a match (result shows "Saved locally"), then switch back to **Success** and reload — the pending record is synced automatically without duplication.

---

## Test Instrumentation

For deterministic E2E tests the app exposes:

- `window.__pirateEngine` — current `GameEngine`; `debugGetState()` returns score, time, player position/cooldowns, enemies, projectiles and total shots; `debugSetTimeRemaining(s)` fast-forwards the clock.
- `window.__pirateRng` — when set to a seeded RNG (mulberry32 in tests), spawn positions and enemy types become reproducible.
- `window.__setMswScenario(name)` / `window.__resetMswDatabase()` — scenario and fixture control from test code.

These hooks only observe or steer the simulation — the real rules, inputs, collisions and rendering run normally.
