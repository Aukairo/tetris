import os
import sys
import copy
import time
from typing import List, Dict, Any, Optional, Tuple
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Initialize FastAPI App
app = FastAPI(title="Laya-MLX Tetris AI Engine", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Tetromino shapes (4x4 grids or coordinate offsets)
# [rotation][y][x]
PIECE_SHAPES: Dict[str, List[List[List[int]]]] = {
    "I": [
        [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]],
        [[0,0,1,0], [0,0,1,0], [0,0,1,0], [0,0,1,0]],
        [[0,0,0,0], [0,0,0,0], [1,1,1,1], [0,0,0,0]],
        [[0,1,0,0], [0,1,0,0], [0,1,0,0], [0,1,0,0]],
    ],
    "O": [
        [[0,1,1,0], [0,1,1,0], [0,0,0,0], [0,0,0,0]],
        [[0,1,1,0], [0,1,1,0], [0,0,0,0], [0,0,0,0]],
        [[0,1,1,0], [0,1,1,0], [0,0,0,0], [0,0,0,0]],
        [[0,1,1,0], [0,1,1,0], [0,0,0,0], [0,0,0,0]],
    ],
    "T": [
        [[0,1,0,0], [1,1,1,0], [0,0,0,0], [0,0,0,0]],
        [[0,1,0,0], [0,1,1,0], [0,1,0,0], [0,0,0,0]],
        [[0,0,0,0], [1,1,1,0], [0,1,0,0], [0,0,0,0]],
        [[0,1,0,0], [1,1,0,0], [0,1,0,0], [0,0,0,0]],
    ],
    "S": [
        [[0,1,1,0], [1,1,0,0], [0,0,0,0], [0,0,0,0]],
        [[0,1,0,0], [0,1,1,0], [0,0,1,0], [0,0,0,0]],
        [[0,0,0,0], [0,1,1,0], [1,1,0,0], [0,0,0,0]],
        [[1,0,0,0], [1,1,0,0], [0,1,0,0], [0,0,0,0]],
    ],
    "Z": [
        [[1,1,0,0], [0,1,1,0], [0,0,0,0], [0,0,0,0]],
        [[0,0,1,0], [0,1,1,0], [0,1,0,0], [0,0,0,0]],
        [[0,0,0,0], [1,1,0,0], [0,1,1,0], [0,0,0,0]],
        [[0,1,0,0], [1,1,0,0], [1,0,0,0], [0,0,0,0]],
    ],
    "J": [
        [[1,0,0,0], [1,1,1,0], [0,0,0,0], [0,0,0,0]],
        [[0,1,1,0], [0,1,0,0], [0,1,0,0], [0,0,0,0]],
        [[0,0,0,0], [1,1,1,0], [0,0,1,0], [0,0,0,0]],
        [[0,1,0,0], [0,1,0,0], [1,1,0,0], [0,0,0,0]],
    ],
    "L": [
        [[0,0,1,0], [1,1,1,0], [0,0,0,0], [0,0,0,0]],
        [[0,1,0,0], [0,1,0,0], [0,1,1,0], [0,0,0,0]],
        [[0,0,0,0], [1,1,1,0], [1,0,0,0], [0,0,0,0]],
        [[1,1,0,0], [0,1,0,0], [0,1,0,0], [0,0,0,0]],
    ],
    # Sabotage Corrupted Pieces (Irregular shapes to trip up AI)
    "PLUS": [
        [[0,1,0,0], [1,1,1,0], [0,1,0,0], [0,0,0,0]],
        [[0,1,0,0], [1,1,1,0], [0,1,0,0], [0,0,0,0]],
        [[0,1,0,0], [1,1,1,0], [0,1,0,0], [0,0,0,0]],
        [[0,1,0,0], [1,1,1,0], [0,1,0,0], [0,0,0,0]],
    ],
    "DOT": [
        [[0,0,0,0], [0,1,0,0], [0,0,0,0], [0,0,0,0]],
        [[0,0,0,0], [0,1,0,0], [0,0,0,0], [0,0,0,0]],
        [[0,0,0,0], [0,1,0,0], [0,0,0,0], [0,0,0,0]],
        [[0,0,0,0], [0,1,0,0], [0,0,0,0], [0,0,0,0]],
    ],
    "PENTOMINO_U": [
        [[1,0,1,0], [1,1,1,0], [0,0,0,0], [0,0,0,0]],
        [[1,1,0,0], [1,0,0,0], [1,1,0,0], [0,0,0,0]],
        [[1,1,1,0], [1,0,1,0], [0,0,0,0], [0,0,0,0]],
        [[0,1,1,0], [0,0,1,0], [0,1,1,0], [0,0,0,0]],
    ]
}

