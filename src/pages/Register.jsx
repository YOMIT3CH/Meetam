import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LuMail, LuLock, LuUser, LuCalendar } from 'react-icons/lu';

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [dob, setDob] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate name
    if (!name.trim()) {
      setError('Full name is required');
      return;
    }

    // Validate email
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Valid email is required');
      return;
    }

    // Validate DOB
    if (!dob) {
      setError('Date of birth is required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    // TODO: call auth API
    setTimeout(() => {
      setIsSubmitting(false);
      alert('Account created! Please check your email to verify.');
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center bg-slate-950 px-4 py-8 sm:px-6 lg:px-8">
      <div className="w-full max-w-md mx-auto">
        <div className="glass-card p-5 sm:p-8 mb-6 sm:mb-8 rounded-2xl">
          <div className="flex items-center gap-2 mb-5 sm:mb-6">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-emerald-500 to-pink-500 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-white text-xs sm:text-sm font-bold">M</span>
            </div>
            <span className="font-bold text-lg sm:text-xl tracking-tight text-white">MeetAm</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-white mb-1.5 sm:mb-2">Create account</h2>
          <p className="text-slate-300 text-xs sm:text-sm mb-5 sm:mb-6">Sign up to get started with MeetAm</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 sm:p-4 mb-5 sm:mb-6">
              <p className="text-red-400 text-xs sm:text-sm font-medium mb-0.5">Error:</p>
              <p className="text-white text-xs sm:text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div>
              <label className="block text-xs sm:text-sm text-white mb-1.5 sm:mb-2">Full name</label>
              <div className="relative">
                <LuUser size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white pointer-events-none" />
                <input
                  type="text"
                  placeholder="John Doe"
                  className="input-field w-full pl-10 pr-4 h-11 sm:h-12 text-sm sm:text-base rounded-lg"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm text-white mb-1.5 sm:mb-2">Email address</label>
              <div className="relative">
                <LuMail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white pointer-events-none" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="input-field w-full pl-10 pr-4 h-11 sm:h-12 text-sm sm:text-base rounded-lg"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-3">
              <div>
                <label className="block text-xs sm:text-sm text-white mb-1.5 sm:mb-2">Password</label>
                <div className="relative">
                  <LuLock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="input-field w-full pl-10 pr-12 h-11 sm:h-12 text-sm sm:text-base rounded-lg"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-emerald-400 hover:text-emerald-300 transition-colors py-1"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm text-white mb-1.5 sm:mb-2">Confirm password</label>
                <div className="relative">
                  <LuLock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white pointer-events-none" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="input-field w-full pl-10 pr-12 h-11 sm:h-12 text-sm sm:text-base rounded-lg"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-emerald-400 hover:text-emerald-300 transition-colors py-1"
                  >
                    {showConfirmPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-400 -mt-2">Minimum 8 characters</p>

            <div>
              <label className="block text-xs sm:text-sm text-white mb-1.5 sm:mb-2">Date of birth</label>
              <div className="relative">
                <LuCalendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white pointer-events-none" />
                <input
                  type="date"
                  className="input-field w-full pl-10 pr-4 text-white text-sm sm:text-base [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer bg-slate-950/20 backdrop-blur border border-slate-500/30 rounded-lg h-11 sm:h-12 focus:bg-slate-950/30 focus:border-emerald-500 transition-colors appearance-none"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-emerald-500 to-pink-500 text-white py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 active:scale-[0.99] transition-all disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating account...' : 'Create account'}
            </button>

            <p className="mt-4 text-center text-xs sm:text-sm text-white">
              Already have an account?{' '}
              <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </form>
        </div>

        <div className="text-center text-xs sm:text-sm text-slate-300 px-2">
          By continuing, you agree to our{' '}
          <Link to="/terms" className="text-emerald-400 hover:text-emerald-300 transition-colors underline-offset-2 hover:underline">
            Terms of Service
          </Link>
        </div>
      </div>
    </div>
  );
}