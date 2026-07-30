import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { io } from 'socket.io-client';
import { useRouter } from 'next/router';
import { Search, Bell, Swords, Trophy, Activity, Award, Key, Zap, Target, TrendingUp, Flame, X, ChevronRight, Clock, Sword } from 'lucide-react';
import { api } from '@/utils/api';
import Link from 'next/link';

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();

  // Search panel state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef = useRef(null);

  // Notification panel state
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const notifRef = useRef(null);

  // Fetch real notifications from backend
  useEffect(() => {
    if (!user) return;
    const fetchNotifications = async () => {
      setNotifLoading(true);
      try {
        const data = await api.get('/users/me/notifications');
        setNotifications(data);
      } catch (err) {
        console.error('Failed to load notifications:', err);
      } finally {
        setNotifLoading(false);
      }
    };
    fetchNotifications();
  }, [user]);

  const unreadCount = notifications.filter(n => n.unread).length;

  // Close panels when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Search users by query
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const debounce = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const data = await api.get('/users/leaderboard');
        const filtered = data.filter(p =>
          p.username.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 6);
        setSearchResults(filtered);
      } catch { setSearchResults([]); }
      finally { setSearchLoading(false); }
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  // Matchmaking settings
  const [platform, setPlatform] = useState('All');
  const [difficulty, setDifficulty] = useState('All');
  const [topic, setTopic] = useState('All');
  const [timeLimit, setTimeLimit] = useState(30);

  const [inQueue, setInQueue] = useState(false);
  const [queueSize, setQueueSize] = useState(0);
  const [socket, setSocket] = useState(null);
  
  // Dashboard data lists
  const [recentMatches, setRecentMatches] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [joinRoomCode, setJoinRoomCode] = useState('');

  // Fetch match summaries
  useEffect(() => {
    const fetchData = async () => {
      try {
        const matches = await api.get('/matches/recent');
        setRecentMatches(matches);

        const players = await api.get('/users/leaderboard');
        setLeaderboard(players.slice(0, 5));
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      }
    };
    fetchData();
  }, []);

  // Initialize socket matchmaking
  useEffect(() => {
    if (inQueue) {
      const token = localStorage.getItem('token');
      const socketInstance = io('http://localhost:5000', {
        auth: { token }
      });

      socketInstance.on('connect', () => {
        socketInstance.emit('join-matchmaking', {
          platform,
          difficulty,
          topic,
          timeLimit
        });
      });

      socketInstance.on('queue-status', (data) => {
        setQueueSize(data.queueSize || 1);
      });

      socketInstance.on('match-found', ({ roomCode }) => {
        socketInstance.disconnect();
        setInQueue(false);
        router.push(`/match/${roomCode}`);
      });

      socketInstance.on('error-msg', (msg) => {
        alert(msg);
        setInQueue(false);
        socketInstance.disconnect();
      });

      setSocket(socketInstance);

      return () => {
        socketInstance.disconnect();
      };
    }
  }, [inQueue]);

  const handleStartMatchmaking = () => {
    setInQueue(true);
  };

  const handleCancelMatchmaking = () => {
    if (socket) {
      socket.emit('leave-matchmaking');
      socket.disconnect();
    }
    setInQueue(false);
  };

  const handleCreatePrivateLobby = () => {
    try {
      const token = localStorage.getItem('token');
      const socketInstance = io('http://localhost:5000', { auth: { token } });

      socketInstance.on('connect', () => {
        socketInstance.emit('create-private-room', { platform, difficulty, topic, timeLimit });
      });

      socketInstance.once('private-room-created', ({ roomCode }) => {
        // Do NOT disconnect — the match page's own socket will handle the session.
        // Just navigate; the creator will be recognised by userId in the room state.
        socketInstance.disconnect();
        router.push(`/match/${roomCode}`);
      });

      socketInstance.on('error-msg', (msg) => {
        alert('Room creation error: ' + msg);
        socketInstance.disconnect();
      });
    } catch (err) {
      alert('Failed to generate private lobby: ' + err.message);
    }
  };


  const handleJoinPrivateLobby = (e) => {
    e.preventDefault();
    if (!joinRoomCode || joinRoomCode.trim().length !== 6) {
      alert('Please enter a valid 6-character room code.');
      return;
    }
    router.push(`/match/${joinRoomCode.toUpperCase().trim()}`);
  };

  const handleStartBotMatch = () => {
    try {
      const token = localStorage.getItem('token');
      const socketInstance = io('http://localhost:5000', { auth: { token } });

      socketInstance.on('connect', () => {
        socketInstance.emit('start-bot-match', { platform, difficulty, topic, timeLimit });
      });

      socketInstance.once('private-room-created', ({ roomCode }) => {
        socketInstance.disconnect();
        router.push(`/match/${roomCode}`);
      });

      socketInstance.on('error-msg', (msg) => {
        alert('Bot match error: ' + msg);
        socketInstance.disconnect();
      });
    } catch (err) {
      alert('Failed to start bot match: ' + err.message);
    }
  };

  const totalGames = user ? user.wins + user.losses : 0;
  const winRate = totalGames > 0 ? Math.round((user.wins / totalGames) * 100) : 0;


  // Compute rank title based on rating
  const getRatingTitle = (rating) => {
    if (rating >= 1800) return 'Grandmaster';
    if (rating >= 1500) return 'Master';
    if (rating >= 1200) return 'Expert';
    return 'Pupil';
  };

  const ratingValue = user?.rating || 1200;

  return (
    <DashboardLayout>
      {/* Ambient background glows for premium look */}
      <div className="absolute top-[10%] left-[20%] w-[350px] h-[350px] rounded-full bg-[#0088ff]/5 blur-[90px] pointer-events-none z-0" />
      <div className="absolute bottom-[10%] right-[10%] w-[300px] h-[300px] rounded-full bg-[#bf00ff]/3 blur-[90px] pointer-events-none z-0" />

      {/* Cyber Matchmaking Queue Overlay */}
      {inQueue && (
        <div className="fixed inset-0 bg-[#050508]/96 backdrop-blur-xl z-50 flex flex-col items-center justify-center text-center p-6 select-none font-sans">
          <div className="relative w-44 h-44 flex items-center justify-center mb-8">
            <div className="absolute inset-0 rounded-full border border-[#00b7ff]/20 animate-pulse"></div>
            <div className="absolute inset-4 rounded-full border border-[#bf00ff]/20 animate-ping"></div>
            <div className="w-12 h-12 rounded-full bg-[#00b7ff]/10 border border-[#00b7ff]/30 flex items-center justify-center shadow-[0_0_20px_rgba(0,183,255,0.2)]">
              <Swords className="w-6 h-6 text-[#00b7ff] animate-pulse" />
            </div>
          </div>

          <h2 className="text-xl font-extrabold tracking-widest text-white mb-2 font-mono uppercase">RETRIEVING OPPONENT SIGNAL</h2>
          <p className="text-xs text-zinc-500 mb-8 font-mono uppercase tracking-wider">Target ELO: {ratingValue}</p>

          <div className="flex gap-12 px-8 py-4 bg-white/5 border border-white/5 rounded-2xl text-xs mb-8 text-zinc-300 shadow-xl backdrop-blur-md font-mono">
            <div>
              <span className="text-zinc-500 mr-2 uppercase">DIFFICULTY:</span>
              <strong className="text-white font-bold">{difficulty}</strong>
            </div>
            <div className="border-l border-white/10 pl-12">
              <span className="text-zinc-500 mr-2 uppercase">SOURCE:</span>
              <strong className="text-white font-bold">{platform}</strong>
            </div>
          </div>

          <button 
            onClick={handleCancelMatchmaking} 
            className="py-3.5 px-10 bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-900/30 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer rounded-xl shadow-lg shadow-black/40"
          >
            DISCONNECT QUEUE
          </button>
        </div>
      )}

      {/* Main Grid: Left Column (2/3 width) and Right Column (1/3 width) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        
        {/* Left Section (Welcome, Stats, Configuration, Activities) */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          {/* Top Header Block */}
          <div className="flex justify-between items-center">
            <div>
              <span className="text-zinc-500 text-xs font-semibold tracking-wider uppercase font-mono">Arena Dashboard</span>
              <h1 className="text-3xl font-black text-white tracking-tight capitalize mt-1">Welcome back, {user?.username}</h1>
              <p className="text-xs text-[#10b981] font-bold font-mono tracking-widest uppercase mt-1">Status: Active Duelist</p>
            </div>
            <div className="flex items-center gap-3">

              {/* ── Search Panel ── */}
              <div className="relative" ref={searchRef}>
                <button
                  onClick={() => { setSearchOpen(o => !o); setNotifOpen(false); }}
                  className={`p-3 border rounded-xl transition-all cursor-pointer ${
                    searchOpen ? 'bg-white/10 border-white/10 text-white' : 'bg-white/5 border-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Search size={16} />
                </button>

                {searchOpen && (
                  <div className="absolute right-0 top-[calc(100%+10px)] w-80 bg-[#0d0d14] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
                    {/* sheen */}
                    <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <div className="p-3">
                      <div className="flex items-center gap-2 bg-white/5 border border-white/5 rounded-xl px-3 py-2">
                        <Search size={13} className="text-zinc-500 shrink-0" />
                        <input
                          autoFocus
                          type="text"
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          placeholder="Search players..."
                          className="bg-transparent text-white text-xs placeholder-zinc-600 outline-none flex-1 font-mono"
                        />
                        {searchQuery && (
                          <button onClick={() => setSearchQuery('')} className="text-zinc-600 hover:text-zinc-400 cursor-pointer">
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="max-h-64 overflow-y-auto">
                      {searchLoading && (
                        <div className="px-4 py-6 text-center text-[10px] text-zinc-600 font-mono animate-pulse uppercase tracking-wider">Searching...</div>
                      )}
                      {!searchLoading && searchQuery && searchResults.length === 0 && (
                        <div className="px-4 py-6 text-center text-[10px] text-zinc-600 font-mono uppercase tracking-wider">No players found</div>
                      )}
                      {!searchQuery && (
                        <div className="px-4 py-4 text-center text-[10px] text-zinc-600 font-mono uppercase tracking-wider">Type to search players</div>
                      )}
                      {searchResults.map(p => (
                        <Link
                          key={p._id}
                          href={`/profile/${p.username}`}
                          onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors border-t border-white/5 first:border-0"
                        >
                          <img src={p.profilePicture} alt="" className="w-8 h-8 rounded-full object-cover border border-white/10" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-white truncate">{p.username}</div>
                            <div className="text-[10px] text-zinc-500 font-mono">{p.rating} ELO</div>
                          </div>
                          <ChevronRight size={13} className="text-zinc-600 shrink-0" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ── Notification Panel ── */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => { setNotifOpen(o => !o); setSearchOpen(false); }}
                  className={`p-3 border rounded-xl transition-all relative cursor-pointer ${
                    notifOpen ? 'bg-white/10 border-white/10 text-white' : 'bg-white/5 border-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Bell size={16} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[8px] font-black flex items-center justify-center font-mono">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 top-[calc(100%+10px)] w-80 bg-[#0d0d14] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
                    <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                      <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="text-[10px] text-[#0088ff] font-mono font-bold">{unreadCount} new</span>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
                      {notifLoading && (
                        <div className="px-4 py-8 text-center text-[10px] text-zinc-600 font-mono animate-pulse uppercase tracking-wider">
                          Loading...
                        </div>
                      )}
                      {!notifLoading && notifications.length === 0 && (
                        <div className="px-4 py-8 text-center text-[10px] text-zinc-600 font-mono uppercase tracking-wider">
                          No notifications yet
                        </div>
                      )}
                      {!notifLoading && notifications.map(n => (
                        <div
                          key={n.id}
                          className={`flex gap-3 px-4 py-3.5 transition-colors hover:bg-white/5 cursor-pointer ${
                            n.unread ? 'bg-[#0088ff]/5' : ''
                          }`}
                        >
                          <span className="text-lg shrink-0 mt-0.5">{n.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <span className={`text-xs font-bold ${n.unread ? 'text-white' : 'text-zinc-300'}`}>{n.title}</span>
                              {n.unread && <span className="w-1.5 h-1.5 rounded-full bg-[#0088ff] shrink-0 mt-1.5" />}
                            </div>
                            <p className="text-[11px] text-zinc-500 font-mono mt-0.5 leading-relaxed">{n.body}</p>
                            <div className="flex items-center gap-1 mt-1.5 text-[10px] text-zinc-600 font-mono">
                              <Clock size={9} />
                              {n.time}
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

          {/* Overview Stats Block */}
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-500 font-mono block mb-4">HUD METRICS</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-white/5 to-white/[0.01] border border-white/5 rounded-2xl p-5 shadow-xl relative overflow-hidden backdrop-blur-md">
                <div className="absolute top-0 right-0 w-20 h-20 bg-[#10b981]/5 rounded-bl-full pointer-events-none" />
                <span className="text-xs font-medium text-zinc-500 block">Win Rate</span>
                <div className="text-2xl font-extrabold text-white mt-1 font-mono tracking-tight">{winRate}%</div>
                <span className="text-[10px] text-[#10b981] font-bold font-mono block mt-2">↑ 12% RATE</span>
              </div>
              
              <div className="bg-gradient-to-br from-white/5 to-white/[0.01] border border-white/5 rounded-2xl p-5 shadow-xl relative overflow-hidden backdrop-blur-md">
                <span className="text-xs font-medium text-zinc-500 block">Matches</span>
                <div className="text-2xl font-extrabold text-white mt-1 font-mono tracking-tight">{totalGames}</div>
                <span className="text-[10px] text-zinc-500 font-mono block mt-2">THIS WEEK</span>
              </div>
              
              <div className="bg-gradient-to-br from-white/5 to-white/[0.01] border border-white/5 rounded-2xl p-5 shadow-xl relative overflow-hidden backdrop-blur-md">
                <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/5 rounded-bl-full pointer-events-none" />
                <span className="text-xs font-medium text-zinc-500 block">Streak</span>
                <div className="text-2xl font-extrabold text-white mt-1 font-mono tracking-tight flex items-baseline gap-1">
                  {user?.streak || 0}
                  <Flame size={14} className="text-orange-500 animate-pulse" />
                </div>
                <span className="text-[10px] text-zinc-500 font-mono block mt-2">ACTIVE STREAK</span>
              </div>
              
              <div className="bg-gradient-to-br from-white/5 to-white/[0.01] border border-white/5 rounded-2xl p-5 shadow-xl relative overflow-hidden backdrop-blur-md">
                <span className="text-xs font-medium text-zinc-500 block">Accuracy</span>
                <div className="text-2xl font-extrabold text-white mt-1 font-mono tracking-tight">89%</div>
                <span className="text-[10px] text-[#10b981] font-bold font-mono block mt-2">↑ 8% CHANGE</span>
              </div>
            </div>
          </div>

          {/* Match Configuration Card */}
          <div className="bg-gradient-to-br from-white/5 to-white/[0.01] border border-white/5 rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden backdrop-blur-md">
            {/* Skeuomorphic top card sheen line */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

            <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-6 border-b border-white/5 pb-4 flex items-center gap-2 font-mono">
              <Activity size={14} className="text-[#10b981]" /> MATCH CONFIGURATION
            </h3>

            <div className="flex flex-col gap-6">
              {/* Problem Source selection */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono">Problem Source</span>
                <div className="grid grid-cols-3 gap-3">
                  {['All', 'LeetCode', 'Codeforces'].map((plat) => (
                    <button
                      key={plat}
                      type="button"
                      onClick={() => setPlatform(plat)}
                      className={`py-3 text-xs font-mono font-bold tracking-wider uppercase border rounded-xl transition-all duration-200 cursor-pointer ${
                        platform === plat
                          ? 'border-[#0088ff]/40 bg-[#0088ff]/15 text-white shadow-[0_0_15px_rgba(0,136,255,0.1)]'
                          : 'border-white/5 bg-white/[0.02] text-zinc-400 hover:border-white/10 hover:text-white'
                      }`}
                    >
                      {plat === 'All' ? 'Mixed' : plat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty Options */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono">Target Difficulty</span>
                <div className="grid grid-cols-4 gap-3">
                  {['All', 'Easy', 'Medium', 'Hard'].map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setDifficulty(diff)}
                      className={`py-3 text-xs font-mono font-bold tracking-wider uppercase border rounded-xl transition-all duration-200 cursor-pointer ${
                        difficulty === diff
                          ? 'border-[#0088ff]/40 bg-[#0088ff]/15 text-white shadow-[0_0_15px_rgba(0,136,255,0.1)]'
                          : 'border-white/5 bg-white/[0.02] text-zinc-400 hover:border-white/10 hover:text-white'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              {/* Topic Tag Selector */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono">Algorithm Focus</span>
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="bg-[#08080c] border border-white/5 p-3.5 text-zinc-200 text-xs outline-none focus:border-white/10 rounded-xl font-semibold tracking-wider cursor-pointer"
                >
                  <option value="All">All Topics</option>
                  <option value="Arrays">Arrays & Hashing</option>
                  <option value="Strings">Strings & Subsequences</option>
                  <option value="DP">Dynamic Programming (DP)</option>
                  <option value="Graph">Graph Algorithms</option>
                  <option value="Trees">Trees & BSTs</option>
                  <option value="Binary Search">Binary Search</option>
                  <option value="Greedy">Greedy Algorithms</option>
                  <option value="Number Theory">Math & Number Theory</option>
                </select>
              </div>

              {/* Match Time limit */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono">Match Timer limit</span>
                <div className="grid grid-cols-4 gap-3">
                  {[20, 30, 45, 60].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTimeLimit(t)}
                      className={`py-3 text-xs font-mono font-bold tracking-wider uppercase border rounded-xl transition-all duration-200 cursor-pointer ${
                        timeLimit === t
                          ? 'border-[#bf00ff]/40 bg-[#bf00ff]/15 text-white shadow-[0_0_15px_rgba(191,0,255,0.1)]'
                          : 'border-white/5 bg-white/[0.02] text-zinc-400 hover:border-white/10 hover:text-white'
                      }`}
                    >
                      {t} MINS
                    </button>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                <button
                  onClick={handleStartMatchmaking}
                  className="w-full py-4 rounded-xl bg-white hover:bg-slate-200 text-slate-950 font-extrabold text-xs uppercase tracking-wider transition-colors shadow-xl shadow-black/20 border-none cursor-pointer select-none"
                >
                  ⚡ FIND 1V1 MATCH
                </button>
                <button
                  onClick={handleStartBotMatch}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-950/40 border-none cursor-pointer select-none"
                >
                  🤖 PRACTICE VS BOT
                </button>
                <button
                  onClick={handleCreatePrivateLobby}
                  className="w-full py-4 rounded-xl bg-[#0c0c12] hover:bg-slate-900 border border-white/10 text-white font-extrabold text-xs uppercase tracking-wider transition-colors cursor-pointer select-none"
                >
                  🔑 PRIVATE ROOM
                </button>
              </div>

            </div>
          </div>

          {/* Recent Activity List */}
          <div className="bg-gradient-to-br from-white/5 to-white/[0.01] border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden backdrop-blur-md">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-6 border-b border-white/5 pb-4 flex items-center gap-2 font-mono">
              <Activity size={14} className="text-[#10b981]" /> RECENT ACTIVITY FEED
            </h3>
            {recentMatches.length === 0 ? (
              <div className="text-center py-10 text-xs text-zinc-500 font-mono uppercase tracking-wider">
                No battles logged in local database
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {recentMatches.map((m, idx) => {
                  const isPlayer1 = m.player1?.username === user?.username;
                  const resultText = m.winner ? (m.winner.username === user?.username ? 'Won against' : 'Lost against') : 'Drew with';
                  const oppName = isPlayer1 ? (m.player2?.username || 'Opponent') : (m.player1?.username || 'Opponent');
                  const eloAdjust = m.winner ? (m.winner.username === user?.username ? '+24' : '-16') : '+0';
                  const colorClass = m.winner ? (m.winner.username === user?.username ? 'text-[#10b981]' : 'text-red-400') : 'text-zinc-500';
                  return (
                    <div
                      key={m._id || idx}
                      className="border-b border-white/5 last:border-0 pb-3 last:pb-0 flex justify-between items-center text-xs text-zinc-300 font-mono"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`font-bold ${colorClass}`}>
                          {m.winner ? (m.winner.username === user?.username ? '✓' : '✗') : '•'}
                        </span>
                        <span>{resultText} <strong className="text-white">{oppName}</strong></span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`font-bold ${colorClass}`}>{eloAdjust}</span>
                        <span className="text-zinc-500 text-[10px]">
                          {Math.floor(m.duration / 60)}m {m.duration % 60}s
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Section (Rating wave sparkline, Invite code, Top standings) */}
        <div className="flex flex-col gap-8 relative z-10">
          
          {/* Current Rating and SVG Sparkline Wave Card */}
          <div className="bg-gradient-to-br from-white/5 to-white/[0.01] border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden backdrop-blur-md">
            <span className="text-xs font-semibold text-zinc-500 block uppercase tracking-wider font-mono">CURRENT RATING</span>
            <div className="text-3xl font-black text-white font-mono tracking-tight mt-1">{ratingValue} ELO</div>
            <div className="inline-block bg-[#10b981]/10 border border-[#10b981]/30 text-[#10b981] text-[9px] font-bold font-mono px-2 py-0.5 rounded-sm mt-1.5 uppercase tracking-wider">
              {getRatingTitle(ratingValue)}
            </div>
            
            {/* Smooth emerald SVG sparkline chart */}
            <div className="mt-6 w-full h-16 relative">
              <svg viewBox="0 0 200 60" className="w-full h-full text-[#10b981] overflow-visible">
                <defs>
                  <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* Area under curve */}
                <path
                  d="M 0 50 Q 30 20, 60 40 T 120 15 T 180 30 L 200 10 L 200 60 L 0 60 Z"
                  fill="url(#chartGlow)"
                />
                {/* Outline path */}
                <path
                  d="M 0 50 Q 30 20, 60 40 T 120 15 T 180 30 L 200 10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Glowing target point */}
                <circle cx="200" cy="10" r="4" fill="currentColor" className="animate-pulse shadow-sm" />
              </svg>
            </div>
          </div>

          {/* Invite Code Connect box */}
          <div className="bg-gradient-to-br from-white/5 to-white/[0.01] border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden backdrop-blur-md">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4 font-mono flex items-center gap-2">
              <Key size={13} className="text-[#0088ff]" /> UPLINK INVITE CODE
            </h4>
            <form onSubmit={handleJoinPrivateLobby} className="flex flex-col gap-3">
              <input
                type="text"
                value={joinRoomCode}
                onChange={(e) => setJoinRoomCode(e.target.value.toUpperCase())}
                placeholder="LOBBY CODE"
                maxLength={6}
                style={{ letterSpacing: '0.2em' }}
                className="bg-[#08080c] border border-white/5 focus:border-white/10 p-3.5 text-white text-center font-mono font-bold outline-none text-xs rounded-xl"
              />
              <button
                type="submit"
                className="w-full py-3 bg-[#181822] hover:bg-[#20202d] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm border border-white/5 cursor-pointer"
              >
                CONNECT TO ROOM
              </button>
            </form>
          </div>

          {/* Top Coders Scoreboard list */}
          <div className="bg-gradient-to-br from-white/5 to-white/[0.01] border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden backdrop-blur-md">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-6 border-b border-white/5 pb-4 flex items-center gap-2 font-mono">
              <Trophy size={14} className="text-[#bf00ff]" /> TOP DUELISTS
            </h4>
            <div className="flex flex-col gap-4">
              {leaderboard.map((p, idx) => (
                <div key={p._id} className="flex items-center justify-between text-xs py-1.5 border-b border-white/5 pb-3 last:border-0 font-mono">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <span className="font-bold text-zinc-600 w-4">#{idx + 1}</span>
                    <img src={p.profilePicture} alt="" className="w-6 h-6 rounded-full border border-white/5 object-cover" />
                    <div className="truncate">
                      <Link href={`/profile/${p.username}`} className="font-bold text-white hover:underline truncate block">
                        {p.username}
                      </Link>
                      <span className="text-[9px] text-[#bf00ff] block font-bold uppercase mt-0.5 leading-none">{getRatingTitle(p.rating)}</span>
                    </div>
                  </div>
                  <span className="text-[#0088ff] font-bold shrink-0">{p.rating} ELO</span>
                </div>
              ))}
            </div>
            <Link
              href="/leaderboard"
              className="block text-center text-[10px] text-[#0088ff] hover:underline font-bold uppercase tracking-widest mt-6 transition-all"
            >
              FULL GLOBAL STANDINGS
            </Link>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
