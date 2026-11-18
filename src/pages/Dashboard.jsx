import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import supabase from '../lib/supabase';
import { useMeetAm } from '../context/MeetAmContext';
import AppNavbar from '../components/AppNavbar';
import CreditTopUpModal from '../components/CreditTopUpModal';
import AnnouncementBanner from '../components/AnnouncementBanner';
import { INTENT_LOOKUP, NIGERIAN_STATES, INTENTS } from '../lib/data';
import {
  LuCreditCard,
  LuLockOpen,
  LuZap,
  LuUser,
  LuPencil,
  LuCheck,
  LuX,
  LuCircleAlert,
  LuRocket,
  LuMessageCircle,
  LuGhost,
  LuClock,
} from 'react-icons/lu';

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    user,
    loading: authLoading,
    creditsBalance,
    unlockedContacts,
    boostMyProfile,
    refreshCredits,
    showTopUp,
    setShowTopUp,
  } = useMeetAm();

  // Redirect unauthenticated users
  useEffect(() => {
    if (!authLoading && !user) navigate('/login', { replace: true });
  }, [authLoading, user, navigate]);

  // ---- Own profile ----
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // ---- Boost ----
  const [boosting, setBoosting] = useState(false);
  const [boostMsg, setBoostMsg] = useState(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('*')
      .or(`user_id.eq.${user.id},id.eq.${user.id}`)
      .maybeSingle()
      .then(({ data }) => {
        setProfile(data || null);
        setProfileLoading(false);
      })
      .catch(() => setProfileLoading(false));
  }, [user]);

  const openEdit = () => {
    setEditForm({
      display_name: profile?.display_name || '',
      age: profile?.age || '',
      gender: profile?.gender || '',
      intent: profile?.intent || '',
      state: profile?.state || '',
      area: profile?.area || '',
      tribe: profile?.tribe || '',
      religion: profile?.religion || '',
      occupation: profile?.occupation || '',
      height: profile?.height || '',
      body_type: profile?.body_type || '',
      about_me: profile?.about_me || '',
      looking_for: profile?.looking_for || '',
      whatsapp_number: profile?.whatsapp_number || '',
      snapchat_handle: profile?.snapchat_handle || '',
    });
    setSaveError('');
    setSaveSuccess(false);
    setShowEditModal(true);
  };

  const saveProfile = async () => {
    setSaving(true);
    setSaveError('');
    setSaveSuccess(false);

    const payload = {
      ...editForm,
      age: editForm.age ? parseInt(editForm.age, 10) : null,
      updated_at: new Date().toISOString(),
    };

    if (profile) {
      // Update existing
      const { error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('user_id', user.id);
      if (error) { setSaveError(error.message); setSaving(false); return; }
    } else {
      // Insert new profile
      const { error } = await supabase
        .from('profiles')
        .insert({ ...payload, user_id: user.id });
      if (error) { setSaveError(error.message); setSaving(false); return; }
    }

    // Refetch
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .or(`user_id.eq.${user.id},id.eq.${user.id}`)
      .maybeSingle();
    setProfile(data || null);
    setSaving(false);
    setSaveSuccess(true);
    setTimeout(() => { setSaveSuccess(false); setShowEditModal(false); }, 1200);
  };

  const handleBoost = async () => {
    if (!profile) return;
    setBoosting(true);
    setBoostMsg(null);
    const result = await boostMyProfile(profile.id);
    setBoosting(false);
    if (result?.ok) {
      setBoostMsg({ success: true, text: 'Profile boosted for 24 hours!' });
      refreshCredits();
      // Refetch profile to update featured_until
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .or(`user_id.eq.${user.id},id.eq.${user.id}`)
        .maybeSingle();
      setProfile(data || profile);
    } else if (result?.error === 'INSUFFICIENT_CREDITS') {
      setShowTopUp(true);
    } else {
      setBoostMsg({ success: false, text: result?.error || 'Boost failed.' });
    }
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-emerald-500/30 border-t-emerald-400 rounded-full" />
      </div>
    );
  }

  const isBoosted =
    profile?.is_featured &&
    profile?.featured_until &&
    new Date(profile.featured_until) > new Date();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <AppNavbar />
      <AnnouncementBanner />

      <CreditTopUpModal
        open={showTopUp}
        onClose={() => setShowTopUp(false)}
        onCompleted={() => { setShowTopUp(false); refreshCredits(); }}
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <StatCard
            icon={<LuCreditCard size={18} className="text-emerald-400" />}
            label="Credits"
            value={creditsBalance}
            action={
              <button
                onClick={() => setShowTopUp(true)}
                className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                Top up →
              </button>
            }
          />
          <StatCard
            icon={<LuLockOpen size={18} className="text-pink-400" />}
            label="Contacts Unlocked"
            value={unlockedContacts.length}
          />
          <StatCard
            icon={<LuZap size={18} className="text-amber-400" />}
            label="Profile Boost"
            value={isBoosted ? 'Active' : 'Inactive'}
            highlight={isBoosted}
            action={
              !isBoosted && (
                <button
                  onClick={handleBoost}
                  disabled={boosting || creditsBalance < 1}
                  className="text-xs text-amber-400 hover:text-amber-300 transition-colors disabled:opacity-40"
                >
                  {boosting ? 'Boosting…' : 'Boost (1 credit) →'}
                </button>
              )
            }
          />
        </div>

        {boostMsg && (
          <div className={`flex items-center justify-center gap-2 text-sm ${boostMsg.success ? 'text-emerald-400' : 'text-red-400'}`}>
            {boostMsg.success ? <LuRocket size={16} /> : <LuCircleAlert size={16} />}
            <span>{boostMsg.text}</span>
          </div>
        )}

        {/* My Profile card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-pink-500 flex items-center justify-center shrink-0">
                <LuUser size={20} className="text-white" />
              </div>
              <div>
                <h2 className="font-bold text-white text-base sm:text-lg">My Profile</h2>
                <p className="text-xs text-slate-400">Your public dating intro</p>
              </div>
            </div>
            <button
              onClick={openEdit}
              className="flex items-center justify-center gap-1.5 text-xs sm:text-sm text-emerald-400 hover:text-emerald-300 transition-colors border border-emerald-400/30 px-3.5 py-1.5 rounded-xl bg-emerald-500/10 cursor-pointer self-start sm:self-auto"
            >
              <LuPencil size={13} />
              {profile ? 'Edit' : 'Create'} Profile
            </button>
          </div>

          {!profile ? (
            <div className="text-center py-8 text-slate-400">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 mx-auto mb-3">
                <LuPencil size={24} />
              </div>
              <p className="font-medium text-white mb-1">No profile yet</p>
              <p className="text-sm mb-4">Create your intro to appear in the feed.</p>
              <button
                onClick={openEdit}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-pink-500 text-white text-sm font-medium"
              >
                Create Profile
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 text-sm">
              <Field label="Display Name" value={profile.display_name} />
              <Field label="Age" value={profile.age ? `${profile.age} yrs` : null} />
              <Field label="Gender" value={profile.gender} />
              <Field label="Intent" value={INTENT_LOOKUP[profile.intent] || profile.intent} />
              <Field label="State" value={profile.state} />
              <Field label="Area" value={profile.area} />
              <Field label="Tribe" value={profile.tribe} />
              <Field label="Religion" value={profile.religion} />
              <Field label="Occupation" value={profile.occupation} />
              <Field label="Height" value={profile.height} />
              <Field
                label="Body Type"
                value={
                  profile.body_type
                    ? {
                        slim: 'Slim',
                        average: 'Average',
                        athletic: 'Athletic',
                        curvy: 'Curvy',
                        plus_size: 'Plus Size',
                        muscular: 'Muscular',
                      }[profile.body_type.toLowerCase()] || profile.body_type
                    : null
                }
              />
              <div className="col-span-2 sm:col-span-3">
                <Field label="About Me" value={profile.about_me} multiline />
              </div>
              <div className="col-span-2 sm:col-span-3">
                <Field label="Looking For" value={profile.looking_for} multiline />
              </div>
              <Field label="WhatsApp" value={profile.whatsapp_number ? '•••••••••• (hidden)' : null} />
              <Field label="Snapchat" value={profile.snapchat_handle ? '•••••••••• (hidden)' : null} />
            </div>
          )}
        </div>

        {/* Unlocked contacts */}
        {unlockedContacts.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <LuLockOpen size={16} className="text-pink-400" />
              <span>Unlocked Contacts ({unlockedContacts.length})</span>
            </h3>
            <div className="space-y-2.5">
              {unlockedContacts.map((c) => {
                const name = c.profiles?.display_name || c.profiles?.full_name || 'Member';
                const wa = c.profiles?.whatsapp_number || c.whatsapp_number;
                const snap = c.profiles?.snapchat_handle || c.snapchat_handle;

                return (
                  <div
                    key={c.profile_id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm border border-white/5 rounded-2xl p-3.5 bg-slate-900/60 hover:bg-slate-900 transition-colors"
                  >
                    <div>
                      <p className="font-bold text-white text-sm">{name}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Unlocked on {new Date(c.unlocked_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {wa && (
                        <a
                          href={`https://wa.me/${wa.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-500/15 border border-green-500/30 text-green-300 text-xs font-semibold hover:bg-green-500 hover:text-white transition-colors"
                        >
                          <LuMessageCircle size={14} />
                          <span>WhatsApp: {wa}</span>
                        </a>
                      )}
                      {snap && (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-yellow-500/15 border border-yellow-500/30 text-yellow-300 text-xs font-semibold">
                          <LuGhost size={14} />
                          <span>Snapchat: {snap.startsWith('@') ? snap : `@${snap}`}</span>
                        </span>
                      )}
                      {!wa && !snap && (
                        <span className="text-xs text-slate-400 italic">No handles attached</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="flex gap-3 flex-wrap">
          <Link
            to="/feed"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-pink-500 text-white text-sm font-medium shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-shadow"
          >
            Browse Feed →
          </Link>
          <Link
            to="/profile"
            className="px-5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white text-sm hover:bg-white/10 transition-colors"
          >
            View Profile
          </Link>
        </div>
      </main>

      {/* Edit / Create Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md cursor-pointer"
            onClick={() => setShowEditModal(false)}
          />
          <div className="relative w-full max-w-2xl max-h-[92dvh] sm:max-h-[88vh] flex flex-col rounded-t-[28px] sm:rounded-3xl border-t sm:border border-white/10 bg-slate-900 shadow-2xl z-10 overflow-hidden text-white">
            {/* Mobile pull indicator */}
            <div className="w-full pt-2.5 pb-1 flex justify-center sm:hidden shrink-0 bg-slate-900">
              <div className="w-10 h-1 bg-white/20 rounded-full" />
            </div>

            {/* Sticky Header */}
            <div className="px-4 sm:px-6 py-3.5 border-b border-white/10 flex items-center justify-between shrink-0 bg-slate-900/95 backdrop-blur-md">
              <h2 className="text-base sm:text-lg font-bold text-white">
                {profile ? 'Edit Profile' : 'Create Profile'}
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <LuX size={18} />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 overscroll-contain">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
              <FormField label="Display Name *" required>
                <input
                  type="text"
                  value={editForm.display_name}
                  onChange={(e) => setEditForm((f) => ({ ...f, display_name: e.target.value }))}
                  className="form-input"
                  placeholder="e.g. Ade from Lagos"
                />
              </FormField>

              <FormField label="Age">
                <input
                  type="number"
                  value={editForm.age}
                  onChange={(e) => setEditForm((f) => ({ ...f, age: e.target.value }))}
                  className="form-input"
                  placeholder="e.g. 28"
                  min="18" max="80"
                />
              </FormField>

              <FormField label="Gender">
                <select
                  value={editForm.gender}
                  onChange={(e) => setEditForm((f) => ({ ...f, gender: e.target.value }))}
                  className="form-input"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </FormField>

              <FormField label="Intent">
                <select
                  value={editForm.intent}
                  onChange={(e) => setEditForm((f) => ({ ...f, intent: e.target.value }))}
                  className="form-input"
                >
                  <option value="">Select intent</option>
                  {INTENTS.map((i) => (
                    <option key={i.value} value={i.value}>{i.label}</option>
                  ))}
                </select>
              </FormField>

              <FormField label="State">
                <select
                  value={editForm.state}
                  onChange={(e) => setEditForm((f) => ({ ...f, state: e.target.value }))}
                  className="form-input"
                >
                  <option value="">Select state</option>
                  {NIGERIAN_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </FormField>

              <FormField label="Area / LGA">
                <input
                  type="text"
                  value={editForm.area}
                  onChange={(e) => setEditForm((f) => ({ ...f, area: e.target.value }))}
                  className="form-input"
                  placeholder="e.g. Lekki"
                />
              </FormField>

              <FormField label="Tribe">
                <input
                  type="text"
                  value={editForm.tribe}
                  onChange={(e) => setEditForm((f) => ({ ...f, tribe: e.target.value }))}
                  className="form-input"
                  placeholder="e.g. Yoruba"
                />
              </FormField>

              <FormField label="Religion">
                <input
                  type="text"
                  value={editForm.religion}
                  onChange={(e) => setEditForm((f) => ({ ...f, religion: e.target.value }))}
                  className="form-input"
                  placeholder="e.g. Christian"
                />
              </FormField>

              <FormField label="Occupation">
                <input
                  type="text"
                  value={editForm.occupation}
                  onChange={(e) => setEditForm((f) => ({ ...f, occupation: e.target.value }))}
                  className="form-input"
                  placeholder="e.g. Software Engineer"
                />
              </FormField>

              <FormField label="Height">
                <input
                  type="text"
                  value={editForm.height}
                  onChange={(e) => setEditForm((f) => ({ ...f, height: e.target.value }))}
                  className="form-input"
                  placeholder={`e.g. 5'10"`}
                />
              </FormField>

              <FormField label="Body Type">
                <select
                  value={editForm.body_type}
                  onChange={(e) => setEditForm((f) => ({ ...f, body_type: e.target.value }))}
                  className="form-input"
                >
                  <option value="">Select</option>
                  <option value="slim">Slim</option>
                  <option value="average">Average</option>
                  <option value="athletic">Athletic</option>
                  <option value="curvy">Curvy</option>
                  <option value="plus_size">Plus Size</option>
                  <option value="muscular">Muscular</option>
                </select>
              </FormField>

              <FormField label="WhatsApp Number" hint="Only revealed after unlock">
                <input
                  type="tel"
                  value={editForm.whatsapp_number}
                  onChange={(e) => setEditForm((f) => ({ ...f, whatsapp_number: e.target.value }))}
                  className="form-input"
                  placeholder="+2348012345678"
                />
              </FormField>

              <FormField label="Snapchat Handle" hint="Only revealed after unlock">
                <input
                  type="text"
                  value={editForm.snapchat_handle}
                  onChange={(e) => setEditForm((f) => ({ ...f, snapchat_handle: e.target.value }))}
                  className="form-input"
                  placeholder="@yourhandle"
                />
              </FormField>

              <div className="sm:col-span-2">
                <FormField label="About Me *" required hint="Tell people who you are — personality, values, lifestyle.">
                  <textarea
                    value={editForm.about_me}
                    onChange={(e) => setEditForm((f) => ({ ...f, about_me: e.target.value }))}
                    className="form-input h-28 resize-none"
                    placeholder="Describe yourself genuinely…"
                  />
                </FormField>
              </div>

              <div className="sm:col-span-2">
                <FormField label="Looking For" hint="What kind of partner or connection are you seeking?">
                  <textarea
                    value={editForm.looking_for}
                    onChange={(e) => setEditForm((f) => ({ ...f, looking_for: e.target.value }))}
                    className="form-input h-20 resize-none"
                    placeholder="Describe your ideal match…"
                  />
                </FormField>
              </div>
            </div>

              {saveError && (
                <p className="mt-3 text-xs sm:text-sm text-red-400 flex items-center gap-1.5">
                  <LuCircleAlert size={14} /> {saveError}
                </p>
              )}
            </div>

            {/* Sticky Footer */}
            <div className="shrink-0 px-4 sm:px-6 py-3 sm:py-4 border-t border-white/10 bg-slate-900/95 backdrop-blur-md flex gap-3">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="flex-1 py-3 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 transition-colors cursor-pointer text-xs sm:text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveProfile}
                disabled={saving || !editForm.display_name}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-pink-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-shadow disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {saving ? (
                  <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                ) : saveSuccess ? (
                  <><LuCheck size={16} /> Saved!</>
                ) : (
                  'Save Profile'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .form-input {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border-radius: 0.75rem;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: white;
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .form-input:focus {
          border-color: #10b981;
          box-shadow: 0 0 0 2px rgba(16,185,129,0.2);
        }
        .form-input option { background: #0f172a; }
      `}</style>
    </div>
  );
}

// ---- Sub-components ----
function StatCard({ icon, label, value, action, highlight }) {
  return (
    <div className={`rounded-2xl border p-5 ${highlight ? 'border-amber-400/30 bg-amber-500/5' : 'border-white/10 bg-white/5'}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs text-slate-400">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${highlight ? 'text-amber-300' : 'text-white'}`}>{value}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

function Field({ label, value, multiline }) {
  return (
    <div>
      <p className="text-xs text-slate-500 mb-0.5">{label}</p>
      <p className={`text-white font-medium ${multiline ? 'whitespace-pre-wrap' : 'truncate'}`}>
        {value || <span className="text-slate-600 italic text-sm">Not set</span>}
      </p>
    </div>
  );
}

function FormField({ label, children, hint, required }) {
  return (
    <div>
      <label className="block text-xs text-slate-400 mb-1">
        {label}
        {hint && <span className="ml-1 text-slate-600">({hint})</span>}
      </label>
      {children}
    </div>
  );
}
