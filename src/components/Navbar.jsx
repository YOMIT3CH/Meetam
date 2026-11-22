import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LuMenu, LuX, LuLogOut } from 'react-icons/lu';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const navLinks = [
    { name: "How It Works", href: "#how-it-works" },
    { name: "Safety", href: "#safety" },
    { name: "Terms", href: "/terms" },
  ];

  const renderNavLink = (link, isMobile = false) => {
    const className = isMobile
      ? "block text-slate-300 hover:text-white py-2 text-sm transition-colors"
      : "text-slate-300 hover:text-white text-sm font-medium transition-colors";

    if (link.href.startsWith('#')) {
      return (
        <a
          key={link.name}
          href={link.href}
          onClick={() => isMobile && setIsOpen(false)}
          className={className}
        >
          {link.name}
        </a>
      );
    }

    return (
      <Link
        key={link.name}
        to={link.href}
        onClick={() => isMobile && setIsOpen(false)}
        className={className}
      >
        {link.name}
      </Link>
    );
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-slate-950/95 backdrop-blur-md border-b border-white/10 pt-[env(safe-area-inset-top,0px)] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-pink-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">M</span>
            </div>
            <span className="font-bold text-xl tracking-tight text-white">MeetAm</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => renderNavLink(link, false))}

            <div className="flex items-center gap-3">
              {isLoggedIn ? (
                <button
                  onClick={() => setIsLoggedIn(false)}
                  className="flex items-center gap-1.5 text-sm text-slate-300 hover:text-white transition-colors"
                >
                  <LuLogOut size={16} />
                  Logout
                </button>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-sm text-slate-300 hover:text-white transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="bg-gradient-to-r from-emerald-500 to-pink-500 text-white px-6 py-2 rounded-xl text-sm font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-0.5 active:scale-95 transition-all"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-slate-300 hover:text-white p-1"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle Menu"
          >
            {isOpen ? <LuX size={20} strokeWidth={2} /> : <LuMenu size={20} strokeWidth={2} />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="md:hidden bg-slate-950 border-b border-white/5">
          <div className="px-4 py-4 space-y-3">
            {navLinks.map((link) => renderNavLink(link, true))}

            <div className="pt-4 border-t border-white/5 space-y-3">
              {isLoggedIn ? (
                <button
                  onClick={() => {
                    setIsLoggedIn(false);
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-2 text-slate-300 hover:text-white py-2 text-sm transition-colors w-full"
                >
                  <LuLogOut size={16} />
                  Logout
                </button>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="block text-slate-300 hover:text-white py-2 text-sm transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsOpen(false)}
                    className="block text-center bg-gradient-to-r from-emerald-500 to-pink-500 text-white w-full px-6 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 active:scale-95 transition-all"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}