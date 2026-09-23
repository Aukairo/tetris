'use client';

import React from 'react';
import { SabotageAbility, SabotageCombo } from '../types/game';
import { Zap, Skull, EyeOff, Shuffle, Activity, Flame, Crosshair, Sparkles } from 'lucide-react';

interface SaboteurDeckProps {
  energy: number;
  cooldowns: Record<SabotageAbility, number>;
  onTriggerSabotage: (abilityId: SabotageAbility) => void;
  disabled: boolean;
  isCommitted?: boolean;
  heatLevel?: number;
  activeCombo?: SabotageCombo | null;
}

interface AbilityCardDef {
  id: SabotageAbility;
  key: string;
  name: string;
  cost: number;
  icon: React.ReactNode;
  desc: string;
  borderColor: string;
  btnGlow: string;
}

const ABILITIES: AbilityCardDef[] = [
  {
    id: 'CORRUPT',
    key: '1',
    name: 'Piece Corruptor',
    cost: 35,
    icon: <Skull className="w-4 h-4 text-pink-400" />,
    desc: 'Mutates piece into irregular shape',
    borderColor: 'border-pink-500/40 hover:border-pink-400',
    btnGlow: 'hover:glow-pink bg-pink-950/20 text-pink-200',
  },
  {
    id: 'GLITCH',
    key: '2',
    name: 'Sensor Glitch',
    cost: 50,
    icon: <EyeOff className="w-4 h-4 text-cyan-400" />,
    desc: 'Blinds Laya-MLX vision for 4.0s',
    borderColor: 'border-cyan-500/40 hover:border-cyan-400',
    btnGlow: 'hover:glow-cyan bg-cyan-950/20 text-cyan-200',
  },
  {
    id: 'INVERT',
    key: '3',
    name: 'Control Invert',
    cost: 45,
    icon: <Shuffle className="w-4 h-4 text-amber-400" />,
    desc: 'Reverses AI horizontal inputs for 2.5s',
    borderColor: 'border-amber-500/40 hover:border-amber-400',
    btnGlow: 'hover:glow-yellow bg-amber-950/20 text-amber-200',
  },
  {
    id: 'EARTHQUAKE',
    key: '4',
    name: 'Earthquake',
    cost: 65,
    icon: <Activity className="w-4 h-4 text-emerald-400" />,
    desc: 'Elevates 2 columns with jagged holes',
    borderColor: 'border-emerald-500/40 hover:border-emerald-400',
    btnGlow: 'hover:shadow-[0_0_15px_rgba(16,185,129,0.4)] bg-emerald-950/20 text-emerald-200',
  },
  {
    id: 'GRAVITY',
    key: '5',
    name: 'Gravity Surge',
    cost: 30,
    icon: <Flame className="w-4 h-4 text-purple-400" />,
    desc: '3x falling speed for 4s',
    borderColor: 'border-purple-500/40 hover:border-purple-400',
    btnGlow: 'hover:glow-purple bg-purple-950/20 text-purple-200',
  },
];

