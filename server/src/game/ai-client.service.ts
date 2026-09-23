import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ActivePiece, PieceType } from './tetris-engine';

export interface ActionProbability {
  action: string;
  probability: number;
  description: string;
}

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

export interface DecisionResult {
  targetX: number;
  targetRotation: number;
  actions: string[];
  confidence: number;
  modelProbability?: number;
  calibrationMargin?: number;
  reasoning?: string;
  evaluatedOptions: number;
  modelUsed: string;
  decisionTimeMs: number;
  evalScores?: Record<string, number>;
  candidateDecisions?: CandidateOption[];
  actionProbabilities?: ActionProbability[];
  committed?: boolean;
  isTuck?: boolean;
  targetKey?: string;
  remainingDistance?: number;
  lookaheadPiece?: string;
  lookaheadSynergy?: string;
}

@Injectable()
export class AiClientService {
  private readonly logger = new Logger(AiClientService.name);
  private readonly pythonAiUrl = 'http://127.0.0.1:8000/decision';

  public async getDecision(
    board: number[][],
    currentPiece: ActivePiece,
    nextPieces: PieceType[],
    glitched: boolean,
    inverterActive: boolean,
    previousTargetKey?: string,
  ): Promise<DecisionResult> {
    const t0 = Date.now();
    try {
      const response = await axios.post(
        this.pythonAiUrl,
        {
          board,
          currentPiece,
          nextPieces,
          glitched,
          inverterActive,
          previousTargetKey,
        },
        { timeout: 350 },
      );

      return response.data;
    } catch (err: any) {
      // Fallback decision heuristic if Python engine is unreachable
      const t1 = Date.now();
      this.logger.debug(`Using internal fallback decision: ${err?.message || err}`);
      return {
        targetX: Math.max(0, Math.min(6, currentPiece.x)),
        targetRotation: (currentPiece.rotation + 1) % 4,
        actions: ['ROTATE_CW', 'HARD_DROP'],
        confidence: 0.5,
        evaluatedOptions: 10,
        modelUsed: 'internal-fallback',
        decisionTimeMs: t1 - t0,
        evalScores: {},
      };
    }
  }
}
