# Technical Architecture Document

**Project:** Reverse Saboteur Tetris  
**Version:** 1.0.0  
**Stack:** Next.js 15, NestJS 11, Python 3.12 (Apple Silicon MLX / `laya-mlx`), Prisma ORM, WebSockets  

---

## 1. High-Level System Architecture

```
                      +-----------------------------+
                      |     Client Browser (Web)    |
                      |  Next.js 15 + Canvas 60 FPS |
                      +--------------+--------------+
                                     |
                                     | WebSocket (Socket.io)
                                     v
                      +-----------------------------+
                      |   NestJS 11 Game Backend    |
                      |  - Game Gateway & Rooms     |
                      |  - Authoritative Tick Loop  |
                      |  - Sabotage Rule Engine     |
                      |  - Auth & Leaderboard API   |
                      +-------+-------------+-------+
                              |             |
           HTTP / Unix Socket |             | Prisma ORM
                      (<15ms) |             |
                              v             v
       +-------------------------+     +--------------------------+
       |   Python 3.12 Engine    |     | SQLite / PostgreSQL DB   |
       |  - MLX Native Runtime   |     |  - Users & Sessions      |
       |  - laya-mlx Model       |     |  - Matches & Records     |
       |  - Fallback Heuristics  |     |  - Global Leaderboards   |
       +-------------------------+     +--------------------------+
```

---

## 2. Component Specifications

### 2.1 Frontend (`web/` - Next.js 15 App Router)
- **Framework:** Next.js 15 (React 19, TypeScript, TailwindCSS).
- **Game Viewport:** HTML5 Canvas rendering for 60 FPS smooth block animations, ghost piece projection, and particle effects upon line clears and sabotages.
- **Saboteur HUD:**
  - Dynamic circular / segmented energy gauge ($0 - 100$).
  - 5 interactive sabotage cards with hotkey triggers (`1` through `5`), cooldown countdown overlays, and sound feedback.
- **Laya-MLX Telemetry Panel:**
  - Real-time display of decision metrics: confidence score ($0 - 100\%$), evaluated placement options, and current AI focus.
- **Match Timer:** High-visibility digital countdown clock from `03:00` to `00:00` with urgency pulse at $<30$ seconds.

### 2.2 Backend (`server/` - NestJS 11)
- **Framework:** NestJS 11 with `@nestjs/websockets` & `socket.io`.
- **Game Engine Core (`TetrisEngine`):**
  - Pure deterministic game logic decoupled from transport.
  - Standard 7-bag randomizer with sabotage injection queue.
  - Wall kick rules (SRS simplified) and hard/soft drop raycasting.
  - 180s countdown timer per room; triggers automatic forfeit with $+5,000$ score penalty if time runs out before top-out.
- **Sabotage Service (`SabotageService`):**
  - Energy replenishment tick ($+5/\text{sec}$, $+10/\text{piece}$).
  - Cooldown tracking per player session.
  - Modifies game state: switches current piece, scrambles telemetry, inverts directional inputs, or elevates columns.
- **Database & Persistence (`PrismaModule`):**
  - SQLite for seamless out-of-the-box local development, swappable to PostgreSQL via `DATABASE_URL`.
  - Indexes on `aiScore ASC, durationSeconds ASC` for instant leaderboard sorting.

### 2.3 AI Decision Engine (`ai-engine/` - Python 3.12 MLX)
- **Framework:** Python 3.12, `mlx`, `laya-mlx`, `fastapi`, `uvicorn`.
- **Model:** `laya-mlx` typed decision model (`aac6fef/laya-multilingual-mlx` or local decision head).
- **Communication:** High-speed local HTTP / Unix Domain Socket (`localhost:8000/decision`).
- **Input Schema:**
  ```json
  {
    "board": [[0,0,...], ...], // 20x10 matrix
    "currentPiece": { "type": "T", "rotation": 0, "x": 3, "y": 0 },
    "nextPieces": ["I", "O", "L"],
    "glitched": false
  }
  ```
- **Output Schema:**
  ```json
  {
    "targetX": 2,
    "targetRotation": 1,
    "actionPath": ["ROTATE_CW", "MOVE_LEFT", "HARD_DROP"],
    "confidence": 0.88,
    "evaluatedOptions": 34
  }
  ```
- **Resilience:** If the MLX model is downloading or running on non-Apple Silicon hardware, the built-in heuristic matrix automatically services requests with $<2\text{ms}$ latency.

---

## 3. Data Model & Database Schema

```prisma
model User {
  id           String        @id @default(uuid())
  email        String?       @unique
  username     String
  avatarUrl    String?
  provider     String        // "google" | "github" | "guest"
  providerId   String?       @unique
  createdAt    DateTime      @default(now())
  matches      MatchRecord[]
}

model MatchRecord {
  id              String   @id @default(uuid())
  userId          String?
  user            User?    @relation(fields: [userId], references: [id])
  guestSessionId  String?  // for unclaimed guest games
  aiScore         Int      // Lower is better!
  linesCleared    Int
  piecesPlaced    Int
  durationSeconds Float
  sabotagesUsed   Int
  completedEarly  Boolean  // true if top-out forced before 180s timer
  createdAt       DateTime @default(now())

  @@index([aiScore, durationSeconds])
  @@index([guestSessionId])
}
```

---

## 4. WebSocket Protocol Specification

| Event Name | Direction | Payload | Description |
| :--- | :---: | :--- | :--- |
| `start_game` | Client $\to$ Server | `{ guestId?: string }` | Initializes or resets a 180s game room. |
| `game_state` | Server $\to$ Client | `{ board, currentPiece, nextPieces, energy, score, timeRemaining, aiTelemetry }` | Pushed on every tick / move. |
| `sabotage` | Client $\to$ Server | `{ abilityId: "CORRUPT" \| "GLITCH" \| "INVERT" \| "EARTHQUAKE" \| "GRAVITY" }` | Requests execution of a sabotage power-up. |
| `sabotage_applied` | Server $\to$ Client | `{ abilityId, energyRemaining, cooldowns }` | Confirms ability fired and triggers visual effects. |
| `game_over` | Server $\to$ Client | `{ finalScore, duration, reason, rank, isGuest }` | Emitted when AI tops out or 180s timer expires. |

---

## 5. Security & Anti-Cheat

1. **Server Authoritative:** Game loop, score calculation, timer countdown, and block collisions are executed strictly on NestJS.
2. **Rate Limiting & Cooldowns:** Sabotage inputs are rejected on the server if the user has insufficient energy or is on cooldown.
3. **Guest Session Claiming:** Guest tokens are cryptographically signed JWTs preventing score tampering before being linked to permanent OAuth accounts.
