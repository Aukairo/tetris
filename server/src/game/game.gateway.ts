import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Inject } from '@nestjs/common';
import { TetrisEngine } from './tetris-engine';
import { SabotageService, SabotageAbility } from './sabotage.service';
import { AiClientService, DecisionResult } from './ai-client.service';
import { PrismaService } from '../prisma.service';

interface GameSession {
  engine: TetrisEngine;
  timerInterval: NodeJS.Timeout | null;
  aiActionQueue: string[];
  lastDecision: DecisionResult | null;
  isProcessingDecision: boolean;
  playerName: string;
  guestSessionId: string;
  userId?: string;
  committedTargetKey?: string | null;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(GameGateway.name);
  private sessions = new Map<string, GameSession>();

  constructor(
    @Inject(SabotageService)
    private readonly sabotageService: SabotageService,
    @Inject(AiClientService)
    private readonly aiClient: AiClientService,
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.stopSession(client.id);
  }

  @SubscribeMessage('start_game')
  async handleStartGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { playerName?: string; guestSessionId?: string; userId?: string; matchDuration?: number },
  ) {
    this.stopSession(client.id);

    const matchDuration = data?.matchDuration === 0 ? 0 : Math.max(30, Math.min(600, data?.matchDuration ?? 180));
    const engine = new TetrisEngine(matchDuration);
    const guestSessionId = data?.guestSessionId || `guest_${Math.random().toString(36).substring(2, 9)}`;
    const playerName = data?.playerName || 'Guest Saboteur';

    const session: GameSession = {
      engine,
      timerInterval: null,
      aiActionQueue: [],
      lastDecision: null,
      isProcessingDecision: false,
      playerName,
      guestSessionId,
      userId: data?.userId,
      committedTargetKey: null,
    };

    this.sessions.set(client.id, session);
    this.sabotageService.getOrCreateState(client.id);

    // Initial broadcast
    this.broadcastState(client.id);

    // Start game tick loop
    this.startGameLoop(client.id);
  }

  @SubscribeMessage('toggle_pause')
  handleTogglePause(@ConnectedSocket() client: Socket) {
    const session = this.sessions.get(client.id);
    if (!session || session.engine.isGameOver) return;

    session.engine.isPaused = !session.engine.isPaused;
    this.broadcastState(client.id);
  }

  @SubscribeMessage('sabotage')
  handleSabotage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { abilityId: SabotageAbility; targetColumn?: number; queueIndex?: number },
  ) {
    const session = this.sessions.get(client.id);
    if (!session || session.engine.isGameOver || session.engine.isPaused) return;

    // Check if AI is currently committed to its trajectory (critical hit opportunity!)
    const isCommittedHit = session.lastDecision?.committed === true;

    const result = this.sabotageService.executeSabotage(
      client.id,
      data.abilityId,
      session.engine,
      {
        targetColumn: data.targetColumn,
        queueIndex: data.queueIndex,
        isCommittedHit,
      },
    );

    if (result.success) {
      // Clear planned AI action queue and reset target commitment so AI must react to the sabotage
      session.aiActionQueue = [];
      session.committedTargetKey = null;

      client.emit('sabotage_applied', {
        abilityId: data.abilityId,
        cooldowns: this.sabotageService.getCooldownRemaining(client.id),
        isCritical: result.isCritical,
        energyRefund: result.energyRefund,
        combo: result.combo,
        targetColumn: result.targetColumn,
        queueIndex: result.queueIndex,
      });

      if (result.isCritical) {
        client.emit('critical_sabotage', {
          abilityId: data.abilityId,
          energyRefund: result.energyRefund,
          message: 'CRITICAL INTERCEPT! Trajectory lock broken at touchdown zone!',
        });
      }

      if (result.combo) {
        client.emit('combo_triggered', {
          combo: result.combo,
        });
      }

      this.broadcastState(client.id);
    } else {
      client.emit('sabotage_rejected', { reason: result.reason });
    }
  }

  private startGameLoop(clientId: string) {
    const session = this.sessions.get(clientId);
    if (!session) return;

    let lastTickTime = Date.now();

    const tick = async () => {
      const currentSession = this.sessions.get(clientId);
      if (!currentSession || currentSession.engine.isGameOver) {
        if (currentSession?.engine.isGameOver) {
          await this.handleGameOver(clientId);
        }
        return;
      }

      const now = Date.now();
      const deltaSeconds = (now - lastTickTime) / 1000.0;
      lastTickTime = now;

      const engine = currentSession.engine;

      // If paused, skip tick computation but maintain loop
      if (engine.isPaused) {
        currentSession.timerInterval = setTimeout(tick, 300);
        return;
      }

      // Update match countdown
      engine.updateTime(deltaSeconds);
      if (engine.isGameOver) {
        await this.handleGameOver(clientId);
        return;
      }

      // Passive energy regen
      this.sabotageService.replenishTick(clientId, deltaSeconds);

      // AI Decision execution
      await this.processAiStep(clientId);

      this.broadcastState(clientId);

      // Adaptive tick speed: 360ms normal pace, 160ms under Gravity Surge
      const tickDelay = now < engine.gravityUntil ? 160 : 360;
      currentSession.timerInterval = setTimeout(tick, tickDelay);
    };

    session.timerInterval = setTimeout(tick, 360);
  }

  private async processAiStep(clientId: string) {
    const session = this.sessions.get(clientId);
    if (!session || session.engine.isGameOver) return;

    const engine = session.engine;
    const now = Date.now();
    const isGlitched = now < engine.glitchedUntil;
    const isInverted = now < engine.invertedUntil;

    // Continuous evaluation: evaluate the best option at every point based on the current piece, position, and game status
    let currentActions: string[] = [];
    const prevPiecesPlaced = engine.piecesPlaced;
    try {
      const decision = await this.aiClient.getDecision(
        engine.board,
        engine.currentPiece,
        engine.nextQueue,
        isGlitched,
        isInverted,
        session.committedTargetKey || undefined,
      );
      session.lastDecision = decision;
      if (decision.targetKey) {
        session.committedTargetKey = decision.targetKey;
      }
      currentActions = decision.actions || [];
    } catch (e) {
      this.logger.error(`Continuous decision error: ${e}`);
    }

    const prevLinesCleared = engine.linesCleared;

    // Execute steering micro-action(s) for this point
    for (const action of currentActions) {
      if (action === 'ROTATE_CW') {
        engine.rotate('CW');
      } else if (action === 'ROTATE_CCW') {
        engine.rotate('CCW');
      } else if (action === 'MOVE_LEFT') {
        engine.moveLeft();
      } else if (action === 'MOVE_RIGHT') {
        engine.moveRight();
      }
    }

    // Advance gravity down towards the base on every tick
    // If piece cannot drop further, softDrop() automatically locks the piece and clears lines
    engine.softDrop();

    // If piece was placed and spawned a new one, reset target commitment for the fresh piece
    if (engine.piecesPlaced !== prevPiecesPlaced) {
      session.committedTargetKey = null;
    }

    // Penalize user energy if AI managed to destroy/clear rows!
    const newlyCleared = engine.linesCleared - prevLinesCleared;
    if (newlyCleared > 0) {
      const penalty = this.sabotageService.onLinesDestroyed(clientId, newlyCleared);
      this.server.to(clientId).emit('line_cleared_penalty', {
        linesCleared: newlyCleared,
        energyDeducted: penalty,
      });
    }
  }

  private broadcastState(clientId: string) {
    const session = this.sessions.get(clientId);
    if (!session) return;

    const engine = session.engine;
    const energyState = this.sabotageService.getOrCreateState(clientId);
    const cooldowns = this.sabotageService.getCooldownRemaining(clientId);

    this.server.to(clientId).emit('game_state', {
      board: engine.board,
      currentPiece: engine.currentPiece,
      ghostY: engine.getGhostY(),
      nextPieces: engine.nextQueue.slice(0, 3),
      score: engine.score,
      linesCleared: engine.linesCleared,
      piecesPlaced: engine.piecesPlaced,
      timeRemaining: Math.max(0, Math.ceil(engine.timeRemaining)),
      matchDuration: engine.matchDuration,
      energy: Math.floor(energyState.energy),
      heatLevel: Math.round(energyState.heatLevel),
      criticalHits: energyState.criticalHits,
      isCommitted: session.lastDecision?.committed || false,
      cooldowns,
      isGlitched: Date.now() < engine.glitchedUntil,
      isInverted: Date.now() < engine.invertedUntil,
      isGravitySurged: Date.now() < engine.gravityUntil,
      isPaused: engine.isPaused,
      aiTelemetry: session.lastDecision
        ? {
            confidence: session.lastDecision.confidence,
            modelProbability: session.lastDecision.modelProbability,
            calibrationMargin: session.lastDecision.calibrationMargin,
            reasoning: session.lastDecision.reasoning,
            modelUsed: session.lastDecision.modelUsed,
            decisionTimeMs: session.lastDecision.decisionTimeMs,
            evaluatedOptions: session.lastDecision.evaluatedOptions,
            targetX: session.lastDecision.targetX,
            targetRotation: session.lastDecision.targetRotation,
            evalScores: session.lastDecision.evalScores,
            candidateDecisions: session.lastDecision.candidateDecisions || [],
            actionProbabilities: session.lastDecision.actionProbabilities || [],
            committed: session.lastDecision.committed || false,
            isTuck: session.lastDecision.isTuck || false,
            remainingDistance: session.lastDecision.remainingDistance ?? 0,
            lookaheadPiece: session.lastDecision.lookaheadPiece,
            lookaheadSynergy: session.lastDecision.lookaheadSynergy,
          }
        : null,
    });
  }

  private async handleGameOver(clientId: string) {
    const session = this.sessions.get(clientId);
    if (!session) return;

    const engine = session.engine;
    this.stopSession(clientId);

    const completedEarly = engine.gameOverReason === 'TOP_OUT';
    const timeoutPenalty = engine.gameOverReason === 'TIME_EXPIRED';
    const durationSeconds = Math.round(engine.getElapsedTime() * 10) / 10;

    // Persist to Prisma SQLite database
    let matchRecord = null;
    try {
      matchRecord = await this.prisma.matchRecord.create({
        data: {
          playerName: session.playerName,
          guestSessionId: session.guestSessionId,
          userId: session.userId || null,
          aiScore: engine.score,
          linesCleared: engine.linesCleared,
          piecesPlaced: engine.piecesPlaced,
          durationSeconds,
          sabotagesUsed: engine.sabotagesUsed,
          completedEarly,
          timeoutPenalty,
        },
      });
    } catch (e) {
      this.logger.error(`Error saving match record: ${e}`);
    }

    // Query rank (how many matches have a strictly lower score)
    let rank = 1;
    try {
      rank = (await this.prisma.matchRecord.count({
        where: {
          aiScore: {
            lt: engine.score,
          },
        },
      })) + 1;
    } catch (_) {}

    this.server.to(clientId).emit('game_over', {
      matchId: matchRecord?.id,
      finalScore: engine.score,
      linesCleared: engine.linesCleared,
      piecesPlaced: engine.piecesPlaced,
      durationSeconds,
      sabotagesUsed: engine.sabotagesUsed,
      reason: engine.gameOverReason,
      completedEarly,
      timeoutPenalty,
      rank,
      isGuest: !session.userId,
    });
  }

  private stopSession(clientId: string) {
    const session = this.sessions.get(clientId);
    if (session) {
      if (session.timerInterval) {
        clearTimeout(session.timerInterval);
        session.timerInterval = null;
      }
      this.sessions.delete(clientId);
    }
  }
}