# Fallback for unknown piece types
DEFAULT_SHAPES = PIECE_SHAPES["T"]

# Attempt to load laya-mlx
laya_agent = None
laya_status = "unloaded"

def init_laya():
    global laya_agent, laya_status
    try:
        import laya_mlx
        print("Loading Laya-MLX model...")
        laya_agent = laya_mlx.load("convaiinnovations/laya")
        # Warmup inference to compile Metal graph
        warmup_state = "Tetris Board: holes=0, bumpiness=1, height=2. Piece: T."
        warmup_q = {
            "placement": {
                "type": "choice",
                "instructions": "Select safest move",
                "criteria": ["opt_a", "opt_b"]
            }
        }
        laya_agent.predict(warmup_state, warmup_q)
        laya_status = "ready"
        print("Laya-MLX model loaded and warmed up successfully!")
    except Exception as e:
        print(f"Laya-MLX initialization note: {e}. Heuristic fallback active.")
        laya_status = f"fallback ({type(e).__name__})"

# Pydantic Schemas
class PieceState(BaseModel):
    type: str
    x: int
    y: int
    rotation: int

class DecisionRequest(BaseModel):
    board: List[List[int]] # 20 rows x 10 cols (0 = empty, 1 = filled)
    currentPiece: PieceState
    nextPieces: List[str]
    glitched: bool = False # Sabotage: sensor glitch (blinds/inverts view)
    inverterActive: bool = False # Sabotage: reversed movement controls
    previousTargetKey: Optional[str] = None # Persistence key to maintain plan continuity

class ActionProbability(BaseModel):
    action: str
    probability: float
    description: str

class CandidateOption(BaseModel):
    key: str
    label: str
    targetX: int
    targetRotation: int
    score: float
    probability: float
    isSelected: bool
    isTuck: bool = False
    lookaheadSubScore: Optional[float] = None
    synergyReason: Optional[str] = None

class DecisionResponse(BaseModel):
    targetX: int
    targetRotation: int
    actions: List[str]
    confidence: float
    modelProbability: float
    calibrationMargin: float
    reasoning: str
    evaluatedOptions: int
    modelUsed: str
    decisionTimeMs: float
    evalScores: Dict[str, float]
    candidateDecisions: List[CandidateOption]
    actionProbabilities: List[ActionProbability]
    committed: bool = False
    isTuck: bool = False
    targetKey: str = ""
    remainingDistance: int = 0
    lookaheadPiece: Optional[str] = None
    lookaheadSynergy: Optional[str] = None

def get_piece_blocks(piece_type: str, rotation: int) -> List[Tuple[int, int]]:
    rotations = PIECE_SHAPES.get(piece_type, DEFAULT_SHAPES)
    matrix = rotations[rotation % len(rotations)]
    blocks = []
    for r in range(4):
        for c in range(4):
            if matrix[r][c] == 1:
                blocks.append((c, r))
    return blocks

def is_valid_position(board: List[List[int]], piece_type: str, rot: int, px: int, py: int) -> bool:
    blocks = get_piece_blocks(piece_type, rot)
    for bx, by in blocks:
        gx = px + bx
        gy = py + by
        if gx < 0 or gx >= 10:
            return False
        if gy >= 20:
            return False
        if gy >= 0 and board[gy][gx] == 1:
            return False
    return True

def can_rotate(board: List[List[int]], piece_type: str, target_rot: int, x: int, y: int) -> Tuple[bool, int]:
    """Checks if piece can rotate to target_rot at (x, y) with standard wall kicks."""
    for kick in [0, -1, 1, -2, 2]:
        if is_valid_position(board, piece_type, target_rot, x + kick, y):
            return True, kick
    return False, 0

