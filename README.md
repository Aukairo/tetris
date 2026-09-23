# Reverse Tetris // Saboteur Protocol
> A competitive, real-time AI vs. Saboteur Tetris game powered by **Laya-MLX** on Apple Silicon, **NestJS 11**, and **Next.js 15**.

---

## 1. Project Overview

In traditional Tetris, players try to survive as long as possible to score maximum points. **Reverse Tetris** turns this classic gameplay upside down:

- **The AI (`laya-mlx`):** Runs locally on Apple Silicon (MLX framework with Metal GPU acceleration). It evaluates up to 34 placement trajectories per piece and strives to clear lines and survive.
- **The Player (The Saboteur):** Armed with an arsenal of 5 sabotage power-ups (Piece Corruptor, Sensor Glitch, Control Invert, Earthquake, Gravity Surge).
- **The Objective:** Sabotage the AI to force an early top-out with the **lowest possible AI score** before the match duration expires. Configurable match lengths: **2M Blitz (120s)**, **3M Standard (180s)**, **5M Marathon (300s)**, or **∞ Unlimited (Endless)**. Lower AI score = higher global rank!
- **Anti-Stall Rule:** If a timed match runs out before the AI tops out, a **+5,000 point penalty** is added to the score (not applicable in Unlimited mode).
- **Energy Economy & Heat:** Energy regenerates at a base **+1.2⚡/sec** and **+3⚡** per piece drop. If the AI clears rows, the player is penalized **-15⚡ Energy per row**. Precision plays escalate the **Saboteur Heat Gauge (1X to 3X)**, boosting passive energy regeneration by up to **+80%**.

---

## 2. System Architecture & Services

The application consists of three decoupled microservices:

| Service | Technology | Port | Directory | Description |
| :--- | :--- | :---: | :--- | :--- |
| **AI Engine** | Python 3.12, `laya-mlx`, MLX, FastAPI | `8000` | `ai-engine/` | Apple Silicon native typed-decision brain. Evaluates candidate board states, cavity tucks, and commitment locking in ~2ms. |
| **Game Backend** | NestJS 11, WebSockets, Prisma, SQLite | `3001` | `server/` | Authoritative game engine, dynamic match timers, combo validator, heat gauge, inverted leaderboard, and auth. |
| **Frontend Web** | Next.js 15 (App Router), Tailwind CSS | `3000` | `web/` | Cyberpunk arcade UI with 60 FPS HTML5 Canvas board, column targeting reticle, queue hijacker, live AI telemetry inspector, and modals. |

---

## 3. Prerequisites

- **Operating System:** macOS with Apple Silicon (M1, M2, M3, or M4 chip).
- **Python:** Python 3.12+
- **Node.js:** Node.js v20.x or v22.x with `npm`.

---

## 4. Local Setup & Quick Start Guide

### Step 1: Start the Python Laya-MLX AI Engine

1. Navigate to the `ai-engine` directory:
   ```bash
   cd ai-engine
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the inference daemon:
   ```bash
   python server.py
   ```
   *The server starts on `http://127.0.0.1:8000`. On first launch, the `convaiinnovations/laya` model weights will be automatically cached locally.*

---

### Step 2: Start the NestJS Game Backend

1. Open a new terminal and navigate to the `server` directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```
3. Initialize the SQLite database schema via Prisma:
   ```bash
   npx prisma db push
   ```
4. Start the backend in development mode:
   ```bash
   npm run dev
   ```
   *The server starts on `http://localhost:3001`.*

---

### Step 3: Start the Next.js Frontend

1. Open a third terminal and navigate to the `web` directory:
   ```bash
   cd web
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   *The web client starts on `http://localhost:3000`.*

---

## 5. How to Play & Strategic Sabotage Guide

1. Open **`http://localhost:3000`** in your browser.
2. Select your desired **Match Length** (`2M BLITZ`, `3M STANDARD`, `5M MARATHON`, or `∞ UNLIMITED`).
3. Click **DEPLOY MATCH** (or review the interactive tutorial).
4. Watch the local **Laya-MLX** model play in real time on the playfield.
5. Deploy your sabotage arsenal using keys **`[1]`** through **`[5]`** or direct mouse interaction:
   - **`[1]` Piece Corruptor (35⚡):** Replaces the active piece with an irregular shape (e.g. 5-block plus, U-pentomino, dot).
   - **`[2]` Sensor Glitch (50⚡):** Blinds Laya-MLX vision for 4.0s to cause tactical placement blunders.
   - **`[3]` Control Inverter (45⚡):** Inverts left/right AI controls for 2.5s.
   - **`[4]` Faultline Earthquake (65⚡):** Elevates 2 columns with jagged holes.
   - **`[5]` Gravity Surge (30⚡):** Accelerates falling speed for 4.0s.
