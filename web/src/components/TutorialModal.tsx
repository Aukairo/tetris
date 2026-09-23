'use client';

import React, { useState } from 'react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Zap,
  Cpu,
  Flame,
  Shuffle,
  EyeOff,
  MoveHorizontal,
  Activity,
  ChevronsDown,
  Pause,
  Award,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

interface Step {
  title: string;
  badge: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const handleFinish = () => {
    localStorage.setItem('tetris_tutorial_seen', 'true');
    if (onComplete) onComplete();
    onClose();
  };

  const steps: Step[] = [
    {
      title: 'THE REVERSE TETRIS CONFLICT',
      badge: 'CONCEPT',
      icon: <Award className="w-6 h-6 text-yellow-400" />,
      content: (
        <div className="space-y-3 text-xs leading-relaxed text-slate-300">
          <p>
            Welcome to <strong className="text-cyan-300">Reverse Tetris: Saboteur Protocol</strong>!
          </p>
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-white font-bold">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>The AI Plays, You Sabotage</span>
            </div>
            <p>
              The game is played autonomously by <strong className="text-cyan-300">Laya-MLX</strong>, an Apple Silicon GPU-accelerated local decision model.
            </p>
            <p>
              Your objective is <span className="text-rose-400 font-bold">REVERSED</span>: You must use sabotages to force the AI into a <strong className="text-white">TOP-OUT GAME OVER</strong> with the <strong className="text-yellow-400">LOWEST possible score</strong>!
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-900/60 text-rose-200">
            ⏱️ <strong>180s Time Limit:</strong> If the 3-minute timer runs out before you top out the AI, a heavy timeout penalty is applied to your leaderboard ranking.
          </div>
        </div>
      ),
    },
    {
      title: 'ENERGY & DESTRUCTION PENALTY',
      badge: 'RESOURCE MANAGEMENT',
      icon: <Zap className="w-6 h-6 text-amber-400" />,
      content: (
        <div className="space-y-3 text-xs leading-relaxed text-slate-300">
          <p>
            Every sabotage costs <strong className="text-amber-400">⚡ Energy</strong>. Managing your energy gauge is the difference between victory and defeat.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Passive Recharge</span>
              <div className="text-base font-bold text-amber-400 mt-0.5">+2.0 ⚡ / sec</div>
              <p className="text-[10px] text-slate-400 mt-1">Pool caps at 100⚡.</p>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-900/60">
              <span className="text-[10px] text-rose-400 uppercase font-bold">AI Clear Penalty</span>
              <div className="text-base font-bold text-rose-300 mt-0.5">-15 ⚡ / line</div>
              <p className="text-[10px] text-rose-300/80 mt-1">Whenever the AI clears rows, you bleed energy!</p>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-800/60 text-cyan-200">
            💡 <strong>Strategy:</strong> Don't let the AI clean up the board. Disrupt its placements before it completes lines to preserve your energy reserves!
          </div>
        </div>
      ),
    },
    {
      title: 'THE 5 SABOTAGE ARSENALS',
      badge: 'ABILITIES',
      icon: <Flame className="w-6 h-6 text-pink-500" />,
      content: (
        <div className="space-y-2 text-xs leading-relaxed text-slate-300">
          <p className="text-[11px] text-slate-400 mb-1">
            Trigger abilities with mouse clicks or hotkeys <kbd className="px-1 py-0.5 bg-slate-800 border border-slate-700 rounded text-cyan-300 font-mono">[1]</kbd> to <kbd className="px-1 py-0.5 bg-slate-800 border border-slate-700 rounded text-cyan-300 font-mono">[5]</kbd>:
          </p>
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            <div className="p-2 rounded-xl bg-pink-950/30 border border-pink-800/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-pink-500/20 text-pink-400 font-mono text-[10px] font-bold flex items-center justify-center border border-pink-500/40">1</span>
                <div>
                  <span className="font-bold text-white">Piece Corruptor (25⚡)</span>
                  <div className="text-[10px] text-slate-400">Mutates falling piece into an irregular Plus, Dot, or U-shape.</div>
                </div>
              </div>
              <Shuffle className="w-4 h-4 text-pink-400 shrink-0" />
            </div>

            <div className="p-2 rounded-xl bg-purple-950/30 border border-purple-800/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-purple-500/20 text-purple-400 font-mono text-[10px] font-bold flex items-center justify-center border border-purple-500/40">2</span>
                <div>
                  <span className="font-bold text-white">Sensor Glitch (30⚡)</span>
                  <div className="text-[10px] text-slate-400">Blinds the AI's heuristics for 1.8s, causing disastrous blunders.</div>
                </div>
              </div>
              <EyeOff className="w-4 h-4 text-purple-400 shrink-0" />
            </div>

            <div className="p-2 rounded-xl bg-yellow-950/30 border border-yellow-800/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-yellow-500/20 text-yellow-400 font-mono text-[10px] font-bold flex items-center justify-center border border-yellow-500/40">3</span>
                <div>
                  <span className="font-bold text-white">Control Inverter (40⚡)</span>
                  <div className="text-[10px] text-slate-400">Reverses left/right steering for 3.5s so AI moves away from its intended slot.</div>
                </div>
              </div>
              <MoveHorizontal className="w-4 h-4 text-yellow-400 shrink-0" />
            </div>

            <div className="p-2 rounded-xl bg-emerald-950/30 border border-emerald-800/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold flex items-center justify-center border border-emerald-500/40">4</span>
                <div>
                  <span className="font-bold text-white">Earthquake (45⚡)</span>
                  <div className="text-[10px] text-slate-400">Injects a solid garbage line with random gap from the bottom.</div>
                </div>
              </div>
              <Activity className="w-4 h-4 text-emerald-400 shrink-0" />
            </div>

            <div className="p-2 rounded-xl bg-indigo-950/30 border border-indigo-800/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-indigo-500/20 text-indigo-400 font-mono text-[10px] font-bold flex items-center justify-center border border-indigo-500/40">5</span>
                <div>
                  <span className="font-bold text-white">Gravity Surge (35⚡)</span>
                  <div className="text-[10px] text-slate-400">Forces 3x falling speed for 3s so AI panics and drops prematurely.</div>
                </div>
              </div>
              <ChevronsDown className="w-4 h-4 text-indigo-400 shrink-0" />
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'AI TELEMETRY & DECISION PROBABILITIES',
      badge: 'INTELLIGENCE',
      icon: <Sparkles className="w-6 h-6 text-cyan-400" />,
      content: (
        <div className="space-y-3 text-xs leading-relaxed text-slate-300">
          <p>
            The <strong className="text-cyan-300">LAYA-MLX BRAIN</strong> panel on the right displays real-time model decision metrics:
          </p>
          <div className="space-y-2">
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="font-bold text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                <span>Action Probabilities (Move / Rotate / Drop)</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Shows the live probability distribution among possible movements at each tick so you can predict where the AI is trying to shift.
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="font-bold text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                <span>Evaluated Move Candidates</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Laya-MLX scores dozens of landing columns and orientations (e.g. <em>Left Wall Flat</em>, <em>Slot 4 Vertical</em>). The chosen move is marked <span className="text-cyan-300 font-bold">CHOSEN</span>.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'MATCH CONTROLS & PAUSE',
      badge: 'CONTROLS',
      icon: <Pause className="w-6 h-6 text-yellow-400" />,
      content: (
        <div className="space-y-3 text-xs leading-relaxed text-slate-300">
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="font-bold text-white">Essential Hotkeys:</div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                <span className="font-mono text-cyan-300 font-bold">[Space] / [P]</span>
                <div className="text-slate-400 mt-0.5">Pause / Resume match</div>
              </div>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                <span className="font-mono text-pink-300 font-bold">[1] - [5]</span>
                <div className="text-slate-400 mt-0.5">Instant Sabotage fire</div>
              </div>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-r from-pink-950/40 via-purple-950/40 to-cyan-950/40 border border-cyan-800/60 text-slate-200">
            <span className="font-bold text-white">Ready to sabotaging?</span>
            <p className="text-[11px] text-slate-400 mt-1">
              Remember: <strong className="text-yellow-400">Lowest AI score wins</strong>. Fire your sabotages smartly, stack awkward shapes, and top out Laya-MLX!
            </p>
          </div>
        </div>
      ),
    },
  ];

  const current = steps[currentStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl p-6 flex flex-col gap-4 font-mono relative overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
              {current.icon}
            </div>
            <div>
              <span className="text-[10px] bg-cyan-950/60 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded-full font-bold">
                {current.badge}
              </span>
              <h3 className="text-sm font-black text-white mt-1 uppercase tracking-wide">
                {current.title}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-900 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Content */}
        <div className="py-2 min-h-[220px] z-10">
          {current.content}
        </div>

        {/* Footer Navigation & Stepper */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 z-10">
          {/* Stepper dots */}
          <div className="flex items-center gap-1.5">
            {steps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`h-1.5 rounded-full transition-all ${
                  idx === currentStep
                    ? 'w-6 bg-cyan-400'
                    : 'w-2 bg-slate-800 hover:bg-slate-700'
                }`}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleFinish}
              className="px-3 py-1.5 rounded-xl text-slate-400 hover:text-white text-xs hover:bg-slate-900 transition-colors"
            >
              Skip Tutorial
            </button>

            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep((prev) => prev - 1)}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            {currentStep < steps.length - 1 ? (
              <button
                onClick={() => setCurrentStep((prev) => prev + 1)}
                className="flex items-center gap-1 px-4 py-1.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-xs font-bold transition-all shadow-md active:scale-95"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black text-xs transition-all shadow-md active:scale-95"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>START PLAYING</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
