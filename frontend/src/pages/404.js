import Link from 'next/link';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function Custom404() {
  return (
    <div className="min-h-screen bg-[#121214] flex flex-col items-center justify-center text-center p-6 font-mono">
      <div className="p-4 bg-[#ff1744]/10 border border-[#ff1744] rounded-full text-[#ff1744] mb-6 animate-pulse">
        <ShieldAlert size={48} />
      </div>
      <h1 className="text-4xl font-extrabold text-white tracking-widest uppercase mb-2">
        404 - SECTOR OFFLINE
      </h1>
      <p className="text-sm text-[#94a3b8] max-w-md mb-8 uppercase">
        The coordinates you requested do not exist or have been removed from the arena database.
      </p>
      <Link href="/dashboard" className="btn-cyber danger py-3 px-8 text-xs font-bold flex items-center gap-2">
        <ArrowLeft size={16} />
        RETURN TO LOBBY BASE
      </Link>
    </div>
  );
}
