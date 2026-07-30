import Link from "next/link";
import { Cpu, Zap, Trophy, Shield } from "lucide-react";
import { CinematicHero } from "@/components/ui/cinematic-landing-hero";

export default function Home() {
  const phoneWidgets = (
    <div className="space-y-3">
      <div className="phone-widget widget-depth rounded-2xl p-3 flex items-center">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/5 flex items-center justify-center mr-3 border border-blue-400/20 shadow-inner">
          <Zap className="w-5 h-5 text-blue-400 drop-shadow-md" />
        </div>
        <div className="flex-1">
          <div className="text-[10px] text-neutral-300 font-bold">Telemetry Sync</div>
          <div className="text-[8px] text-neutral-500 font-medium">Opponent is typing...</div>
        </div>
      </div>
      <div className="phone-widget widget-depth rounded-2xl p-3 flex items-center">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/5 flex items-center justify-center mr-3 border border-emerald-400/20 shadow-inner">
          <Shield className="w-5 h-5 text-emerald-400 drop-shadow-md" />
        </div>
        <div className="flex-1">
          <div className="text-[10px] text-neutral-300 font-bold">Test Sandbox</div>
          <div className="text-[8px] text-emerald-400 font-medium">12/12 Cases Passed</div>
        </div>
      </div>
    </div>
  );

  const ctaButtons = (
    <div className="flex flex-col sm:flex-row gap-6">
      <Link href="/dashboard" className="btn-modern-light flex items-center justify-center gap-3 px-8 py-4 rounded-[1.25rem] group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
        <Cpu className="w-7 h-7 text-[#0088ff] transition-transform group-hover:scale-105" />
        <div className="text-left">
          <div className="text-[10px] font-bold tracking-wider text-neutral-500 uppercase mb-[-2px]">LAUNCH GAME</div>
          <div className="text-xl font-bold leading-none tracking-tight">ENTER ARENA</div>
        </div>
      </Link>
      <Link href="/leaderboard" className="btn-modern-dark flex items-center justify-center gap-3 px-8 py-4 rounded-[1.25rem] group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
        <Trophy className="w-7 h-7 text-[#ff5500] transition-transform group-hover:scale-105" />
        <div className="text-left">
          <div className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase mb-[-2px]">LEADERBOARDS</div>
          <div className="text-xl font-bold leading-none tracking-tight">VIEW RANKINGS</div>
        </div>
      </Link>
    </div>
  );

  return (
    <div className="overflow-x-hidden w-full min-h-screen relative">
      {/* Floating Pill Header Navigation */}
      <header className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-5xl rounded-full bg-[#050811]/60 border border-white/5 backdrop-blur-md py-3 px-6 flex justify-between items-center z-50 shadow-2xl shadow-black/40">
        <div className="flex items-center gap-2">
          {/* Logo with 5 dots cross layout */}
          <div className="flex flex-col gap-[3px] items-center justify-center mr-1">
            <div className="w-[5px] h-[5px] rounded-full bg-[#0088ff] animate-pulse" />
            <div className="flex gap-[3px]">
              <div className="w-[5px] h-[5px] rounded-full bg-[#0088ff]" />
              <div className="w-[5px] h-[5px] rounded-full bg-[#0088ff] shadow-[0_0_8px_#0088ff]" />
              <div className="w-[5px] h-[5px] rounded-full bg-[#0088ff]" />
            </div>
            <div className="w-[5px] h-[5px] rounded-full bg-[#0088ff] animate-pulse" />
          </div>
          <span className="font-bold text-sm tracking-widest text-white font-mono">ARENA 1V1</span>
        </div>
        
        {/* Navigation links */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/dashboard" className="text-xs font-mono font-bold tracking-wider text-neutral-400 hover:text-white transition-all">
            ARENA
          </Link>
          <Link href="/leaderboard" className="text-xs font-mono font-bold tracking-wider text-neutral-400 hover:text-white transition-all">
            LEADERBOARD
          </Link>
          <Link href="/register" className="text-xs font-mono font-bold tracking-wider text-neutral-400 hover:text-white transition-all">
            REGISTER
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/login" className="px-5 py-2 rounded-full border border-white/10 text-xs font-bold tracking-wider text-white hover:bg-white/5 transition-all">
            LOGIN
          </Link>
          <Link href="/register" className="px-5 py-2 rounded-full bg-white text-neutral-950 text-xs font-black tracking-wider hover:bg-neutral-200 transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)]">
            SIGNUP
          </Link>
        </div>
      </header>

      {/* Cinematic Hero adapted for Arena 1v1 */}
      <CinematicHero
        brandName="ARENA"
        tagline1="Speed run the"
        tagline2="algorithms."
        cardHeading="Real-time coding duels."
        cardDescription={
          <>
            <span className="text-white font-semibold">Arena 1v1</span> duels coders in real-time speed challenges. Sourced from Codeforces and LeetCode. First accepted solution wins ELO.
          </>
        }
        metricValue={1500}
        metricLabel="ELO Rating"
        ctaHeading="Launch the game."
        ctaDescription="Join thousands of coders competing in real-time matchmaking. Launch the game and start your climb today."
        
        phoneHeaderTitle="Queue Status"
        phoneHeaderSubtitle="Matchmaking"
        phoneHeaderInitials="1v1"
        badge1Emoji="⚔️"
        badge1Text="Grandmaster"
        badge1Subtext="10 Win Streak"
        badge2Emoji="🏆"
        badge2Text="+25 ELO Gained"
        badge2Subtext="Last match won"
        phoneWidgets={phoneWidgets}
        ctaButtons={ctaButtons}
      />
    </div>
  );
}
