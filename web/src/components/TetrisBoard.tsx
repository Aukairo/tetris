'use client';

import React, { useRef, useEffect } from 'react';
import { GameState, PieceType } from '../types/game';
import { Pause, Play } from 'lucide-react';

interface TetrisBoardProps {
  gameState: GameState | null;
  shake: boolean;
  onTogglePause?: () => void;
  onTargetColumn?: (column: number) => void;
  canTargetColumn?: boolean;
}

const PIECE_COLORS: Record<PieceType, { fill: string; stroke: string; glow: string }> = {
  I: { fill: '#00f0ff', stroke: '#80f8ff', glow: 'rgba(0, 240, 255, 0.4)' },
  O: { fill: '#ffe600', stroke: '#fff280', glow: 'rgba(255, 230, 0, 0.4)' },
  T: { fill: '#a855f7', stroke: '#d8b4fe', glow: 'rgba(168, 85, 247, 0.4)' },
  S: { fill: '#22c55e', stroke: '#86efac', glow: 'rgba(34, 197, 94, 0.4)' },
  Z: { fill: '#ef4444', stroke: '#fca5a5', glow: 'rgba(239, 68, 68, 0.4)' },
  J: { fill: '#3b82f6', stroke: '#93c5fd', glow: 'rgba(59, 130, 246, 0.4)' },
  L: { fill: '#f97316', stroke: '#fdba74', glow: 'rgba(249, 115, 22, 0.4)' },
  // Corrupted / Sabotage irregular shapes
  PLUS: { fill: '#ec4899', stroke: '#fbcfe8', glow: 'rgba(236, 72, 153, 0.6)' },
  DOT: { fill: '#14b8a6', stroke: '#99f6e4', glow: 'rgba(20, 184, 166, 0.6)' },
  PENTOMINO_U: { fill: '#e11d48', stroke: '#fda4af', glow: 'rgba(225, 29, 72, 0.6)' },
};

