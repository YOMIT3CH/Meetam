import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../lib/supabase';
import { useMeetAm } from '../context/MeetAmContext';
import AppNavbar from '../components/AppNavbar';
import CreditTopUpModal from '../components/CreditTopUpModal';
import AnnouncementBanner from '../components/AnnouncementBanner';
import {
  NIGERIAN_STATES,
  INTENTS,
  INTENT_LOOKUP,
  PUBLIC_PROFILE_FIELDS,
  DEFAULT_INTENT_VALUES,
} from '../lib/data';
import {
  LuLockOpen,
  LuLock,
  LuZap,
  LuSearch,
  LuX,
  LuClock,
  LuMessageCircle,
  LuGhost,
  LuChevronDown,
  LuMapPin,
  LuUser,
} from 'react-icons/lu';

const PAGE_SIZE = 20;

export default function Feed() {
  const navigate = useNavigate();
  const {
    user,
    loading: authLoading,
    creditsBalance,
    unlockedContacts,
    cooldownMs,
    cooldownUntilAt,
    formatCountdown,
    unlockContact,
    isProfileUnlocked,
    refreshCredits,
    refreshUnlockedContacts,
    showTopUp,
    setShowTopUp,
    enabledIntentValues,
  } = useMeetAm();

  // Redirect unauthenticated users
  useEffect(() => {
    if (!authLoading && !user) navigate('/login', { replace: true });
  }, [authLoading, user, navigate]);

  // ---- Filters ----
  const [filterState, setFilterState] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [filterIntents, setFilterIntents] = useState(enabledIntentValues);
  const [search, setSearch] = useState('');

  // ---- Profiles ----
  const [profiles, setProfiles] = useState([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // ---- Unlock state ----
  const [unlockingId, setUnlockingId] = useState(null);
  const [unlockResult, setUnlockResult] = useState({}); // profileId -> { whatsapp, snapchat, error }

  const fetchProfiles = useCallback(async (reset = false) => {
    setFeedLoading(true);
    const currentPage = reset ? 0 : page;
    let query = supabase
      .from('profiles')
      .select(PUBLIC_PROFILE_FIELDS.join(', '))
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .range(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE - 1);

    if (filterState) query = query.eq('state', filterState);
    if (filterGender) query = query.eq('gender', filterGender);
    if (filterIntents.length > 0) query = query.in('intent', filterIntents);
    if (user) query = query.neq('user_id', user.id);

    const { data, error } = await query;
    setFeedLoading(false);
    if (error || !data) return;

    setHasMore(data.length === PAGE_SIZE);
    if (reset) {
      setProfiles(data);
      setPage(1);
    } else {
      setProfiles((prev) => [...prev, ...data]);
      setPage((p) => p + 1);
    }
  }, [page, filterState, filterGender, filterIntents, user]);

  // Initial load + filter changes
  useEffect(() => {
    if (!authLoading && user) fetchProfiles(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, filterState, filterGender, filterIntents]);

  const handleUnlock = async (profileId) => {
    if (unlockingId) return;
    setUnlockingId(profileId);
    const result = await unlockContact(profileId);
    if (result?.ok) {
      setUnlockResult((prev) => ({
        ...prev,
        [profileId]: {
          whatsapp: result.whatsapp_number,
          snapchat: result.snapchat_handle,
        },
      }));
      refreshCredits();
      refreshUnlockedContacts();
    } else if (result?.error === 'INSUFFICIENT_CREDITS') {
      setShowTopUp(true);
    } else if (result?.error === 'COOLDOWN_ACTIVE') {
      // cooldownMs from context already reflects this
    }
    setUnlockingId(null);
  };

  // Filter visible profiles by search
  const displayProfiles = search.trim()
    ? profiles.filter((p) => {
        const q = search.toLowerCase();
        return (
          p.display_name?.toLowerCase().includes(q) ||
          p.about_me?.toLowerCase().includes(q) ||
          p.tribe?.toLowerCase().includes(q) ||
          p.occupation?.toLowerCase().includes(q)
        );
      })
    : profiles;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-emerald-500/30 border-t-emerald-400 rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <AppNavbar />
      <AnnouncementBanner />

      {/* Credit top-up modal */}
      <CreditTopUpModal
        open={showTopUp}
        onClose={() => setShowTopUp(false)}
        onCompleted={() => { setShowTopUp(false); refreshCredits(); }}
      />

      {/* Cooldown banner */}
      {cooldownMs > 0 && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-center gap-1.5 text-xs text-amber-300">
          <LuClock size={13} className="text-amber-400" />
          <span>Next unlock available in</span>
          <span className="font-semibold">{formatCountdown(cooldownMs)}</span>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 mb-6">
          {/* Search */}
          <div className="relative w-full sm:flex-1 min-w-[200px]">
            <LuSearch size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, tribe, occupation…"
              className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all hover:border-white/20"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 rounded transition-colors"
                title="Clear search"
              >
                <LuX size={14} />
              </button>
            )}
          </div>

          {/* Selects Row: 2 columns on mobile, inline on desktop */}
          <div className="grid grid-cols-2 gap-2.5 w-full sm:w-auto sm:flex sm:gap-3">
            {/* State filter */}
            <div className="relative w-full sm:min-w-[150px]">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <LuMapPin size={14} />
              </div>
              <select
                value={filterState}
                onChange={(e) => setFilterState(e.target.value)}
                className="w-full appearance-none pl-9 pr-9 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all hover:border-white/20 cursor-pointer shadow-sm truncate"
              >
                <option value="" className="bg-slate-900 text-slate-400">All States</option>
                {NIGERIAN_STATES.map((s) => (
                  <option key={s} value={s} className="bg-slate-900 text-white py-1">{s}</option>
                ))}
              </select>
              <LuChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Gender filter */}
            <div className="relative w-full sm:min-w-[140px]">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <LuUser size={14} />
              </div>
              <select
                value={filterGender}
                onChange={(e) => setFilterGender(e.target.value)}
                className="w-full appearance-none pl-9 pr-9 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all hover:border-white/20 cursor-pointer shadow-sm truncate"
              >
                <option value="" className="bg-slate-900 text-slate-400">All Genders</option>
                <option value="male" className="bg-slate-900 text-white py-1">Male</option>
                <option value="female" className="bg-slate-900 text-white py-1">Female</option>
                <option value="other" className="bg-slate-900 text-white py-1">Other</option>
              </select>
              <LuChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Intent pills */}
          <div className="flex gap-2 flex-wrap items-center w-full">
            {INTENTS.map((intent) => {
              const active = filterIntents.includes(intent.value);
              return (
                <button
                  key={intent.value}
                  onClick={() =>
                    setFilterIntents((prev) =>
                      active
                        ? prev.filter((v) => v !== intent.value)
                        : [...prev, intent.value]
                    )
                  }
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                    active
                      ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300 shadow-sm shadow-emerald-500/10'
                      : 'bg-slate-900/90 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                  }`}
                >
                  {intent.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Profile grid */}
        {feedLoading && profiles.length === 0 ? (
          <div className="flex justify-center py-24">
            <div className="animate-spin h-10 w-10 border-4 border-emerald-500/30 border-t-emerald-400 rounded-full" />
          </div>
        ) : displayProfiles.length === 0 ? (
          <div className="text-center py-24 text-slate-400">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 mx-auto mb-4">
              <LuSearch size={28} />
            </div>
            <p className="font-semibold text-white mb-1">No profiles found</p>
            <p className="text-sm">Try adjusting your filters or check back later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayProfiles.map((profile) => (
              <ProfileCard
                key={profile.id}
                profile={profile}
                isUnlocked={isProfileUnlocked(profile.id)}
                unlockData={unlockResult[profile.id]}
                onUnlock={() => handleUnlock(profile.id)}
                unlocking={unlockingId === profile.id}
                cooldownActive={cooldownMs > 0}
                creditsBalance={creditsBalance}
              />
            ))}
          </div>
        )}

        {/* Load more */}
        {hasMore && !feedLoading && displayProfiles.length > 0 && (
          <div className="flex justify-center mt-8">
            <button
              onClick={() => fetchProfiles(false)}
              className="px-6 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
            >
              Load more
            </button>
          </div>
        )}

        {feedLoading && profiles.length > 0 && (
          <div className="flex justify-center mt-6">
            <div className="animate-spin h-6 w-6 border-4 border-emerald-500/30 border-t-emerald-400 rounded-full" />
          </div>
        )}
      </main>
    </div>
  );
}

// ---- Profile Card ----
function ProfileCard({ profile, isUnlocked, unlockData, onUnlock, unlocking, cooldownActive, creditsBalance }) {
  const intentLabel = INTENT_LOOKUP[profile.intent] || profile.intent || '—';
  const revealed = isUnlocked || !!unlockData;

  return (
    <div className={`relative rounded-2xl border bg-white/5 p-5 flex flex-col gap-3 transition-all hover:bg-white/8 ${
      profile.is_featured ? 'border-emerald-400/40 shadow-lg shadow-emerald-500/10' : 'border-white/10'
    }`}>
      {/* Featured badge */}
      {profile.is_featured && (
        <span className="absolute top-3 right-3 flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-400/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
          <LuZap size={10} /> Featured
        </span>
      )}

      {/* Header */}
      <div>
        <p className="font-bold text-white text-base">
          {profile.display_name || 'Anonymous'}
        </p>
        <p className="text-xs text-slate-400 mt-0.5">
          {[profile.age && `${profile.age} yrs`, profile.gender, profile.state].filter(Boolean).join(' · ')}
        </p>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {intentLabel && (
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-300">
            {intentLabel}
          </span>
        )}
        {profile.tribe && (
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400">
            {profile.tribe}
          </span>
        )}
        {profile.religion && (
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400">
            {profile.religion}
          </span>
        )}
        {profile.occupation && (
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400">
            {profile.occupation}
          </span>
        )}
      </div>

      {/* Bio */}
      {profile.about_me && (
        <p className="text-sm text-slate-300 line-clamp-3 leading-relaxed">
          {profile.about_me}
        </p>
      )}

      {/* Looking for */}
      {profile.looking_for && (
        <p className="text-xs text-slate-500 italic line-clamp-2">
          Looking for: {profile.looking_for}
        </p>
      )}

      {/* Contact reveal / unlock */}
      <div className="mt-auto pt-3 border-t border-white/5">
        {revealed ? (
          <div className="space-y-1.5">
            {(unlockData?.whatsapp || profile.whatsapp_number) && (
              <a
                href={`https://wa.me/${(unlockData?.whatsapp || '').replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                <LuMessageCircle size={16} />
                WhatsApp: {unlockData?.whatsapp || '—'}
              </a>
            )}
            {(unlockData?.snapchat || profile.snapchat_handle) && (
              <p className="flex items-center gap-2 text-sm text-yellow-400">
                <LuGhost size={16} />
                Snapchat: {unlockData?.snapchat || '—'}
              </p>
            )}
          </div>
        ) : (
          <button
            onClick={onUnlock}
            disabled={unlocking || cooldownActive || creditsBalance < 1}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
              unlocking
                ? 'bg-white/5 border border-white/10 text-slate-500 cursor-wait'
                : cooldownActive
                ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400 cursor-not-allowed'
                : creditsBalance < 1
                ? 'bg-white/5 border border-white/10 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-500 to-pink-500 text-white hover:shadow-lg hover:shadow-emerald-500/20'
            }`}
          >
            {unlocking ? (
              <span className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full" />
            ) : cooldownActive ? (
              <><LuLock size={14} /> Cooldown active</>
            ) : creditsBalance < 1 ? (
              <><LuLock size={14} /> No credits</>
            ) : (
              <><LuLockOpen size={14} /> Unlock — 1 credit</>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