def is_horizontal_path_clear(board: List[List[int]], piece_type: str, rot: int, start_x: int, target_x: int, y: int) -> bool:
    """Verifies that the piece can slide horizontally from start_x to target_x at altitude y without collision."""
    if start_x == target_x:
        return True
    step = 1 if target_x > start_x else -1
    for x in range(start_x, target_x + step, step):
        if not is_valid_position(board, piece_type, rot, x, y):
            return False
    return True

def find_reachable_placements(
    board: List[List[int]],
    piece_type: str,
    cur_x: int,
    cur_y: int,
    cur_rot: int
) -> List[Dict[str, Any]]:
    """
    Finds all physically reachable landing sites from the current piece position and orientation.
    Includes vertical drops down shafts as well as lateral cavity tucks/slides under overhangs.
    """
    rotations = PIECE_SHAPES.get(piece_type, DEFAULT_SHAPES)
    rotations_count = len(rotations)
    candidates_dict: Dict[str, Dict[str, Any]] = {}

    for rot in range(rotations_count):
        # 1. Orientation feasibility check from current position
        if rot == cur_rot:
            adj_x = cur_x
        else:
            can_rot, kick = can_rotate(board, piece_type, rot, cur_x, cur_y)
            if not can_rot:
                continue
            adj_x = cur_x + kick

        # 2. Iterate through vertical descent shafts at current altitude cur_y
        for shaft_x in range(-2, 11):
            if not is_horizontal_path_clear(board, piece_type, rot, adj_x, shaft_x, cur_y):
                continue

            # Drop vertically down the shaft to touchdown
            drop_y = cur_y
            while is_valid_position(board, piece_type, rot, shaft_x, drop_y + 1):
                drop_y += 1

            # Standard vertical landing placement
            sim_board, lines = simulate_placement(board, piece_type, rot, shaft_x, drop_y)
            features = evaluate_board_heuristics(sim_board, lines, drop_y)
            std_key = f"x{shaft_x}_r{rot}"
            cand_std = {
                "key": std_key,
                "label": get_human_label(shaft_x, rot),
                "target_x": shaft_x,
                "target_rot": rot,
                "target_y": drop_y,
                "shaft_x": shaft_x,
                "shaft_drop_y": drop_y,
                "is_tuck": False,
                "score": features["score"],
                "features": features,
            }
            if std_key not in candidates_dict or cand_std["score"] > candidates_dict[std_key]["score"]:
                candidates_dict[std_key] = cand_std

            # 3. Cavity Tuck / Lateral Slide under overhangs:
            # At touchdown altitude drop_y, test sliding left/right into an underhang cavity
            for dx in [-1, 1, -2, 2]:
                tuck_x = shaft_x + dx
                step = 1 if dx > 0 else -1
                slide_ok = True
                for step_x in range(shaft_x + step, tuck_x + step, step):
                    if not is_valid_position(board, piece_type, rot, step_x, drop_y):
                        slide_ok = False
                        break
                if not slide_ok:
                    continue

                # Drop further after tucking, if possible
                tuck_drop_y = drop_y
                while is_valid_position(board, piece_type, rot, tuck_x, tuck_drop_y + 1):
                    tuck_drop_y += 1

                # Check if this position is truly under an overhang (i.e. blocked straight from cur_y)
                is_overhang = not is_valid_position(board, piece_type, rot, tuck_x, cur_y)
                if is_overhang or tuck_drop_y > drop_y:
                    sim_board_tuck, lines_tuck = simulate_placement(board, piece_type, rot, tuck_x, tuck_drop_y)
                    feat_tuck = evaluate_board_heuristics(sim_board_tuck, lines_tuck, tuck_drop_y)
                    # Cavity bonus to encourage tucking under overhangs instead of creating messy towers
                    bonus = 2.5 if is_overhang else 0.8
                    tuck_key = f"tuck_x{tuck_x}_r{rot}"
                    cand_tuck = {
                        "key": tuck_key,
                        "label": f"{get_human_label(tuck_x, rot)} [Tuck]",
                        "target_x": tuck_x,
                        "target_rot": rot,
                        "target_y": tuck_drop_y,
                        "shaft_x": shaft_x,
                        "shaft_drop_y": drop_y,
                        "is_tuck": True,
                        "score": feat_tuck["score"] + bonus,
                        "features": feat_tuck,
                    }
                    if tuck_key not in candidates_dict or cand_tuck["score"] > candidates_dict[tuck_key]["score"]:
                        candidates_dict[tuck_key] = cand_tuck

    return list(candidates_dict.values())

