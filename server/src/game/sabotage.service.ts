import { Injectable } from '@nestjs/common';
import { TetrisEngine } from './tetris-engine';

export type SabotageAbility = 'CORRUPT' | 'GLITCH' | 'INVERT' | 'EARTHQUAKE' | 'GRAVITY';

export interface AbilityMeta {
  id: SabotageAbility;
  name: string;
  cost: number;
  cooldownSeconds: number;
  durationSeconds?: number;
  description: string;
}

export const ABILITIES_CONFIG: Record<SabotageAbility, AbilityMeta> = {
  CORRUPT: {
    id: 'CORRUPT',
    name: 'Piece Corruptor',
    cost: 35,
    cooldownSeconds: 6,
    description: 'Swaps current piece with an irregular shape (plus, dot, U-pentomino).',
  },
  GLITCH: {
    id: 'GLITCH',
    name: 'Sensor Glitch',
    cost: 50,
    cooldownSeconds: 10,
    durationSeconds: 4.0,
    description: 'Blinds/scrambles the board state fed to Laya-MLX for 2.0s.',
  },
  INVERT: {
    id: 'INVERT',
    name: 'Control Inverter',
    cost: 45,
    cooldownSeconds: 8,
    durationSeconds: 2.5,
    description: 'Inverts left/right AI controls for 2.5s.',
  },
  EARTHQUAKE: {
    id: 'EARTHQUAKE',
    name: 'Faultline Earthquake',
    cost: 65,
    cooldownSeconds: 12,
    description: 'Elevates 2 random columns by 1 row with jagged hole gaps.',
  },
  GRAVITY: {
    id: 'GRAVITY',
    name: 'Gravity Surge',
    cost: 30,
    cooldownSeconds: 5,
    durationSeconds: 4,
    description: 'Triples the piece drop speed for 4s.',
  },
};

export interface SabotageCombo {
  id: string;
  title: string;
  description: string;
  bonusRefund: number;
}

export interface SabotageExecutionResult {
  success: boolean;
  reason?: string;
  isCritical?: boolean;
  energyRefund?: number;
  combo?: SabotageCombo;
  targetColumn?: number;
  queueIndex?: number;
}

export interface PlayerEnergyState {
  energy: number;
  maxEnergy: number;
  lastUpdated: number;
  cooldowns: Record<SabotageAbility, number>; // timestamp until cooldown finishes
  lastAction?: {
    abilityId: SabotageAbility;
    timestamp: number;
  };
  heatLevel: number; // 1 to 3
  criticalHits: number;
}

@Injectable()
export class SabotageService {
  private playerStates = new Map<string, PlayerEnergyState>();

  public getOrCreateState(sessionId: string): PlayerEnergyState {
    let state = this.playerStates.get(sessionId);
    if (!state) {
      state = {
        energy: 25,
        maxEnergy: 100,
        lastUpdated: Date.now(),
        cooldowns: {
          CORRUPT: 0,
          GLITCH: 0,
          INVERT: 0,
          EARTHQUAKE: 0,
          GRAVITY: 0,
        },
        heatLevel: 1,
        criticalHits: 0,
      };
      this.playerStates.set(sessionId, state);
    }
    return state;
  }

  public replenishTick(sessionId: string, deltaSeconds: number): void {
    const state = this.getOrCreateState(sessionId);
    // Heat level boosts energy replenishment (up to +80% at Heat 3)
    const regenMultiplier = 1.0 + (state.heatLevel - 1) * 0.4;
    state.energy = Math.min(state.maxEnergy, state.energy + (1.2 * regenMultiplier) * deltaSeconds);
    state.lastUpdated = Date.now();

    // Gradual heat decay if inactive for > 12 seconds
    if (state.lastAction && (Date.now() - state.lastAction.timestamp > 12000) && state.heatLevel > 1) {
      state.heatLevel = Math.max(1, state.heatLevel - 0.2 * deltaSeconds);
    }
  }

  public onPieceLocked(sessionId: string): void {
    const state = this.getOrCreateState(sessionId);
    state.energy = Math.min(state.maxEnergy, state.energy + 3);
  }

  public onLinesDestroyed(sessionId: string, linesCount: number): number {
    const state = this.getOrCreateState(sessionId);
    const penalty = 15 * linesCount;
    state.energy = Math.max(0, state.energy - penalty);
    state.heatLevel = 1; // Reset heat on AI comeback
    return penalty;
  }

