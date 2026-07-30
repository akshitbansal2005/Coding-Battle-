import React, { useState } from 'react';
import { Award, ShieldAlert, Clock, ArrowRight, Bot, Cpu, CheckCircle2, Sparkles, Code2, Copy, Check } from 'lucide-react';
import { api } from '@/utils/api';

export default function MatchResultModal({ result = {}, myId, userCode = '', language = 'javascript', problem = {}, onReturnToLobby }) {
  const isDraw = result?.draw || result?.winnerId === null;
  const isWinner = !isDraw && result?.winnerId === myId;
  const isForfeit = result?.forfeit;
  const elo = result?.eloChanges || { winnerChange: 0, loserChange: 0 };

  const winnerName = result?.winnerName;
  const selfRatingChange = isDraw ? 0 : (isWinner ? elo.winnerChange : elo.loserChange);
  const newRating = isDraw ? null : (isWinner ? elo.newWinnerRating : elo.newLoserRating);

  // Extract stats
  const stats = result.stats || {};
  const selfStats = stats[myId] || { username: 'You', charCount: 0, lineCount: 0, language };
  const opponentId = Object.keys(stats).find(id => id !== myId);
  const oppStats = opponentId ? stats[opponentId] : { username: 'Opponent', charCount: 0, lineCount: 0, language };

  // AI Review State
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [showOptimalCode, setShowOptimalCode] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchAIAnalysis = async () => {
    if (aiAnalysis) {
      setAiOpen(o => !o);
      return;
    }

    setAiLoading(true);
    setAiOpen(true);
    try {
      const data = await api.post('/matches/analyze', {
        code: userCode,
        language: selfStats.language || language,
        problemTitle: problem?.title || 'Competitive Problem',
        difficulty: problem?.difficulty || 'Medium',
        topic: problem?.topic || 'General',
      });
      setAiAnalysis(data);
    } catch (err) {
      console.error('AI Analysis failed:', err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleCopyCode = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-[#0b0b0d]/90 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className={`w-full max-w-xl game-card p-6 sm:p-8 text-center bg-[#131316] relative border my-auto ${
        isDraw ? 'border-neutral-500' : (isWinner ? 'border-[#00ff66]' : 'border-[#ff3344]')
      }`}>
        
        {/* Visual Header */}
        <div className="flex justify-center mb-4">
          {isDraw ? (
            <div className="p-4 bg-neutral-500/10 border border-neutral-500 rounded-full text-neutral-400 shadow-[0_0_20px_rgba(115,115,115,0.2)]">
              <Clock size={42} />
            </div>
          ) : isWinner ? (
            <div className="p-4 bg-[#00ff66]/10 border border-[#00ff66] rounded-full text-[#00ff66] shadow-[0_0_20px_rgba(0,255,102,0.2)]">
              <Award size={42} />
            </div>
          ) : (
            <div className="p-4 bg-[#ff3344]/10 border border-[#ff3344] rounded-full text-[#ff3344] shadow-[0_0_20px_rgba(255,51,68,0.2)]">
              <ShieldAlert size={42} />
            </div>
          )}
        </div>

        <h1 className={`text-2xl sm:text-3xl font-extrabold uppercase tracking-widest mb-1.5 font-mono ${
          isDraw ? 'text-neutral-400' : (isWinner ? 'text-[#00ff66]' : 'text-[#ff3344]')
        }`}>
          {isDraw ? 'DRAW MATCH' : (isWinner ? 'VICTORY' : 'DEFEAT')}
        </h1>
        
        <p className="text-xs text-[#94a3b8] mb-6 uppercase tracking-wider font-mono">
          {isDraw 
            ? 'Match time limit expired. The duel has ended in a draw!'
            : (isForfeit 
                ? (isWinner ? 'Opponent disconnected. You win by forfeit!' : 'You disconnected and forfeited the match.')
                : (isWinner ? 'You successfully compiled and submitted first!' : `${winnerName} submitted the accepted solution first.`)
              )
          }
        </p>

        <div className="grid grid-cols-2 gap-4 mb-6 text-xs font-mono">
          <div className="bg-[#0b0b0d] border border-[#222227] p-3.5 flex flex-col gap-1 rounded-xl">
            <span className="text-[#475569] text-[10px] font-bold uppercase">ELO ADJUSTMENT</span>
            <span className={`text-base sm:text-lg font-extrabold ${isDraw ? 'text-neutral-400' : (selfRatingChange >= 0 ? 'text-[#00ff66]' : 'text-[#ff3344]')}`}>
              {isDraw ? '±0 (No Change)' : `${selfRatingChange >= 0 ? `+${selfRatingChange}` : selfRatingChange} ${newRating ? `(New: ${newRating})` : ''}`}
            </span>
          </div>
          <div className="bg-[#0b0b0d] border border-[#222227] p-3.5 flex flex-col gap-1 rounded-xl">
            <span className="text-[#475569] text-[10px] font-bold uppercase">ELAPSED TIME</span>
            <span className="text-base sm:text-lg font-extrabold text-white flex items-center justify-center gap-1">
              <Clock size={14} />
              {Math.floor((result?.duration || 0) / 60)}m {(result?.duration || 0) % 60}s
            </span>
          </div>
        </div>

        {/* AI Review Trigger Button */}
        <div className="mb-6">
          <button
            onClick={fetchAIAnalysis}
            disabled={aiLoading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600/20 via-blue-600/20 to-purple-600/20 hover:from-cyan-600/30 hover:to-purple-600/30 border border-cyan-500/40 text-cyan-300 font-extrabold text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.15)] disabled:opacity-50"
          >
            {aiLoading ? (
              <>
                <Cpu size={15} className="animate-spin text-cyan-400" />
                <span>Running AI Code Inspection...</span>
              </>
            ) : (
              <>
                <Bot size={16} className="text-cyan-400" />
                <span>{aiOpen ? 'Hide AI Code Review' : '🤖 Generate AI Code Review & Complexity Analysis'}</span>
              </>
            )}
          </button>
        </div>

        {/* AI Review Drawer Panel */}
        {aiOpen && aiAnalysis && (
          <div className="mb-6 bg-[#080911] border border-cyan-500/30 rounded-2xl p-5 text-left font-mono space-y-4 animate-in fade-in slide-in-from-top-2 duration-300 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-cyan-400 font-extrabold text-xs uppercase tracking-wider">
                <Sparkles size={14} />
                <span>AI Battle Breakdown</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-400">Quality Score:</span>
                <span className={`text-xs font-black px-2 py-0.5 rounded-lg border ${
                  aiAnalysis.score >= 80 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                }`}>
                  {aiAnalysis.score}/100
                </span>
              </div>
            </div>

            {/* Complexity Badges HUD */}
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-white/[0.03] border border-cyan-500/20 rounded-xl p-3">
                <span className="text-[10px] text-zinc-400 uppercase block font-bold mb-1">Time Complexity</span>
                <span className="text-sm font-black text-cyan-300 tracking-wide">{aiAnalysis.timeComplexity}</span>
              </div>
              <div className="bg-white/[0.03] border border-purple-500/20 rounded-xl p-3">
                <span className="text-[10px] text-zinc-400 uppercase block font-bold mb-1">Space Complexity</span>
                <span className="text-sm font-black text-purple-300 tracking-wide">{aiAnalysis.spaceComplexity}</span>
              </div>
            </div>

            {/* Insights & Recommendations */}
            <div className="space-y-2 text-[11px]">
              {aiAnalysis.strengths?.map((s, idx) => (
                <div key={idx} className="flex items-start gap-2 text-emerald-300 bg-emerald-950/20 border border-emerald-900/30 p-2.5 rounded-lg">
                  <CheckCircle2 size={13} className="shrink-0 mt-0.5 text-emerald-400" />
                  <span>{s}</span>
                </div>
              ))}
              {aiAnalysis.recommendations?.map((r, idx) => (
                <div key={idx} className="flex items-start gap-2 text-amber-300 bg-amber-950/20 border border-amber-900/30 p-2.5 rounded-lg">
                  <Sparkles size={13} className="shrink-0 mt-0.5 text-amber-400" />
                  <span>{r}</span>
                </div>
              ))}
            </div>

            {/* Optimal Code Accordion */}
            <div className="pt-2">
              <button
                onClick={() => setShowOptimalCode(s => !s)}
                className="text-[10px] font-extrabold text-cyan-400 hover:text-cyan-300 flex items-center justify-between w-full bg-white/5 px-3 py-2 rounded-xl border border-white/5 cursor-pointer uppercase tracking-wider"
              >
                <span className="flex items-center gap-1.5">
                  <Code2 size={12} />
                  {showOptimalCode ? 'Hide Optimal Reference Solution' : 'View Optimal Reference Solution'}
                </span>
                <span>{showOptimalCode ? '▲' : '▼'}</span>
              </button>

              {showOptimalCode && (
                <div className="mt-2 relative bg-[#040508] border border-white/10 rounded-xl p-3 text-[11px] font-mono text-cyan-200 overflow-x-auto">
                  <button
                    onClick={() => handleCopyCode(aiAnalysis.optimalCode)}
                    className="absolute top-2 right-2 p-1.5 bg-white/10 hover:bg-white/20 text-zinc-300 rounded-lg text-[10px] flex items-center gap-1 transition-all cursor-pointer"
                  >
                    {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                  <pre className="whitespace-pre-wrap">{aiAnalysis.optimalCode}</pre>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="divider mb-4 font-bold tracking-wider text-[10px] text-[#475569] uppercase font-mono">PERFORMANCE DETAILS</div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 text-xs font-mono text-left">
          {/* Your Stats */}
          <div className="bg-[#0b0b0d] border border-[#222227] p-4 flex flex-col gap-2 rounded-xl">
            <div className="font-bold text-[#0088ff] uppercase">{selfStats.username} (YOU)</div>
            <div className="flex justify-between border-b border-[#222227]/40 pb-1 mt-1 text-[10px]">
              <span className="text-[#475569]">LANGUAGE:</span>
              <span className="text-white uppercase font-bold">{selfStats.language}</span>
            </div>
            <div className="flex justify-between border-b border-[#222227]/40 pb-1 text-[10px]">
              <span className="text-[#475569]">SIZE:</span>
              <span className="text-white">{selfStats.charCount} CHARS</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-[#475569]">LINES:</span>
              <span className="text-white">{selfStats.lineCount} LINES</span>
            </div>
          </div>

          {/* Opponent Stats */}
          <div className="bg-[#0b0b0d] border border-[#222227] p-4 flex flex-col gap-2 rounded-xl">
            <div className="font-bold text-[#ff5500] uppercase">{oppStats.username}</div>
            <div className="flex justify-between border-b border-[#222227]/40 pb-1 mt-1 text-[10px]">
              <span className="text-[#475569]">LANGUAGE:</span>
              <span className="text-white uppercase font-bold">{oppStats.language}</span>
            </div>
            <div className="flex justify-between border-b border-[#222227]/40 pb-1 text-[10px]">
              <span className="text-[#475569]">SIZE:</span>
              <span className="text-white">{oppStats.charCount} CHARS</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-[#475569]">LINES:</span>
              <span className="text-white">{oppStats.lineCount} LINES</span>
            </div>
          </div>
        </div>

        <button onClick={onReturnToLobby} className="btn-game w-full py-4 text-xs font-bold flex justify-center items-center gap-2 cursor-pointer">
          RETURN TO DASHBOARD
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}