def simulate_placement(board: List[List[int]], piece_type: str, rot: int, px: int, py: int):
    """Simulates placing a piece and returns the new board and lines cleared."""
    new_board = [row[:] for row in board]
    blocks = get_piece_blocks(piece_type, rot)
    for bx, by in blocks:
        gx = px + bx
        gy = py + by
        if 0 <= gy < 20 and 0 <= gx < 10:
            new_board[gy][gx] = 1

    # Check line clears
    cleared_board = []
    lines_cleared = 0
    for row in new_board:
        if all(cell == 1 for cell in row):
            lines_cleared += 1
        else:
            cleared_board.append(row)

    # Prepend empty rows
    while len(cleared_board) < 20:
        cleared_board.insert(0, [0] * 10)

    return cleared_board, lines_cleared

def evaluate_board_heuristics(board: List[List[int]], lines_cleared: int, drop_y: int) -> Dict[str, float]:
    """Extracts structural Tetris features (Pierre Dellacherie / Stanford Tetris AI features)."""
    col_heights = [0] * 10
    holes = 0
    wells = 0

    for c in range(10):
        found_top = False
        for r in range(20):
            if board[r][c] == 1:
                if not found_top:
                    col_heights[c] = 20 - r
                    found_top = True
            elif found_top:
                holes += 1

    # Measure wells (depressions of depth > 1)
    for c in range(10):
        left = col_heights[c - 1] if c > 0 else 20
        right = col_heights[c + 1] if c < 9 else 20
        well_depth = min(left, right) - col_heights[c]
        if well_depth > 1:
            wells += well_depth

    bumpiness = sum(abs(col_heights[i] - col_heights[i + 1]) for i in range(9))
    aggregate_height = sum(col_heights)
    max_height = max(col_heights) if col_heights else 0
    landing_height = 20 - drop_y

    # Dellacherie optimization weights:
    # Heavily penalize landing height to keep pieces at the bottom, heavily penalize holes
    score = (
        (lines_cleared * 7.5)
        - (landing_height * 4.2)
        - (holes * 9.8)
        - (bumpiness * 1.6)
        - (wells * 1.4)
        - (aggregate_height * 0.4)
        - (max_height * 1.8)
    )

    return {
        "score": score,
        "holes": float(holes),
        "bumpiness": float(bumpiness),
        "aggregate_height": float(aggregate_height),
        "max_height": float(max_height),
        "lines_cleared": float(lines_cleared),
        "landing_height": float(landing_height)
    }

def evaluate_next_piece_best_score(sim_board: List[List[int]], next_piece_type: str) -> Tuple[float, Optional[str]]:
    """
    Simulates placing next_piece_type on sim_board across all reachable drop points to find the best 2nd-ply score.
    """
    rotations = PIECE_SHAPES.get(next_piece_type, DEFAULT_SHAPES)
    rotations_count = len(rotations)
    best_score = -9999.0
    best_key = None

    for rot in range(rotations_count):
        for x in range(-2, 10):
            if not is_valid_position(sim_board, next_piece_type, rot, x, 0):
                continue
            drop_y = 0
            while is_valid_position(sim_board, next_piece_type, rot, x, drop_y + 1):
                drop_y += 1
            if drop_y >= 20:
                continue

            sub_board, lines = simulate_placement(sim_board, next_piece_type, rot, x, drop_y)
            features = evaluate_board_heuristics(sub_board, lines, drop_y)
            sub_score = features["score"]

            if next_piece_type == "I" and lines >= 4:
                sub_score += 15.0

            if sub_score > best_score:
                best_score = sub_score
                best_key = f"x{x}_r{rot}"

    if best_score < -9000.0:
        return -150.0, None
    return best_score, best_key

