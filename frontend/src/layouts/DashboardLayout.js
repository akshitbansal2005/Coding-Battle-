import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { LayoutGrid, Trophy, User, LogOut, Award, Camera, Check, X, Loader2 } from 'lucide-react';
import { api } from '@/utils/api';

export default function DashboardLayout({ children }) {
  const { user, logout, loading, updateUser } = useAuth();
  const router = useRouter();

  // Avatar upload state
  const fileInputRef = useRef(null);
  const [avatarPreview, setAvatarPreview] = useState(null); // local preview before save
  const [uploadState, setUploadState] = useState('idle'); // idle | uploading | success | error
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Only image files are supported.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setUploadError('Image must be under 2 MB.');
      return;
    }

    setUploadError('');
    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatarPreview(event.target.result); // show preview immediately
    };
    reader.readAsDataURL(file);
  };

  // Confirm and upload the selected avatar
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
      setUploadError(err.message || 'Upload failed. Try again.');
      setUploadState('error');
      setTimeout(() => setUploadState('idle'), 3000);
    }
  };

  // Cancel preview, revert to current avatar
  const handleCancelPreview = () => {
    setAvatarPreview(null);
    setUploadError('');
    setUploadState('idle');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#060609] font-sans">
        <div className="text-sm font-semibold text-[#10b981] animate-pulse">Establishing secure session link...</div>
      </div>
    );
  }

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutGrid size={20} /> },
    { name: 'Leaderboard', path: '/leaderboard', icon: <Trophy size={20} /> },
    { name: 'My Profile', path: `/profile/${user.username}`, icon: <User size={20} /> },
    { name: 'Achievements', path: '/dashboard#achievements', icon: <Award size={20} /> },
  ];

  const currentAvatar = avatarPreview || user.profilePicture;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#060609] text-[#f8fafc] font-sans selection:bg-[#10b981]/25 select-none relative">

      {/* Sidebar Navigation */}
      <aside className="w-full md:w-20 bg-[#08080c] border-r border-[#1a1a24] flex flex-col justify-between py-6 z-10 shrink-0">
        <div>
          {/* Logo */}
          <div className="flex justify-center mb-10 select-none">
            <span className="font-extrabold text-xl tracking-tight text-white font-sans">A1</span>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col items-center gap-6 px-2">
            {navItems.map((item) => {
              const isActive = router.pathname === item.path || (router.pathname.startsWith(item.path) && item.path !== '/dashboard');
              return (
                <Link
                  key={item.name}
                  href={item.path}
                  title={item.name}
                  className={`p-3 rounded-xl transition-all duration-150 relative ${
                    isActive
                      ? 'bg-[#10b981]/15 text-[#10b981] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] border border-[#10b981]/20'
                      : 'text-slate-500 hover:text-white hover:bg-slate-900/50'
                  }`}
                >
                  {item.icon}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Avatar editor + logout at the bottom */}
        <div className="flex flex-col items-center gap-4">

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Avatar with camera overlay */}
          <div className="relative group">
            <img
              src={currentAvatar}
              alt={user.username}
              title={`${user.username} — click to change avatar`}
              className={`w-10 h-10 rounded-full border-2 object-cover transition-all duration-200 cursor-pointer ${
                avatarPreview
                  ? 'border-[#0088ff]/60 shadow-[0_0_12px_rgba(0,136,255,0.3)]'
                  : uploadState === 'success'
                  ? 'border-[#10b981]/60 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                  : 'border-slate-800 group-hover:border-slate-600'
              }`}
              onClick={() => !avatarPreview && fileInputRef.current?.click()}
            />

            {/* Camera badge — shown on hover when no preview active */}
            {!avatarPreview && uploadState === 'idle' && (
              <button
                onClick={() => fileInputRef.current?.click()}
                title="Change profile picture"
                className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#0088ff] hover:bg-[#0070d4] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg border border-[#0050a0] cursor-pointer"
              >
                <Camera size={10} className="text-white" />
              </button>
            )}

            {/* Uploading spinner */}
            {uploadState === 'uploading' && (
              <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                <Loader2 size={14} className="text-white animate-spin" />
              </div>
            )}

            {/* Success tick */}
            {uploadState === 'success' && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#10b981] rounded-full flex items-center justify-center shadow-lg border border-[#059669]">
                <Check size={10} className="text-white" />
              </div>
            )}
          </div>

          {/* Confirm / cancel buttons — appear when preview is selected */}
          {avatarPreview && (
            <div className="flex flex-col gap-1.5 items-center">
              <button
                onClick={handleConfirmUpload}
                title="Save new avatar"
                disabled={uploadState === 'uploading'}
                className="w-8 h-8 bg-[#10b981]/20 hover:bg-[#10b981]/30 border border-[#10b981]/30 rounded-xl flex items-center justify-center transition-all cursor-pointer disabled:opacity-50"
              >
                <Check size={14} className="text-[#10b981]" />
              </button>
              <button
                onClick={handleCancelPreview}
                title="Cancel"
                disabled={uploadState === 'uploading'}
                className="w-8 h-8 bg-red-900/20 hover:bg-red-900/30 border border-red-900/30 rounded-xl flex items-center justify-center transition-all cursor-pointer disabled:opacity-50"
              >
                <X size={14} className="text-red-400" />
              </button>
            </div>
          )}

          {/* Error tooltip */}
          {uploadError && (
            <div className="px-2 py-1 bg-red-900/30 border border-red-900/40 rounded-lg text-[9px] text-red-400 text-center font-mono max-w-[68px] leading-tight">
              {uploadError}
            </div>
          )}

          <button
            onClick={logout}
            title="Disconnect"
            className="p-3 text-slate-500 hover:text-red-400 hover:bg-red-950/20 rounded-xl transition-all cursor-pointer border-none"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-[1250px] mx-auto w-full z-10 relative">
        {children}
      </main>
    </div>
  );
}
