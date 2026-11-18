import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import supabase from '../lib/supabase';
import AuthLayout from '../components/AuthLayout';
import { NIGERIAN_STATES, INTENTS, BODY_TYPES } from '../lib/data';
import {
  LuMail,
  LuLock,
  LuUser,
  LuCalendar,
  LuMapPin,
  LuEye,
  LuEyeOff,
  LuCircleAlert,
  LuCircleCheck,
  LuArrowRight,
  LuChevronDown,
  LuBriefcase,
  LuSparkles,
  LuGlobe,
  LuHeart,
} from 'react-icons/lu';

export default function Register() {
  const navigate = useNavigate();

  // State Declarations - Account
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // State Declarations - Dating Intro & Specs
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [locationState, setLocationState] = useState('');
  const [locationCity, setLocationCity] = useState('');
  const [intent, setIntent] = useState('serious_relationship');
  const [tribe, setTribe] = useState('');
  const [occupation, setOccupation] = useState('');
  const [bodyType, setBodyType] = useState('');
  const [height, setHeight] = useState('');
  const [bio, setBio] = useState('');
  const [lookingFor, setLookingFor] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Auto-navigate after success
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        navigate('/login');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    // Age validation (18+)
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (isNaN(age) || age < 18) {
      setError('You must be at least 18 years old to join MeetAm');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Sign up user
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name.trim(),
            dob,
            gender,
            location_city: locationCity.trim(),
            location_state: locationState,
            bio: bio.trim(),
            intent,
            tribe: tribe.trim(),
            occupation: occupation.trim(),
            body_type: bodyType,
            height: height.trim(),
            looking_for: lookingFor.trim(),
          },
        },
      });

      if (authError) throw authError;

      if (data?.user) {
        // Insert/upsert profile row with all dating intro attributes
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            user_id: data.user.id,
            full_name: name.trim(),
            display_name: name.trim(),
            date_of_birth: dob,
            age,
            gender,
            location_city: locationCity.trim(),
            location_state: locationState,
            state: locationState,
            area: locationCity.trim(),
            intent,
            tribe: tribe.trim(),
            occupation: occupation.trim(),
            body_type: bodyType,
            height: height.trim(),
            bio: bio.trim(),
            about_me: bio.trim(),
            looking_for: lookingFor.trim(),
            is_active: true,
          });

        if (profileError) {
          console.error('Profile creation note:', profileError);
        }

        setSuccess('Account created successfully! Redirecting to login…');
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout activeTab="register">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">Create your intro</h2>
        <p className="text-sm text-slate-400 mt-1">Join Nigeria's intentional dating community</p>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs sm:text-sm mb-5 leading-relaxed">
          <LuCircleAlert size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs sm:text-sm mb-5 leading-relaxed">
          <LuCircleCheck size={16} className="shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Section 1: Account Credentials */}
        <div className="space-y-3.5">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Full Name / Display Name <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <LuUser size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Adeyemi Adeleke"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all hover:border-white/20"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Email Address <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <LuMail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all hover:border-white/20"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Password <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <LuLock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="8+ characters"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all hover:border-white/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                {showPassword ? <LuEyeOff size={15} /> : <LuEye size={15} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Confirm Password <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <LuLock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all hover:border-white/20"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                {showConfirmPassword ? <LuEyeOff size={15} /> : <LuEye size={15} />}
              </button>
            </div>
          </div>
        </div>

        {/* Section 2: Dating Intro, State, Gender, Tribe, Body Type, Occupation */}
        <div className="pt-3 border-t border-white/10 space-y-3.5">
          <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
            Dating Card &amp; Specs
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Date of Birth */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Date of Birth (18+) <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <LuCalendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="date"
                  required
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 [color-scheme:dark] transition-all hover:border-white/20"
                />
              </div>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Gender <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <LuUser size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <select
                  required
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full appearance-none pl-10 pr-9 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer transition-all hover:border-white/20"
                >
                  <option value="" disabled className="bg-slate-900">Select Gender</option>
                  <option value="male" className="bg-slate-900">Male</option>
                  <option value="female" className="bg-slate-900">Female</option>
                  <option value="other" className="bg-slate-900">Other</option>
                </select>
                <LuChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* State */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                State in Nigeria <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <LuMapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <select
                  required
                  value={locationState}
                  onChange={(e) => setLocationState(e.target.value)}
                  className="w-full appearance-none pl-10 pr-9 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer transition-all hover:border-white/20"
                >
                  <option value="" disabled className="bg-slate-900">Select State</option>
                  {NIGERIAN_STATES.map((s) => (
                    <option key={s} value={s} className="bg-slate-900">{s}</option>
                  ))}
                </select>
                <LuChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* City / Area */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                City / Area <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <LuMapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={locationCity}
                  onChange={(e) => setLocationCity(e.target.value)}
                  placeholder="e.g. Lekki, Ikeja, Garki, Port Harcourt"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all hover:border-white/20"
                />
              </div>
            </div>

            {/* Relationship Intent */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Relationship Intent
              </label>
              <div className="relative">
                <LuHeart size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pink-400 pointer-events-none" />
                <select
                  value={intent}
                  onChange={(e) => setIntent(e.target.value)}
                  className="w-full appearance-none pl-10 pr-9 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer transition-all hover:border-white/20"
                >
                  {INTENTS.map((i) => (
                    <option key={i.value} value={i.value} className="bg-slate-900">{i.label}</option>
                  ))}
                </select>
                <LuChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Body Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Body Type
              </label>
              <div className="relative">
                <LuSparkles size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-400 pointer-events-none" />
                <select
                  value={bodyType}
                  onChange={(e) => setBodyType(e.target.value)}
                  className="w-full appearance-none pl-10 pr-9 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer transition-all hover:border-white/20"
                >
                  <option value="" className="bg-slate-900">Select Body Type</option>
                  {BODY_TYPES.map((bt) => (
                    <option key={bt.value} value={bt.value} className="bg-slate-900">{bt.label}</option>
                  ))}
                </select>
                <LuChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Tribe / Ethnicity */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Tribe / Ethnicity
              </label>
              <div className="relative">
                <LuGlobe size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={tribe}
                  onChange={(e) => setTribe(e.target.value)}
                  placeholder="e.g. Yoruba, Igbo, Hausa, Edo"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all hover:border-white/20"
                />
              </div>
            </div>

            {/* Occupation */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Occupation / Career
              </label>
              <div className="relative">
                <LuBriefcase size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  placeholder="e.g. Software Engineer, Doctor, Trader"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all hover:border-white/20"
                />
              </div>
            </div>
          </div>

          {/* Personality Intro / Bio */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Personality Intro / Bio <span className="text-red-400">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="What are you about? Your personality, values, humor, lifestyle, and character…"
              className="w-full p-3 rounded-xl bg-slate-950/60 border border-white/10 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none transition-all hover:border-white/20"
            />
          </div>

          {/* Looking For */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              What kind of partner are you looking for? (Optional)
            </label>
            <input
              type="text"
              value={lookingFor}
              onChange={(e) => setLookingFor(e.target.value)}
              placeholder="e.g. Someone kind, ambitious, funny, and family-oriented"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all hover:border-white/20"
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-3 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-pink-500 text-white text-sm font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/35 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
        >
          {isSubmitting ? (
            <span className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full" />
          ) : (
            <>
              <span>Create My Intro</span>
              <LuArrowRight size={16} />
            </>
          )}
        </button>
      </form>
    </AuthLayout>
  );
}
