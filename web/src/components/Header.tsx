'use client';

import React from 'react';
import { UserProfile } from '../types/game';
import { Trophy, User, LogIn, Volume2, VolumeX, Timer, Radio, Pause, Play, HelpCircle } from 'lucide-react';
import { sounds } from '../utils/audio';

interface HeaderProps {
  timeRemaining: number;
  matchDuration?: number;
  onSelectDuration?: (seconds: number) => void;
  score: number;
  user: UserProfile | null;
  isGameActive?: boolean;
  isPaused?: boolean;
  onTogglePause?: () => void;
  onOpenTutorial?: () => void;
  onOpenLeaderboard: () => void;
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  timeRemaining,
  matchDuration = 180,
  onSelectDuration,
  score,
  user,
  isGameActive = false,
  isPaused = false,
  onTogglePause,
  onOpenTutorial,
  onOpenLeaderboard,
  onOpenAuth,
}) => {
  const [audioEnabled, setAudioEnabled] = React.useState(true);

  const toggleAudio = () => {
    sounds.enabled = !audioEnabled;
    setAudioEnabled(!audioEnabled);
  };

  const isUnlimited = matchDuration === 0;
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = Math.floor(timeRemaining % 60);
  const formattedTime = isUnlimited
    ? `∞ ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const isUrgent = !isUnlimited && timeRemaining <= 30 && timeRemaining > 0;

  const durationOptions = [
    { label: '2M BLITZ', seconds: 120 },
    { label: '3M STD', seconds: 180 },
    { label: '5M MARATHON', seconds: 300 },
    { label: '∞ UNLIMITED', seconds: 0 },
  ];

  return (
    <header className="w-full max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md sticky top-0 z-40">
      {/* Brand & Subtitle */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-600 via-purple-600 to-cyan-400 p-0.5 shadow-md flex items-center justify-center">
          <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
          </div>
        </div>
        <div>
          <h1 className="font-mono text-base font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-pink-400 to-yellow-400 uppercase">
            REVERSE TETRIS
          </h1>
          <p className="text-[10px] font-mono text-slate-400 tracking-widest uppercase">
            SABOTEUR PROTOCOL // LAYA-MLX
          </p>
        </div>
      </div>

      {/* Center Match Stats: Timer, Duration Selector & Score */}
      <div className="flex items-center gap-3">
        {/* Match Timer */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${
            isUrgent
              ? 'bg-rose-950/70 border-rose-500 text-rose-300 animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.4)]'
              : 'bg-slate-900/80 border-slate-800 text-slate-200'
          }`}
        >
          <Timer className={`w-4 h-4 ${isUrgent ? 'text-rose-400' : 'text-cyan-400'}`} />
          <div className="flex flex-col">
            <span className="text-[9px] font-mono uppercase text-slate-400 leading-none">
              {isUnlimited ? 'ELAPSED' : 'TIME LIMIT'}
            </span>
            <span className="font-mono text-sm font-bold tracking-widest">{formattedTime}</span>
          </div>
        </div>

        {/* Pre-Match Duration Selector */}
        {!isGameActive && onSelectDuration && (
          <div className="hidden md:flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 gap-1 text-[10px] font-mono">
            {durationOptions.map((opt) => (
              <button
                key={opt.seconds}
                onClick={() => onSelectDuration(opt.seconds)}
                className={`px-2 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  matchDuration === opt.seconds
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {/* Current AI Score (Lower is Better!) */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-slate-800 bg-slate-900/80">
          <div className="flex flex-col text-right">
            <span className="text-[9px] font-mono uppercase text-slate-400 leading-none">AI SCORE (LOWEST WINS)</span>
            <span className="font-mono text-sm font-bold text-amber-400 tracking-wider">
              {score} <span className="text-[10px] text-slate-500 font-normal">PTS</span>
            </span>
          </div>
        </div>

        {/* Pause / Resume Button (Active Match) */}
        {isGameActive && onTogglePause && (
          <button
            onClick={onTogglePause}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-mono text-xs font-bold transition-all shadow-sm cursor-pointer ${
              isPaused
                ? 'bg-yellow-500/20 border-yellow-500 text-yellow-300 animate-pulse'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
            }`}
            title="Pause / Resume match [Space] or [P]"
          >
            {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{isPaused ? 'RESUME' : 'PAUSE'}</span>
          </button>
        )}
      </div>

      {/* User Status & Action Buttons */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={toggleAudio}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 transition-colors"
          title="Toggle Audio"
        >
          {audioEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
        </button>

        {onOpenTutorial && (
          <button
            onClick={onOpenTutorial}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 text-cyan-400 text-xs font-mono font-semibold transition-all shadow-sm cursor-pointer"
            title="Open Interactive Demo & Guides"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">TUTORIAL</span>
          </button>
        )}

        <button
          onClick={onOpenLeaderboard}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/50 text-slate-200 text-xs font-mono font-semibold transition-all shadow-sm"
        >
          <Trophy className="w-4 h-4 text-yellow-400" />
          <span>HALL OF SABOTEURS</span>
        </button>

        {user ? (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500/50 text-xs font-mono text-slate-200 transition-all"
          >
            <div className="w-5 h-5 rounded-full bg-purple-600/30 border border-purple-500 flex items-center justify-center text-[10px] font-bold text-purple-300">
              {user.username.slice(0, 1).toUpperCase()}
            </div>
            <span>{user.username}</span>
            {user.isGuest && (
              <span className="text-[9px] bg-slate-800 text-slate-400 px-1 rounded uppercase">Guest</span>
            )}
          </button>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-xs font-mono font-bold tracking-wide transition-all shadow-md active:scale-95"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>LOGIN</span>
          </button>
        )}
      </div>
    </header>
  );
};
