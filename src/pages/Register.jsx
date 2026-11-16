import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LuMail, LuLock, LuPhone, LuUser } from 'react-icons/lu';

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [ageVerified, setAgeVerified] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!termsAgreed || !ageVerified) {
      alert('Please agree to the terms and verify you are 18+');
      return;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md">
        <div className="glass-card p-8 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-7 h-7 bg-gradient-to-br from-emerald-500 to-pink-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">M</span>
            </div>
            <span className="font-bold text-lg tracking-tight text-white">MeetAm</span>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">Create account</h2>
          <p className="text-slate-400 text-sm mb-8">
            Join Nigeria's personality-first dating platform
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-300 mb-2">Full name</label>
              <div className="relative">
                <LuUser size={18} className="absolute left-3 top-3 text-slate-500" />
                <input type="text" placeholder="Adeoluwa Okafor" className="input-field pl-10" required />
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">Email address</label>
              <div className="relative">
                <LuMail size={18} className="absolute left-3 top-3 text-slate-500" />
                <input type="email" placeholder="you@example.com" className="input-field pl-10" required />
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">Phone number</label>
              <div className="relative">
                <LuPhone size={18} className="absolute left-3 top-3 text-slate-500" />
                <input type="tel" placeholder="+234 801 234 5678" className="input-field pl-10" required />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-slate-300">Password</label>
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <div className="relative">
                <LuLock size={18} className="absolute left-3 top-3 text-slate-500" />
                <input type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="input-field pl-10" required minLength={8} />
              </div>
              <p className="text-xs text-slate-500 mt-1">Minimum 8 characters</p>
            </div>

            <div className="space-y-6">
              <h3 className="text-sm font-medium text-amber-300 mb-4">Legal requirements</h3>

              <div className="bg-amber-500/5 border border-amber-300/10 rounded-xl p-6">
                <p className="text-sm text-amber-200 leading-relaxed mb-4">
                  Please confirm the following before registering:
                </p>

                <div className="space-y-4">
                  <label className="flex items-start gap-3 group cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ageVerified}
                      onChange={() => setAgeVerified(!ageVerified)}
                      className="rounded border-amber-400/50 group-input accent-color-amber-500"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-amber-300 font-medium">I am 18 years or older</p>
                      <p className="text-xs text-amber-300/60 opacity-0 group-hover:opacity-100 transition-opacity">
                        Minimum age requirement for MeetAm registration.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 group cursor-pointer">
                    <input
                      type="checkbox"
                      checked={termsAgreed}
                      onChange={() => setTermsAgreed(!termsAgreed)}
                      className="rounded border-amber-400/50 group-input accent-color-amber-500"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-amber-300 font-medium">
                        I agree to the{' '}
                        <a href="/terms" className="underline text-amber-300 hover:text-amber-200 transition-colors">
                          Terms of Service
                        </a>
                      </p>
                      <p className="text-xs text-amber-300/60 opacity-0 group-hover:opacity-100 transition-opacity">
                        Mandatory for platform access. Covers zero-tolerance for commercial solicitation, non-refundable digital credits, and third-party offline interaction liability shield.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <button type="submit" disabled={!termsAgreed || !ageVerified} className="bg-gradient-to-r from-emerald-500 to-pink-500 text-white w-full py-3 rounded-xl font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
              Create account
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
          <div className="mt-4 text-center">
            <Link to="/" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm">
              ← Back to MeetAm
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}