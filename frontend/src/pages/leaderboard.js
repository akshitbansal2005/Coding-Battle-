import { useState, useEffect } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { api } from '@/utils/api';
import Link from 'next/link';
import { Trophy, TrendingUp, Swords, Flame, Medal } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const getRatingTitle = (rating) => {
  if (rating >= 1800) return 'Grandmaster';
  if (rating >= 1500) return 'Master';
  if (rating >= 1200) return 'Expert';
  return 'Pupil';
};

const getRankStyle = (rank) => {
  if (rank === 1) return { badge: 'bg-amber-400/20 text-amber-300 border-amber-400/30', glow: 'shadow-[0_0_12px_rgba(251,191,36,0.15)]' };
  if (rank === 2) return { badge: 'bg-slate-300/20 text-slate-200 border-slate-400/30', glow: 'shadow-[0_0_8px_rgba(203,213,225,0.1)]' };
  if (rank === 3) return { badge: 'bg-orange-600/20 text-orange-400 border-orange-600/30', glow: 'shadow-[0_0_8px_rgba(234,88,12,0.1)]' };
  return { badge: 'bg-white/5 text-zinc-400 border-white/5', glow: '' };
};

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const data = await api.get('/users/leaderboard');
        setLeaderboard(data);
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  return (
    <DashboardLayout>
      {/* Ambient glow */}
      <div className="absolute top-[5%] left-[30%] w-[400px] h-[300px] rounded-full bg-[#bf00ff]/4 blur-[100px] pointer-events-none z-0" />

      <div className="relative z-10 flex flex-col gap-8">

        {/* Header */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest font-mono">Global Rankings</span>
          <div className="flex items-center gap-4 mt-1">
            <div className="p-3 bg-[#bf00ff]/10 border border-[#bf00ff]/20 rounded-xl">
              <Trophy size={22} className="text-[#bf00ff]" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">Arena Leaderboard</h1>
              <p className="text-xs text-zinc-500 font-mono mt-0.5">Top competitive coders ranked by ELO rating</p>
            </div>
          </div>
        </div>

        {/* Top 3 podium cards */}
        {!loading && leaderboard.length >= 3 && (
          <div className="grid grid-cols-3 gap-4">
            {[leaderboard[1], leaderboard[0], leaderboard[2]].map((player, i) => {
              const podiumRank = [2, 1, 3][i];
              const isCenter = podiumRank === 1;
              return (
                <Link
                  href={`/profile/${player.username}`}
                  key={player._id}
                  className={`flex flex-col items-center gap-3 p-6 rounded-2xl border transition-all duration-200 hover:scale-[1.02] ${
                    isCenter
                      ? 'bg-gradient-to-b from-amber-400/10 to-transparent border-amber-400/20 shadow-[0_0_30px_rgba(251,191,36,0.08)]'
                      : 'bg-gradient-to-br from-white/5 to-white/[0.01] border-white/5'
                  }`}
                >
                  <span className={`text-xs font-black font-mono px-2.5 py-1 rounded-lg border ${getRankStyle(podiumRank).badge}`}>
                    #{podiumRank}
                  </span>
                  <div className="relative">
                    <img
                      src={player.profilePicture}
                      alt={player.username}
                      className={`w-14 h-14 rounded-full object-cover border-2 ${
                        isCenter ? 'border-amber-400/50' : 'border-white/10'
                      }`}
                    />
                    {podiumRank === 1 && (
                      <span className="absolute -top-2 -right-2 text-base">👑</span>
                    )}
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-white text-sm">{player.username}</div>
                    <div className={`text-[10px] font-mono font-bold uppercase mt-0.5 ${
                      isCenter ? 'text-amber-300' : 'text-zinc-500'
                    }`}>{getRatingTitle(player.rating)}</div>
                  </div>
                  <div className={`text-xl font-black font-mono ${isCenter ? 'text-amber-300' : 'text-white'}`}>
                    {player.rating}
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Full table */}
        <div className="bg-gradient-to-br from-white/5 to-white/[0.01] border border-white/5 rounded-2xl overflow-hidden shadow-xl backdrop-blur-md">
          {/* Top sheen line */}
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          {loading ? (
            <div className="text-center py-16 text-xs text-[#0088ff] font-mono animate-pulse tracking-widest uppercase">
              Fetching global standings...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5">
                    {['Rank', 'Duelist', 'Rating', 'Win Rate', 'Wins', 'Losses', 'Streak'].map((h) => (
                      <th key={h} className="py-4 px-5 text-[10px] font-bold uppercase tracking-widest text-zinc-500 font-mono text-center first:text-left">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((player) => {
                    const rankStyle = getRankStyle(player.rank);
                    const isMe = currentUser?.username === player.username;
                    return (
                      <tr
                        key={player._id}
                        className={`border-b border-white/[0.03] last:border-0 transition-colors duration-150 ${
                          isMe
                            ? 'bg-[#10b981]/5 hover:bg-[#10b981]/8'
                            : 'hover:bg-white/[0.02]'
                        }`}
                      >
                        {/* Rank */}
                        <td className="py-4 px-5">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border text-xs font-black font-mono ${rankStyle.badge} ${rankStyle.glow}`}>
                            {player.rank <= 3
                              ? ['🥇','🥈','🥉'][player.rank - 1]
                              : `#${player.rank}`}
                          </span>
                        </td>

                        {/* Duelist */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <img
                              src={player.profilePicture}
                              alt=""
                              className="w-9 h-9 rounded-full object-cover border border-white/10"
                            />
                            <div>
                              <Link
                                href={`/profile/${player.username}`}
                                className="font-bold text-white hover:text-[#10b981] transition-colors text-sm"
                              >
                                {player.username}
                                {isMe && (
                                  <span className="ml-2 text-[9px] text-[#10b981] font-mono border border-[#10b981]/30 bg-[#10b981]/10 px-1.5 py-0.5 rounded-sm uppercase">YOU</span>
                                )}
                              </Link>
                              <div className="text-[10px] text-zinc-500 font-mono uppercase mt-0.5">
                                {getRatingTitle(player.rating)}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Rating */}
                        <td className="py-4 px-5 text-center">
                          <span className="font-black text-sm font-mono text-white">{player.rating}</span>
                          <span className="text-zinc-600 text-[10px] font-mono ml-1">ELO</span>
                        </td>

                        {/* Win Rate */}
                        <td className="py-4 px-5 text-center">
                          <div className="inline-flex flex-col items-center gap-1">
                            <span className={`font-bold text-sm font-mono ${player.winRate >= 60 ? 'text-[#10b981]' : player.winRate >= 40 ? 'text-[#0088ff]' : 'text-zinc-400'}`}>
                              {player.winRate}%
                            </span>
                            <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${player.winRate >= 60 ? 'bg-[#10b981]' : player.winRate >= 40 ? 'bg-[#0088ff]' : 'bg-zinc-600'}`}
                                style={{ width: `${player.winRate}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Wins */}
                        <td className="py-4 px-5 text-center font-mono text-sm text-[#10b981] font-bold">{player.wins}</td>

                        {/* Losses */}
                        <td className="py-4 px-5 text-center font-mono text-sm text-red-400 font-bold">{player.losses}</td>

                        {/* Streak */}
                        <td className="py-4 px-5 text-center">
                          {player.streak > 0 ? (
                            <span className="inline-flex items-center gap-1 font-bold font-mono text-orange-400 text-sm">
                              <Flame size={13} className="animate-pulse" />
                              {player.streak}
                            </span>
                          ) : (
                            <span className="text-zinc-600 font-mono text-sm">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
