export type PieceType = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z' | 'PLUS' | 'DOT' | 'PENTOMINO_U';

export interface ActivePiece {
  type: PieceType;
  x: number;
  y: number;
  rotation: number;
}

export const PIECE_MATRICES: Record<PieceType, number[][][]> = {
  I: [
    [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]],
    [[0,0,1,0], [0,0,1,0], [0,0,1,0], [0,0,1,0]],
    [[0,0,0,0], [0,0,0,0], [1,1,1,1], [0,0,0,0]],
    [[0,1,0,0], [0,1,0,0], [0,1,0,0], [0,1,0,0]],
  ],
  O: [
    [[0,1,1,0], [0,1,1,0], [0,0,0,0], [0,0,0,0]],
    [[0,1,1,0], [0,1,1,0], [0,0,0,0], [0,0,0,0]],
    [[0,1,1,0], [0,1,1,0], [0,0,0,0], [0,0,0,0]],
    [[0,1,1,0], [0,1,1,0], [0,0,0,0], [0,0,0,0]],
  ],
  T: [
    [[0,1,0,0], [1,1,1,0], [0,0,0,0], [0,0,0,0]],
    [[0,1,0,0], [0,1,1,0], [0,1,0,0], [0,0,0,0]],
    [[0,0,0,0], [1,1,1,0], [0,1,0,0], [0,0,0,0]],
    [[0,1,0,0], [1,1,0,0], [0,1,0,0], [0,0,0,0]],
  ],
  S: [
    [[0,1,1,0], [1,1,0,0], [0,0,0,0], [0,0,0,0]],
    [[0,1,0,0], [0,1,1,0], [0,0,1,0], [0,0,0,0]],
    [[0,0,0,0], [0,1,1,0], [1,1,0,0], [0,0,0,0]],
    [[1,0,0,0], [1,1,0,0], [0,1,0,0], [0,0,0,0]],
  ],
  Z: [
    [[1,1,0,0], [0,1,1,0], [0,0,0,0], [0,0,0,0]],
    [[0,0,1,0], [0,1,1,0], [0,1,0,0], [0,0,0,0]],
    [[0,0,0,0], [1,1,0,0], [0,1,1,0], [0,0,0,0]],
    [[0,1,0,0], [1,1,0,0], [1,0,0,0], [0,0,0,0]],
  ],
  J: [
    [[1,0,0,0], [1,1,1,0], [0,0,0,0], [0,0,0,0]],
    [[0,1,1,0], [0,1,0,0], [0,1,0,0], [0,0,0,0]],
    [[0,0,0,0], [1,1,1,0], [0,0,1,0], [0,0,0,0]],
    [[0,1,0,0], [0,1,0,0], [1,1,0,0], [0,0,0,0]],
  ],
  L: [
    [[0,0,1,0], [1,1,1,0], [0,0,0,0], [0,0,0,0]],
    [[0,1,0,0], [0,1,0,0], [0,1,1,0], [0,0,0,0]],
    [[0,0,0,0], [1,1,1,0], [1,0,0,0], [0,0,0,0]],
    [[1,1,0,0], [0,1,0,0], [0,1,0,0], [0,0,0,0]],
  ],
  PLUS: [
    [[0,1,0,0], [1,1,1,0], [0,1,0,0], [0,0,0,0]],
    [[0,1,0,0], [1,1,1,0], [0,1,0,0], [0,0,0,0]],
    [[0,1,0,0], [1,1,1,0], [0,1,0,0], [0,0,0,0]],
    [[0,1,0,0], [1,1,1,0], [0,1,0,0], [0,0,0,0]],
  ],
  DOT: [
    [[0,0,0,0], [0,1,0,0], [0,0,0,0], [0,0,0,0]],
    [[0,0,0,0], [0,1,0,0], [0,0,0,0], [0,0,0,0]],
    [[0,0,0,0], [0,1,0,0], [0,0,0,0], [0,0,0,0]],
    [[0,0,0,0], [0,1,0,0], [0,0,0,0], [0,0,0,0]],
  ],
  PENTOMINO_U: [
    [[1,0,1,0], [1,1,1,0], [0,0,0,0], [0,0,0,0]],
    [[1,1,0,0], [1,0,0,0], [1,1,0,0], [0,0,0,0]],
    [[1,1,1,0], [1,0,1,0], [0,0,0,0], [0,0,0,0]],
    [[0,1,1,0], [0,0,1,0], [0,1,1,0], [0,0,0,0]],
  ],
};

const STANDARD_BAG: PieceType[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];

export class TetrisEngine {
  public board: number[][]; // 20 rows x 10 cols
  public currentPiece: ActivePiece;
  public nextQueue: PieceType[];
  public score: number = 0;
  public linesCleared: number = 0;
  public piecesPlaced: number = 0;
  public isGameOver: boolean = false;
  public isPaused: boolean = false;
  public gameOverReason: 'TOP_OUT' | 'TIME_EXPIRED' | null = null;
  public matchDuration: number = 180.0;
  public timeRemaining: number = 180.0;
  public startTime: number = Date.now();
  public sabotagesUsed: number = 0;
  public criticalSabotageCount: number = 0;

