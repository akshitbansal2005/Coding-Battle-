import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { io } from 'socket.io-client';
import Editor from '@monaco-editor/react';
import {
  Play, Send, Clock, Cpu, Terminal, ChevronDown, ChevronUp,
  Maximize2, Minimize2, RotateCcw, CheckCircle2, XCircle, AlertCircle,
  Code2, FileText, Lightbulb, Users
} from 'lucide-react';
import MatchResultModal from '@/components/MatchResultModal';

// ─────────────────────────────────────────────────────────────────────────────
// Language config — same editor for LeetCode & Codeforces,
// starter templates adapt to platform style automatically.
// ─────────────────────────────────────────────────────────────────────────────
const LANGUAGES = [
  { id: 'javascript', label: 'JavaScript', monacoLang: 'javascript', ext: '.js' },
  { id: 'python',     label: 'Python 3',   monacoLang: 'python',     ext: '.py' },
  { id: 'cpp',        label: 'C++ 17',     monacoLang: 'cpp',        ext: '.cpp' },
  { id: 'java',       label: 'Java',       monacoLang: 'java',       ext: '.java' },
  { id: 'c',          label: 'C',          monacoLang: 'c',          ext: '.c'   },
];

/**
 * Generate a clean starter template based on platform, language, and problem metadata.
 * LeetCode → function/class wrapper style.
 * Codeforces → stdin/stdout style.
 */
const getStarterCode = (platform, language, problem) => {
  const isLC = platform === 'LeetCode';
  const fnName = problem?.title
    ? problem.title.toLowerCase().replace(/[^a-z0-9]+(.)/g, (_, c) => c.toUpperCase())
    : 'solve';

  if (language === 'javascript') {
    return isLC
      ? `/**
 * ${problem?.title || 'Problem'}
 * Platform: LeetCode
 * Difficulty: ${problem?.difficulty || ''}
 */

/**
 * @param {number[]} nums
 * @return {number}
 */
var ${fnName} = function(nums) {
    // Write your solution here

};
`
      : `// ${problem?.title || 'Problem'}
// Platform: Codeforces
// Difficulty: ${problem?.difficulty || ''}

const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
const lines = [];
rl.on('line', line => lines.push(line.trim()));
rl.on('close', () => {
    // Parse input and solve
    const n = parseInt(lines[0]);

    // Write your solution here

});
`;
  }

  if (language === 'python') {
    return isLC
      ? `# ${problem?.title || 'Problem'}
# Platform: LeetCode | Difficulty: ${problem?.difficulty || ''}

class Solution:
    def ${fnName}(self, nums: list[int]) -> int:
        # Write your solution here
        pass
`
      : `# ${problem?.title || 'Problem'}
# Platform: Codeforces | Difficulty: ${problem?.difficulty || ''}

import sys
input = sys.stdin.readline

def solve():
    # Parse input
    n = int(input())

    # Write your solution here

t = int(input())
for _ in range(t):
    solve()
`;
  }

  if (language === 'cpp') {
    return isLC
      ? `// ${problem?.title || 'Problem'}
// Platform: LeetCode | Difficulty: ${problem?.difficulty || ''}

#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int ${fnName}(vector<int>& nums) {
        // Write your solution here

        return 0;
    }
};
`
      : `// ${problem?.title || 'Problem'}
// Platform: Codeforces | Difficulty: ${problem?.difficulty || ''}

#include <bits/stdc++.h>
using namespace std;

void solve() {
    int n;
    cin >> n;

    // Write your solution here

}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int t = 1;
    cin >> t;
    while (t--) solve();

    return 0;
}
`;
  }

  if (language === 'java') {
    return isLC
      ? `// ${problem?.title || 'Problem'}
// Platform: LeetCode | Difficulty: ${problem?.difficulty || ''}

class Solution {
    public int ${fnName}(int[] nums) {
        // Write your solution here

        return 0;
    }
}
`
      : `// ${problem?.title || 'Problem'}
// Platform: Codeforces | Difficulty: ${problem?.difficulty || ''}

import java.util.*;
import java.io.*;

public class Main {
    static BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
    static PrintWriter out = new PrintWriter(new BufferedOutputStream(System.out));

    public static void main(String[] args) throws IOException {
        int t = Integer.parseInt(br.readLine().trim());
        while (t-- > 0) {
            solve();
        }
        out.flush();
    }

    static void solve() throws IOException {
        int n = Integer.parseInt(br.readLine().trim());

        // Write your solution here

    }
}
`;
  }

  if (language === 'c') {
    return isLC
      ? `// ${problem?.title || 'Problem'}
// Platform: LeetCode | Difficulty: ${problem?.difficulty || ''}
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int ${fnName}(int* nums, int numsSize) {
    // Write your solution here

    return 0;
}
`
      : `// ${problem?.title || 'Problem'}
// Platform: Codeforces | Difficulty: ${problem?.difficulty || ''}
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

void solve() {
    int n;
    scanf("%d", &n);

    // Write your solution here

}

int main() {
    int t;
    scanf("%d", &t);
    while (t--) {
        solve();
    }
    return 0;
}
`;
  }

  return '// Start coding here\n';
};

