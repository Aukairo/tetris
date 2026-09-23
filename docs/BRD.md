# Business Requirements Document (BRD) & Game Design Specification

**Project Name:** Reverse Saboteur Tetris (AI vs. Player)  
**Target Platform:** Web (Desktop & Mobile Responsive)  
**Document Version:** 1.0.0  
**Status:** Approved for Implementation  

---

## 1. Executive Summary

Traditional Tetris rewards players for surviving as long as possible and achieving the highest score through efficient line clears. **Reverse Saboteur Tetris** turns this classic paradigm upside down:
- The game is played autonomously by **`laya-mlx`** (a native Apple Silicon typed-decision model) acting as the Tetris player.
- The human user acts as the **Saboteur**, armed with strategic disruption abilities.
- The player's objective is to **sabotage the AI** and force a top-out (Game Over) with the **lowest possible AI score** before the **match time limit** expires.
- The global **Hall of Saboteurs** ranks players in ascending order of AI score (lower score = higher rank).

---

## 2. Target Audience & Core Value Proposition

1. **Gamers & Puzzle Enthusiasts:** Offers a fresh, high-intensity twist on an iconic game format.
2. **AI & Tech Community:** Showcases real-time, low-latency (<15ms) decision-making from local models (`laya-mlx`) running on Apple Silicon, complete with live telemetry visualizing the model's confidence and decision criteria.
3. **Competitive Players:** Features an inverted leaderboard with guest trials and permanent Google/GitHub authenticated rankings.

---

## 3. Game Mechanics & Rules

### 3.1 Role of the AI (`laya-mlx`)
* **Objective:** Clear lines, maintain a low and flat board profile, minimize holes/bumpiness, and survive.
* **Vision & Inputs:**
  * Active 10x20 grid state (filled blocks, column heights, holes, contour).
  * Current falling piece type and orientation.
  * Preview queue of the next 3 pieces.
* **Output:** Evaluates placement targets and issues inputs (`MOVE_LEFT`, `MOVE_RIGHT`, `ROTATE_CW`, `ROTATE_CCW`, `SOFT_DROP`, `HARD_DROP`).

### 3.2 Role of the Saboteur (User)
* **Objective:** Trigger an AI top-out (blocks reaching row 0) with the lowest AI score possible.
* **Energy Meter:**
  * Starts at 50 energy (Capacity: 100).
  * Passive regeneration: +5 energy per second.
  * Event bonus: +10 energy whenever the AI locks a piece into the grid.

### 3.3 Sabotage Deck & Abilities

| Ability Name | Energy Cost | Cooldown | Visual / Mechanics Effect |
| :--- | :---: | :---: | :--- |
| **Piece Corruptor** | 35 | 6s | Replaces the falling piece with an irregular shape (e.g., 5-block plus, U-shape, or awkward zig-zag). |
| **Sensor Glitch** | 50 | 10s | Scrambles/inverts the board state fed to the AI for 3 seconds, causing it to miscalculate heights and create holes. |
| **Control Inverter** | 45 | 8s | Reverses the AI's left/right inputs for 3 seconds. |
| **Earthquake** | 65 | 12s | Elevates 2 random columns by 1 row with jagged blocks, disrupting the AI's surface. |
| **Gravity Surge** | 30 | 5s | Multiplies falling speed by 3x for 4 seconds, compressing the AI's reaction window. |

### 3.4 Match Time Limit & Anti-Stall Rule
To prevent indefinite gameplay, stall exploits, or infinite sessions:
* **Match Duration:** Fixed at **180 seconds (3:00 minutes)** with a live HUD countdown timer.
* **Time Expiration Outcome:**
  * If the timer hits `00:00` and the AI has **not** topped out:
    * The game automatically concludes as a **Time Expired** match.
    * The AI's final accumulated score is recorded, plus an **Unfinished Match Penalty** (+5,000 points added to score), severely degrading the player's leaderboard standing.
  * If the Saboteur forces a Game Over before `00:00`:
    * The match is a **Successful Sabotage**.
    * The raw, pristine AI score (e.g., 120 points) is recorded, earning a top-tier rank.

---

## 4. Leaderboard & Scoring Rules

### 4.1 Scoring Formula
* **AI Scoring:**
  * Single Line Clear: +100 pts
  * Double Line Clear: +300 pts
  * Triple Line Clear: +500 pts
  * Tetris (4 Lines): +800 pts
  * Soft Drop: +1 pt/cell
  * Hard Drop: +2 pt/cell
* **Leaderboard Rank Sorting:**
  * Primary: **AI Score (Ascending)** - Lowest score ranks #1.
  * Secondary Tie-breaker: **Time to Sabotage (Ascending)** - Faster elimination breaks ties.
  * Tertiary Tie-breaker: **Fewest Pieces Placed (Ascending)**.

### 4.2 User Identity & Modes
* **Guest Mode:**
  * One-click instant play without registration.
  * Temporary session ID stored in browser storage.
  * Scores displayed on the **"Today's Guest Board"**.
  * Option to link/claim guest scores upon signing in.
* **Permanent Authenticated Mode:**
  * OAuth 2.0 via Google and GitHub.
  * Permanent profile with All-Time Hall of Saboteurs ranking, match history, and saboteur efficiency badges.

---

## 5. Non-Functional Requirements

1. **Latency:** Total latency from state export to Laya inference to action execution must be <30ms (Laya-MLX inference <15ms).
2. **Frame Rate:** HTML5 Canvas rendering at continuous 60 FPS on standard displays.
3. **Security:** Server-authoritative game state (clients cannot fabricate scores or bypass sabotage energy cooldowns).
4. **Availability:** Fallback heuristic engine ensures the game functions immediately if MLX weights are downloading or running in environments without Apple Silicon.