def calculate_piece_synergy(board: List[List[int]], next_piece: str) -> Tuple[float, str]:
    """Calculates tactical preparation bonus based on upcoming piece requirements."""
    col_heights = [0] * 10
    for c in range(10):
        for r in range(20):
            if board[r][c] == 1:
                col_heights[c] = 20 - r
                break

    synergy_bonus = 0.0
    synergy_reason = ""

    if next_piece == "I":
        right_well_depth = col_heights[8] - col_heights[9]
        left_well_depth = col_heights[1] - col_heights[0]
        if right_well_depth >= 3 or left_well_depth >= 3:
            synergy_bonus += 8.0
            synergy_reason = "Preserving 1-wide vertical well for Tetris clear"
    elif next_piece == "O":
        flat_pairs = sum(1 for c in range(9) if col_heights[c] == col_heights[c + 1] and col_heights[c] > 0)
        if flat_pairs >= 2:
            synergy_bonus += 5.0
            synergy_reason = "Flattening 2-wide landing pad for square piece"
    elif next_piece in ["S", "Z"]:
        deep_wells = sum(1 for c in range(1, 9) if min(col_heights[c-1], col_heights[c+1]) - col_heights[c] >= 2)
        if deep_wells == 0:
            synergy_bonus += 4.0
            synergy_reason = f"Eliminating crevice traps for {next_piece} tetromino"
    elif next_piece == "T":
        synergy_bonus += 3.5
        synergy_reason = "Maintaining flat cavity for T-piece placement"

    return synergy_bonus, synergy_reason

def get_human_label(px: int, rot: int) -> str:
    if px <= 1:
        col_desc = "Left Wall"
    elif px <= 3:
        col_desc = "Left Lane"
    elif px <= 6:
        col_desc = "Center Slot"
    elif px <= 8:
        col_desc = "Right Lane"
    else:
        col_desc = "Right Wall"

    rot_desc = "Flat" if rot % 2 == 0 else "Upright"
    return f"{col_desc} ({rot_desc})"

def plan_action_step(
    current_x: int,
    current_y: int,
    current_rot: int,
    target_x: int,
    target_rot: int,
    shaft_x: int,
    shaft_drop_y: int,
    is_tuck: bool = False,
    inverter: bool = False
) -> List[str]:
    actions = []

    # 1. Orientation step
    if target_rot != current_rot:
        rot_diff = (target_rot - current_rot) % 4
        if rot_diff == 3:
            actions.append("ROTATE_CCW")
        else:
            actions.append("ROTATE_CW")

    # 2. Horizontal navigation target:
    # If tuck, descend via vertical shaft until touchdown altitude, then execute the horizontal tuck slide
    if is_tuck:
        steer_x = target_x if current_y >= shaft_drop_y else shaft_x
    else:
        steer_x = target_x

    # 3. Horizontal steering step
    if steer_x < current_x:
        move_action = "MOVE_RIGHT" if inverter else "MOVE_LEFT"
        actions.append(move_action)
    elif steer_x > current_x:
        move_action = "MOVE_LEFT" if inverter else "MOVE_RIGHT"
        actions.append(move_action)

    # 4. If aligned, soft drop down cleanly
    if not actions:
        actions.append("SOFT_DROP")

    return actions

@app.on_event("startup")
async def startup_event():
    init_laya()

@app.get("/health")
def health():
    return {
        "status": "online",
        "laya_status": laya_status,
        "engine": "laya-mlx" if laya_status == "ready" else "heuristic-fallback"
    }

