'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ShieldAlert, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { Ripple, TechOrbitDisplay } from '@/components/blocks/modern-animated-sign-in';
import Image from 'next/image';

const INJECTED_STYLES = `
  .film-grain {
      position: absolute; inset: 0; width: 100%; height: 100%;
      pointer-events: none; z-index: 50; opacity: 0.05; mix-blend-mode: overlay;
      background: url('data:image/svg+xml;utf8,<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><filter id="noiseFilter"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23noiseFilter)"/></svg>');
  }
`;

const iconsArray = [
  {
    component: () => (
      <Image
        width={100}
        height={100}
        src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/cplusplus/cplusplus-original.svg"
        alt="C++"
        className="w-full h-full object-contain"
      />
    ),
    className: 'w-[45px] h-[45px] border-none bg-transparent',
    duration: 22,
    delay: 10,
    radius: 120,
    path: false,
    reverse: false,
  },
  {
    component: () => (
      <Image
        width={100}
        height={100}
        src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg"
        alt="Python"
        className="w-full h-full object-contain"
      />
    ),
    className: 'w-[45px] h-[45px] border-none bg-transparent',
    duration: 22,
    delay: 20,
    radius: 120,
    path: false,
    reverse: false,
  },
  {
    component: () => (
      <Image
        width={100}
        height={100}
        src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/java/java-original.svg"
        alt="Java"
        className="w-full h-full object-contain"
      />
    ),
    className: 'w-[45px] h-[45px] border-none bg-transparent',
    duration: 24,
    delay: 5,
    radius: 180,
    path: false,
    reverse: true,
  },
  {
    component: () => (
      <Image
        width={100}
        height={100}
        src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/go/go-original.svg"
        alt="Go"
        className="w-full h-full object-contain"
      />
    ),
    className: 'w-[45px] h-[45px] border-none bg-transparent',
    duration: 24,
    delay: 25,
    radius: 180,
    path: false,
    reverse: true,
  },
  {
    component: () => (
      <Image
        width={100}
        height={100}
        src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/javascript/javascript-original.svg"
        alt="JavaScript"
        className="w-full h-full object-contain"
      />
    ),
    className: 'w-[45px] h-[45px] border-none bg-transparent',
    radius: 250,
    duration: 20,
    delay: 15,
    path: false,
    reverse: false,
  },
  {
    component: () => (
      <Image
        width={100}
        height={100}
        src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg"
        alt="TypeScript"
        className="w-full h-full object-contain"
      />
    ),
    className: 'w-[45px] h-[45px] border-none bg-transparent',
    radius: 250,
    duration: 20,
    delay: 35,
    path: false,
    reverse: false,
  },
];

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [codeforcesUsername, setCodeforcesUsername] = useState('');
  const [leetcodeUsername, setLeetcodeUsername] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { register, user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !email || !password) {
      setErrorMsg('Please fill in all required fields');
      return;
    }
    if (username.length < 3 || username.length > 15) {
      setErrorMsg('Username must be between 3 and 15 characters');
      return;
    }
    try {
      setErrorMsg('');
      await register(username, email, password, codeforcesUsername, leetcodeUsername);
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed. Check info or choose another username.');
    }
  };

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050811] relative overflow-hidden font-mono">
        <div className="text-xl text-[#0088ff] animate-pulse z-10">CREATING PROFILE...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050811] relative overflow-hidden flex flex-col justify-center py-6">
      <style dangerouslySetInnerHTML={{ __html: INJECTED_STYLES }} />
      <div className="film-grain" aria-hidden="true" />

      {/* Back to Home Button */}
      <div className="absolute top-6 left-6 z-50">
        <Link href="/" className="flex items-center gap-2 text-sm font-sans font-medium text-white hover:text-blue-200 transition-all bg-[#080b15]/90 border border-blue-500/35 hover:border-blue-400/70 px-6 py-2 rounded-full backdrop-blur-md shadow-[0_2px_12px_rgba(37,99,235,0.25)]">
          ← Back to Home
        </Link>
      </div>

      <section className="flex max-lg:justify-center w-full max-w-7xl mx-auto px-6 relative z-10 items-center">
        {/* Left Side: Animated Orbit & concentric rings */}
        <span className="flex flex-col justify-center w-1/2 max-lg:hidden relative h-[90dvh]">
          {/* Subtle tech background glow */}
          <div className="absolute w-[350px] h-[350px] rounded-full bg-[#0088ff]/5 blur-[90px] pointer-events-none" />
          <Ripple mainCircleSize={100} />
          <TechOrbitDisplay iconsArray={iconsArray} />
        </span>

        {/* Right Side: Register Form */}
        <span className="w-1/2 flex flex-col justify-center items-center max-lg:w-full max-lg:px-[5%]">
          <div className="w-full max-w-md flex flex-col text-left">
            {/* Header */}
            <div className="text-left mb-6">
              <h2 className="text-4xl font-bold text-white tracking-tight">
                Initialize profile
              </h2>
              <p className="text-sm text-neutral-400 mt-2 font-normal">
                Deploy your profile to the gaming network
              </p>
            </div>

            {/* Error Message Box */}
            {errorMsg && (
              <div className="mb-6 flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-2xl text-xs font-mono font-bold">
                <ShieldAlert className="text-red-400 shrink-0" size={18} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-white flex items-center gap-1">
                  <span>Codename (Username)</span>
                  <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Neo"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#121620] border border-neutral-800 rounded-xl p-4 text-white placeholder-neutral-500 outline-none text-sm transition-all focus:border-[#0088ff] focus:ring-1 focus:ring-[#0088ff]"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-white flex items-center gap-1">
                  <span>Email Address</span>
                  <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. pilot@arena.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#121620] border border-neutral-800 rounded-xl p-4 text-white placeholder-neutral-500 outline-none text-sm transition-all focus:border-[#0088ff] focus:ring-1 focus:ring-[#0088ff]"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-white flex items-center gap-1">
                  <span>Password</span>
                  <span className="text-red-500 font-bold">*</span>
                </label>
                <div className="relative w-full">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#121620] border border-neutral-800 rounded-xl p-4 pr-12 text-white placeholder-neutral-500 outline-none text-sm transition-all focus:border-[#0088ff] focus:ring-1 focus:ring-[#0088ff]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white cursor-pointer select-none bg-transparent border-none outline-none"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-white flex justify-between items-center">
                  <span>Codeforces User</span>
                  <span className="text-neutral-500 text-xs font-normal">Optional</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. tourist"
                  value={codeforcesUsername}
                  onChange={(e) => setCodeforcesUsername(e.target.value)}
                  className="w-full bg-[#121620] border border-neutral-800 rounded-xl p-4 text-white placeholder-neutral-500 outline-none text-sm transition-all focus:border-[#ff6600] focus:ring-1 focus:ring-[#ff6600]"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-white flex justify-between items-center">
                  <span>LeetCode User</span>
                  <span className="text-neutral-500 text-xs font-normal">Optional</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. lc_user"
                  value={leetcodeUsername}
                  onChange={(e) => setLeetcodeUsername(e.target.value)}
                  className="w-full bg-[#121620] border border-neutral-800 rounded-xl p-4 text-white placeholder-neutral-500 outline-none text-sm transition-all focus:border-[#ff6600] focus:ring-1 focus:ring-[#ff6600]"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full py-4 rounded-xl bg-[#121620] hover:bg-[#1b2234] border border-neutral-800 text-white font-semibold text-sm transition-colors mt-4 text-center flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>DEPLOY PROFILE</span>
                <ArrowRight size={16} />
              </button>
            </form>

            {/* Already have account */}
            <div className="text-left mt-6 text-sm text-neutral-400 font-mono">
              <span>Already have an account? </span>
              <Link href="/login" className="text-[#0088ff] hover:underline font-bold">
                LOG IN
              </Link>
            </div>
          </div>
        </span>
      </section>
    </div>
  );
}