  // Active sabotage temporary effects
  public glitchedUntil: number = 0;
  public invertedUntil: number = 0;
  public gravityUntil: number = 0;

  // Touchdown lock delay: grants 1 tick grace period upon base collision for lateral tucks/slides
  public touchdownTicks: number = 0;

  constructor(matchDuration: number = 180) {
    this.matchDuration = matchDuration;
    this.timeRemaining = matchDuration <= 0 ? 0 : matchDuration;
    this.board = Array.from({ length: 20 }, () => Array(10).fill(0));
    this.nextQueue = this.generateBag();
    this.currentPiece = this.spawnNextPiece();
  }

  private generateBag(): PieceType[] {
    const bag = [...STANDARD_BAG];
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    return bag;
  }

  public spawnNextPiece(): ActivePiece {
    if (this.nextQueue.length < 5) {
      this.nextQueue.push(...this.generateBag());
    }
    const type = this.nextQueue.shift()!;
    const piece: ActivePiece = {
      type,
      x: 3,
      y: 0,
      rotation: 0,
    };

    if (!this.isValidPosition(piece.type, piece.rotation, piece.x, piece.y)) {
      this.isGameOver = true;
      this.gameOverReason = 'TOP_OUT';
    }

    return piece;
  }

  public getPieceBlocks(type: PieceType, rotation: number): [number, number][] {
    const matrices = PIECE_MATRICES[type] || PIECE_MATRICES.T;
    const matrix = matrices[rotation % matrices.length];
    const blocks: [number, number][] = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (matrix[r][c] === 1) {
          blocks.push([c, r]);
        }
      }
    }
    return blocks;
  }

  public isValidPosition(type: PieceType, rotation: number, px: number, py: number): boolean {
    const blocks = this.getPieceBlocks(type, rotation);
    for (const [bx, by] of blocks) {
      const gx = px + bx;
      const gy = py + by;
      if (gx < 0 || gx >= 10) return false;
      if (gy >= 20) return false;
      if (gy >= 0 && this.board[gy][gx] === 1) return false;
    }
    return true;
  }

  public getGhostY(): number {
    let gy = this.currentPiece.y;
    while (this.isValidPosition(this.currentPiece.type, this.currentPiece.rotation, this.currentPiece.x, gy + 1)) {
      gy++;
    }
    return gy;
  }

  public moveLeft(): boolean {
    if (this.isValidPosition(this.currentPiece.type, this.currentPiece.rotation, this.currentPiece.x - 1, this.currentPiece.y)) {
      this.currentPiece.x -= 1;
      if (this.isValidPosition(this.currentPiece.type, this.currentPiece.rotation, this.currentPiece.x, this.currentPiece.y + 1)) {
        this.touchdownTicks = 0;
      }
      return true;
    }
    return false;
  }

  public moveRight(): boolean {
    if (this.isValidPosition(this.currentPiece.type, this.currentPiece.rotation, this.currentPiece.x + 1, this.currentPiece.y)) {
      this.currentPiece.x += 1;
      if (this.isValidPosition(this.currentPiece.type, this.currentPiece.rotation, this.currentPiece.x, this.currentPiece.y + 1)) {
        this.touchdownTicks = 0;
      }
      return true;
    }
    return false;
  }

  public rotate(direction: 'CW' | 'CCW' = 'CW'): boolean {
    const matrices = PIECE_MATRICES[this.currentPiece.type] || PIECE_MATRICES.T;
    const len = matrices.length;
    const nextRot = direction === 'CW'
      ? (this.currentPiece.rotation + 1) % len
      : (this.currentPiece.rotation - 1 + len) % len;

    // Standard wall kicks attempts: [0, 0], [-1, 0], [1, 0], [-2, 0], [2, 0], [0, -1]
    const kicks = [0, -1, 1, -2, 2];
    for (const kick of kicks) {
      if (this.isValidPosition(this.currentPiece.type, nextRot, this.currentPiece.x + kick, this.currentPiece.y)) {
        this.currentPiece.rotation = nextRot;
        this.currentPiece.x += kick;
        if (this.isValidPosition(this.currentPiece.type, this.currentPiece.rotation, this.currentPiece.x, this.currentPiece.y + 1)) {
          this.touchdownTicks = 0;
        }
        return true;
      }
    }
    return false;
  }

  public softDrop(): boolean {
    if (this.isValidPosition(this.currentPiece.type, this.currentPiece.rotation, this.currentPiece.x, this.currentPiece.y + 1)) {
      this.currentPiece.y += 1;
      this.score += 1;
      this.touchdownTicks = 0;
      return true;
    }
    // Touchdown grace period: Allow 1 tick for lateral slides/tucks before cementing
    if (this.touchdownTicks === 0) {
      this.touchdownTicks = 1;
      return false;
    }
    this.touchdownTicks = 0;
    this.lockPiece();
    return false;
  }

  public hardDrop(): number {
    let cellsDropped = 0;
    while (this.isValidPosition(this.currentPiece.type, this.currentPiece.rotation, this.currentPiece.x, this.currentPiece.y + 1)) {
      this.currentPiece.y += 1;
      cellsDropped++;
    }
    this.score += cellsDropped * 2;
    this.touchdownTicks = 0;
    this.lockPiece();
    return cellsDropped;
  }

  public lockPiece(): number {
    this.touchdownTicks = 0;
    const blocks = this.getPieceBlocks(this.currentPiece.type, this.currentPiece.rotation);
    for (const [bx, by] of blocks) {
      const gx = this.currentPiece.x + bx;
      const gy = this.currentPiece.y + by;
      if (gy < 0) {
        this.isGameOver = true;
        this.gameOverReason = 'TOP_OUT';
        return 0;
      }
      if (gy < 20 && gx >= 0 && gx < 10) {
        this.board[gy][gx] = 1;
      }
    }

    this.piecesPlaced++;
    const cleared = this.clearLines();

    if (!this.isGameOver) {
      this.currentPiece = this.spawnNextPiece();
    }
    return cleared;
  }

  public clearLines(): number {
    let cleared = 0;
    const newBoard: number[][] = [];

    for (let r = 0; r < 20; r++) {
      if (this.board[r].every((cell) => cell === 1)) {
        cleared++;
      } else {
        newBoard.push(this.board[r]);
      }
    }

    while (newBoard.length < 20) {
      newBoard.unshift(Array(10).fill(0));
    }

    this.board = newBoard;
    this.linesCleared += cleared;

    // Standard scoring
    if (cleared === 1) this.score += 100;
    else if (cleared === 2) this.score += 300;
    else if (cleared === 3) this.score += 500;
    else if (cleared >= 4) this.score += 800;

    return cleared;
  }

  // --- Sabotage Mechanisms ---

  public corruptActivePiece(): boolean {
    const corruptOptions: PieceType[] = ['PLUS', 'DOT', 'PENTOMINO_U'];
    const chosen = corruptOptions[Math.floor(Math.random() * corruptOptions.length)];
    this.currentPiece.type = chosen;
    this.currentPiece.rotation = 0;

    // Ensure valid position or shift up
    while (this.currentPiece.y > 0 && !this.isValidPosition(this.currentPiece.type, this.currentPiece.rotation, this.currentPiece.x, this.currentPiece.y)) {
      this.currentPiece.y--;
    }
    this.sabotagesUsed++;
    return true;
  }

  public triggerEarthquake(targetColumns?: number[]): boolean {
    // Elevate 2 target columns (or random if unspecified) by 1 row with jagged holes
    let col1: number;
    let col2: number;
    if (targetColumns && targetColumns.length > 0) {
      col1 = Math.max(0, Math.min(9, Math.floor(targetColumns[0])));
      col2 = targetColumns.length > 1
        ? Math.max(0, Math.min(9, Math.floor(targetColumns[1])))
        : (col1 + 1) % 10;
    } else {
      col1 = Math.floor(Math.random() * 5);
      col2 = 5 + Math.floor(Math.random() * 5);
    }

    for (let r = 0; r < 19; r++) {
      this.board[r][col1] = this.board[r + 1][col1];
      this.board[r][col2] = this.board[r + 1][col2];
    }
    this.board[19][col1] = 1;
    this.board[19][col2] = 1;

    // Check if blocks pushed into row 0
    if (this.board[0].some(cell => cell === 1)) {
      this.isGameOver = true;
      this.gameOverReason = 'TOP_OUT';
    }

    this.sabotagesUsed++;
    return true;
  }

  public corruptQueuePiece(index: number = 0): boolean {
    if (this.nextQueue.length <= index) return false;
    const corruptOptions: PieceType[] = ['PLUS', 'DOT', 'PENTOMINO_U'];
    const chosen = corruptOptions[Math.floor(Math.random() * corruptOptions.length)];
    this.nextQueue[index] = chosen;
    this.sabotagesUsed++;
    return true;
  }

  public updateTime(deltaSeconds: number): void {
    if (this.isGameOver) return;
    if (this.matchDuration <= 0) {
      // Unlimited mode: timeRemaining tracks elapsed time with no expiration
      this.timeRemaining += deltaSeconds;
      return;
    }
    this.timeRemaining -= deltaSeconds;
    if (this.timeRemaining <= 0) {
      this.timeRemaining = 0;
      this.isGameOver = true;
      this.gameOverReason = 'TIME_EXPIRED';
      // Anti-stall timeout penalty (+5,000 points added to AI score)
      this.score += 5000;
    }
  }

  public getElapsedTime(): number {
    return this.matchDuration <= 0
      ? Math.max(0, this.timeRemaining)
      : Math.max(0, this.matchDuration - this.timeRemaining);
  }
}
