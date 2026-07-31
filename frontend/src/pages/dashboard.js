import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { io } from 'socket.io-client';
import { useRouter } from 'next/router';
import { Search, Bell, X, ChevronRight, Clock, ArrowRight, Loader2 } from 'lucide-react';
import { api } from '@/utils/api';
import Link from 'next/link';

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();

  // Search
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef = useRef(null);

  // Notifications
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    const fetch_ = async () => {
      setNotifLoading(true);
      try { const data = await api.get('/users/me/notifications'); setNotifications(data); }
      catch { /* silent */ }
      finally { setNotifLoading(false); }
    };
    fetch_();
  }, [user]);

  const unreadCount = notifications.filter(n => n.unread).length;

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const data = await api.get('/users/leaderboard');
        setSearchResults(data.filter(p => p.username.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 6));
      } catch { setSearchResults([]); }
      finally { setSearchLoading(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Match config
  const [platform, setPlatform] = useState('All');
  const [difficulty, setDifficulty] = useState('All');
  const [topic, setTopic] = useState('All');
  const [timeLimit, setTimeLimit] = useState(30);

  const [inQueue, setInQueue] = useState(false);
  const [socket, setSocket] = useState(null);
  const [recentMatches, setRecentMatches] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [joinRoomCode, setJoinRoomCode] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const matches = await api.get('/matches/recent');
        setRecentMatches(matches);
        const players = await api.get('/users/leaderboard');
        setLeaderboard(players.slice(0, 5));
      } catch { /* silent */ }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!inQueue) return;
    const token = localStorage.getItem('token');
    const s = io('http://localhost:5000', { auth: { token } });
    s.on('connect', () => s.emit('join-matchmaking', { platform, difficulty, topic, timeLimit }));
    s.on('queue-status', () => {});
    s.on('match-found', ({ roomCode }) => { s.disconnect(); setInQueue(false); router.push(`/match/${roomCode}`); });
    s.on('error-msg', (msg) => { alert(msg); setInQueue(false); s.disconnect(); });
    setSocket(s);
    return () => s.disconnect();
  }, [inQueue]);

  const handleCancelMatchmaking = () => {
    if (socket) { socket.emit('leave-matchmaking'); socket.disconnect(); }
    setInQueue(false);
  };

  const handleCreatePrivateLobby = () => {
    const token = localStorage.getItem('token');
    const s = io('http://localhost:5000', { auth: { token } });
    s.on('connect', () => s.emit('create-private-room', { platform, difficulty, topic, timeLimit }));
    s.once('private-room-created', ({ roomCode }) => { s.disconnect(); router.push(`/match/${roomCode}`); });
    s.on('error-msg', (msg) => { alert(msg); s.disconnect(); });
  };

  const handleJoinPrivateLobby = (e) => {
    e.preventDefault();
    if (!joinRoomCode || joinRoomCode.trim().length !== 6) { alert('Enter a valid 6-character room code.'); return; }
    router.push(`/match/${joinRoomCode.toUpperCase().trim()}`);
  };

  const handleStartBotMatch = () => {
    const token = localStorage.getItem('token');
    const s = io('http://localhost:5000', { auth: { token } });
    s.on('connect', () => s.emit('start-bot-match', { platform, difficulty, topic, timeLimit }));
    s.once('private-room-created', ({ roomCode }) => { s.disconnect(); router.push(`/match/${roomCode}`); });
    s.on('error-msg', (msg) => { alert(msg); s.disconnect(); });
  };

  const totalGames = user ? user.wins + user.losses : 0;
  const winRate = totalGames > 0 ? Math.round((user.wins / totalGames) * 100) : 0;
  const ratingValue = user?.rating || 1200;

  const getRatingTitle = (r) => {
    if (r >= 1800) return 'Grandmaster';
    if (r >= 1500) return 'Master';
    if (r >= 1200) return 'Expert';
    return 'Pupil';
  };

  return (
    <DashboardLayout>

      {/* Matchmaking Queue Overlay */}
      {inQueue && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-center p-6">
          <div className="mb-8">
            <Loader2 className="w-8 h-8 text-white animate-spin mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-white mb-1">Finding opponent</h2>
            <p className="text-sm text-zinc-500">Matching you against {difficulty} difficulty · {platform}</p>
          </div>
          <button
            onClick={handleCancelMatchmaking}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-white border border-white/10 hover:border-white/20 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10">

        {/* Left column */}
        <div className="flex flex-col gap-10">

          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-zinc-500 mb-1.5">Welcome back</p>
              <h1 className="text-2xl font-semibold text-white">{user?.username}</h1>
              <p className="text-sm text-zinc-500 mt-0.5">{getRatingTitle(ratingValue)} · {ratingValue} ELO</p>
            </div>

            {/* Search + Notif */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative" ref={searchRef}>
                <button
                  onClick={() => { setSearchOpen(o => !o); setNotifOpen(false); }}
                  className="p-2 text-zinc-500 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <Search size={16} />
                </button>
                {searchOpen && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-[#111] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                    <div className="p-3 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <Search size={13} className="text-zinc-500 shrink-0" />
                        <input
                          autoFocus
                          type="text"
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          placeholder="Search players..."
                          className="bg-transparent text-sm text-white placeholder-zinc-600 outline-none flex-1"
                        />
                        {searchQuery && <button onClick={() => setSearchQuery('')} className="text-zinc-600 hover:text-zinc-400 cursor-pointer"><X size={12} /></button>}
                      </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {searchLoading && <div className="px-4 py-6 text-center text-xs text-zinc-600">Searching...</div>}
                      {!searchLoading && searchQuery && searchResults.length === 0 && <div className="px-4 py-6 text-center text-xs text-zinc-600">No players found</div>}
                      {!searchQuery && <div className="px-4 py-6 text-center text-xs text-zinc-600">Type to search players</div>}
                      {searchResults.map(p => (
                        <Link key={p._id} href={`/profile/${p.username}`}
                          onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors border-t border-white/5 first:border-0">
                          <img src={p.profilePicture} alt="" className="w-7 h-7 rounded-full object-cover border border-white/10" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white truncate">{p.username}</div>
                            <div className="text-xs text-zinc-500">{p.rating} ELO</div>
                          </div>
                          <ChevronRight size={13} className="text-zinc-600 shrink-0" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Notifications */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => { setNotifOpen(o => !o); setSearchOpen(false); }}
                  className="p-2 text-zinc-500 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer relative"
                >
                  <Bell size={16} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-red-500 rounded-full text-white text-[8px] font-bold flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-[#111] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                      <span className="text-sm font-medium text-white">Notifications</span>
                      {unreadCount > 0 && <span className="text-xs text-zinc-500">{unreadCount} unread</span>}
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-white/5">
                      {notifLoading && <div className="px-4 py-8 text-center text-xs text-zinc-600">Loading...</div>}
                      {!notifLoading && notifications.length === 0 && <div className="px-4 py-8 text-center text-xs text-zinc-600">No notifications</div>}
                      {!notifLoading && notifications.map(n => (
                        <div key={n.id} className={`flex gap-3 px-4 py-3 hover:bg-white/5 cursor-pointer ${n.unread ? 'bg-white/[0.02]' : ''}`}>
                          <span className="text-base shrink-0">{n.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-medium text-white">{n.title}</span>
                              {n.unread && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />}
                            </div>
                            <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{n.body}</p>
                            <div className="flex items-center gap-1 mt-1 text-[11px] text-zinc-600">
                              <Clock size={9} /> {n.time}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div>
            <p className="text-xs font-medium text-zinc-500 mb-4">Overview</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Win rate',  value: `${winRate}%`,        sub: `${user?.wins || 0}W · ${user?.losses || 0}L`, border: 'border-l-blue-500',   num: 'text-blue-400' },
                { label: 'Matches',   value: totalGames,            sub: 'Total played',                                border: 'border-l-violet-500', num: 'text-violet-400' },
                { label: 'Streak',    value: user?.streak || 0,     sub: 'Current streak',                              border: 'border-l-amber-500',  num: 'text-amber-400' },
                { label: 'Rating',    value: ratingValue,           sub: getRatingTitle(ratingValue),                   border: 'border-l-emerald-500',num: 'text-emerald-400' },
              ].map((stat) => (
                <div key={stat.label} className={`bg-[#111] border border-white/8 border-l-2 ${stat.border} rounded-xl p-5`}>
                  <p className="text-xs text-zinc-500 mb-2">{stat.label}</p>
                  <p className={`text-xl font-semibold ${stat.num}`}>{stat.value}</p>
                  <p className="text-xs text-zinc-600 mt-1">{stat.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Match configuration */}
          <div>
            <p className="text-xs font-medium text-zinc-500 mb-4">Start a match</p>
            <div className="border border-white/8 rounded-xl overflow-hidden">

              {/* Platform */}
              <div className="p-5 border-b border-white/5">
                <p className="text-xs text-zinc-500 mb-3">Problem source</p>
                <div className="flex gap-2 flex-wrap">
                  {['All', 'LeetCode', 'Codeforces'].map((plat) => (
                    <button key={plat} onClick={() => setPlatform(plat)}
                      className={`px-3.5 py-1.5 rounded-md text-sm transition-colors cursor-pointer border ${
                        platform === plat
                          ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-300 font-medium'
                          : 'border-white/8 bg-transparent text-zinc-400 hover:text-white hover:border-white/15'
                      }`}>
                      {plat === 'All' ? 'Mixed' : plat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty */}
              <div className="p-5 border-b border-white/5">
                <p className="text-xs text-zinc-500 mb-3">Difficulty</p>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { label: 'All',    active: 'border-zinc-500/40 bg-zinc-500/10 text-zinc-200' },
                    { label: 'Easy',   active: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' },
                    { label: 'Medium', active: 'border-amber-500/40 bg-amber-500/10 text-amber-300' },
                    { label: 'Hard',   active: 'border-red-500/40 bg-red-500/10 text-red-300' },
                  ].map(({ label, active }) => (
                    <button key={label} onClick={() => setDifficulty(label)}
                      className={`px-3.5 py-1.5 rounded-md text-sm transition-colors cursor-pointer border ${
                        difficulty === label
                          ? `${active} font-medium`
                          : 'border-white/8 bg-transparent text-zinc-400 hover:text-white hover:border-white/15'
                      }`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Topic */}
              <div className="p-5 border-b border-white/5">
                <p className="text-xs text-zinc-500 mb-3">Topic</p>
                <select value={topic} onChange={(e) => setTopic(e.target.value)}
                  className="bg-[#111] border border-white/8 rounded-md px-3 py-2 text-sm text-zinc-300 outline-none focus:border-white/20 transition-colors cursor-pointer w-full max-w-xs">
                  <option value="All">All Topics</option>
                  <option value="Arrays">Arrays &amp; Hashing</option>
                  <option value="Strings">Strings &amp; Subsequences</option>
                  <option value="DP">Dynamic Programming</option>
                  <option value="Graph">Graph Algorithms</option>
                  <option value="Trees">Trees &amp; BSTs</option>
                  <option value="Binary Search">Binary Search</option>
                  <option value="Greedy">Greedy Algorithms</option>
                  <option value="Number Theory">Math &amp; Number Theory</option>
                </select>
              </div>

              {/* Timer */}
              <div className="p-5">
                <p className="text-xs text-zinc-500 mb-3">Time limit</p>
                <div className="flex gap-2 flex-wrap">
                  {[20, 30, 45, 60].map((t) => (
                    <button key={t} onClick={() => setTimeLimit(t)}
                      className={`px-3.5 py-1.5 rounded-md text-sm transition-colors cursor-pointer border ${
                        timeLimit === t
                          ? 'border-white/20 bg-white/10 text-white font-medium'
                          : 'border-white/8 bg-transparent text-zinc-400 hover:text-white hover:border-white/15'
                      }`}>
                      {t} min
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-3 gap-3 mt-3">
              <button onClick={() => setInQueue(true)}
                className="py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/50">
                Find 1v1
                <ArrowRight size={14} />
              </button>
              <button onClick={handleStartBotMatch}
                className="py-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/8 text-emerald-300 text-sm font-medium hover:bg-emerald-500/15 transition-colors cursor-pointer">
                vs Bot
              </button>
              <button onClick={handleCreatePrivateLobby}
                className="py-2.5 rounded-lg border border-white/10 bg-transparent text-zinc-300 text-sm font-medium hover:bg-white/5 transition-colors cursor-pointer">
                Private room
              </button>
            </div>
          </div>

          {/* Recent activity */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-medium text-zinc-500">Recent matches</p>
            </div>
            <div className="border border-white/8 rounded-xl overflow-hidden">
              {recentMatches.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm text-zinc-600">No matches yet</div>
              ) : (
                recentMatches.map((m, idx) => {
                  const isWin = m.winner?.username === user?.username;
                  const isDraw = !m.winner;
                  const oppName = m.player1?.username === user?.username ? (m.player2?.username || 'Opponent') : (m.player1?.username || 'Opponent');
                  const elo = isDraw ? '±0' : isWin ? '+24' : '−16';
                  return (
                    <div key={m._id || idx} className="flex items-center justify-between px-5 py-3.5 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-center gap-3">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isDraw ? 'bg-zinc-500' : isWin ? 'bg-emerald-400' : 'bg-red-400'}`} />
                        <span className="text-sm text-zinc-300">
                          {isDraw ? 'Drew with' : isWin ? 'Won against' : 'Lost to'}{' '}
                          <span className="text-white font-medium">{oppName}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`text-sm font-medium ${isDraw ? 'text-zinc-500' : isWin ? 'text-emerald-400' : 'text-red-400'}`}>{elo}</span>
                        <span className="text-xs text-zinc-600">{Math.floor(m.duration / 60)}m {m.duration % 60}s</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6">

          {/* Rating card */}
          <div className="border border-indigo-500/20 bg-indigo-950/20 rounded-xl p-5">
            <p className="text-xs text-indigo-300/60 mb-1">Current rating</p>
            <div className="text-3xl font-semibold text-white mt-1">{ratingValue} <span className="text-base font-normal text-indigo-300/50">ELO</span></div>
            <span className="inline-block mt-2 text-xs text-indigo-300 border border-indigo-500/30 bg-indigo-500/10 rounded-md px-2 py-0.5">{getRatingTitle(ratingValue)}</span>

            {/* Sparkline */}
            <div className="mt-5 w-full h-14">
              <svg viewBox="0 0 200 56" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="ratingGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M 0 50 Q 30 20, 60 38 T 120 14 T 180 28 L 200 10 L 200 56 L 0 56 Z" fill="url(#ratingGrad)" />
                <path d="M 0 50 Q 30 20, 60 38 T 120 14 T 180 28 L 200 10" fill="none" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="200" cy="10" r="3" fill="#818cf8" />
              </svg>
            </div>
          </div>

          {/* Join private room */}
          <div className="border border-white/8 rounded-xl p-5">
            <p className="text-xs font-medium text-zinc-500 mb-4">Join a private room</p>
            <form onSubmit={handleJoinPrivateLobby} className="flex flex-col gap-2">
              <input
                type="text"
                value={joinRoomCode}
                onChange={(e) => setJoinRoomCode(e.target.value.toUpperCase())}
                placeholder="Room code"
                maxLength={6}
                className="bg-[#111] border border-white/8 focus:border-white/20 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition-colors text-center tracking-widest font-mono uppercase"
              />
              <button type="submit"
                className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/8 hover:border-white/15 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer">
                Join room
              </button>
            </form>
          </div>

          {/* Leaderboard */}
          <div className="border border-white/8 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-medium text-zinc-500">Top players</p>
              <Link href="/leaderboard" className="text-xs text-zinc-500 hover:text-white transition-colors">See all</Link>
            </div>
            <div className="flex flex-col gap-3">
              {leaderboard.map((p, idx) => {
                const rankColor = idx === 0 ? 'text-amber-400' : idx === 1 ? 'text-zinc-300' : idx === 2 ? 'text-amber-600' : 'text-zinc-600';
                return (
                  <div key={p._id} className="flex items-center gap-3 group">
                    <span className={`text-xs font-semibold w-4 shrink-0 ${rankColor}`}>#{idx + 1}</span>
                    <img src={p.profilePicture} alt="" className="w-6 h-6 rounded-full border border-white/10 object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <Link href={`/profile/${p.username}`} className="text-sm text-white group-hover:text-indigo-300 transition-colors truncate block">{p.username}</Link>
                      <span className="text-[11px] text-zinc-500">{getRatingTitle(p.rating)}</span>
                    </div>
                    <span className="text-sm text-indigo-400 font-medium shrink-0">{p.rating}</span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

    </DashboardLayout>
  );
}
