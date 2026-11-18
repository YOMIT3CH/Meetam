import { useEffect, useState } from 'react';
import { useMeetAm } from '../context/MeetAmContext';
import GlassCard from './ui/GlassCard';
import GlassButton from './ui/GlassButton';
import { LuPencil, LuMapPin, LuLockOpen, LuBell } from 'react-icons/lu';

const STEPS = [
  {
    icon: LuPencil,
    title: 'Post a text intro',
    description:
      'Write a genuine personality card. No photos, no swiping — just you.',
  },
  {
    icon: LuMapPin,
    title: 'Filter by state & intent',
    description:
      'Match by Nigerian state and what you are looking for.',
  },
  {
    icon: LuLockOpen,
    title: 'Unlock 1 contact every 24h',
    description:
      'Each contact unlock costs 1 credit. Move the conversation offline when ready.',
  },
  {
    icon: LuBell,
    title: 'Set state match alerts',
    description:
      'Get notified when someone matching your state and intent posts.',
  },
];

export default function OnboardingModal() {
  const { hasOnboarded, setShowOnboarding, setShowTopUp } = useMeetAm();
  const [step, setStep] = useState(0);
  const [skipped, setSkipped] = useState(false);

  useEffect(() => {
    if (!hasOnboarded) setStep(0);
  }, [hasOnboarded]);

  if (hasOnboarded || !hasOnboarded && skipped) return null;

  const goToStep = (next) => setStep(Math.max(0, Math.min(STEPS.length - 1, next)));
  const nextStep = () => goToStep((step) => step + 1);
  const prevStep = () => goToStep((step) => step - 1);

  const finish = () => {
    window.localStorage.setItem('meetam_onboarded', '1');
    setShowOnboarding(false);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-3 sm:p-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-slate-950/95 p-5 sm:p-8 text-white">
        <div className="flex items-center justify-between mb-5">
          <span className="text-xs font-semibold text-emerald-400 tracking-widest uppercase">
            {step + 1} / {STEPS.length}
          </span>
          <button
            onClick={() => {
              if (step === 0) setShowOnboarding(false);
              else nextStep();
            }}
            className="text-slate-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <span className="text-xl leading-none">×</span>
          </button>
        </div>

        <div className="mb-6">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
            {(() => {
              const StepIcon = STEPS[step].icon;
              return <StepIcon size={28} />;
            })()}
          </div>
          <h2 className="text-xl font-bold text-white mb-2">{STEPS[step].title}</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            {STEPS[step].description}
          </p>
        </div>

        <div className="flex gap-2">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i <= step ? 'w-8 bg-emerald-400' : 'w-2 bg-white/10'
              }`}
            />
          ))}
        </div>

        <div className="mt-8 flex justify-between">
          {step === 0 ? (
            <button
              onClick={() => setSkipped(true)}
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              Skip for now
            </button>
          ) : (
            <button
              onClick={prevStep}
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              ← Back
            </button>
          )}

          {step === STEPS.length - 1 ? (
            <GlassButton onClick={finish}>Get Started</GlassButton>
          ) : (
            <GlassButton onClick={nextStep}>Next →</GlassButton>
          )}
        </div>
      </div>
    </div>
  );
}
