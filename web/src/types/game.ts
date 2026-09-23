export type PieceType = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z' | 'PLUS' | 'DOT' | 'PENTOMINO_U';

export interface ActivePiece {
  type: PieceType;
  x: number;
  y: number;
  rotation: number;
}

export type SabotageAbility = 'CORRUPT' | 'GLITCH' | 'INVERT' | 'EARTHQUAKE' | 'GRAVITY';

export interface CandidateOption {
  key: string;
  label?: string;
  targetX: number;
  targetRotation: number;
  score: number;
  probability: number;
  isSelected: boolean;
  isTuck?: boolean;
  lookaheadSubScore?: number;
  synergyReason?: string;
}

export interface ActionProbability {
  action: string;
  probability: number;
  description: string;
}

export interface AiTelemetry {
  confidence: number;
  modelProbability?: number;
  calibrationMargin?: number;
  reasoning?: string;
  modelUsed: string;
  decisionTimeMs: number;
  evaluatedOptions: number;
  targetX: number;
  targetRotation: number;
  evalScores?: Record<string, number>;
  candidateDecisions?: CandidateOption[];
  actionProbabilities?: ActionProbability[];
  committed?: boolean;
  isTuck?: boolean;
  remainingDistance?: number;
  lookaheadPiece?: string;
  lookaheadSynergy?: string;
}

export interface SabotageCombo {
  id: string;
  title: string;
  description: string;
  bonusRefund: number;
}

export interface CriticalSabotageEvent {
  abilityId: SabotageAbility;
  energyRefund: number;
  message: string;
}

export interface GameState {
  board: number[][];
  currentPiece: ActivePiece;
  ghostY: number;
  nextPieces: PieceType[];
  score: number;
  linesCleared: number;
  piecesPlaced: number;
  timeRemaining: number;
  matchDuration?: number;
  energy: number;
  heatLevel?: number;
  criticalHits?: number;
  isCommitted?: boolean;
  cooldowns: Record<SabotageAbility, number>;
  isGlitched: boolean;
  isInverted: boolean;
  isGravitySurged: boolean;
  isPaused?: boolean;
  aiTelemetry: AiTelemetry | null;
}

export interface GameOverData {
  matchId?: string;
  finalScore: number;
  linesCleared: number;
  piecesPlaced: number;
  durationSeconds: number;
  sabotagesUsed: number;
  reason: 'TOP_OUT' | 'TIME_EXPIRED';
  completedEarly: boolean;
  timeoutPenalty: boolean;
  rank: number;
  isGuest: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  id: string;
  playerName: string;
  avatarUrl?: string;
  provider: string;
  aiScore: number;
  durationSeconds: number;
  piecesPlaced: number;
  linesCleared: number;
  sabotagesUsed: number;
  completedEarly: boolean;
  timeoutPenalty: boolean;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  username: string;
  email?: string;
  avatarUrl?: string;
  provider: 'guest' | 'google' | 'github';
  isGuest: boolean;
}