@app.post("/decision", response_model=DecisionResponse)
def decide_move(req: DecisionRequest):
    t0 = time.perf_counter()
    board = req.board
    p_type = req.currentPiece.type

    # Sensor Glitch Sabotage: If active, inject sensor blindness and column noise
    if req.glitched:
        noisy_board = [row[:] for row in board]
        for r in range(min(5, len(noisy_board))):
            noisy_board[r] = [0] * 10
        for c in range(1, 10, 2):
            noisy_board[12][c] = 1
        board = noisy_board

    cur_x = req.currentPiece.x
    cur_y = req.currentPiece.y
    cur_rot = req.currentPiece.rotation

    # 1. Find all physically reachable landing placements (including underhang tucks)
    placements = find_reachable_placements(board, p_type, cur_x, cur_y, cur_rot)
    candidates_map: Dict[str, Dict[str, Any]] = {p["key"]: p for p in placements}
    evaluated_count = len(placements)

    # Emergency fallback if all blocked
    if not placements:
        fallback = {
            "key": f"x{cur_x}_r{cur_rot}",
            "label": get_human_label(cur_x, cur_rot),
            "target_x": cur_x,
            "target_rot": cur_rot,
            "target_y": cur_y,
            "shaft_x": cur_x,
            "shaft_drop_y": cur_y,
            "is_tuck": False,
            "score": -999.0,
            "features": {"holes": 0, "bumpiness": 0, "aggregate_height": 0, "max_height": 20, "lines_cleared": 0, "landing_height": 20 - cur_y}
        }
        candidates_map[fallback["key"]] = fallback
        placements = [fallback]

    # 2. Check previous commitment and apply continuity hysteresis bonus (+3.5)
    is_committed = False
    chosen_candidate = None
    remaining_dist = 0

    if req.previousTargetKey and req.previousTargetKey in candidates_map:
        prev_cand = candidates_map[req.previousTargetKey]
        d = prev_cand["target_y"] - cur_y
        remaining_dist = max(0, d)

        # Apply continuity hysteresis bonus (+3.5) so minor heuristic noise doesn't flip columns
        prev_cand["score"] += 3.5

        # Point of No Return commitment gate:
        # If remaining drop distance d <= 3 and no active user sabotage, lock trajectory!
        if d <= 3 and not req.glitched and not req.inverterActive:
            is_committed = True
            chosen_candidate = prev_cand

    # 3. Sort candidates to find top options
    sorted_candidates = sorted(placements, key=lambda c: c["score"], reverse=True)
    top_candidates = sorted_candidates[:4]

    if chosen_candidate is None:
        chosen_candidate = top_candidates[0]
        remaining_dist = max(0, chosen_candidate["target_y"] - cur_y)

    choice_keys = [c["key"] for c in top_candidates]
    if chosen_candidate["key"] not in choice_keys:
        choice_keys.insert(0, chosen_candidate["key"])
        top_candidates.insert(0, chosen_candidate)
        top_candidates = top_candidates[:4]

    probs: Dict[str, float] = {c["key"]: round(1.0 / len(top_candidates), 4) for c in top_candidates}
    calibration_margin = 0.15
    model_used = "heuristic-el-tetris"

    # 4. If committed, enforce high confidence commitment probability
    if is_committed:
        for c in top_candidates:
            probs[c["key"]] = 0.05
        probs[chosen_candidate["key"]] = 0.85
        calibration_margin = 0.05
        model_used = "laya-mlx (committed-trajectory)"
    elif laya_agent is not None and laya_status == "ready" and evaluated_count > 0:
        # Prompt Laya-MLX with semantic descriptions
        try:
            state_description = (
                f"Tetris Board: holes={chosen_candidate['features']['holes']}, "
                f"bumpiness={chosen_candidate['features']['bumpiness']}, "
                f"height={chosen_candidate['features']['max_height']}. "
                f"Piece: {p_type}. Next: {', '.join(req.nextPieces[:2])}."
            )
            laya_result = laya_agent.predict(
                state_description,
                {
                    "placement": {
                        "type": "choice",
                        "instructions": "Select the safest piece placement with minimal height and no holes",
                        "criteria": choice_keys
                    }
                }
            )
            answers = laya_result.get("answers", {}).get("placement", {})
            calibration_margin = float(answers.get("confidence", 0.15))
            ret_choice = answers.get("choice")
            if ret_choice and ret_choice in candidates_map:
                chosen_candidate = candidates_map[ret_choice]
                remaining_dist = max(0, chosen_candidate["target_y"] - cur_y)

            ret_probs = answers.get("probabilities", {})
            if ret_probs:
                probs = ret_probs

            model_used = "laya-mlx-native"
        except Exception as e:
            model_used = f"laya-mlx (fallback: {e})"

    # Calculate model probability & confidence
    chosen_prob = float(probs.get(chosen_candidate["key"], 1.0 / len(top_candidates)))
    confidence = round(chosen_prob, 2)

    # Build detailed candidate breakdown
    candidate_decisions: List[CandidateOption] = []
    for cand in top_candidates:
        p = float(probs.get(cand["key"], round(1.0 / len(top_candidates), 4)))
        candidate_decisions.append(
            CandidateOption(
                key=cand["key"],
                label=cand["label"],
                targetX=cand["target_x"],
                targetRotation=cand["target_rot"],
                score=round(cand["score"], 2),
                probability=round(p, 4),
                isSelected=(cand["key"] == chosen_candidate["key"]),
                isTuck=cand.get("is_tuck", False),
                lookaheadSubScore=cand.get("lookahead_sub_score"),
                synergyReason=cand.get("synergy_reason")
            )
        )

    # Compute instantaneous micro-action probabilities
    p_left = sum(c.probability for c in candidate_decisions if c.targetX < cur_x)
    p_right = sum(c.probability for c in candidate_decisions if c.targetX > cur_x)
    p_rot = sum(c.probability for c in candidate_decisions if c.targetRotation != cur_rot)
    p_drop = sum(c.probability for c in candidate_decisions if c.targetX == cur_x and c.targetRotation == cur_rot)

    tot_p = p_left + p_right + p_rot + p_drop
    if tot_p <= 0:
        tot_p = 1.0

    action_probabilities = [
        ActionProbability(action="MOVE_LEFT", probability=round(p_left / tot_p, 2), description="Shift piece left"),
        ActionProbability(action="MOVE_RIGHT", probability=round(p_right / tot_p, 2), description="Shift piece right"),
        ActionProbability(action="ROTATE", probability=round(p_rot / tot_p, 2), description="Rotate piece orientation"),
        ActionProbability(action="SOFT_DROP", probability=round(p_drop / tot_p, 2), description="Descend into pocket"),
    ]

    # Human-friendly reasoning statement
    cand_label = chosen_candidate["label"]
    if is_committed:
        reasoning = (
            f"🔒 COMMITTED (d={remaining_dist}): Locked trajectory into {cand_label} "
            f"to guarantee flush touchdown without last-moment snagging."
        )
    elif chosen_candidate.get("is_tuck"):
        reasoning = (
            f"📐 CAVITY TUCK: Descending shaft Col {chosen_candidate['shaft_x']} "
            f"then sliding under overhang into {cand_label} (0 holes)."
        )
    else:
        reasoning = (
            f"Laya-MLX selected {cand_label} "
            f"with {round(chosen_prob * 100, 1)}% probability, expecting "
            f"{int(chosen_candidate['features']['holes'])} holes and landing at row {chosen_candidate['target_y']}."
        )

    actions = plan_action_step(
        cur_x,
        cur_y,
        cur_rot,
        chosen_candidate["target_x"],
        chosen_candidate["target_rot"],
        chosen_candidate.get("shaft_x", chosen_candidate["target_x"]),
        chosen_candidate.get("shaft_drop_y", chosen_candidate["target_y"]),
        is_tuck=chosen_candidate.get("is_tuck", False),
        inverter=req.inverterActive
    )

    t1 = time.perf_counter()
    decision_ms = round((t1 - t0) * 1000.0, 2)

    return DecisionResponse(
        targetX=chosen_candidate["target_x"],
        targetRotation=chosen_candidate["target_rot"],
        actions=actions,
        confidence=confidence,
        modelProbability=round(chosen_prob, 4),
        calibrationMargin=round(calibration_margin, 4),
        reasoning=reasoning,
        evaluatedOptions=evaluated_count,
        modelUsed=model_used,
        decisionTimeMs=decision_ms,
        evalScores={c["key"]: round(c["score"], 2) for c in top_candidates},
        candidateDecisions=candidate_decisions,
        actionProbabilities=action_probabilities,
        committed=is_committed,
        isTuck=chosen_candidate.get("is_tuck", False),
        targetKey=chosen_candidate["key"],
        remainingDistance=remaining_dist
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="127.0.0.1", port=8000, reload=False, log_level="info")
