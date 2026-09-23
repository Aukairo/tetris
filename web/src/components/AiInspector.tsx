'use client';

import React, { useState } from 'react';
import { AiTelemetry } from '../types/game';
import {
  Cpu,
  Gauge,
  Compass,
  Layers,
  ShieldCheck,
  Info,
  CheckCircle2,
  Terminal,
  ArrowLeft,
  ArrowRight,
  RotateCw,
  ArrowDown,
  Lock,
  Sparkles,
} from 'lucide-react';

interface AiInspectorProps {
  telemetry: AiTelemetry | null;
  score: number;
  piecesPlaced: number;
  linesCleared: number;
}

export const AiInspector: React.FC<AiInspectorProps> = ({
  telemetry,
  score,
  piecesPlaced,
  linesCleared,
}) => {
  const [showInfo, setShowInfo] = useState(false);

  // Softmax certainty percentage (0 - 100%)
  const probabilityPercent = telemetry?.modelProbability
    ? Math.round(telemetry.modelProbability * 100)
    : telemetry?.confidence
    ? Math.round(telemetry.confidence * 100)
    : 0;

  const calibrationMargin = telemetry?.calibrationMargin
    ? (telemetry.calibrationMargin > 0 ? `+${(telemetry.calibrationMargin * 100).toFixed(1)}%` : `${(telemetry.calibrationMargin * 100).toFixed(1)}%`)
    : '+3.7%';

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'MOVE_LEFT':
        return <ArrowLeft className="w-3 h-3 text-cyan-400" />;
      case 'MOVE_RIGHT':
        return <ArrowRight className="w-3 h-3 text-pink-400" />;
      case 'ROTATE':
        return <RotateCw className="w-3 h-3 text-yellow-400" />;
      case 'SOFT_DROP':
      default:
        return <ArrowDown className="w-3 h-3 text-emerald-400" />;
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full bg-slate-900/60 p-4 rounded-2xl border border-slate-800 backdrop-blur-md shadow-xl font-mono text-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-white tracking-wider">LAYA-MLX BRAIN</span>
        </div>
        <div className="flex items-center gap-1.5">
          {telemetry?.committed && (
            <span className="text-[10px] bg-amber-950/80 text-amber-300 border border-amber-500/80 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 shadow-sm">
              <Lock className="w-2.5 h-2.5 text-amber-400" />
              LOCKED (d={telemetry.remainingDistance ?? 0})
            </span>
          )}
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="text-slate-400 hover:text-cyan-300 p-0.5 rounded transition-colors"
            title="What is confidence score?"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] bg-cyan-950/50 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
            APPLE_SILICON_GPU
          </span>
        </div>
      </div>

      {/* Explanatory Info Card (Expandable) */}
      {showInfo && (
        <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-800/80 text-[11px] text-cyan-200 space-y-1">
          <div className="font-bold text-white flex items-center gap-1">
            <Info className="w-3 h-3 text-cyan-400" /> Understanding Model Probabilities:
          </div>
          <p className="text-slate-300 leading-snug">
            Unlike generative LLMs, <span className="text-cyan-300 font-semibold">Laya-MLX</span> is a typed decision model running on Apple Silicon GPU via MLX.
          </p>
          <p className="text-slate-300 leading-snug">
            • <strong className="text-white">Action Probabilities:</strong> The real-time softmax distribution across micro-actions (Move Left, Move Right, Rotate, Drop).
          </p>
          <p className="text-slate-300 leading-snug">
            • <strong className="text-white">Placement Decisions:</strong> Evaluated physical target zones (e.g. Left Wall, Center Slot) ranked by heuristic survival score.
          </p>
          <p className="text-slate-300 leading-snug">
            • <strong className="text-amber-300">Commitment Gate:</strong> When within 3 rows of touchdown, the model locks into its landing pocket to prevent destructive last-second snags.
          </p>
        </div>
      )}

      {/* Hardware & Inference Speed */}
      <div className="grid grid-cols-2 gap-2 text-slate-300">
        <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
          <div className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
            <Gauge className="w-3 h-3 text-cyan-400" /> Decision Latency
          </div>
          <div className="text-sm font-bold text-cyan-300 mt-1">
            {telemetry?.decisionTimeMs ? `${telemetry.decisionTimeMs} ms` : '~12 ms'}
          </div>
        </div>

        <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
          <div className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
            <Layers className="w-3 h-3 text-purple-400" /> Evaluated Candidates
          </div>
          <div className="text-sm font-bold text-purple-300 mt-1">
            {telemetry?.evaluatedOptions || 34} drop paths
          </div>
        </div>
      </div>

      {/* 1. Real-time Action Choice Probabilities (Move/Rotate/Drop) */}
      <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 flex flex-col gap-2">
        <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center justify-between pb-1 border-b border-slate-800/60">
          <span className="flex items-center gap-1 font-bold text-white">
            <Compass className="w-3 h-3 text-cyan-400" />
            ACTION PROBABILITIES
          </span>
          <span className="text-[9px] text-slate-500">LIVE SELECTION</span>
        </div>

        {telemetry?.actionProbabilities && telemetry.actionProbabilities.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {telemetry.actionProbabilities.map((act) => {
              const pct = Math.round(act.probability * 100);
              return (
                <div
                  key={act.action}
                  className="bg-slate-900/60 p-2 rounded-xl border border-slate-800/70 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between text-[11px] mb-1.5">
                    <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                      {getActionIcon(act.action)}
                      {act.description}
                    </span>
                    <span className="font-bold text-cyan-300 font-mono">{pct}%</span>
                  </div>
                  <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800/50">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full transition-all duration-200"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-slate-600 text-center py-2 text-[11px]">
            Awaiting action probability stream...
          </div>
        )}
      </div>

      {/* Model Decision Reasoning Box */}
      {telemetry?.reasoning && (
        <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 text-[11px] text-slate-300">
          <div className="text-[10px] text-slate-500 uppercase flex items-center gap-1 mb-1 font-bold">
            <Terminal className="w-3 h-3 text-yellow-400" /> Model Reasoning:
          </div>
          <div className="text-slate-300 leading-snug">
            {telemetry.reasoning}
          </div>
        </div>
      )}

      {/* 2. Top Placement Candidate Decisions */}
      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60 flex flex-col gap-1.5">
        <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center justify-between pb-1 border-b border-slate-800/60">
          <span className="font-bold text-white">EVALUATED PLACEMENTS</span>
          <span>PROBABILITY</span>
        </div>

        {(!telemetry?.candidateDecisions || telemetry.candidateDecisions.length === 0) ? (
          <div className="text-slate-600 text-center py-2 text-[11px]">
            Awaiting placement decisions...
          </div>
        ) : (
          telemetry.candidateDecisions.map((cand, idx) => {
            const probPct = Math.round(cand.probability * 100);
            return (
              <div
                key={cand.key || idx}
                className={`flex items-center justify-between p-2 rounded-xl text-[11px] transition-all ${
                  cand.isSelected
                    ? telemetry?.committed
                      ? 'bg-amber-950/50 border border-amber-500/70 text-amber-200 shadow-sm'
                      : 'bg-cyan-950/60 border border-cyan-500/60 text-cyan-200 shadow-sm'
                    : 'text-slate-400 bg-slate-900/40 border border-slate-850'
                }`}
              >
                <div className="flex items-center gap-2">
                  {cand.isSelected ? (
                    telemetry?.committed ? (
                      <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    )
                  ) : (
                    <span className="w-3.5 text-center text-slate-600 text-[10px]">{idx + 1}</span>
                  )}
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white leading-tight">
                        {cand.label || `Slot ${cand.targetX + 1}`}
                      </span>
                      {cand.isTuck && (
                        <span className="text-[8px] bg-purple-900/80 text-purple-300 border border-purple-500/60 font-bold px-1 rounded uppercase tracking-wider">
                          TUCK
                        </span>
                      )}
                    </div>
                    <span className="text-slate-500 text-[9px] leading-tight">
                      Col {cand.targetX + 1} · {cand.targetRotation * 90}° rot
                    </span>
                  </div>
                  {cand.isSelected && (
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ml-1 flex items-center gap-0.5 ${
                      telemetry?.committed
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-cyan-500 text-slate-950'
                    }`}>
                      {telemetry?.committed && <Lock className="w-2.5 h-2.5" />}
                      {telemetry?.committed ? 'LOCKED' : 'CHOSEN'}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-14 bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full ${cand.isSelected ? (telemetry?.committed ? 'bg-amber-400' : 'bg-cyan-400') : 'bg-slate-600'}`}
                      style={{ width: `${probPct}%` }}
                    />
                  </div>
                  <span className={`font-bold w-8 text-right font-mono ${cand.isSelected ? (telemetry?.committed ? 'text-amber-300' : 'text-cyan-300') : 'text-slate-400'}`}>
                    {probPct}%
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Match Scores Footer */}
      <div className="grid grid-cols-3 gap-1.5 pt-1 text-center">
        <div className="bg-slate-950/40 p-2 rounded-lg border border-slate-800/40">
          <div className="text-[9px] text-slate-500 uppercase">AI Score</div>
          <div className="text-xs font-bold text-amber-400 mt-0.5">{score}</div>
        </div>
        <div className="bg-slate-950/40 p-2 rounded-lg border border-slate-800/40">
          <div className="text-[9px] text-slate-500 uppercase">Lines Cleared</div>
          <div className="text-xs font-bold text-cyan-300 mt-0.5">{linesCleared}</div>
        </div>
        <div className="bg-slate-950/40 p-2 rounded-lg border border-slate-800/40">
          <div className="text-[9px] text-slate-500 uppercase">Pieces Placed</div>
          <div className="text-xs font-bold text-slate-300 mt-0.5">{piecesPlaced}</div>
        </div>
      </div>
    </div>
  );
};
