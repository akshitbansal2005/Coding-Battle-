import { useState, useEffect } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { api } from '@/utils/api';
import Link from 'next/link';
import { Flame } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const getRatingTitle = (rating) => {
  if (rating >= 1800) return 'Grandmaster';
  if (rating >= 1500) return 'Master';
  if (rating >= 1200) return 'Expert';
  return 'Pupil';
};

const getRatingAccent = (rating) => {
  if (rating >= 1800) return 'text-amber-400';
  if (rating >= 1500) return 'text-violet-400';
  if (rating >= 1200) return 'text-indigo-400';
  return 'text-zinc-400';
};

const rankMedal = (rank) => {
  if (rank === 1) return { color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' };
  if (rank === 2) return { color: 'text-zinc-300',  bg: 'bg-zinc-500/10 border-zinc-500/20' };
  if (rank === 3) return { color: 'text-amber-600', bg: 'bg-amber-700/10 border-amber-700/20' };
  return { color: 'text-zinc-600', bg: 'bg-transparent border-white/5' };
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
      <div className="flex flex-col gap-8 max-w-4xl">

        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold text-white">Leaderboard</h1>
          <p className="text-sm text-zinc-500 mt-1">Top players ranked by ELO rating</p>
        </div>

        {/* Top 3 podium */}
        {!loading && leaderboard.length >= 3 && (
          <div className="grid grid-cols-3 gap-3">
            {[leaderboard[1], leaderboard[0], leaderboard[2]].map((player, i) => {
              const podiumRank = [2, 1, 3][i];
              const isFirst = podiumRank === 1;
              const medal = rankMedal(podiumRank);
              return (
                <Link
                  href={`/profile/${player.username}`}
                  key={player._id}
                  className={`flex flex-col items-center gap-3 p-5 rounded-xl border transition-all hover:bg-white/[0.03] ${
                    isFirst
                      ? 'border-amber-500/20 bg-amber-500/[0.04]'
                      : 'border-white/8 bg-[#111]'
                  }`}
                >
                  {/* Rank badge */}
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${medal.bg} ${medal.color}`}>
                    #{podiumRank}
                  </span>

                  {/* Avatar */}
                  <div className="relative">
                    <img
                      src={player.profilePicture}
                      alt={player.username}
                      className={`w-12 h-12 rounded-full object-cover border-2 ${
                        isFirst ? 'border-amber-400/40' : 'border-white/10'
                      }`}
                    />
                    {isFirst && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-sm">👑</span>
                    )}
                  </div>

                  {/* Name + rank */}
                  <div className="text-center">
                    <p className="text-sm font-medium text-white">{player.username}</p>
                    <p className={`text-xs mt-0.5 ${isFirst ? 'text-amber-400/70' : 'text-zinc-500'}`}>
                      {getRatingTitle(player.rating)}
                    </p>
                  </div>

                  {/* Rating */}
                  <p className={`text-lg font-semibold ${isFirst ? 'text-amber-400' : 'text-white'}`}>
                    {player.rating}
                  </p>
                </Link>
              );
            })}
          </div>
        )}

        {/* Full table */}
        <div className="border border-white/8 rounded-xl overflow-hidden bg-[#111]">
          {loading ? (
            <div className="py-16 text-center text-sm text-zinc-500">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5">
                    {['Rank', 'Player', 'Rating', 'Win rate', 'Wins', 'Losses', 'Streak'].map((h) => (
                      <th key={h} className="py-3 px-4 text-xs font-medium text-zinc-500 first:pl-5 last:pr-5">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {leaderboard.map((player) => {
                    const medal = rankMedal(player.rank);
                    const isMe = currentUser?.username === player.username;
                    return (
                      <tr
                        key={player._id}
                        className={`transition-colors ${
                          isMe ? 'bg-indigo-500/[0.05]' : 'hover:bg-white/[0.02]'
                        }`}
                      >
                        {/* Rank */}
                        <td className="py-3.5 pl-5">
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-md border text-xs font-semibold ${medal.bg} ${medal.color}`}>
                            {player.rank <= 3 ? ['1', '2', '3'][player.rank - 1] : player.rank}
                          </span>
                        </td>

                        {/* Player */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={player.profilePicture}
                              alt=""
                              className="w-8 h-8 rounded-full object-cover border border-white/10 shrink-0"
                            />
                            <div>
                              <Link href={`/profile/${player.username}`}
                                className="text-sm font-medium text-white hover:text-indigo-300 transition-colors">
                                {player.username}
                                {isMe && (
                                  <span className="ml-2 text-[10px] text-indigo-400 border border-indigo-500/30 bg-indigo-500/10 px-1.5 py-0.5 rounded font-medium">
                                    You
                                  </span>
                                )}
                              </Link>
                              <p className={`text-xs mt-0.5 ${getRatingAccent(player.rating)}`}>
                                {getRatingTitle(player.rating)}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Rating */}
                        <td className="py-3.5 px-4">
                          <span className={`text-sm font-semibold ${getRatingAccent(player.rating)}`}>
                            {player.rating}
                          </span>
                          <span className="text-xs text-zinc-600 ml-1">ELO</span>
                        </td>

                        {/* Win rate */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-1">
                            <span className={`text-sm font-medium ${
                              player.winRate >= 60 ? 'text-emerald-400' :
                              player.winRate >= 40 ? 'text-indigo-400' : 'text-zinc-400'
                            }`}>
                              {player.winRate}%
                            </span>
                            <div className="w-14 h-1 bg-white/5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  player.winRate >= 60 ? 'bg-emerald-500' :
                                  player.winRate >= 40 ? 'bg-indigo-500' : 'bg-zinc-600'
                                }`}
                                style={{ width: `${player.winRate}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Wins */}
                        <td className="py-3.5 px-4 text-sm text-emerald-400 font-medium">{player.wins}</td>

                        {/* Losses */}
                        <td className="py-3.5 px-4 text-sm text-red-400 font-medium">{player.losses}</td>

                        {/* Streak */}
                        <td className="py-3.5 pr-5 px-4">
                          {player.streak > 0 ? (
                            <span className="inline-flex items-center gap-1 text-sm text-amber-400 font-medium">
                              <Flame size={12} />
                              {player.streak}
                            </span>
                          ) : (
                            <span className="text-zinc-600 text-sm">—</span>
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
