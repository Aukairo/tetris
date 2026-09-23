'use client';

import React, { useEffect } from 'react';
import { GameOverData, UserProfile } from '../types/game';
import confetti from 'canvas-confetti';
import { Skull, AlertTriangle, Trophy, RotateCcw, Clock, Layers, Award } from 'lucide-react';

interface GameOverModalProps {
  data: GameOverData | null;
  user: UserProfile | null;
  onPlayAgain: () => void;
  onOpenLeaderboard: () => void;
  onOpenAuth: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  data,
  user,
  onPlayAgain,
  onOpenLeaderboard,
  onOpenAuth,
}) => {
  useEffect(() => {
    if (data?.completedEarly && typeof window !== 'undefined') {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00f0ff', '#ff007f', '#ffe600'],
      });
    }
  }, [data?.completedEarly]);

  if (!data) return null;

  const isSuccess = data.completedEarly; // Player forced AI top-out!

  // Efficiency Tier
  let grade = 'C';
  let gradeColor = 'text-slate-400 border-slate-700 bg-slate-900';
  if (data.finalScore <= 150) {
    grade = 'S+';
    gradeColor = 'text-cyan-300 border-cyan-400 bg-cyan-950/40 glow-cyan';
  } else if (data.finalScore <= 350) {
    grade = 'A';
    gradeColor = 'text-emerald-300 border-emerald-400 bg-emerald-950/40';
  } else if (data.finalScore <= 800) {
    grade = 'B';
    gradeColor = 'text-yellow-300 border-yellow-400 bg-yellow-950/40';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in font-mono">
      <div className="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl text-center glow-pink relative">
        {/* Header Icon */}
        <div className="flex justify-center mb-4">
          <div
            className={`w-16 h-16 rounded-2xl border flex items-center justify-center ${
              isSuccess
                ? 'bg-pink-600/20 border-pink-500 text-pink-400 shadow-[0_0_20px_rgba(236,72,153,0.5)]'
                : 'bg-rose-950/40 border-rose-500 text-rose-400'
            }`}
          >
            {isSuccess ? <Skull className="w-8 h-8" /> : <AlertTriangle className="w-8 h-8" />}
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-black text-white uppercase tracking-wider mb-1">
          {isSuccess ? 'AI TOPPED OUT // SABOTAGE SUCCESS' : 'MATCH TIME EXPIRED'}
        </h2>
        <p className="text-xs text-slate-400 mb-5">
          {isSuccess
            ? 'The Laya-MLX model was unable to recover from your sabotages!'
            : 'Match timer elapsed before top-out. Anti-stall +5,000 penalty applied.'}
        </p>

        {/* Grade & Final AI Score */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase tracking-widest">
              FINAL AI SCORE
            </div>
            <div className="text-2xl font-black text-amber-400 mt-1">
              {data.finalScore} <span className="text-xs text-slate-500 font-normal">PTS</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Lower score = Better rank</div>
          </div>

          <div className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center ${gradeColor}`}>
            <div className="text-[10px] uppercase tracking-widest text-slate-300">
              SABOTEUR RATING
            </div>
            <div className="text-2xl font-black mt-1">{grade} GRADE</div>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-3 gap-2 bg-slate-900/50 p-3 rounded-2xl border border-slate-850 mb-6 text-xs text-slate-300">
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3 text-cyan-400" /> Time
            </span>
            <span className="font-bold text-white mt-1">{data.durationSeconds}s</span>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[10px] text-slate-500 flex items-center gap-1">
              <Layers className="w-3 h-3 text-purple-400" /> Pieces
            </span>
            <span className="font-bold text-white mt-1">{data.piecesPlaced}</span>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[10px] text-slate-500 flex items-center gap-1">
              <Award className="w-3 h-3 text-yellow-400" /> Est. Rank
            </span>
            <span className="font-bold text-yellow-400 mt-1">#{data.rank}</span>
          </div>
        </div>

        {/* Guest Claim Prompt */}
        {user?.isGuest && (
          <div className="mb-5 p-3 rounded-xl bg-purple-950/30 border border-purple-800/60 text-left flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-purple-300">Playing as Guest</div>
              <div className="text-[10px] text-slate-400">Save score to the permanent leaderboard</div>
            </div>
            <button
              onClick={onOpenAuth}
              className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold"
            >
              Sign In
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={onPlayAgain}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold text-xs tracking-wider transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>PLAY AGAIN</span>
          </button>

          <button
            onClick={onOpenLeaderboard}
            className="py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-700 text-slate-200 font-bold text-xs tracking-wider transition-all flex items-center justify-center gap-2"
          >
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span>LEADERBOARD</span>
          </button>
        </div>
      </div>
    </div>
  );
};
