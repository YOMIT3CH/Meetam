import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LuMail, LuLock } from 'react-icons/lu';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);

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

          <h2 className="text-2xl font-bold text-white mb-2">Welcome back</h2>
          <p className="text-slate-400 text-sm mb-8">
            Sign in to your account to continue
          </p>

          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-300 mb-2">Email address</label>
              <div className="relative">
                <LuMail size={18} className="absolute left-3 top-3 text-slate-500" />
                <input type="email" placeholder="you@example.com" className="input-field pl-10" required />
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
                <input type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="input-field pl-10" required />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input type="checkbox" className="rounded border-white/10" />
                Remember me
              </label>
              <Link to="/forgot-password" className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
                Forgot password?
              </Link>
            </div>

            <button type="submit" className="bg-gradient-to-r from-emerald-500 to-pink-500 text-white w-full py-3 rounded-xl font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all">
              Sign in
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
              Create an account
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-slate-600">
          By continuing, you agree to our{' '}
          <Link to="/terms" className="text-emerald-400 hover:text-emerald-300">Terms of Service</Link>
        </p>
        <div className="mt-4 text-center">
          <Link to="/" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm">
            ← Back to MeetAm
          </Link>
        </div>
      </div>
    </div>
  );
}