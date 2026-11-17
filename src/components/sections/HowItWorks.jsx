import { HOW_IT_WORKS } from '../../lib/constants.js';

const StepNumber = ({ n, className = "" }) => (
  <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg ${className}`}>
    {n}
  </div>
);

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-16 sm:py-20 bg-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4">How It Works</h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Simple, intentional, privacy-first. Three steps to meaningful connections.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {HOW_IT_WORKS.map((step) => (
            <div key={step.step} className="glass-card p-6 sm:p-8 text-center hover:border-emerald-500/50 transition-colors">
              <StepNumber n={step.step} className="mx-auto mb-5 sm:mb-6" />
              <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">{step.title}</h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