// Shape matrices for drawing active piece
const SHAPES: Record<string, number[][][]> = {
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

export const TetrisBoard: React.FC<TetrisBoardProps> = ({
  gameState,
  shake,
  onTogglePause,
  onTargetColumn,
  canTargetColumn = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoveredCol, setHoveredCol] = React.useState<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const cols = 10;
    const rows = 20;
    const cellSize = width / cols;

    // Clear canvas
    ctx.fillStyle = '#080c14';
    ctx.fillRect(0, 0, width, height);

    // Subtle grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let c = 0; c <= cols; c++) {
      ctx.beginPath();
      ctx.moveTo(c * cellSize, 0);
      ctx.lineTo(c * cellSize, height);
      ctx.stroke();
    }
    for (let r = 0; r <= rows; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * cellSize);
      ctx.lineTo(width, r * cellSize);
      ctx.stroke();
    }

    if (!gameState) {
      // Idle screen text
      ctx.fillStyle = 'rgba(0, 240, 255, 0.6)';
      ctx.font = 'bold 15px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('AWAITING LAYA-MLX LINK...', width / 2, height / 2);
      return;
    }

    const { board, currentPiece, ghostY, isGlitched } = gameState;

    // Helper to draw beveled cyber block
    const drawBlock = (x: number, y: number, color: { fill: string; stroke: string; glow: string }, isGhost: boolean = false) => {
      const px = x * cellSize;
      const py = y * cellSize;
      const pad = 1.5;

      if (isGhost) {
        ctx.strokeStyle = color.fill;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 2]);
        ctx.strokeRect(px + pad, py + pad, cellSize - pad * 2, cellSize - pad * 2);
        ctx.setLineDash([]);
        return;
      }

      ctx.save();
      ctx.fillStyle = color.fill;
      ctx.shadowColor = color.glow;
      ctx.shadowBlur = 8;
      ctx.fillRect(px + pad, py + pad, cellSize - pad * 2, cellSize - pad * 2);
      ctx.restore();

      ctx.strokeStyle = color.stroke;
      ctx.lineWidth = 1;
      ctx.strokeRect(px + pad, py + pad, cellSize - pad * 2, cellSize - pad * 2);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.fillRect(px + pad + 1, py + pad + 1, (cellSize - pad * 2) * 0.4, 2);
    };

    // 1. Draw Settled Blocks
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (board[r][c] === 1) {
          // Color based on height or metallic cyan
          const blockColor = isGlitched
            ? { fill: '#ff007f', stroke: '#ff80bf', glow: 'rgba(255,0,127,0.5)' }
            : { fill: '#334155', stroke: '#64748b', glow: 'rgba(100,116,139,0.3)' };
          drawBlock(c, r, blockColor);
        }
      }
    }

    // 2. Draw Active Piece & Ghost Projection
    if (currentPiece) {
      const shapeRotations = SHAPES[currentPiece.type] || SHAPES.T;
      const matrix = shapeRotations[currentPiece.rotation % shapeRotations.length];
      const color = PIECE_COLORS[currentPiece.type] || PIECE_COLORS.T;

      // Draw Ghost Piece
      if (ghostY !== undefined && ghostY >= currentPiece.y) {
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 4; c++) {
            if (matrix[r][c] === 1) {
              const gx = currentPiece.x + c;
              const gy = ghostY + r;
              if (gy >= 0 && gy < rows && gx >= 0 && gx < cols) {
                drawBlock(gx, gy, color, true);
              }
            }
          }
        }
      }

      // Draw Active Falling Piece
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          if (matrix[r][c] === 1) {
            const gx = currentPiece.x + c;
            const gy = currentPiece.y + r;
            if (gy >= 0 && gy < rows && gx >= 0 && gx < cols) {
              drawBlock(gx, gy, color, false);
            }
          }
        }
      }
    }

    // 3. Interactive Column Targeting Beam
    if (hoveredCol !== null && onTargetColumn && canTargetColumn) {
      const c1 = hoveredCol;
      const c2 = (hoveredCol + 1) % 10;
      ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
      ctx.fillRect(c1 * cellSize, 0, cellSize, height);
      ctx.fillRect(c2 * cellSize, 0, cellSize, height);

      ctx.strokeStyle = 'rgba(16, 185, 129, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(c1 * cellSize, 0, cellSize, height);
      ctx.strokeRect(c2 * cellSize, 0, cellSize, height);
      ctx.setLineDash([]);

      // Floating reticle badge at top
      ctx.fillStyle = 'rgba(6, 78, 59, 0.9)';
      ctx.fillRect(c1 * cellSize, 10, cellSize * 2, 22);
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 1;
      ctx.strokeRect(c1 * cellSize, 10, cellSize * 2, 22);

      ctx.fillStyle = '#6ee7b7';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`⚡ SPIKE [${c1 + 1}]`, (c1 + 1) * cellSize, 24);
    }

    // 4. Glitch Overlay Effect if sensor glitch active
    if (isGlitched) {
      ctx.fillStyle = 'rgba(255, 0, 127, 0.08)';
      ctx.fillRect(0, 0, width, height);

      // Random noise lines
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      for (let i = 0; i < 6; i++) {
        const lineY = Math.random() * height;
        ctx.fillRect(0, lineY, width, Math.random() * 3 + 1);
      }
    }
  }, [gameState, hoveredCol, onTargetColumn, canTargetColumn]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !onTargetColumn || !canTargetColumn) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const col = Math.floor((x / rect.width) * 10);
    if (col >= 0 && col < 10) {
      setHoveredCol(col);
    }
  };

  const handleMouseLeave = () => {
    setHoveredCol(null);
  };

  const handleClick = () => {
    if (hoveredCol !== null && onTargetColumn && canTargetColumn) {
      onTargetColumn(hoveredCol);
    }
  };

  return (
    <div className={`relative p-2 rounded-2xl bg-slate-950/80 border border-cyan-500/30 glow-cyan transition-transform ${shake ? 'animate-glitch' : ''}`}>
      <div className="absolute top-3 left-4 flex items-center gap-2 pointer-events-none">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
        <span className="text-[11px] font-mono tracking-widest text-cyan-400 uppercase font-semibold">
          AI_PLAYFIELD [10x20]
        </span>
      </div>

      <canvas
        ref={canvasRef}
        width={300}
        height={600}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        className={`rounded-xl shadow-2xl block bg-slate-950 ${
          onTargetColumn && canTargetColumn ? 'cursor-crosshair' : 'cursor-default'
        }`}
      />

      {gameState?.isGlitched && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="bg-pink-600/90 text-white font-mono text-xs px-3 py-1 rounded-full uppercase tracking-widest font-black animate-pulse shadow-lg">
            SENSOR GLITCH ACTIVE
          </span>
        </div>
      )}
      {gameState?.isInverted && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 pointer-events-none">
          <span className="bg-yellow-500/90 text-black font-mono text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider font-bold animate-bounce shadow-md">
            CONTROLS REVERSED
          </span>
        </div>
      )}
      {gameState?.isGravitySurged && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none">
          <span className="bg-purple-600/90 text-white font-mono text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider font-bold animate-pulse shadow-md">
            GRAVITY SURGE (3X SPEED)
          </span>
        </div>
      )}

      {/* MATCH PAUSED OVERLAY */}
      {gameState?.isPaused && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center z-30 gap-4 border border-yellow-500/40 p-6 text-center animate-in fade-in duration-150">
          <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 border border-yellow-400/60 flex items-center justify-center text-yellow-400 shadow-[0_0_25px_rgba(234,179,8,0.25)]">
            <Pause className="w-7 h-7 animate-pulse" />
          </div>
          <div className="space-y-1 font-mono">
            <div className="text-lg font-black text-yellow-400 tracking-wider">MATCH PAUSED</div>
            <p className="text-xs text-slate-400 max-w-[220px]">
              AI inference loop and gravity clock are suspended.
            </p>
          </div>
          {onTogglePause && (
            <button
              onClick={onTogglePause}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-slate-950 font-mono font-black text-xs uppercase tracking-wider transition-all shadow-lg active:scale-95 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>RESUME MATCH</span>
            </button>
          )}
          <div className="text-[10px] text-slate-500 font-mono">
            Press <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300 font-bold">[Space]</kbd> or <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300 font-bold">[P]</kbd>
          </div>
        </div>
      )}
    </div>
  );
};
