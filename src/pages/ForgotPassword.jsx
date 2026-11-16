import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LuMail, LuShield } from 'react-icons/lu';

export default function ForgotPassword() {
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setEmailSent(true);
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
        <div className="w-full max-w-md">
          <div className="glass-card p-8 text-center">
            <LuShield size={48} className="text-emerald-500 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-2">Check your email</h2>
            <p className="text-slate-400 text-sm mb-8">
              We've sent a password reset link to your inbox. Follow the instructions to create a new password.
            </p>
            <Link to="/login" className="bg-gradient-to-r from-emerald-500 to-pink-500 text-white px-6 py-2 rounded-xl font-semibold inline-block shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all">
              Back to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md">
        <div className="glass-card p-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-7 h-7 bg-gradient-to-br from-emerald-500 to-pink-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">M</span>
            </div>
            <span className="font-bold text-lg tracking-tight text-white">MeetAm</span>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">Reset password</h2>
          <p className="text-slate-400 text-sm mb-8">
            Enter your email and we'll send you a reset link
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-300 mb-2">Email address</label>
              <div className="relative">
                <LuMail size={18} className="absolute left-3 top-3 text-slate-500" />
                <input type="email" placeholder="you@example.com" className="input-field pl-10" required />
              </div>
            </div>

            <button type="submit" className="bg-gradient-to-r from-emerald-500 to-pink-500 text-white w-full py-3 rounded-xl font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all">
              Send reset link
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            Remember your password?{' '}
            <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}