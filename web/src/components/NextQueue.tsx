'use client';

import React from 'react';
import { PieceType } from '../types/game';
import { Skull } from 'lucide-react';

interface NextQueueProps {
  queue: PieceType[];
  onHijackPiece?: (index: number) => void;
  canHijack?: boolean;
}

const PREVIEWS: Record<PieceType, number[][]> = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
  ],
  O: [
    [1, 1],
    [1, 1],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
  ],
  PLUS: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 1, 0],
  ],
  DOT: [[1]],
  PENTOMINO_U: [
    [1, 0, 1],
    [1, 1, 1],
  ],
};

const PIECE_COLORS: Record<PieceType, string> = {
  I: 'bg-cyan-400 border-cyan-300 shadow-[0_0_8px_rgba(0,240,255,0.6)]',
  O: 'bg-yellow-400 border-yellow-300 shadow-[0_0_8px_rgba(255,230,0,0.6)]',
  T: 'bg-purple-500 border-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.6)]',
  S: 'bg-emerald-500 border-emerald-400 shadow-[0_0_8px_rgba(34,197,94,0.6)]',
  Z: 'bg-rose-500 border-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.6)]',
  J: 'bg-blue-500 border-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.6)]',
  L: 'bg-orange-500 border-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.6)]',
  PLUS: 'bg-pink-500 border-pink-400 shadow-[0_0_8px_rgba(236,72,153,0.6)]',
  DOT: 'bg-teal-400 border-teal-300 shadow-[0_0_8px_rgba(20,184,166,0.6)]',
  PENTOMINO_U: 'bg-rose-600 border-rose-400 shadow-[0_0_8px_rgba(225,29,72,0.6)]',
};

export const NextQueue: React.FC<NextQueueProps> = ({
  queue,
  onHijackPiece,
  canHijack = false,
}) => {
  const pieces = queue.slice(0, 3);

  return (
    <div className="flex flex-col gap-2 w-full bg-slate-900/60 p-3 rounded-2xl border border-slate-800 backdrop-blur-md">
      <div className="flex items-center justify-between text-[11px] font-mono tracking-widest text-slate-400 uppercase font-bold px-1">
        <span>NEXT PIECES</span>
        {canHijack && (
          <span className="text-[9px] text-pink-400 bg-pink-950/60 border border-pink-500/40 px-1.5 py-0.5 rounded font-mono font-semibold">
            CLICK TO HIJACK
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {pieces.map((piece, idx) => {
          const matrix = PREVIEWS[piece] || PREVIEWS.T;
          const colorClass = PIECE_COLORS[piece] || PIECE_COLORS.T;

          return (
            <button
              key={idx}
              type="button"
              disabled={!canHijack}
              onClick={() => onHijackPiece && onHijackPiece(idx)}
              className={`group relative bg-slate-950/70 p-2.5 rounded-xl border transition-all flex items-center justify-center min-h-[52px] ${
                canHijack
                  ? 'border-slate-800 hover:border-pink-500 hover:bg-pink-950/25 cursor-pointer shadow-sm hover:shadow-[0_0_15px_rgba(236,72,153,0.25)]'
                  : 'border-slate-800/80 cursor-default'
              }`}
              title={canHijack ? `Click to Hijack Piece #${idx + 1} into irregular corrupt shape! (35⚡)` : undefined}
            >
              <div className="flex flex-col gap-1 items-center">
                {matrix.map((row, r) => (
                  <div key={r} className="flex gap-1">
                    {row.map((cell, c) => (
                      <div
                        key={c}
                        className={`w-3.5 h-3.5 rounded-sm ${
                          cell === 1 ? `${colorClass} border` : 'opacity-0'
                        }`}
                      />
                    ))}
                  </div>
                ))}
              </div>

              {canHijack && (
                <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-[1px] rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-1 text-pink-400 font-mono text-[10px] font-black">
                  <Skull className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
                  <span>HIJACK QUEUE [{idx + 1}]</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