6. **Advanced Strategic Mechanics**:
   - **Interactive Column Spike Reticle**: Hover over any column on the Tetris board to see the `⚡ SPIKE [COL X]` reticle; click to spike that specific column with an Earthquake!
   - **Queue Hijacking**: Hover over upcoming pieces in the **NEXT PIECES** tray and click `HIJACK QUEUE` to corrupt pieces before they spawn.
   - **Critical Commitment Interception**: When the AI approaches the landing zone ($d \le 3$), it enters the **COMMITTED** state. Striking during this window scores a **Critical Sabotage (+25% energy refund)**, breaks the AI trajectory lock, and charges your **Heat Gauge**.
   - **Synergy Combos**: Chaining complementary abilities within 4 seconds triggers combos (*Blind Dive*, *Turbo Invert*, *Faultline Trap*) with bonus energy refunds.
7. Press **`[Space]`** or **`[P]`** to pause/resume the game at any moment.
8. The match ends when the AI tops out (blocks reach row 0) or the match timer expires. Lowest score wins!
9. Check your standing on the **Hall of Saboteurs** leaderboard.

---

## 6. Project Directory Structure

```
jev/
├── README.md                  # Project documentation (this file)
├── docs/
│   ├── BRD.md                 # Business & game design specification
│   └── ARCHITECTURE.md        # Technical architecture & WebSocket protocols
├── ai-engine/
│   ├── requirements.txt       # Python dependencies (mlx, laya-mlx, fastapi)
│   ├── server.py              # FastAPI decision server & heuristic fallback
│   └── venv/                  # Python virtual environment
├── server/
│   ├── prisma/
│   │   ├── schema.prisma      # SQLite database schema (Users & MatchRecords)
│   │   └── dev.db             # Local SQLite database
│   └── src/
│       ├── main.ts            # NestJS entrypoint (port 3001)
│       ├── prisma.service.ts  # Prisma ORM database connection
│       ├── game/
│       │   ├── tetris-engine.ts    # Deterministic Tetris physics & 180s timer
│       │   ├── game.gateway.ts     # Real-time WebSocket game loop (Socket.io)
│       │   ├── sabotage.service.ts # Energy pool & cooldown validator
│       │   └── ai-client.service.ts# HTTP client to Python Laya-MLX daemon
│       ├── leaderboard/       # Inverted score leaderboard queries
│       └── auth/              # Guest identity & Google/GitHub OAuth mock
└── web/
    ├── src/
    │   ├── app/
    │   │   ├── page.tsx       # Main page layout & socket connection
    │   │   └── globals.css    # Cyberpunk scanlines & neon glows
    │   ├── components/
    │   │   ├── Header.tsx           # Brand, 180s timer, pause & score HUD
    │   │   ├── TetrisBoard.tsx      # 60 FPS HTML5 Canvas playfield
    │   │   ├── SaboteurDeck.tsx     # Energy gauge & ability cards
    │   │   ├── AiInspector.tsx      # Live Laya-MLX decision matrix & reasoning
    │   │   ├── NextQueue.tsx        # Next 3 upcoming pieces preview
    │   │   ├── TutorialModal.tsx    # Step-by-step interactive onboarding
    │   │   ├── LeaderboardModal.tsx # Inverted score rankings
    │   │   ├── AuthModal.tsx        # Sign-in & guest callsign manager
    │   │   └── GameOverModal.tsx    # Match summary & rating grade
    │   ├── types/game.ts      # TypeScript interfaces
    │   └── utils/audio.ts     # Synthesized Web Audio sound effects
```

---

## 7. Troubleshooting

- **Python MLX dependency issue:** Ensure you are running on an Apple Silicon Mac (`arm64`). MLX requires macOS 14+ and Apple Silicon hardware.
- **Port already in use:** If port 3000, 3001, or 8000 is occupied, free it with `lsof -ti :<port> | xargs kill -9`.
- **Database schema out of sync:** In the `server` directory, run `npx prisma db push` to re-sync SQLite tables.