  public canUseAbility(sessionId: string, abilityId: SabotageAbility): { allowed: boolean; reason?: string } {
    const state = this.getOrCreateState(sessionId);
    const config = ABILITIES_CONFIG[abilityId];
    if (!config) {
      return { allowed: false, reason: 'Invalid ability' };
    }

    const now = Date.now();
    if (state.cooldowns[abilityId] > now) {
      const wait = Math.ceil((state.cooldowns[abilityId] - now) / 1000);
      return { allowed: false, reason: `Ability is on cooldown (${wait}s)` };
    }

    if (state.energy < config.cost) {
      return { allowed: false, reason: `Insufficient energy (requires ${config.cost}, have ${Math.floor(state.energy)})` };
    }

    return { allowed: true };
  }

  private detectCombo(prevAbility?: SabotageAbility, currentAbility?: SabotageAbility): SabotageCombo | undefined {
    if (!prevAbility || !currentAbility) return undefined;
    const pair = [prevAbility, currentAbility].sort().join('+');

    if (pair === 'GLITCH+GRAVITY') {
      return {
        id: 'BLIND_DIVE',
        title: 'BLIND DIVE',
        description: 'Sensor Glitch + Gravity Surge: AI forced into blind high-speed descent!',
        bonusRefund: 15,
      };
    }
    if (pair === 'GRAVITY+INVERT') {
      return {
        id: 'TURBO_INVERT',
        title: 'TURBO INVERT',
        description: 'Control Invert + Gravity Surge: AI horizontal controls inverted at 3x drop speed!',
        bonusRefund: 12,
      };
    }
    if (pair === 'CORRUPT+EARTHQUAKE') {
      return {
        id: 'FAULTLINE_TRAP',
        title: 'FAULTLINE TRAP',
        description: 'Faultline Earthquake + Corruptor: Jagged terrain spike beneath irregular shape!',
        bonusRefund: 18,
      };
    }
    return undefined;
  }

  public executeSabotage(
    sessionId: string,
    abilityId: SabotageAbility,
    engine: TetrisEngine,
    options?: { targetColumn?: number; queueIndex?: number; isCommittedHit?: boolean }
  ): SabotageExecutionResult {
    const check = this.canUseAbility(sessionId, abilityId);
    if (!check.allowed) return { success: false, reason: check.reason };

    const state = this.getOrCreateState(sessionId);
    const config = ABILITIES_CONFIG[abilityId];
    const now = Date.now();

    state.energy -= config.cost;
    state.cooldowns[abilityId] = now + config.cooldownSeconds * 1000;

    // Check for synergy combos with recent action (< 4.0s)
    let combo: SabotageCombo | undefined;
    if (state.lastAction && now - state.lastAction.timestamp < 4000) {
      combo = this.detectCombo(state.lastAction.abilityId, abilityId);
      if (combo) {
        state.energy = Math.min(state.maxEnergy, state.energy + combo.bonusRefund);
      }
    }
    state.lastAction = { abilityId, timestamp: now };

    // Critical Hit: Intercepting an AI committed trajectory
    let isCritical = false;
    let refund = 0;
    if (options?.isCommittedHit) {
      isCritical = true;
      refund = Math.round(config.cost * 0.25);
      state.energy = Math.min(state.maxEnergy, state.energy + refund);
      state.criticalHits++;
      state.heatLevel = Math.min(3, state.heatLevel + 1);
      engine.criticalSabotageCount++;
    }

    switch (abilityId) {
      case 'CORRUPT':
        if (options?.queueIndex !== undefined && options.queueIndex >= 0) {
          engine.corruptQueuePiece(options.queueIndex);
        } else {
          engine.corruptActivePiece();
        }
        break;
      case 'GLITCH':
        engine.glitchedUntil = now + (config.durationSeconds || 4.0) * 1000;
        break;
      case 'INVERT':
        engine.invertedUntil = now + (config.durationSeconds || 2.5) * 1000;
        break;
      case 'EARTHQUAKE':
        if (options?.targetColumn !== undefined) {
          engine.triggerEarthquake([options.targetColumn, (options.targetColumn + 1) % 10]);
        } else {
          engine.triggerEarthquake();
        }
        break;
      case 'GRAVITY':
        engine.gravityUntil = now + (config.durationSeconds || 4) * 1000;
        break;
    }

    return {
      success: true,
      isCritical,
      energyRefund: refund + (combo?.bonusRefund || 0),
      combo,
      targetColumn: options?.targetColumn,
      queueIndex: options?.queueIndex,
    };
  }

  public getCooldownRemaining(sessionId: string): Record<SabotageAbility, number> {
    const state = this.getOrCreateState(sessionId);
    const now = Date.now();
    const result: Record<SabotageAbility, number> = {} as any;
    for (const key of Object.keys(state.cooldowns) as SabotageAbility[]) {
      result[key] = Math.max(0, Math.ceil((state.cooldowns[key] - now) / 1000));
    }
    return result;
  }
}
