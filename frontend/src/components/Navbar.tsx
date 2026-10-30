"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Stethoscope,
  Activity,
  Zap,
  Pill,
  FileSearch,
  Users,
  BookOpen,
  LogOut,
  ShieldCheck,
  Sparkles,
  Eye,
  EyeOff,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePhi } from '../context/PhiContext';

const NAV_ITEMS = [
  { name: 'OPD Copilot', href: '/opd', icon: Stethoscope },
  { name: 'X-Ray Radiology', href: '/xray', icon: Zap },
  { name: 'Drug Safety', href: '/drug-safety', icon: Pill },
  { name: 'Lab Reports', href: '/documents', icon: FileSearch },
  { name: 'Patient EHR', href: '/patients', icon: Users },
  { name: 'Medical RAG', href: '/library', icon: BookOpen },
];

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const { phiMasked, togglePhiMask } = usePhi();
  const [isOnline, setIsOnline] = React.useState(true);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full px-4 sm:px-6 pt-3 pb-2 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto h-14 bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-full px-4 sm:px-6 flex items-center justify-between gap-4 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        {/* Brand Logo & Clinical Status */}
        <Link href="/" className="flex items-center gap-3 shrink-0 group">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 via-teal-600 to-emerald-600 text-white flex items-center justify-center shadow-[0_0_15px_rgba(13,148,136,0.5)] group-hover:scale-105 transition-transform">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base font-extrabold text-white tracking-tight flex items-center gap-1.5">
              MedSynexa
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                CLINICAL AI
              </span>
            </span>
          </div>
        </Link>

        {/* Primary Route Navigation */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-950/60 p-1 rounded-full border border-white/10">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-[0_0_15px_rgba(13,148,136,0.4)] border border-teal-400/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-teal-200' : 'text-slate-500'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Section: Controls, User & Auth */}
        <div className="flex items-center gap-2.5">
          {/* Wi-Fi Hospital Network Status Indicator */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
              isOnline
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-300 border-rose-500/30 animate-pulse'
            }`}
            title={isOnline ? 'Hospital Wi-Fi Connected (Live EHR Sync)' : 'Hospital Wi-Fi Disconnected (Offline Cache Active)'}
          >
            {isOnline ? <Wifi className="w-3 h-3 text-emerald-400" /> : <WifiOff className="w-3 h-3 text-rose-400" />}
            <span className="hidden xl:inline">{isOnline ? 'Live EHR Sync' : 'Offline'}</span>
          </div>

          {/* PHI Privacy Masking Toggle */}
          <button
            onClick={togglePhiMask}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold border transition-colors ${
              phiMasked
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                : 'bg-slate-800 text-slate-400 border-white/10 hover:text-white'
            }`}
            title={phiMasked ? 'PHI Masking Active (Patient Names Obscured)' : 'Click to Mask Patient Names on Shared Screens'}
          >
            {phiMasked ? <EyeOff className="w-3 h-3 text-amber-400" /> : <Eye className="w-3 h-3" />}
            <span className="hidden xl:inline">{phiMasked ? 'PHI Hidden' : 'PHI Visible'}</span>
          </button>

          {isAuthenticated ? (
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-white/10 text-xs font-semibold text-white">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center text-[10px] font-extrabold shadow-xs">
                  {user?.firstName?.[0] || 'D'}
                </div>
                <span className="hidden sm:inline text-slate-200 font-bold">
                  {user?.firstName ? `Dr. ${user.firstName}` : 'Dr. Practitioner'}
                </span>
              </div>

              <button
                onClick={logout}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-full transition-colors border border-white/10"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link href="/login" className="btn-teal text-xs py-1.5 px-4 shadow-sm">
              Sign In
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Sub-Header Navigation */}
      <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto px-4 py-2 mt-2 rounded-2xl bg-slate-900/90 border border-white/10 backdrop-blur-md">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                isActive
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-400 border border-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
};

export default Navbar;


