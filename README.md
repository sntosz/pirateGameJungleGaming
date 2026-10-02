# Pirate Battle — 2D Top-Down Naval Shooter

A 2D top-down naval shooter game built with **React**, **TypeScript (Strict Mode)**, **PixiJS**, **TanStack Query**, **Axios**, **MSW**, and **Playwright**.

---

## Features

- **2D Top-Down Gameplay**: Ships with realistic top-down sailing physics, forward thrust, reverse, and smooth rotational steering.
- **Armament Systems**: Frontal cannon and left/right broadside cannons firing 3 parallel projectiles each with realistic cooldowns.
- **Enemy AI**:
  - **Chaser**: Directly pursues the player, explodes on collision causing damage (yields no score on self-destruction).
  - **Shooter**: Approaches the player, stops at attack range, turns towards player, and fires frontal cannonballs.
- **Arena & Obstacles**: Tiled ocean background and island obstacles blocking ship movement and destroying cannonballs.
- **Pause & Resume**: Manual pause and automatic pause on window blur or tab hide without motion/shot accumulation.
- **Options & Customization**: Game Session Time (60s - 180s), Enemy Spawn Interval (1s - 10s), Captain Name, and Volume/Mute options with `localStorage` persistence.
- **Global Ranking & Match History**: Paginated REST endpoints provided by MSW, consumed via Axios and TanStack Query with deterministic tie-breaking.
- **Offline & Pending Match Sync**: Matches saved locally if network fails or times out, auto-synced upon reconnection.
- **MSW Scenario Control**: Live scenario switcher in main menu (Success, Empty, Delayed, Timeout, 500 Error).
- **Responsive & Mobile Touch Controls**: Adaptive canvas resizing for high-DPI/retina displays, with on-screen D-Pad and fire buttons for mobile devices.

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

---

## Getting Started

### Prerequisites

- Node.js >= 18
- npm >= 9

### Installation & Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server with MSW:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

## Commands

- `npm run dev` — Start Vite development server
- `npm run build` — Typecheck and build production bundle
- `npm run preview` — Preview production build
- `npm run typecheck` — Execute TypeScript compiler check
- `npm run test:e2e` — Execute Playwright E2E tests

---

## How to Test MSW Network Scenarios

In the main menu header, use the **MSW Scenario** dropdown selector to switch between network conditions:
1. **Success**: Standard API behavior.
2. **Empty**: Returns empty data lists for ranking and history.
3. **Delayed / High Latency**: Adds 1.5s delay to API calls.
4. **Timeout**: Delays response past 8s timeout to trigger retry/offline queue logic.
5. **Server Error (500)**: Simulates HTTP 500 errors.

---

## Controls

### Keyboard Controls
- `W` / `Up Arrow` — Forward Thrust
- `S` / `Down Arrow` — Reverse
- `A` / `Left Arrow` — Turn Left
- `D` / `Right Arrow` — Turn Right
- `Space` / `I` — Fire Front Cannon
- `Q` / `U` — Fire Left Broadside (3 parallel shots)
- `E` / `O` — Fire Right Broadside (3 parallel shots)

### Touch Controls
Available automatically on mobile screens with virtual D-Pad and fire action buttons.
