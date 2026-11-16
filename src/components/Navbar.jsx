import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LuMenu, LuX } from 'react-icons/lu';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: "How It Works", href: "#how-it-works" },
    { name: "Browse", href: "/browse" },
    { name: "Safety", href: "#safety" },
    { name: "Terms", href: "/terms" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-pink-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">M</span>
            </div>
            <span className="font-bold text-xl tracking-tight text-white">MeetAm</span>
          </div>

          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className="text-slate-300 hover:text-white text-sm font-medium transition-colors"
              >
                {link.name}
              </Link>
            ))}
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-sm text-slate-300 hover:text-white transition-colors">
                Login
              </Link>
              <button className="bg-gradient-to-r from-emerald-500 to-pink-500 text-white px-6 py-2 rounded-xl text-sm font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-1 active:scale-95 transition-all">
                Get Started
              </button>
            </div>
          </div>

          <button
            className="md:hidden text-slate-300 hover:text-white"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <LuX size={20} strokeWidth={2} /> : <LuMenu size={20} strokeWidth={2} />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-slate-950 border-b border-white/5">
          <div className="px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                onClick={() => setIsOpen(false)}
                className="block text-slate-300 hover:text-white py-2 text-sm transition-colors"
              >
                {link.name}
              </Link>
            ))}
            <div className="pt-4">
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="block text-slate-300 hover:text-white py-2 text-sm transition-colors"
              >
                Login
              </Link>
              <button className="bg-gradient-to-r from-emerald-500 to-pink-500 text-white w-full px-6 py-2 rounded-xl text-sm font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all" onClick={() => setIsOpen(false)}>
                Get Started
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}