export const SaboteurDeck: React.FC<SaboteurDeckProps> = ({
  energy,
  cooldowns,
  onTriggerSabotage,
  disabled,
  isCommitted = false,
  heatLevel = 1,
  activeCombo = null,
}) => {
  return (
    <div className="flex flex-col gap-3 w-full bg-slate-900/60 p-4 rounded-2xl border border-slate-800 backdrop-blur-md shadow-xl">
      {/* Energy Meter Header & Heat Gauge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-400 animate-pulse" />
          <span className="font-mono text-xs uppercase tracking-wider text-slate-300 font-bold">
            SABOTEUR ENERGY
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Strategic Heat Gauge */}
          <div className="flex items-center gap-1 bg-slate-950/80 px-2 py-0.5 rounded-lg border border-slate-800 font-mono text-[10px]">
            <Flame className={`w-3 h-3 ${heatLevel > 1 ? 'text-amber-400 animate-bounce' : 'text-slate-500'}`} />
            <span className="text-slate-400">HEAT:</span>
            <span className={`font-bold ${heatLevel > 1 ? 'text-amber-300' : 'text-slate-400'}`}>
              {heatLevel}X
            </span>
            {heatLevel > 1 && (
              <span className="text-emerald-400 text-[9px] font-bold">
                +{Math.round((heatLevel - 1) * 40)}%
              </span>
            )}
          </div>

          <div className="font-mono text-sm font-black text-yellow-400">
            {Math.floor(energy)} <span className="text-slate-500 text-xs">/ 100</span>
          </div>
        </div>
      </div>

      {/* Energy Progress Bar */}
      <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-yellow-500 via-amber-400 to-cyan-400 transition-all duration-200 shadow-sm"
          style={{ width: `${Math.min(100, Math.max(0, energy))}%` }}
        />
      </div>

      <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between">
        <span>+{(1.2 * (1 + (heatLevel - 1) * 0.4)).toFixed(1)}/s Regen | +3/Drop</span>
        <span className="text-rose-400 font-bold">Row Clear: -15⚡ Penalty</span>
      </div>

      {/* Critical Opportunity Window Banner */}
      {isCommitted && !disabled && (
        <div className="bg-amber-950/70 border border-amber-500 rounded-xl p-2.5 flex items-center justify-between text-amber-200 font-mono text-xs shadow-[0_0_15px_rgba(245,158,11,0.25)] animate-pulse">
          <div className="flex items-center gap-1.5 font-bold">
            <Crosshair className="w-4 h-4 text-amber-400 animate-spin" />
            <span>CRITICAL WINDOW: AI COMMITTED!</span>
          </div>
          <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded uppercase tracking-wider">
            +25% REFUND
          </span>
        </div>
      )}

      {/* Synergy Combo Banner */}
      {activeCombo && (
        <div className="bg-purple-950/80 border border-purple-500 rounded-xl p-2.5 flex items-center justify-between text-purple-200 font-mono text-xs shadow-[0_0_15px_rgba(168,85,247,0.3)] animate-in fade-in">
          <div className="flex items-center gap-1.5 font-bold">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>COMBO: {activeCombo.title}</span>
          </div>
          <span className="text-[10px] bg-purple-500 text-slate-950 font-black px-2 py-0.5 rounded uppercase tracking-wider">
            +{activeCombo.bonusRefund}⚡ REFUND
          </span>
        </div>
      )}

      {/* Ability Cards */}
      <div className="grid grid-cols-1 gap-2 pt-1">
        {ABILITIES.map((ability) => {
          const cd = cooldowns[ability.id] || 0;
          const isOnCooldown = cd > 0;
          const hasEnoughEnergy = energy >= ability.cost;
          const isUsable = !disabled && !isOnCooldown && hasEnoughEnergy;

          return (
            <button
              key={ability.id}
              disabled={!isUsable}
              onClick={() => onTriggerSabotage(ability.id)}
              className={`relative flex items-center justify-between p-2.5 rounded-xl border transition-all text-left ${ability.borderColor} ${ability.btnGlow} ${isUsable
                  ? 'cursor-pointer active:scale-[0.98]'
                  : 'opacity-50 cursor-not-allowed bg-slate-950/40 border-slate-800'
                }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center justify-center shrink-0">
                  {ability.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-white tracking-wide">
                      {ability.name}
                    </span>
                    <span className="bg-slate-800/80 text-slate-400 font-mono text-[10px] px-1.5 py-0.2 rounded border border-slate-700">
                      [{ability.key}]
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans leading-tight">
                    {ability.desc}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end shrink-0 pl-2">
                <div className="flex items-center gap-1 font-mono text-xs font-bold text-yellow-400">
                  <Zap className="w-3 h-3 text-yellow-400" />
                  {ability.cost}
                </div>
                {isOnCooldown && (
                  <span className="text-[10px] font-mono text-pink-400 font-semibold animate-pulse">
                    {cd}s CD
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
