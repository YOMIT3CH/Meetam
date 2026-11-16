import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LuMail, LuLock, LuUser } from 'react-icons/lu';

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
          <p className="text-white text-sm mb-6">Sign up to get started with MeetAm</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
              <p className="text-red-400 text-sm mb-1">Error:</p>
              <p className="text-white">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-white mb-2">Full name</label>
              <div className="relative">
                <LuUser size={18} className="absolute left-3 top-3 text-white" />
                <input
                  type="text"
                  placeholder="John Doe"
                  className="input-field pl-10 pr-4 h-12 rounded-lg"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-white mb-2">Email address</label>
              <div className="relative">
                <LuMail size={18} className="absolute left-3 top-3 text-white" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="input-field pl-10 pr-4 h-12 rounded-lg"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-white mb-2">Password</label>
              <div className="relative">
                <LuLock size={18} className="absolute left-3 top-3 text-white" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="input-field pl-10 pr-4 h-12 rounded-lg"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <p className="text-xs text-white mt-1">Minimum 8 characters</p>
            </div>

            <div>
              <label className="block text-sm text-white mb-2">Confirm password</label>
              <div className="relative">
                <LuLock size={18} className="absolute left-3 top-3 text-white" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="input-field pl-10 pr-4 h-12 rounded-lg"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  {showConfirmPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm text-white mb-2">Date of birth</label>
              <div className="relative">
                <LuUser size={18} className="absolute left-3 top-3 text-white" />
                <input type="date" className="input-field pl-10 pr-4 h-12 rounded-lg" value={dob} onChange={(e) => setDob(e.target.value)} required />
                <p className="text-xs text-white mt-1">YYYY-MM-DD</p>
              </div>
            </div>

            <button type="submit" className="w-full bg-gradient-to-r from-emerald-500 to-pink-500 text-white py-3 rounded-xl font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all" disabled={isSubmitting}>
              {isSubmitting ? 'Creating account...' : 'Create account'}
            </button>

            <p className="mt-4 text-center text-sm text-white">
              Already have an account?{' '}
              <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </form>
        </div>

        <div className="mt-8 text-center text-sm text-white">
          By continuing, you agree to our
          <a href="/terms" className="text-emerald-400 hover:text-emerald-400 transition-colors">
            Terms of Service
          </a>
        </div>
      </div>
    </div>
  );
}