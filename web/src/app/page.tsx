'use client';

import React, { useState, useEffect, useRef } from 'react';
import io, { Socket } from 'socket.io-client';
import { GameState, GameOverData, UserProfile, SabotageAbility, SabotageCombo, CriticalSabotageEvent } from '../types/game';
import { Header } from '../components/Header';
import { TetrisBoard } from '../components/TetrisBoard';
import { SaboteurDeck } from '../components/SaboteurDeck';
import { AiInspector } from '../components/AiInspector';
import { NextQueue } from '../components/NextQueue';
import { LeaderboardModal } from '../components/LeaderboardModal';
import { AuthModal } from '../components/AuthModal';
import { GameOverModal } from '../components/GameOverModal';
import { TutorialModal } from '../components/TutorialModal';
import { sounds } from '../utils/audio';
import { Play, Pause, RotateCcw, AlertOctagon, Terminal, HelpCircle, Crosshair, Sparkles } from 'lucide-react';

const BACKEND_URL = 'http://localhost:3001';

export default function Home() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [gameOverData, setGameOverData] = useState<GameOverData | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [screenShake, setScreenShake] = useState(false);
  const [matchDuration, setMatchDuration] = useState<number>(180);
  const [activeCombo, setActiveCombo] = useState<SabotageCombo | null>(null);

  // User state
  const [user, setUser] = useState<UserProfile | null>(null);
  const [guestSessionId, setGuestSessionId] = useState('');

  // Modals
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  // Log feed for sabotage telemetry
  const [actionLogs, setActionLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setActionLogs((prev) => [
      `[${new Date().toLocaleTimeString()}] ${msg}`,
      ...prev.slice(0, 7),
    ]);
  };

  // 1. Initialize user & socket connection
  useEffect(() => {
    // Generate or restore guest session
    let storedGuest = localStorage.getItem('tetris_guest_id');
    if (!storedGuest) {
      storedGuest = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      localStorage.setItem('tetris_guest_id', storedGuest);
    }
    setGuestSessionId(storedGuest);

    const initialUser: UserProfile = {
      id: storedGuest,
      username: `Saboteur_${storedGuest.slice(-4).toUpperCase()}`,
      provider: 'guest',
      isGuest: true,
    };
    setUser(initialUser);

    // Socket.io connection
    const newSocket = io(BACKEND_URL, {
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      setConnected(true);
      addLog('LINK ESTABLISHED TO GAME GATEWAY');
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
      addLog('GATEWAY LINK LOST');
    });

    newSocket.on('game_state', (state: GameState) => {
      setGameState(state);
    });

    newSocket.on('sabotage_applied', (data: { abilityId: SabotageAbility; isCritical?: boolean; energyRefund?: number }) => {
      sounds.playSabotage();
      setScreenShake(true);
      setTimeout(() => setScreenShake(false), 400);
      addLog(`SABOTAGE DEPLOYED: ${data.abilityId}${data.isCritical ? ' (CRITICAL INTERCEPT!)' : ''}`);
    });

    newSocket.on('critical_sabotage', (data: CriticalSabotageEvent) => {
      sounds.playSabotage();
      setScreenShake(true);
      setTimeout(() => setScreenShake(false), 500);
      addLog(`🔥 CRITICAL HIT! AI trajectory broken, +${data.energyRefund}⚡ refunded!`);
    });

    newSocket.on('combo_triggered', (data: { combo: SabotageCombo }) => {
      sounds.playSabotage();
      setActiveCombo(data.combo);
      setTimeout(() => setActiveCombo(null), 4000);
      addLog(`✨ COMBO UNLEASHED: ${data.combo.title} (+${data.combo.bonusRefund}⚡)!`);
    });

    newSocket.on('line_cleared_penalty', (data: { linesCleared: number; energyDeducted: number }) => {
      sounds.playGlitch();
      addLog(`AI CLEARED ${data.linesCleared} ROW(S)! -${data.energyDeducted}⚡ ENERGY PENALTY`);
    });

    newSocket.on('game_over', (data: GameOverData) => {
      setIsPlaying(false);
      setGameOverData(data);
      if (data.completedEarly) {
        sounds.playGameOver();
        addLog(`MISSION SUCCESS: AI TOPPED OUT (FINAL SCORE: ${data.finalScore})`);
      } else {
        addLog(`TIME LIMIT EXPIRED (FINAL SCORE: ${data.finalScore})`);
      }
    });

    setSocket(newSocket);

    // Check if new user needs tutorial
    const seen = localStorage.getItem('tetris_tutorial_seen');
    if (!seen) {
      setShowTutorial(true);
    }

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // 2. Start or Restart Game
  const handleStartGame = () => {
    if (!socket) return;
    setGameOverData(null);
    setIsPlaying(true);
    sounds.playPieceDrop();
    addLog(`INITIATING MATCH [${Math.floor(matchDuration / 60)}M] // LAYA-MLX TICK LOOP ENGAGED`);

    socket.emit('start_game', {
      playerName: user?.username || 'Guest Saboteur',
      guestSessionId,
      userId: user?.isGuest ? undefined : user?.id,
      matchDuration,
    });
  };

  // 3. Pause / Resume Toggle
  const handleTogglePause = () => {
    if (!socket || !isPlaying) return;
    sounds.playClick();
    socket.emit('toggle_pause');
    addLog(gameState?.isPaused ? 'MATCH RESUMED' : 'MATCH PAUSED');
  };

  // 4. Trigger Sabotage (supports targeted column and queue hijacking)
  const handleSabotage = (abilityId: SabotageAbility, targetColumn?: number, queueIndex?: number) => {
    if (!socket || !isPlaying || gameState?.isPaused) return;
    socket.emit('sabotage', { abilityId, targetColumn, queueIndex });
  };

  // 5. Hotkeys: Space/P to Pause, 1-5 for instant sabotages
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture keys if typing in an input
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;

      if (!isPlaying) return;

      if (e.code === 'Space' || e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        handleTogglePause();
        return;
      }

      if (gameState?.isPaused) return;

      if (e.key === '1') handleSabotage('CORRUPT');
      else if (e.key === '2') handleSabotage('GLITCH');
      else if (e.key === '3') handleSabotage('INVERT');
      else if (e.key === '4') handleSabotage('EARTHQUAKE');
      else if (e.key === '5') handleSabotage('GRAVITY');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, socket, gameState?.isPaused]);

  return (
    <div className="min-h-screen bg-[#08090d] text-slate-100 flex flex-col scanlines selection:bg-pink-600 selection:text-white">
      {/* Top Cyber Navigation Bar */}
      <Header
        timeRemaining={gameState?.timeRemaining ?? matchDuration}
        matchDuration={matchDuration}
        onSelectDuration={setMatchDuration}
        score={gameState?.score ?? 0}
        user={user}
        isGameActive={isPlaying}
        isPaused={gameState?.isPaused ?? false}
        onTogglePause={handleTogglePause}
        onOpenTutorial={() => setShowTutorial(true)}
        onOpenLeaderboard={() => setShowLeaderboard(true)}
        onOpenAuth={() => setShowAuth(true)}
      />

      {/* Main Game Interface */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 flex flex-col justify-center items-center">
        {!isPlaying && !gameOverData && (
          <div className="w-full max-w-xl my-auto p-8 rounded-3xl bg-slate-950/80 border border-slate-800 glow-cyan text-center flex flex-col items-center gap-5 shadow-2xl backdrop-blur-xl">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center">
              <Play className="w-8 h-8 text-cyan-400 pl-1" />
            </div>

            <div>
              <h2 className="text-2xl font-black font-mono tracking-wider text-white uppercase">
                START SABOTEUR PROTOCOL
              </h2>
              <p className="text-xs font-mono text-slate-400 mt-2 max-w-md">
                The Apple Silicon local model <span className="text-cyan-400 font-bold">Laya-MLX</span> is armed and playing. Intercept trajectories during commitment windows, spike target columns, and hijack the next queue to force a low-score top-out!
              </p>
            </div>

            {/* Match Duration Preset Selector */}
            <div className="flex flex-col items-center gap-2 pt-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">MATCH LENGTH</span>
              <div className="flex items-center gap-2">
                {[
                  { label: '2M BLITZ', seconds: 120 },
                  { label: '3M STANDARD', seconds: 180 },
                  { label: '5M MARATHON', seconds: 300 },
                  { label: '∞ UNLIMITED', seconds: 0 },
                ].map((opt) => (
                  <button
                    key={opt.seconds}
                    type="button"
                    onClick={() => setMatchDuration(opt.seconds)}
                    className={`px-3 py-1.5 rounded-xl border font-mono text-xs font-bold transition-all cursor-pointer ${
                      matchDuration === opt.seconds
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md scale-105'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 w-full max-w-sm justify-center pt-2">
              <button
                onClick={handleStartGame}
                className="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-pink-600 via-purple-600 to-cyan-500 hover:opacity-90 text-white font-mono font-bold text-sm tracking-widest uppercase transition-all shadow-[0_0_25px_rgba(236,72,153,0.4)] active:scale-95 cursor-pointer"
              >
                DEPLOY MATCH
              </button>
              <button
                onClick={() => setShowTutorial(true)}
                className="flex items-center gap-1.5 py-3.5 px-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/60 text-cyan-400 font-mono text-xs font-bold transition-all cursor-pointer shadow-sm hover:text-cyan-300"
                title="How to play demo"
              >
                <HelpCircle className="w-4 h-4" />
                <span>TUTORIAL</span>
              </button>
            </div>
          </div>
        )}

        {(isPlaying || gameOverData) && (
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Saboteur Deck & Hotkeys */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              <SaboteurDeck
                energy={gameState?.energy ?? 50}
                cooldowns={gameState?.cooldowns ?? ({} as any)}
                onTriggerSabotage={(id) => handleSabotage(id)}
                disabled={!isPlaying || (gameState?.isPaused ?? false)}
                isCommitted={gameState?.isCommitted ?? false}
                heatLevel={gameState?.heatLevel ?? 1}
                activeCombo={activeCombo}
              />

              {/* Match Control Panel */}
              <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${connected ? (gameState?.isPaused ? 'bg-yellow-400 animate-pulse' : 'bg-emerald-400') : 'bg-rose-500'}`} />
                  <span className="font-mono text-xs text-slate-300 uppercase">
                    {connected ? (gameState?.isPaused ? 'MATCH PAUSED' : 'CORE CONNECTED') : 'DISCONNECTED'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleTogglePause}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
                      gameState?.isPaused
                        ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/80'
                        : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700'
                    }`}
                    title="Toggle Pause [Space]"
                  >
                    {gameState?.isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
                    <span>{gameState?.isPaused ? 'RESUME' : 'PAUSE'}</span>
                  </button>
                  <button
                    onClick={handleStartGame}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 font-mono text-xs font-bold transition-all border border-slate-700 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    RESTART
                  </button>
                </div>
              </div>

              {/* Console Event Feed */}
              <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80 font-mono text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5 text-slate-300 font-bold mb-2 pb-1 border-b border-slate-800">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                  SYSTEM LOGS
                </div>
                <div className="space-y-1 overflow-hidden">
                  {actionLogs.length === 0 ? (
                    <div className="text-slate-600">Awaiting events...</div>
                  ) : (
                    actionLogs.map((log, i) => (
                      <div key={i} className="truncate text-slate-400">
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Center Column: 60 FPS Tetris Board */}
            <div className="lg:col-span-4 flex justify-center">
              <TetrisBoard
                gameState={gameState}
                shake={screenShake}
                onTogglePause={handleTogglePause}
                onTargetColumn={(col) => handleSabotage('EARTHQUAKE', col)}
                canTargetColumn={(gameState?.energy ?? 0) >= 65}
              />
            </div>

            {/* Right Column: AI Telemetry & Upcoming Pieces */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              <NextQueue
                queue={gameState?.nextPieces ?? []}
                canHijack={(gameState?.energy ?? 0) >= 35}
                onHijackPiece={(idx) => handleSabotage('CORRUPT', undefined, idx)}
              />

              <AiInspector
                telemetry={gameState?.aiTelemetry ?? null}
                score={gameState?.score ?? 0}
                piecesPlaced={gameState?.piecesPlaced ?? 0}
                linesCleared={gameState?.linesCleared ?? 0}
              />
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <TutorialModal
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
      />

      <LeaderboardModal
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        guestSessionId={guestSessionId}
      />

      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        currentUser={user}
        guestSessionId={guestSessionId}
        onUserAuthenticated={(u) => {
          setUser(u);
          addLog(`AUTHENTICATED AS: ${u.username}`);
        }}
      />

      <GameOverModal
        data={gameOverData}
        user={user}
        onPlayAgain={handleStartGame}
        onOpenLeaderboard={() => setShowLeaderboard(true)}
        onOpenAuth={() => setShowAuth(true)}
      />
    </div>
  );
}
