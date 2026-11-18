import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LuCreditCard,
  LuLogOut,
  LuMenu,
  LuX,
  LuCompass,
  LuUser,
  LuDownload,
} from 'react-icons/lu';
import { useMeetAm } from '../context/MeetAmContext';

export default function AppNavbar() {
  const { user, creditsBalance, setShowTopUp, logout } = useMeetAm();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    if (logout) {
      await logout();
    }
    navigate('/login', { replace: true });
  };

  const navItems = [
    { name: 'Browse Feed', path: '/feed', icon: LuCompass },
    { name: 'My Profile', path: '/profile', icon: LuUser },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Main Nav */}
          <div className="flex items-center gap-8">
            <Link to="/feed" className="flex items-center gap-2 shrink-0 group">
              <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <span className="text-white text-base font-bold">M</span>
              </div>
              <span className="font-bold text-lg tracking-tight text-white">
                MeetAm
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                      active
                        ? 'bg-white/10 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon size={16} className={active ? 'text-emerald-400' : 'text-slate-400'} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Desktop Right Actions */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Top Up Credits Pill */}
            <button
              onClick={() => setShowTopUp(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-200 hover:text-white bg-slate-900 border border-white/10 hover:border-emerald-500/30 transition-all cursor-pointer shadow-sm"
              title="Top up credits"
            >
              <LuCreditCard size={14} className="text-emerald-400" />
              <span>Credits</span>
              <span className="ml-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                {creditsBalance}
              </span>
            </button>

            {/* Profile Avatar / Quick Link */}
            <Link
              to="/profile"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                location.pathname === '/profile'
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                  : 'border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-400 to-pink-500 flex items-center justify-center text-[10px] font-bold text-white">
                {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="max-w-[100px] truncate">Profile</span>
            </Link>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
              title="Sign out"
            >
              <LuLogOut size={16} />
            </button>
          </div>

          {/* Mobile Right Bar */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              onClick={() => setShowTopUp(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
            >
              <LuCreditCard size={13} />
              <span>{creditsBalance}</span>
            </button>

            <button
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle navigation"
            >
              {mobileOpen ? <LuX size={20} /> : <LuMenu size={20} />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-slate-950/98 backdrop-blur-xl border-b border-white/10 px-4 py-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon size={18} className={active ? 'text-emerald-400' : 'text-slate-400'} />
                <span>{item.name}</span>
              </Link>
            );
          })}

          <div className="pt-3 border-t border-white/5 space-y-2">
            <button
              onClick={() => {
                setMobileOpen(false);
                setShowTopUp(true);
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
            >
              <span className="flex items-center gap-3">
                <LuCreditCard size={18} className="text-emerald-400" />
                <span>Top Up Credits</span>
              </span>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                {creditsBalance}
              </span>
            </button>

            <button
              onClick={() => {
                setMobileOpen(false);
                window.dispatchEvent(new CustomEvent('meetam_trigger_pwa_install'));
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-emerald-300 hover:bg-emerald-500/10 transition-colors"
            >
              <LuDownload size={18} className="text-emerald-400" />
              <span>Install MeetAm App</span>
            </button>

            <button
              onClick={() => {
                setMobileOpen(false);
                handleLogout();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LuLogOut size={18} />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
