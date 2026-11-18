import { Link } from 'react-router-dom';
import { LuChevronDown } from 'react-icons/lu';
import { HERO } from '../../lib/constants.js';

const ScrollIndicator = () => (
  <LuChevronDown size={24} strokeWidth={2} className="text-slate-500 animate-bounce" />
);

export default function Hero() {
  return (
    <section className="relative pt-20 pb-16 lg:pt-32 lg:pb-24 overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl -z-10" />
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-pink-500/10 rounded-full blur-3xl -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-emerald-400 text-xs font-medium mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Now in Nigeria &bull; 36 states + FCT
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white tracking-tight leading-tight mb-6">
            {HERO.headline}
          </h1>

          <p className="text-base sm:text-lg lg:text-xl text-slate-300 mb-8 sm:mb-10 leading-relaxed max-w-xl mx-auto">
            {HERO.subhead}
          </p>

          <div className="flex flex-col sm:flex-row gap-3.5 sm:gap-4 justify-center">
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center bg-gradient-to-r from-emerald-500 to-pink-500 text-white px-8 py-3.5 sm:py-4 rounded-xl text-base sm:text-lg font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 active:scale-95 transition-all text-center"
            >
              {HERO.primaryCta}
            </Link>
            <a
              href="#how-it-works"
              className="w-full sm:w-auto inline-flex items-center justify-center border border-white/10 text-white px-8 py-3.5 sm:py-4 rounded-xl text-base sm:text-lg font-semibold bg-white/5 hover:bg-white/10 transition-all text-center"
            >
              {HERO.secondaryCta}
            </a>
          </div>

          <div className="mt-10 sm:mt-12 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-slate-400 text-xs sm:text-sm">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              100% personality-first
            </span>
            <span className="hidden sm:inline">&bull;</span>
            <span>Private by default</span>
            <span className="hidden sm:inline">&bull;</span>
            <span>1 credit = ₦1,000</span>
          </div>
        </div>

        <div className="mt-16 flex justify-center">
          <div className="text-slate-500 animate-bounce">
            <ScrollIndicator />
          </div>
        </div>
      </div>
    </section>
  );
}