import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { LayoutGrid, Trophy, User, LogOut, Award, Camera, Check, X, Loader2, ChevronDown } from 'lucide-react';
import { api } from '@/utils/api';

export default function DashboardLayout({ children }) {
  const { user, logout, loading, updateUser } = useAuth();
  const router = useRouter();

  const fileInputRef = useRef(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploadState, setUploadState] = useState('idle');
  const [uploadError, setUploadError] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setUploadError('Only image files are supported.'); return; }
    if (file.size > 2 * 1024 * 1024) { setUploadError('Image must be under 2 MB.'); return; }
    setUploadError('');
    const reader = new FileReader();
    reader.onload = (event) => setAvatarPreview(event.target.result);
    reader.readAsDataURL(file);
  };

  const handleConfirmUpload = async () => {
    if (!avatarPreview) return;
    setUploadState('uploading');
    try {
      const result = await api.patch('/users/me/avatar', { profilePicture: avatarPreview });
      updateUser({ profilePicture: result.profilePicture });
      setAvatarPreview(null);
      setUploadState('success');
      setTimeout(() => setUploadState('idle'), 2000);
    } catch (err) {
      setUploadError(err.message || 'Upload failed.');
      setUploadState('error');
      setTimeout(() => setUploadState('idle'), 3000);
    }
  };

  const handleCancelPreview = () => {
    setAvatarPreview(null);
    setUploadError('');
    setUploadState('idle');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-sm text-zinc-400">Loading...</div>
      </div>
    );
  }

  const navItems = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Leaderboard', path: '/leaderboard' },
    { name: 'Profile', path: `/profile/${user.username}` },
    { name: 'Achievements', path: '/dashboard#achievements' },
  ];

  const currentAvatar = avatarPreview || user.profilePicture;

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a] text-white font-sans" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Top Navbar */}
      <header className="border-b border-white/8 bg-[#0a0a0a] sticky top-0 z-40">
        <div className="max-w-[1280px] mx-auto px-6 h-14 flex items-center justify-between">

          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0">
            <div className="w-7 h-7 rounded bg-white flex items-center justify-center">
              <span className="text-black text-xs font-black tracking-tight">1v1</span>
            </div>
            <span className="text-sm font-semibold text-white">Arena</span>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = router.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  href={item.path}
                  className={`px-3.5 py-1.5 rounded-md text-sm transition-colors ${
                    isActive
                      ? 'text-white font-medium bg-white/8'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {item.name}
                  {isActive && (
                    <span className="ml-1 inline-block w-1 h-1 rounded-full bg-white align-middle mb-0.5" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3" ref={profileRef}>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

            {/* Profile dropdown */}
            <button
              onClick={() => setProfileOpen(o => !o)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            >
              <div className="relative">
                <img
                  src={currentAvatar}
                  alt={user.username}
                  className={`w-7 h-7 rounded-full object-cover border transition-all ${
                    avatarPreview ? 'border-white/40' : 'border-white/10'
                  }`}
                />
                {uploadState === 'uploading' && (
                  <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                    <Loader2 size={10} className="text-white animate-spin" />
                  </div>
                )}
                {uploadState === 'success' && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full flex items-center justify-center border border-[#0a0a0a]">
                    <Check size={7} className="text-white" />
                  </div>
                )}
              </div>
              <span className="text-sm text-zinc-300 hidden sm:block">{user.username}</span>
              <ChevronDown size={14} className={`text-zinc-500 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {profileOpen && (
              <div className="absolute top-14 right-4 w-52 bg-[#111111] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-white/5">
                  <div className="text-sm font-medium text-white">{user.username}</div>
                  <div className="text-xs text-zinc-500 mt-0.5">{user.rating} ELO</div>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => { fileInputRef.current?.click(); setProfileOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer text-left"
                  >
                    <Camera size={14} className="text-zinc-500" />
                    Change avatar
                  </button>
                  <Link
                    href={`/profile/${user.username}`}
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <User size={14} className="text-zinc-500" />
                    View profile
                  </Link>
                  <div className="border-t border-white/5 mt-1 pt-1">
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-400 hover:text-red-400 hover:bg-red-950/20 transition-colors cursor-pointer text-left"
                    >
                      <LogOut size={14} />
                      Sign out
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Avatar confirm/cancel */}
            {avatarPreview && (
              <div className="flex items-center gap-1.5">
                <button onClick={handleConfirmUpload} disabled={uploadState === 'uploading'}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-md transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1">
                  <Check size={11} /> Save
                </button>
                <button onClick={handleCancelPreview} disabled={uploadState === 'uploading'}
                  className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-medium rounded-md transition-colors cursor-pointer">
                  Cancel
                </button>
              </div>
            )}
            {uploadError && (
              <span className="text-xs text-red-400">{uploadError}</span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1280px] mx-auto w-full px-6 py-8">
        {children}
      </main>
    </div>
  );
}