// ─────────────────────────────────────────────────────────────────────────────
// Verdict badge component
// ─────────────────────────────────────────────────────────────────────────────
const VerdictBadge = ({ verdict }) => {
  if (!verdict) return null;
  const map = {
    Accepted:           { icon: <CheckCircle2 size={12} />, cls: 'text-[#10b981] bg-[#10b981]/10 border-[#10b981]/20' },
    'Wrong Answer':     { icon: <XCircle size={12} />,      cls: 'text-red-400 bg-red-900/10 border-red-900/20' },
    'Runtime Error':    { icon: <AlertCircle size={12} />,  cls: 'text-orange-400 bg-orange-900/10 border-orange-900/20' },
    'Time Limit Exceeded': { icon: <Clock size={12} />,     cls: 'text-yellow-400 bg-yellow-900/10 border-yellow-900/20' },
    'Compilation Error':{ icon: <XCircle size={12} />,      cls: 'text-red-400 bg-red-900/10 border-red-900/20' },
  };
  const style = map[verdict] || { icon: <AlertCircle size={12} />, cls: 'text-zinc-400 bg-zinc-800 border-zinc-700' };
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold font-mono px-2.5 py-1 rounded-lg border ${style.cls}`}>
      {style.icon} {verdict}
    </span>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Match Room component
// ─────────────────────────────────────────────────────────────────────────────
export default function MatchRoom() {
  const router = useRouter();
  const { id: roomCode } = router.query;
  const { user, loading: authLoading } = useAuth();
  const editorRef = useRef(null);

  const [socket, setSocket] = useState(null);
  const [roomState, setRoomState] = useState(null);
  const [players, setPlayers] = useState({});
  const [problem, setProblem] = useState(null);
  const [settings, setSettings] = useState({});

  // Lobby
  const [ready, setReady] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(1800);

  // Editor state
  const [language, setLanguage] = useState('cpp');
  const [code, setCode] = useState('');
  const [fontSize, setFontSize] = useState(14);
  const [fullscreen, setFullscreen] = useState(false);

  // Tabs: 'problem' | 'editor' (mobile only; desktop shows both)
  const [activeTab, setActiveTab] = useState('problem');

  // Problem panel sub-tab
  const [problemTab, setProblemTab] = useState('description'); // 'description' | 'hints'

  // Custom test input
  const [customInput, setCustomInput] = useState('');
  const [customInputOpen, setCustomInputOpen] = useState(false);

  // Console / output
  const [consoleOpen, setConsoleOpen] = useState(true);
  const [consoleLogs, setConsoleLogs] = useState([]);
  const [lastVerdict, setLastVerdict] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Progress telemetry
  const [myProgress, setMyProgress] = useState(0);
  const [oppProgress, setOppProgress] = useState(0);
  const [oppLineCount, setOppLineCount] = useState(0);
  const [oppCharCount, setOppCharCount] = useState(0);
  const [oppLanguage, setOppLanguage] = useState('cpp');

  // Hints reveal state
  const [revealedHints, setRevealedHints] = useState({});

  // Match result & refs
  const [matchResult, setMatchResult] = useState(null);
  const typingTimeoutRef = useRef(null);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;

    try {
      monaco.editor.defineTheme('arena-cyber', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'comment', foreground: '6272a4', fontStyle: 'italic' },
          { token: 'keyword', foreground: 'ff79c6', fontStyle: 'bold' },
          { token: 'number', foreground: 'bd93f9' },
          { token: 'string', foreground: 'f1fa8c' },
          { token: 'operator', foreground: 'ff79c6' },
          { token: 'function', foreground: '50fa7b', fontStyle: 'bold' },
          { token: 'variable', foreground: 'f8f8f2' },
          { token: 'type', foreground: '8be9fd', fontStyle: 'bold' },
          { token: 'delimiter', foreground: 'f8f8f2' },
        ],
        colors: {
          'editor.background': '#06070b',
          'editor.foreground': '#f8f8f2',
          'editor.lineHighlightBackground': '#0e101a',
          'editorCursor.foreground': '#00f0ff',
          'editorLineNumber.foreground': '#3b4261',
          'editorLineNumber.activeForeground': '#00f0ff',
          'editor.selectionBackground': '#282a36',
          'editor.inactiveSelectionBackground': '#282a3680',
          'editorIndentGuide.background': '#151722',
          'editorIndentGuide.activeBackground': '#2d3148',
          'editorWidget.background': '#0c0d14',
          'editorWidget.border': '#1e2030',
        }
      });

      monaco.editor.setTheme('arena-cyber');
    } catch (e) {
      console.error(e);
    }
  };


  // ── Auth guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  // ── Socket setup ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!roomCode || !user) return;
    const token = localStorage.getItem('token');
    const s = io('http://localhost:5000', { auth: { token } });

    s.on('connect', () => {
      s.emit('join-private-room', { roomCode });
    });

    s.on('player-joined', (data) => {
      setPlayers(data.players);
      setSettings(data.settings);
      setRoomState('waiting');
    });

    s.on('match-found', (data) => {
      setPlayers(data.players);
      setProblem(data.problem);
      setSettings(data.settings);
      setRoomState('waiting');
    });

    s.on('ready-status-updated', (data) => setPlayers(data.players));

    s.on('countdown-start', ({ delay }) => {
      setRoomState('countdown');
      setCountdown(delay);
    });

    s.on('battle-start', ({ problem, startTime, timeLimit }) => {
      setProblem(problem);
      setStartTime(startTime);
      setRoomState('playing');
      setTimeRemaining(timeLimit * 60);
    });

    s.on('opponent-code-sync', (data) => {
      setOppProgress(data.progress);
      setOppLineCount(data.lineCount);
      setOppCharCount(data.charCount);
      setOppLanguage(data.language);
    });

    s.on('opponent-submission', ({ username, verdict }) => {
      setConsoleLogs(prev => [
        ...prev,
        { text: `⚠ ${username} submitted → ${verdict}`, type: 'info', ts: new Date().toLocaleTimeString() }
      ]);
    });

    s.on('match-ended', (result) => {
      setMatchResult(result);
      setRoomState('finished');
    });

    s.on('room-error', (err) => { alert(err); router.push('/dashboard'); });
    s.on('error-msg',  (msg) => { alert(msg); router.push('/dashboard'); });

    setSocket(s);
    return () => s.disconnect();
  }, [roomCode, user]);

  // ── Set starter code when platform + language + problem are known ──────────
  useEffect(() => {
    if (!problem) return;
    const platform = settings?.platform || problem?.platform || 'Codeforces';
    const starter = getStarterCode(platform, language, problem);
    setCode(starter);
    setConsoleLogs([]);
    setLastVerdict(null);
  }, [language, problem, settings]);

  // ── Lobby countdown ────────────────────────────────────────────────────────
  useEffect(() => {
    if (roomState === 'countdown' && countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [roomState, countdown]);

  // ── Match timer ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (roomState === 'playing' && startTime) {
      const interval = setInterval(() => {
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        const limit = (settings.timeLimit || 30) * 60;
        const remain = Math.max(0, limit - elapsed);
        setTimeRemaining(remain);
        if (remain <= 0) clearInterval(interval);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [roomState, startTime, settings]);

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey && e.key === 'Enter') { e.preventDefault(); handleRun(); }
      if (e.ctrlKey && e.shiftKey && e.key === 'Enter') { e.preventDefault(); handleSubmit(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [code, language]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleEditorChange = useCallback((newCode) => {
    const val = newCode || '';
    setCode(val);
    const lineCount = val.split('\n').length;
    const charCount = val.length;
    const progress = Math.min(100, Math.round((lineCount / 40) * 100));
    setMyProgress(progress);
    if (socket) {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('code-sync', { roomCode, progress, charCount, lineCount, language });
      }, 150);
    }
  }, [socket, roomCode, language]);

  const handleRun = () => {
    if (isRunning || isSubmitting || !socket) return;
    setIsRunning(true);
    setConsoleOpen(true);
    setLastVerdict(null);
    setConsoleLogs([{ text: '▶ Running against sample cases...', type: 'info', ts: new Date().toLocaleTimeString() }]);
    socket.emit('submit-solution', { roomCode, code, language });
    socket.once('submission-verdict', (data) => {
      setIsRunning(false);
      if (data.error) {
        setConsoleLogs(prev => [...prev, { text: `Error: ${data.error}`, type: 'error', ts: new Date().toLocaleTimeString() }]);
        setLastVerdict('Runtime Error');
        return;
      }
      const passed = data.passedCount ?? 0;
      const total  = data.totalCount  ?? 0;
      const v = data.verdict;
      setLastVerdict(v);
      setConsoleLogs(prev => [
        ...prev,
        {
          text: v === 'Accepted'
            ? `✔ All ${total} sample cases passed.`
            : `✘ ${v} — Passed ${passed}/${total} cases.`,
          type: v === 'Accepted' ? 'success' : 'error',
          ts: new Date().toLocaleTimeString()
        }
      ]);
    });
  };

  const handleSubmit = () => {
    if (isRunning || isSubmitting || !socket) return;
    setIsSubmitting(true);
    setConsoleOpen(true);
    setLastVerdict(null);
    setConsoleLogs([{ text: '⏫ Submitting solution — running full test suite...', type: 'info', ts: new Date().toLocaleTimeString() }]);
    socket.emit('submit-solution', { roomCode, code, language });
    socket.once('submission-verdict', (data) => {
      setIsSubmitting(false);
      if (data.error) {
        setConsoleLogs(prev => [...prev, { text: `Error: ${data.error}`, type: 'error', ts: new Date().toLocaleTimeString() }]);
        setLastVerdict('Runtime Error');
        return;
      }
      const v = data.verdict;
      setLastVerdict(v);
      setConsoleLogs(prev => [
        ...prev,
        {
          text: v === 'Accepted'
            ? `✔ ACCEPTED — Passed all ${data.totalCount} cases. Declaring victory...`
            : `✘ ${v} — Passed ${data.passedCount}/${data.totalCount} cases.`,
          type: v === 'Accepted' ? 'success' : 'error',
          ts: new Date().toLocaleTimeString()
        }
      ]);
    });
  };

  const handleForfeit = () => {
    if (confirm('Forfeit match? You will lose rating ELO.') && socket) {
      socket.emit('forfeit-match', { roomCode });
    }
  };

  const handleReset = () => {
    if (!problem) return;
    const platform = settings?.platform || problem?.platform || 'Codeforces';
    setCode(getStarterCode(platform, language, problem));
    setConsoleLogs([]);
    setLastVerdict(null);
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const timeColor = timeRemaining < 300
    ? 'text-red-400'
    : timeRemaining < 600
    ? 'text-orange-400'
    : 'text-[#10b981]';

  // ────────────────────────────────────────────────────────────────────────────
  // AUTH LOADING
  // ────────────────────────────────────────────────────────────────────────────
  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#060609]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#0088ff]/30 border-t-[#0088ff] animate-spin" />
          <span className="text-xs text-zinc-500 font-mono uppercase tracking-widest animate-pulse">Connecting...</span>
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // LOBBY WAITING SCREEN
  // ────────────────────────────────────────────────────────────────────────────
  if (roomState === 'waiting') {
    const userIdStr = (user?._id || user?.id)?.toString();
    const playerIds = Object.keys(players);
    const opponentId = playerIds.find(id => id !== userIdStr);
    const oppInfo  = opponentId ? players[opponentId] : null;
    const selfInfo = userIdStr ? players[userIdStr] : null;

    return (
      <div className="min-h-screen bg-[#060609] flex items-center justify-center p-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(0,136,255,0.06),transparent_70%)] pointer-events-none" />

        <div className="relative z-10 w-full max-w-lg bg-gradient-to-br from-white/5 to-white/[0.01] border border-white/5 rounded-2xl p-8 shadow-2xl backdrop-blur-md">
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent absolute top-0 left-0 right-0 rounded-t-2xl" />

          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Private Room</p>
              <h2 className="text-lg font-black text-white mt-0.5 flex items-center gap-2">
                <Users size={16} className="text-[#0088ff]" /> Battle Lobby
              </h2>
            </div>
            <div className="font-mono bg-white/5 border border-white/5 px-4 py-2 text-xs text-[#0088ff] font-bold rounded-xl">
              {roomCode}
            </div>
          </div>

          {/* Match Settings */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            {[
              { label: 'Platform',   value: settings.platform   || '—' },
              { label: 'Difficulty', value: settings.difficulty || '—' },
              { label: 'Topic',      value: settings.topic      || '—' },
              { label: 'Time Limit', value: settings.timeLimit ? `${settings.timeLimit} min` : '—' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3">
                <span className="text-[10px] text-zinc-500 font-mono uppercase block">{label}</span>
                <span className="text-sm font-bold text-white mt-0.5 block capitalize">{value}</span>
              </div>
            ))}
          </div>

          {/* Player cards */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            {[
              { info: selfInfo, label: 'YOU', isReady: selfInfo?.ready },
              { info: oppInfo,  label: 'OPP', isReady: oppInfo?.ready, waiting: !oppInfo },
            ].map(({ info, label, isReady, waiting }) => (
              <div
                key={label}
                className={`rounded-xl border p-4 transition-all ${
                  isReady ? 'border-[#10b981]/30 bg-[#10b981]/5' : 'border-white/5 bg-white/[0.02]'
                }`}
              >
                {waiting ? (
                  <div className="flex flex-col items-center justify-center h-full py-4 text-[10px] text-zinc-500 font-mono uppercase gap-2">
                    <span className="animate-pulse">Awaiting opponent...</span>
                    <button
                      type="button"
                      onClick={() => socket?.emit('add-bot-opponent', { roomCode })}
                      className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600/30 to-teal-600/30 border border-emerald-500/40 text-emerald-400 font-extrabold text-[10px] hover:border-emerald-400 transition-all cursor-pointer shadow-sm"
                    >
                      🤖 Add AI Bot
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 mb-3">
                      <img src={info?.profilePicture} alt="" className="w-9 h-9 rounded-full border border-white/10 object-cover" />
                      <div>
                        <div className="text-xs font-bold text-white">{info?.username}</div>
                        <div className="text-[10px] text-zinc-500 font-mono">{info?.rating} ELO</div>
                      </div>
                    </div>
                    <div className={`text-[10px] font-black font-mono uppercase text-center py-1.5 rounded-lg ${
                      isReady ? 'bg-[#10b981]/15 text-[#10b981]' : 'bg-white/5 text-zinc-500'
                    }`}>
                      {isReady ? '✓ Ready' : 'Not Ready'}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                const next = !ready;
                setReady(next);
                socket?.emit('player-ready', { roomCode, ready: next });
              }}
              className={`flex-1 py-4 rounded-xl text-sm font-black uppercase tracking-wider transition-all cursor-pointer ${
                ready
                  ? 'bg-[#10b981] text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                  : 'bg-white/10 text-white hover:bg-white/15 border border-white/10'
              }`}
            >
              {ready ? '✓ Ready!' : 'Click to Ready'}
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-4 rounded-xl text-sm font-bold text-red-400 bg-red-900/10 border border-red-900/20 hover:bg-red-900/20 transition-all cursor-pointer"
            >
              Leave
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // COUNTDOWN
  // ────────────────────────────────────────────────────────────────────────────
  if (roomState === 'countdown') {
    return (
      <div className="min-h-screen bg-[#060609] flex flex-col items-center justify-center gap-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(0,136,255,0.06),transparent_70%)] pointer-events-none" />
        <p className="text-xs text-zinc-500 font-mono uppercase tracking-widest">Battle starts in</p>
        <div className={`text-9xl font-black font-mono tabular-nums transition-all duration-300 ${
          countdown <= 3 ? 'text-red-400 scale-110' : 'text-white'
        }`}>
          {countdown}
        </div>
        <p className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest">Prepare your weapons</p>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // PLAYING — MAIN EDITOR ARENA
  // ────────────────────────────────────────────────────────────────────────────
  if (roomState === 'playing' && problem) {
    const currentUserIdStr = (user?._id || user?.id)?.toString();
    const oppName = Object.values(players).find(p => p.userId !== currentUserIdStr)?.username || 'Opponent';
    const oppAvatar = Object.values(players).find(p => p.userId !== currentUserIdStr)?.profilePicture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
    const platform = settings?.platform || problem?.platform || 'Codeforces';
    const isLC = platform === 'LeetCode';

    return (
      <div className={`bg-[#050508] text-white font-sans flex flex-col ${fullscreen ? 'fixed inset-0 z-50' : 'min-h-screen'}`}>

        {/* ── 1. FUTURISTIC ARENA TOP BAR ─────────────────────────────────── */}
        <div className="bg-[#08090f]/90 backdrop-blur-xl border-b border-white/[0.08] px-4 py-2.5 flex items-center justify-between gap-4 shrink-0 shadow-lg relative z-20">
          {/* Left: status + live timer */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-[#10b981] animate-ping" />
              <span className="text-[10px] font-extrabold font-mono text-[#10b981] uppercase tracking-widest">LIVE BATTLE</span>
            </div>
            <div className={`flex items-center gap-2 font-mono font-black text-lg tabular-nums px-3 py-1 rounded-xl bg-white/[0.03] border border-white/5 ${timeColor}`}>
              <Clock size={15} />
              {formatTime(timeRemaining)}
            </div>
          </div>

          {/* Center: problem info pill */}
          <div className="hidden md:flex items-center gap-3 flex-1 justify-center min-w-0">
            <span className={`text-[11px] font-extrabold font-mono uppercase px-3 py-1 rounded-xl border shadow-sm ${
              isLC
                ? 'text-amber-400 border-amber-500/30 bg-gradient-to-r from-amber-500/15 to-orange-500/15'
                : 'text-cyan-400 border-cyan-500/30 bg-gradient-to-r from-cyan-500/15 to-blue-500/15'
            }`}>
              {platform}
            </span>
            <span className="text-sm font-black text-white truncate max-w-[320px]">{problem.title}</span>
            <span className={`text-[10px] font-extrabold font-mono px-2.5 py-0.5 rounded-lg border uppercase tracking-wider ${
              problem.difficulty === 'Easy'   ? 'text-[#10b981] bg-[#10b981]/10 border-[#10b981]/30' :
              problem.difficulty === 'Medium' ? 'text-amber-400 bg-amber-400/10 border-amber-400/30' :
                                               'text-rose-400 bg-rose-400/10 border-rose-400/30'
            }`}>
              {problem.difficulty}
            </span>
          </div>

          {/* Right: Quick Run, Submit & Forfeit */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleRun}
              disabled={isRunning || isSubmitting}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-white/5 hover:bg-white/10 text-zinc-200 border border-white/10 transition-all disabled:opacity-40 cursor-pointer"
            >
              <Play size={12} className="fill-current text-cyan-400" />
              <span className="hidden sm:inline">Run</span>
            </button>

            <button
              onClick={handleSubmit}
              disabled={isRunning || isSubmitting}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-black rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all disabled:opacity-40 cursor-pointer border-none"
            >
              <Send size={12} />
              <span>Submit</span>
            </button>

            <button
              onClick={handleForfeit}
              className="px-3 py-1.5 text-xs font-bold text-rose-400 bg-rose-950/30 border border-rose-800/40 hover:bg-rose-900/40 rounded-xl transition-all cursor-pointer"
            >
              Forfeit
            </button>
          </div>
        </div>

        {/* ── 2. DUAL PLAYER COMBAT TELEMETRY HUD ───────────────────────── */}
        <div className="bg-[#090a12] border-b border-white/[0.06] px-5 py-2 flex items-center gap-6 text-xs font-mono shrink-0 shadow-inner">
          {/* Left Player (You) */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <img src={user?.profilePicture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} alt="" className="w-7 h-7 rounded-full border border-cyan-500/40 object-cover shadow-sm shrink-0" />
            <div className="flex items-center justify-between flex-1 min-w-0">
              <span className="text-zinc-200 font-bold truncate text-[11px]">{user?.username || 'You'}</span>
              <span className="text-cyan-400 font-black text-[12px]">{myProgress}%</span>
            </div>
            <div className="w-32 sm:w-48 h-2 bg-zinc-900 rounded-full overflow-hidden border border-white/5 shrink-0">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                style={{ width: `${myProgress}%` }}
              />
            </div>
            <span className="text-zinc-500 text-[10px] hidden md:inline shrink-0">{code.length}ch · {code.split('\n').length}L</span>
          </div>

          {/* Center VS Emblem */}
          <div className="px-2.5 py-0.5 rounded-lg bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-rose-500/10 border border-white/10 text-[10px] font-black text-zinc-400 font-mono tracking-widest shrink-0">
            VS
          </div>

          {/* Right Player (Opponent) */}
          <div className="flex items-center gap-3 flex-1 min-w-0 justify-end">
            <span className="text-zinc-500 text-[10px] hidden md:inline shrink-0">{oppCharCount}ch · {oppLineCount}L</span>
            <div className="w-32 sm:w-48 h-2 bg-zinc-900 rounded-full overflow-hidden border border-white/5 shrink-0">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(244,63,94,0.5)]"
                style={{ width: `${oppProgress}%` }}
              />
            </div>
            <div className="flex items-center justify-between flex-1 min-w-0">
              <span className="text-rose-400 font-black text-[12px]">{oppProgress}%</span>
              <span className="text-zinc-200 font-bold truncate text-[11px] text-right">{oppName}</span>
            </div>
            <img src={oppAvatar} alt="" className="w-7 h-7 rounded-full border border-rose-500/40 object-cover shadow-sm shrink-0" />
          </div>
        </div>

        {/* ── 3. MAIN ARENA SPLIT PANE ──────────────────────────────────── */}
        <div className="flex flex-1 overflow-hidden">

          {/* ────── Left: Problem Panel ────── */}
          <div className="hidden lg:flex w-[42%] flex-col border-r border-white/[0.08] overflow-hidden bg-[#07080d]">

            {/* Problem panel sub-tabs */}
            <div className="flex border-b border-white/[0.08] shrink-0 bg-[#090a12]">
              {[
                { id: 'description', icon: <FileText size={13} />, label: 'Problem Statement' },
                { id: 'hints',       icon: <Lightbulb size={13} />, label: `Hints (${problem.hints?.length || 0})` },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setProblemTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3 text-[11px] font-extrabold font-mono uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                    problemTab === tab.id
                      ? 'border-cyan-500 text-cyan-400 bg-cyan-500/10'
                      : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02]'
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* Problem content view */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin space-y-6">
              {problemTab === 'description' && (
                <div className="flex flex-col gap-6 text-sm">
                  {/* Title & metadata */}
                  <div className="border-b border-white/5 pb-4">
                    <h2 className="text-lg font-black text-white tracking-tight">{problem.title}</h2>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase">{problem.topic || 'General'}</span>
                      <span className="text-zinc-700">•</span>
                      <span className="text-[10px] font-mono text-zinc-500 uppercase">100 Points</span>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="text-zinc-300 leading-relaxed text-[13px] whitespace-pre-wrap font-sans bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                    {problem.description}
                  </div>

                  {/* Input / Output format cards */}
                  <div className="space-y-4">
                    <div className="bg-white/[0.02] border border-white/5 border-l-2 border-l-emerald-500 rounded-2xl p-4">
                      <h4 className="text-[10px] font-black text-emerald-400 font-mono uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        Input Format
                      </h4>
                      <p className="text-zinc-300 text-[12px] leading-relaxed font-sans">{problem.inputFormat}</p>
                    </div>

                    <div className="bg-white/[0.02] border border-white/5 border-l-2 border-l-cyan-500 rounded-2xl p-4">
                      <h4 className="text-[10px] font-black text-cyan-400 font-mono uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        Output Format
                      </h4>
                      <p className="text-zinc-300 text-[12px] leading-relaxed font-sans">{problem.outputFormat}</p>
                    </div>

                    <div className="bg-white/[0.02] border border-white/5 border-l-2 border-l-purple-500 rounded-2xl p-4">
                      <h4 className="text-[10px] font-black text-purple-400 font-mono uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        Constraints
                      </h4>
                      <pre className="text-zinc-300 text-[12px] font-mono whitespace-pre-wrap bg-black/40 p-2.5 rounded-xl border border-white/5">
                        {problem.constraints}
                      </pre>
                    </div>
                  </div>

                  {/* Sample Test Cases */}
                  <div>
                    <h4 className="text-[11px] font-extrabold text-white font-mono uppercase tracking-wider mb-3">Sample Cases</h4>
                    <div className="flex flex-col gap-4">
                      {problem.sampleCases.map((sc, idx) => (
                        <div key={idx} className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden shadow-lg">
                          <div className="px-4 py-2 bg-white/[0.03] border-b border-white/5 text-[10px] font-extrabold font-mono text-zinc-400 uppercase flex justify-between items-center">
                            <span>Example {idx + 1}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-0">
                            <div className="p-4 border-r border-white/5 bg-black/30">
                              <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase block mb-1.5">Input</span>
                              <pre className="text-[12px] text-emerald-300 font-mono whitespace-pre-wrap">{sc.input}</pre>
                            </div>
                            <div className="p-4 bg-black/30">
                              <span className="text-[10px] text-cyan-400 font-mono font-bold uppercase block mb-1.5">Output</span>
                              <pre className="text-[12px] text-cyan-300 font-mono whitespace-pre-wrap">{sc.output}</pre>
                            </div>
                          </div>
                          {sc.explanation && (
                            <div className="px-4 py-3 bg-black/20 border-t border-white/5">
                              <span className="text-[10px] text-zinc-500 font-mono uppercase block mb-1">Explanation</span>
                              <p className="text-[11px] text-zinc-300 leading-relaxed font-sans">{sc.explanation}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {problemTab === 'hints' && (
                <div className="flex flex-col gap-4">
                  {!problem.hints || problem.hints.length === 0 ? (
                    <div className="text-center py-12 text-zinc-600 text-xs font-mono uppercase">No hints provided</div>
                  ) : (
                    problem.hints.map((hint, idx) => {
                      const revealed = revealedHints[idx];
                      return (
                        <div key={idx} className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 shadow-lg">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[11px] font-black font-mono text-amber-400 uppercase">Hint {idx + 1}</span>
                            {!revealed && (
                              <button
                                onClick={() => setRevealedHints(p => ({ ...p, [idx]: true }))}
                                className="text-[10px] font-extrabold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-lg font-mono uppercase cursor-pointer hover:bg-amber-500/20 transition-all"
                              >
                                Reveal Hint
                              </button>
                            )}
                          </div>
                          {revealed ? (
                            <p className="text-[12px] text-zinc-200 leading-relaxed">{hint}</p>
                          ) : (
                            <div className="h-6 bg-white/5 rounded-xl blur-sm text-transparent select-none">hidden content string</div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ────── Right: Monaco Code Editor Panel ────── */}
          <div className="flex-1 flex flex-col overflow-hidden bg-[#07080c]">

            {/* IDE Controls Header */}
            <div className="bg-[#090a10] border-b border-white/[0.08] px-4 py-2 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <Code2 size={14} className="text-cyan-400" />
                <select
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                  className="bg-white/5 border border-white/10 text-white text-xs font-bold font-mono rounded-xl px-3 py-1.5 outline-none cursor-pointer hover:bg-white/10 transition-colors"
                >
                  {LANGUAGES.map(l => (
                    <option key={l.id} value={l.id}>{l.label}</option>
                  ))}
                </select>
              </div>

              {/* Font size & Reset */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-mono bg-white/5 px-2.5 py-1 rounded-xl border border-white/5">
                  <button onClick={() => setFontSize(f => Math.max(10, f - 1))} className="hover:text-white transition-colors cursor-pointer px-1 font-bold">−</button>
                  <span>{fontSize}px</span>
                  <button onClick={() => setFontSize(f => Math.min(20, f + 1))} className="hover:text-white transition-colors cursor-pointer px-1 font-bold">+</button>
                </div>

                <button
                  onClick={handleReset}
                  title="Reset to starter template"
                  className="p-1.5 text-zinc-400 hover:text-white transition-colors cursor-pointer rounded-xl hover:bg-white/10 border border-transparent hover:border-white/10"
                >
                  <RotateCcw size={14} />
                </button>

                <button
                  onClick={() => setFullscreen(f => !f)}
                  className="p-1.5 text-zinc-400 hover:text-white transition-colors cursor-pointer rounded-xl hover:bg-white/10 border border-transparent hover:border-white/10"
                >
                  {fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </button>
              </div>
            </div>

            {/* Monaco Editor Canvas */}
            <div className="flex-1 overflow-hidden relative border-b border-white/[0.06]">
              {/* VS Code Style File Tab Header */}
              <div className="bg-[#05060a] border-b border-white/5 px-4 py-1.5 flex items-center justify-between text-[11px] font-mono text-zinc-400">
                <div className="flex items-center gap-2 bg-[#07080d] border border-white/10 px-3 py-1 rounded-t-lg text-cyan-400 font-bold border-b-transparent">
                  <Code2 size={12} />
                  <span>solution{LANGUAGES.find(l => l.id === language)?.ext || '.cpp'}</span>
                </div>
                <span className="text-[10px] text-zinc-600 font-mono">Theme: Arena Cyber Dark</span>
              </div>

              <Editor
                height="calc(100% - 28px)"
                language={LANGUAGES.find(l => l.id === language)?.monacoLang || 'javascript'}
                theme="vs-dark"
                value={code}
                onChange={handleEditorChange}
                onMount={handleEditorDidMount}
                options={{
                  minimap: { enabled: false },
                  fontSize,
                  fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
                  fontLigatures: true,
                  lineNumbers: 'on',
                  lineHeight: 24,
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  automaticLayout: true,
                  renderLineHighlight: 'line',
                  bracketPairColorization: { enabled: true },
                  smoothScrolling: true,
                  cursorBlinking: 'smooth',
                  cursorStyle: 'line',
                  padding: { top: 14, bottom: 14 },
                }}
              />
            </div>


            {/* Docked Console Panel */}
            <div className="shrink-0 bg-[#08090f] border-t border-white/[0.08] shadow-2xl">
              {/* Console Bar Header */}
              <div className="flex items-center justify-between px-4 py-2 bg-[#0a0b12] border-b border-white/5">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setConsoleOpen(o => !o)}
                    className="flex items-center gap-2 text-[11px] font-extrabold font-mono text-zinc-300 hover:text-white transition-colors cursor-pointer uppercase tracking-wider"
                  >
                    <Terminal size={13} className="text-cyan-400" />
                    Execution Output
                    {consoleOpen ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
                  </button>
                  {lastVerdict && <VerdictBadge verdict={lastVerdict} />}
                </div>

                <button
                  onClick={() => setCustomInputOpen(o => !o)}
                  className="text-[10px] font-mono font-bold text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer uppercase tracking-wider bg-white/5 px-2.5 py-1 rounded-lg border border-white/5"
                >
                  {customInputOpen ? 'Hide Custom Input' : 'Custom Input (stdin)'}
                </button>
              </div>

              {/* Custom stdin area */}
              {customInputOpen && (
                <div className="px-4 py-3 border-b border-white/5 bg-black/40">
                  <p className="text-[10px] text-zinc-400 font-mono uppercase mb-1.5 font-bold">Standard Input (stdin)</p>
                  <textarea
                    value={customInput}
                    onChange={e => setCustomInput(e.target.value)}
                    rows={3}
                    placeholder="Enter custom stdin test input here..."
                    className="w-full bg-[#050508] border border-white/10 rounded-xl p-3 text-xs font-mono text-zinc-200 placeholder-zinc-700 outline-none resize-none focus:border-cyan-500/50"
                  />
                </div>
              )}

              {/* Console log list */}
              {consoleOpen && (
                <div className="h-28 overflow-y-auto px-4 py-3 space-y-1.5 scrollbar-thin bg-black/50 font-mono">
                  {consoleLogs.length === 0 ? (
                    <p className="text-[11px] text-zinc-600">Console ready. Click Run or Press ⌃↵ to execute.</p>
                  ) : (
                    consoleLogs.map((log, i) => (
                      <div key={i} className="flex items-start gap-2 text-[11px]">
                        <span className="text-zinc-600 shrink-0">{log.ts}</span>
                        <span className={
                          log.type === 'success' ? 'text-emerald-400 font-bold' :
                          log.type === 'error'   ? 'text-rose-400 font-bold'   :
                          'text-zinc-300'
                        }>
                          {log.text}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Match Result Modal */}
        {matchResult && (
          <MatchResultModal
            result={matchResult}
            myId={(user?._id || user?.id)?.toString()}
            userCode={code}
            language={language}
            problem={problem}
            onReturnToLobby={() => router.push('/dashboard')}
          />
        )}
      </div>
    );
  }


  // ────────────────────────────────────────────────────────────────────────────
  // FALLBACK
  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#060609] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#0088ff]/30 border-t-[#0088ff] animate-spin" />
        <span className="text-xs text-zinc-500 font-mono uppercase tracking-widest animate-pulse">Retrieving room state...</span>
      </div>
    </div>
  );
}
