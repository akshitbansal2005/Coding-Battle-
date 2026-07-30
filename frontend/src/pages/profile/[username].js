import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { api } from '@/utils/api';
import { useAuth } from '@/hooks/useAuth';
import { Clock, Flame, TrendingUp, Swords, Shield, ExternalLink, Target } from 'lucide-react';

const getRatingTitle = (rating) => {
  if (rating >= 1800) return 'Grandmaster';
  if (rating >= 1500) return 'Master';
  if (rating >= 1200) return 'Expert';
  return 'Pupil';
};

const getRatingColor = (rating) => {
  if (rating >= 1800) return 'text-amber-400';
  if (rating >= 1500) return 'text-[#bf00ff]';
  if (rating >= 1200) return 'text-[#0088ff]';
  return 'text-zinc-400';
};

export default function Profile() {
  const router = useRouter();
  const { username } = router.query;
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!username) return;
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await api.get(`/users/profile/${username}`);
        setProfile(data);
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [username]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-32">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 rounded-full border-2 border-[#0088ff]/30 border-t-[#0088ff] animate-spin" />
            <span className="text-xs text-zinc-500 font-mono uppercase tracking-widest animate-pulse">Loading profile...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!profile) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Shield size={40} className="text-zinc-700" />
          <div className="text-sm text-zinc-500 font-mono uppercase tracking-widest">Profile not found</div>
        </div>
      </DashboardLayout>
    );
  }

  const { user, winRate, matches } = profile;
  const totalGames = user.wins + user.losses;
  const isOwnProfile = currentUser?.username === user.username;

  return (
    <DashboardLayout>
      {/* Ambient glows */}
      <div className="absolute top-0 left-[20%] w-[350px] h-[350px] rounded-full bg-[#0088ff]/4 blur-[100px] pointer-events-none z-0" />
      <div className="absolute bottom-0 right-[10%] w-[300px] h-[300px] rounded-full bg-[#bf00ff]/4 blur-[100px] pointer-events-none z-0" />

      <div className="relative z-10 flex flex-col gap-8">

        {/* ── Hero Profile Card ── */}
        <div className="bg-gradient-to-br from-white/5 to-white/[0.01] border border-white/5 rounded-2xl p-8 shadow-xl backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8">
            {/* Left: avatar + name */}
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative">
                <img
                  src={user.profilePicture}
                  alt={user.username}
                  className="w-24 h-24 rounded-2xl object-cover border border-white/10 shadow-xl"
                />
                {isOwnProfile && (
                  <span className="absolute -bottom-2 -right-2 text-[9px] bg-[#10b981]/20 border border-[#10b981]/30 text-[#10b981] font-mono font-bold px-2 py-0.5 rounded-md uppercase">You</span>
                )}
              </div>
              <div className="text-center md:text-left">
                <div className="flex items-center gap-3 justify-center md:justify-start">
                  <h1 className="text-3xl font-black text-white tracking-tight capitalize">{user.username}</h1>
                  <span className={`text-xs font-bold font-mono uppercase px-2.5 py-1 rounded-lg border ${
                    user.rating >= 1800 ? 'text-amber-300 border-amber-400/30 bg-amber-400/10' :
                    user.rating >= 1500 ? 'text-[#bf00ff] border-[#bf00ff]/30 bg-[#bf00ff]/10' :
                    user.rating >= 1200 ? 'text-[#0088ff] border-[#0088ff]/30 bg-[#0088ff]/10' :
                    'text-zinc-400 border-zinc-700 bg-zinc-800/50'
                  }`}>
                    {getRatingTitle(user.rating)}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 font-mono mt-1.5 uppercase tracking-wider">
                  Member since {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>

                {/* Platform badges */}
                <div className="flex flex-wrap gap-2 mt-3 justify-center md:justify-start">
                  {user.codeforcesUsername && (
                    <a
                      href={`https://codeforces.com/profile/${user.codeforcesUsername}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 bg-red-900/20 border border-red-900/30 text-red-400 text-[10px] px-3 py-1.5 rounded-xl font-mono font-bold uppercase hover:bg-red-900/30 transition-colors"
                    >
                      CF: {user.codeforcesUsername}
                      <ExternalLink size={9} />
                    </a>
                  )}
                  {user.leetcodeUsername && (
                    <a
                      href={`https://leetcode.com/${user.leetcodeUsername}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 bg-orange-900/20 border border-orange-900/30 text-orange-400 text-[10px] px-3 py-1.5 rounded-xl font-mono font-bold uppercase hover:bg-orange-900/30 transition-colors"
                    >
                      LC: {user.leetcodeUsername}
                      <ExternalLink size={9} />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Right: ELO + Win Rate stat boxes */}
            <div className="flex gap-4 shrink-0">
              <div className="bg-white/[0.03] border border-white/5 rounded-2xl px-8 py-5 text-center">
                <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider mb-1">ELO Rating</div>
                <div className={`text-3xl font-black font-mono ${getRatingColor(user.rating)}`}>{user.rating}</div>
                <div className="text-[10px] text-zinc-600 font-mono mt-1">points</div>
              </div>
              <div className="bg-white/[0.03] border border-white/5 rounded-2xl px-8 py-5 text-center">
                <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider mb-1">Win Rate</div>
                <div className={`text-3xl font-black font-mono ${winRate >= 60 ? 'text-[#10b981]' : winRate >= 40 ? 'text-[#0088ff]' : 'text-zinc-400'}`}>
                  {winRate}%
                </div>
                <div className="text-[10px] text-zinc-600 font-mono mt-1">{totalGames} games</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Main content grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left: Stats column */}
          <div className="flex flex-col gap-6">
            {/* Performance metrics */}
            <div className="bg-gradient-to-br from-white/5 to-white/[0.01] border border-white/5 rounded-2xl p-6 shadow-xl backdrop-blur-md relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-5 flex items-center gap-2 font-mono">
                <TrendingUp size={13} className="text-[#10b981]" /> Performance Log
              </h3>
              <div className="flex flex-col gap-3">
                {[
                  { label: 'Total Battles', value: totalGames, color: 'text-white' },
                  { label: 'Victories', value: user.wins, color: 'text-[#10b981]' },
                  { label: 'Defeats', value: user.losses, color: 'text-red-400' },
                  { label: 'Active Streak', value: user.streak > 0 ? `${user.streak} 🔥` : '0', color: user.streak > 0 ? 'text-orange-400' : 'text-zinc-500' },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                    <span className="text-xs text-zinc-400 font-mono">{stat.label}</span>
                    <span className={`text-sm font-black font-mono ${stat.color}`}>{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* W/L visual bar */}
            {totalGames > 0 && (
              <div className="bg-gradient-to-br from-white/5 to-white/[0.01] border border-white/5 rounded-2xl p-6 shadow-xl backdrop-blur-md">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-4 font-mono flex items-center gap-2">
                  <Target size={13} className="text-[#0088ff]" /> Win / Loss Ratio
                </h3>
                <div className="flex h-2.5 rounded-full overflow-hidden gap-0.5">
                  <div
                    className="bg-[#10b981] rounded-full transition-all"
                    style={{ width: `${winRate}%` }}
                  />
                  <div
                    className="bg-red-500 rounded-full transition-all flex-1"
                  />
                </div>
                <div className="flex justify-between mt-2 text-[10px] font-mono">
                  <span className="text-[#10b981] font-bold">{user.wins}W</span>
                  <span className="text-red-400 font-bold">{user.losses}L</span>
                </div>
              </div>
            )}
          </div>

          {/* Right: Battle history */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-white/5 to-white/[0.01] border border-white/5 rounded-2xl p-6 shadow-xl backdrop-blur-md relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-6 border-b border-white/5 pb-4 flex items-center gap-2 font-mono">
                <Swords size={13} className="text-[#0088ff]" /> Personal Battle History
              </h3>

              {matches.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <Swords size={32} className="text-zinc-700" />
                  <p className="text-xs text-zinc-500 font-mono uppercase tracking-widest text-center">
                    No battles recorded yet
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {matches.map((m) => {
                    const p1Name = m.player1?.username || 'Player1';
                    const p2Name = m.player2?.username || 'Player2';
                    const opponentName = p1Name !== user.username ? p1Name : p2Name;
                    const opponentAvatar = p1Name !== user.username ? m.player1?.profilePicture : m.player2?.profilePicture;
                    const hasWon = m.winner && m.winner.username === user.username;
                    const isDraw = !m.winner;

                    return (
                      <div
                        key={m._id}
                        className={`flex items-center justify-between gap-4 p-4 rounded-xl border transition-colors duration-150 ${
                          isDraw
                            ? 'bg-zinc-800/20 border-zinc-700/20'
                            : hasWon
                            ? 'bg-[#10b981]/5 border-[#10b981]/10 hover:bg-[#10b981]/8'
                            : 'bg-red-900/5 border-red-900/10 hover:bg-red-900/8'
                        }`}
                      >
                        {/* Left: result badge + opponent */}
                        <div className="flex items-center gap-4">
                          <span className={`text-xs font-black font-mono w-12 text-center py-1.5 rounded-lg border ${
                            isDraw
                              ? 'text-zinc-400 border-zinc-700/50 bg-zinc-800/30'
                              : hasWon
                              ? 'text-[#10b981] border-[#10b981]/30 bg-[#10b981]/10'
                              : 'text-red-400 border-red-900/30 bg-red-900/10'
                          }`}>
                            {isDraw ? 'DRAW' : hasWon ? 'WIN' : 'LOSS'}
                          </span>

                          <div className="flex items-center gap-3">
                            {opponentAvatar && (
                              <img src={opponentAvatar} alt="" className="w-7 h-7 rounded-full border border-white/10 object-cover" />
                            )}
                            <div>
                              <div className="text-sm font-bold text-white font-mono">vs {opponentName}</div>
                              {m.problem?.title && (
                                <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                                  {m.problem.title}
                                  <span className="ml-1.5 opacity-60">({m.problem.difficulty})</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: duration */}
                        <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 font-mono shrink-0">
                          <Clock size={11} />
                          <span>{Math.floor(m.duration / 60)}m {m.duration % 60}s</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
