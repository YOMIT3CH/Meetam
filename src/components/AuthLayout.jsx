import { Link } from 'react-router-dom';
import { LuShieldCheck, LuMapPin, LuLockOpen, LuSparkles, LuHeart } from 'react-icons/lu';

function AuthLayout({ children, activeTab = 'login' }) {
  return (
    <div className="min-h-screen bg-slate-950 text-white relative flex flex-col justify-between overflow-x-clip">
      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      {/* Top Navbar */}
      <header className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 pt-[max(1.25rem,calc(env(safe-area-inset-top,0px)+0.75rem))] flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <span className="text-white text-base font-bold">M</span>
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-white block leading-tight">MeetAm</span>
            <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">Personality-First</span>
          </div>
        </Link>

        <div className="flex items-center gap-3 text-sm">
          <span className="hidden sm:inline text-slate-400 text-xs">
            {activeTab === 'login' ? "Don't have an account?" : 'Already a member?'}
          </span>
          <Link
            to={activeTab === 'login' ? '/register' : '/login'}
            className="px-3.5 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white text-xs font-medium transition-all"
          >
            {activeTab === 'login' ? 'Create Account' : 'Sign In'}
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 flex-1 flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 w-full items-center">
          
          {/* Left Hero Column (Desktop) */}
          <div className="hidden lg:flex lg:col-span-5 flex-col justify-center space-y-8 pr-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold mb-6">
                <LuShieldCheck size={14} className="text-emerald-400" />
                <span>100% Privacy Protected</span>
              </div>
              <h1 className="text-4xl xl:text-5xl font-black text-white leading-tight tracking-tight mb-4">
                Date with <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-pink-500">intention</span>, not just photos.
              </h1>
              <p className="text-slate-400 text-base leading-relaxed">
                Meet verified singles across all 36 Nigerian states. Share genuine personality cards, match by values, and unlock direct contacts on your terms.
              </p>
            </div>

            {/* Feature points */}
            <div className="space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                  <LuMapPin size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">All 36 States & FCT</h3>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    Filter intentional matches by state, tribe, religion, and lifestyle goals.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 shrink-0 mt-0.5">
                  <LuLockOpen size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Controlled Contact Unlocks</h3>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    Your WhatsApp and Snapchat remain masked until an intentional match spends a credit.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                  <LuSparkles size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Instant Direct Connect</h3>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    Once unlocked, connect immediately via WhatsApp chat or Snapchat without barriers.
                  </p>
                </div>
              </div>
            </div>

            {/* Community card */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="flex items-center gap-1 text-amber-400 mb-2">
                {[...Array(5)].map((_, i) => (
                  <LuHeart key={i} size={14} className="fill-current text-pink-400" />
                ))}
              </div>
              <p className="text-xs text-slate-300 italic leading-relaxed mb-3">
                "Finally, a dating platform for Nigerians that values character over superficial swiping. The credit unlock ensures you only talk to people who genuinely care."
              </p>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">Chioma O.</span>
                <span className="text-slate-400">Abuja (FCT)</span>
              </div>
            </div>
          </div>

          {/* Right Form Column */}
          <div className="lg:col-span-7 flex justify-center">
            <div className="w-full max-w-xl">
              {/* Tab Selector */}
              <div className="flex items-center p-1.5 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-md mb-6 max-w-xs mx-auto">
                <Link
                  to="/login"
                  className={`flex-1 py-2 text-center rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'login'
                      ? 'bg-gradient-to-r from-emerald-500 to-pink-500 text-white shadow-md shadow-emerald-500/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className={`flex-1 py-2 text-center rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'register'
                      ? 'bg-gradient-to-r from-emerald-500 to-pink-500 text-white shadow-md shadow-emerald-500/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Create Account
                </Link>
              </div>

              {/* Form Card */}
              <div className="rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-4 sm:p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="relative z-10">
                  {children}
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 pb-[max(1.25rem,calc(env(safe-area-inset-bottom,0px)+0.75rem))] text-center text-xs text-slate-400 border-t border-white/5">
        <div className="flex flex-wrap items-center justify-center gap-4">
          <span>&copy; {new Date().getFullYear()} MeetAm Technologies Ltd.</span>
          <span>&middot;</span>
          <Link to="/terms" className="hover:text-slate-300 transition-colors">Terms of Service</Link>
          <span>&middot;</span>
          <Link to="/support" className="hover:text-slate-300 transition-colors">Support & Safety</Link>
        </div>
      </footer>
    </div>
  );
}

export { AuthLayout };
export default AuthLayout;
