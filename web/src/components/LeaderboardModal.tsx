'use client';

import React, { useState, useEffect } from 'react';
import { LeaderboardEntry } from '../types/game';
import { Trophy, X, Shield, Clock, RefreshCw, Flame, Award, Skull } from 'lucide-react';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  guestSessionId: string;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  guestSessionId,
}) => {
  const [tab, setTab] = useState<'all' | 'permanent' | 'guest'>('all');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3001/api/leaderboard?limit=25&mode=${tab}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data);
      }
    } catch (e) {
      console.error('Failed to load leaderboard', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLeaderboard();
    }
  }, [isOpen, tab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[85vh] glow-cyan">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <h2 className="font-mono text-lg font-black text-white tracking-wide uppercase">
                HALL OF SABOTEURS
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                RANKED BY LOWEST AI SCORE (FEWEST POINTS = BEST SABOTAGE)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center justify-between py-4">
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setTab('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                tab === 'all'
                  ? 'bg-cyan-500 text-black font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ALL MATCHES
            </button>
            <button
              onClick={() => setTab('permanent')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                tab === 'permanent'
                  ? 'bg-purple-500 text-white font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              PERMANENT ACCOUNTS
            </button>
            <button
              onClick={() => setTab('guest')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                tab === 'guest'
                  ? 'bg-amber-500 text-black font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              GUEST TRIALS
            </button>
          </div>

          <button
            onClick={fetchLeaderboard}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs font-mono text-slate-300 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>REFRESH</span>
          </button>
        </div>

        {/* Table Body */}
        <div className="overflow-y-auto flex-1 pr-1 space-y-2">
          {entries.length === 0 ? (
            <div className="text-center py-16 text-slate-500 font-mono text-sm">
              {loading ? 'CALCULATING SABOTAGE METRICS...' : 'NO MATCHES RECORDED YET. BE THE FIRST TO SABOTAGE!'}
            </div>
          ) : (
            entries.map((entry) => {
              const isTopThree = entry.rank <= 3;
              const rankColor =
                entry.rank === 1
                  ? 'text-yellow-400 border-yellow-500/50 bg-yellow-500/10'
                  : entry.rank === 2
                  ? 'text-slate-300 border-slate-400/50 bg-slate-400/10'
                  : entry.rank === 3
                  ? 'text-amber-500 border-amber-600/50 bg-amber-600/10'
                  : 'text-slate-500 border-slate-800 bg-slate-900/60';

              return (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/40 border border-slate-850 hover:border-slate-750 transition-all font-mono"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-lg border flex items-center justify-center text-xs font-black ${rankColor}`}
                    >
                      {entry.rank}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white tracking-wide">
                          {entry.playerName}
                        </span>
                        {entry.provider === 'google' && (
                          <span className="text-[10px] bg-red-950/70 text-red-300 border border-red-800 px-1.5 rounded">
                            Google
                          </span>
                        )}
                        {entry.provider === 'github' && (
                          <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-1.5 rounded">
                            GitHub
                          </span>
                        )}
                        {entry.provider === 'guest' && (
                          <span className="text-[10px] bg-slate-900 text-slate-500 px-1.5 rounded">
                            Guest
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-3 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-cyan-400" />
                          {entry.durationSeconds}s
                        </span>
                        <span>{entry.piecesPlaced} pieces</span>
                        {entry.completedEarly ? (
                          <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
                            <Skull className="w-3 h-3" /> Top-Out
                          </span>
                        ) : (
                          <span className="text-rose-400 font-semibold">Time Penalty</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-slate-500 uppercase">AI Score</div>
                    <div className="text-base font-black text-amber-400">
                      {entry.aiScore} <span className="text-xs text-slate-500">PTS</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
