import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { api } from '@/utils/api';
import { useAuth } from '@/hooks/useAuth';
import { Clock, ExternalLink, Shield, Swords } from 'lucide-react';

const getRatingTitle = (rating) => {
  if (rating >= 1800) return 'Grandmaster';
  if (rating >= 1500) return 'Master';
  if (rating >= 1200) return 'Expert';
  return 'Pupil';
};

const getRatingAccent = (rating) => {
  if (rating >= 1800) return { text: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500/10' };
  if (rating >= 1500) return { text: 'text-violet-400', border: 'border-violet-500/30', bg: 'bg-violet-500/10' };
  if (rating >= 1200) return { text: 'text-indigo-400', border: 'border-indigo-500/30', bg: 'bg-indigo-500/10' };
  return { text: 'text-zinc-400', border: 'border-zinc-700/50', bg: 'bg-zinc-800/30' };
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
          <span className="text-sm text-zinc-500">Loading...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (!profile) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-32 gap-3">
          <Shield size={32} className="text-zinc-700" />
          <p className="text-sm text-zinc-500">Profile not found</p>
        </div>
      </DashboardLayout>
    );
  }

  const { user, winRate, matches } = profile;
  const totalGames = user.wins + user.losses;
  const isOwnProfile = currentUser?.username === user.username;
  const accent = getRatingAccent(user.rating);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8 max-w-4xl">

        {/* ── Hero card ── */}
        <div className="border border-white/8 rounded-xl p-6 bg-[#111]">
          <div className="flex flex-col sm:flex-row items-start gap-5">

            {/* Avatar */}
            <div className="relative shrink-0">
              <img
                src={user.profilePicture}
                alt={user.username}
                className="w-20 h-20 rounded-xl object-cover border border-white/10"
              />
              {isOwnProfile && (
                <span className="absolute -bottom-2 -right-2 text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-md font-medium">
                  You
                </span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-semibold text-white capitalize">{user.username}</h1>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-md border ${accent.text} ${accent.border} ${accent.bg}`}>
                  {getRatingTitle(user.rating)}
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                Member since {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>

              {/* Platform links */}
              <div className="flex flex-wrap gap-2 mt-3">
                {user.codeforcesUsername && (
                  <a
                    href={`https://codeforces.com/profile/${user.codeforcesUsername}`}
                    target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 border border-white/8 bg-white/[0.03] hover:bg-white/[0.06] text-zinc-300 text-xs px-2.5 py-1 rounded-md transition-colors"
                  >
                    Codeforces: {user.codeforcesUsername}
                    <ExternalLink size={10} className="text-zinc-500" />
                  </a>
                )}
                {user.leetcodeUsername && (
                  <a
                    href={`https://leetcode.com/${user.leetcodeUsername}`}
                    target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 border border-white/8 bg-white/[0.03] hover:bg-white/[0.06] text-zinc-300 text-xs px-2.5 py-1 rounded-md transition-colors"
                  >
                    LeetCode: {user.leetcodeUsername}
                    <ExternalLink size={10} className="text-zinc-500" />
                  </a>
                )}
              </div>
            </div>

            {/* ELO + Win Rate */}
            <div className="flex gap-3 shrink-0">
              <div className={`border ${accent.border} ${accent.bg} rounded-xl px-5 py-4 text-center`}>
                <p className="text-[11px] text-zinc-500 mb-1">ELO Rating</p>
                <p className={`text-2xl font-bold ${accent.text}`}>{user.rating}</p>
                <p className="text-[10px] text-zinc-600 mt-0.5">points</p>
              </div>
              <div className="border border-white/8 bg-white/[0.02] rounded-xl px-5 py-4 text-center">
                <p className="text-[11px] text-zinc-500 mb-1">Win Rate</p>
                <p className={`text-2xl font-bold ${winRate >= 60 ? 'text-emerald-400' : winRate >= 40 ? 'text-indigo-400' : 'text-zinc-400'}`}>
                  {winRate}%
                </p>
                <p className="text-[10px] text-zinc-600 mt-0.5">{totalGames} games</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Stats + History grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: stats */}
          <div className="flex flex-col gap-4">

            {/* Performance */}
            <div className="border border-white/8 rounded-xl p-5 bg-[#111]">
              <p className="text-xs font-medium text-zinc-500 mb-4">Performance</p>
              <div className="flex flex-col gap-px">
                {[
                  { label: 'Total matches', value: totalGames,   color: 'text-white' },
                  { label: 'Wins',          value: user.wins,    color: 'text-emerald-400' },
                  { label: 'Losses',        value: user.losses,  color: 'text-red-400' },
                  { label: 'Streak',        value: user.streak > 0 ? `${user.streak} 🔥` : 0, color: user.streak > 0 ? 'text-amber-400' : 'text-zinc-500' },
                ].map((s) => (
                  <div key={s.label} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                    <span className="text-sm text-zinc-400">{s.label}</span>
                    <span className={`text-sm font-semibold ${s.color}`}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* W/L bar */}
            {totalGames > 0 && (
              <div className="border border-white/8 rounded-xl p-5 bg-[#111]">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium text-zinc-500">Win / Loss</p>
                  <p className="text-xs text-zinc-500">{user.wins}W · {user.losses}L</p>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${winRate}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-emerald-400 font-medium">{winRate}%</span>
                  <span className="text-xs text-red-400 font-medium">{100 - winRate}%</span>
                </div>
              </div>
            )}
          </div>

          {/* Right: match history */}
          <div className="lg:col-span-2">
            <div className="border border-white/8 rounded-xl bg-[#111] overflow-hidden">
              <div className="px-5 py-4 border-b border-white/5">
                <p className="text-xs font-medium text-zinc-500">Match history</p>
              </div>

              {matches.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Swords size={28} className="text-zinc-700" />
                  <p className="text-sm text-zinc-600">No matches yet</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {matches.map((m) => {
                    const p1Name = m.player1?.username || 'Player1';
                    const p2Name = m.player2?.username || 'Player2';
                    const opponentName = p1Name !== user.username ? p1Name : p2Name;
                    const opponentAvatar = p1Name !== user.username ? m.player1?.profilePicture : m.player2?.profilePicture;
                    const hasWon = m.winner && m.winner.username === user.username;
                    const isDraw = !m.winner;

                    return (
                      <div key={m._id} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors">
                        {/* Result badge + opponent */}
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-semibold w-10 text-center py-1 rounded-md border ${
                            isDraw
                              ? 'text-zinc-400 border-zinc-700/40 bg-zinc-800/20'
                              : hasWon
                              ? 'text-emerald-400 border-emerald-500/25 bg-emerald-500/10'
                              : 'text-red-400 border-red-500/25 bg-red-500/10'
                          }`}>
                            {isDraw ? 'Draw' : hasWon ? 'Win' : 'Loss'}
                          </span>

                          {opponentAvatar && (
                            <img src={opponentAvatar} alt="" className="w-7 h-7 rounded-full border border-white/10 object-cover" />
                          )}

                          <div>
                            <p className="text-sm font-medium text-white">vs {opponentName}</p>
                            {m.problem?.title && (
                              <p className="text-xs text-zinc-500 mt-0.5">
                                {m.problem.title}
                                {m.problem.difficulty && (
                                  <span className={`ml-1.5 text-[11px] ${
                                    m.problem.difficulty === 'Easy' ? 'text-emerald-500' :
                                    m.problem.difficulty === 'Medium' ? 'text-amber-500' : 'text-red-500'
                                  }`}>
                                    {m.problem.difficulty}
                                  </span>
                                )}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Duration */}
                        <div className="flex items-center gap-1.5 text-xs text-zinc-500 shrink-0">
                          <Clock size={11} />
                          {Math.floor(m.duration / 60)}m {m.duration % 60}s
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
