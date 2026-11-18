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
  LuBriefcase,
  LuSparkles,
  LuGlobe,
  LuRuler,
  LuHeart,
  LuQuote,
} from 'react-icons/lu';

const PAGE_SIZE = 20;

export default function Feed() {
  const navigate = useNavigate();
  const {
    user,
    loading: authLoading,
    creditsBalance,
    cooldownMs,
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
      // cooldownMs from context reflects this
    }
    setUnlockingId(null);
  };

  // Filter visible profiles by search across all intro attributes
  const displayProfiles = search.trim()
    ? profiles.filter((p) => {
        const q = search.toLowerCase();
        return (
          p.display_name?.toLowerCase().includes(q) ||
          p.full_name?.toLowerCase().includes(q) ||
          p.about_me?.toLowerCase().includes(q) ||
          p.bio?.toLowerCase().includes(q) ||
          p.tribe?.toLowerCase().includes(q) ||
          p.occupation?.toLowerCase().includes(q) ||
          p.body_type?.toLowerCase().includes(q) ||
          p.height?.toLowerCase().includes(q) ||
          p.state?.toLowerCase().includes(q) ||
          p.location_state?.toLowerCase().includes(q) ||
          p.area?.toLowerCase().includes(q) ||
          p.location_city?.toLowerCase().includes(q) ||
          p.looking_for?.toLowerCase().includes(q)
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
              placeholder="Search by name, tribe, occupation, state, body type…"
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

          {/* Selects Row */}
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
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all border cursor-pointer ${
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
            <p className="text-sm">Try adjusting your filters or search keywords.</p>
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
              className="px-6 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm text-slate-300 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            >
              Load more profiles
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

// ---- Comprehensive Dating Intro Profile Card ----
function ProfileCard({ profile, isUnlocked, unlockData, onUnlock, unlocking, cooldownActive, creditsBalance }) {
  const intentLabel = INTENT_LOOKUP[profile.intent] || profile.intent || null;
  const revealed = isUnlocked || !!unlockData;

  const displayName = profile.display_name || profile.full_name || 'Anonymous';
  const age = profile.age;
  const state = profile.state || profile.location_state;
  const area = profile.area || profile.location_city;
  const locationText = [area, state].filter(Boolean).join(', ');
  const bio = profile.about_me || profile.bio;
  const lookingFor = profile.looking_for;

  // Format body type
  const bodyTypeLookup = {
    slim: 'Slim',
    average: 'Average',
    athletic: 'Athletic',
    curvy: 'Curvy',
    plus_size: 'Plus Size',
    muscular: 'Muscular',
  };
  const bodyTypeDisplay = profile.body_type
    ? bodyTypeLookup[profile.body_type.toLowerCase()] || profile.body_type
    : null;

  // Format gender
  const genderDisplay = profile.gender
    ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1).toLowerCase()
    : null;

  // Gather core dating intro attributes: State, Gender, Tribe, Occupation, Body Type, Height, Religion
  const specs = [
    genderDisplay && { label: 'Gender', value: genderDisplay, icon: LuUser },
    state && { label: 'State', value: state, icon: LuMapPin },
    area && { label: 'Area / City', value: area, icon: LuMapPin },
    profile.tribe && { label: 'Tribe', value: profile.tribe, icon: LuGlobe },
    profile.occupation && { label: 'Occupation', value: profile.occupation, icon: LuBriefcase },
    bodyTypeDisplay && { label: 'Body Type', value: bodyTypeDisplay, icon: LuSparkles },
    profile.height && { label: 'Height', value: profile.height, icon: LuRuler },
    profile.religion && { label: 'Religion', value: profile.religion, icon: LuHeart },
  ].filter(Boolean);

  // Initials for avatar badge
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'M';

  return (
    <div
      className={`relative rounded-3xl border bg-slate-900/80 p-5 sm:p-5.5 flex flex-col gap-4 transition-all duration-200 hover:bg-slate-900 hover:shadow-xl hover:shadow-emerald-500/5 ${
        profile.is_featured
          ? 'border-emerald-400/50 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-400/20'
          : 'border-white/10 hover:border-white/20'
      }`}
    >
      {/* Top Bar: Avatar, Name & Age, Badges */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400/20 to-pink-500/20 border border-white/10 flex items-center justify-center font-bold text-white text-base shadow-inner shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-white text-base sm:text-lg tracking-tight truncate">
              {displayName}
              {age ? <span className="text-slate-400 font-normal">, {age}</span> : ''}
            </h3>
            {locationText && (
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                <LuMapPin size={12} className="text-emerald-400 shrink-0" />
                <span className="truncate">{locationText}</span>
              </p>
            )}
          </div>
        </div>

        {/* Featured Badge */}
        {profile.is_featured && (
          <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-400/30 px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
            <LuZap size={11} /> Boosted
          </span>
        )}
      </div>

      {/* Relationship Intent Pill (if specified) */}
      {intentLabel && (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-pink-500/15 border border-pink-500/30 text-pink-300">
            <LuHeart size={12} />
            <span>Looking for {intentLabel}</span>
          </span>
        </div>
      )}

      {/* Personality Intro / Bio ("About Me") */}
      <div className="bg-slate-950/70 border border-white/5 rounded-2xl p-3.5 space-y-1">
        <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
          <LuQuote size={12} className="text-emerald-400 shrink-0" />
          <span>Dating Intro &amp; Bio</span>
        </div>
        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line">
          {bio || 'No bio written yet.'}
        </p>
      </div>

      {/* Dating Intro Attributes Matrix: State, Gender, Tribe, Occupation, Body Type, Height, Religion */}
      {specs.length > 0 && (
        <div className="space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-0.5">
            Personal Details
          </span>
          <div className="grid grid-cols-2 gap-2">
            {specs.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="p-2 sm:p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-2 hover:bg-white/[0.06] transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                    <Icon size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-slate-400 block uppercase tracking-wider leading-none mb-0.5 truncate">
                      {item.label}
                    </span>
                    <span className="text-xs font-semibold text-white block truncate">
                      {item.value}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* "Looking For" Section (Partner Preference) */}
      {lookingFor && (
        <div className="bg-pink-500/10 border border-pink-500/20 rounded-2xl p-3 text-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-pink-300 block">
            Ideal Partner
          </span>
          <p className="text-pink-100/90 italic leading-relaxed text-xs">
            &ldquo;{lookingFor}&rdquo;
          </p>
        </div>
      )}

      {/* Contact Reveal / Unlock CTA */}
      <div className="mt-auto pt-3 border-t border-white/10">
        {revealed ? (
          <div className="space-y-2 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25">
            <p className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
              <LuLockOpen size={13} />
              <span>Contact Unlocked</span>
            </p>
            <div className="space-y-1.5">
              {(unlockData?.whatsapp || profile.whatsapp_number) && (
                <a
                  href={`https://wa.me/${(unlockData?.whatsapp || profile.whatsapp_number || '').replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-colors bg-white/5 hover:bg-white/10 px-3 py-2 rounded-xl border border-emerald-500/20"
                >
                  <LuMessageCircle size={16} className="shrink-0 text-green-400" />
                  <span>WhatsApp: {unlockData?.whatsapp || profile.whatsapp_number}</span>
                </a>
              )}
              {(unlockData?.snapchat || profile.snapchat_handle) && (
                <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-yellow-300 bg-white/5 px-3 py-2 rounded-xl border border-yellow-500/20">
                  <LuGhost size={16} className="shrink-0 text-yellow-400" />
                  <span>Snapchat: {unlockData?.snapchat || profile.snapchat_handle}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <button
            onClick={onUnlock}
            disabled={unlocking || cooldownActive || creditsBalance < 1}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              unlocking
                ? 'bg-white/5 border border-white/10 text-slate-500 cursor-wait'
                : cooldownActive
                ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400 cursor-not-allowed'
                : creditsBalance < 1
                ? 'bg-white/5 border border-white/10 text-slate-400 hover:border-emerald-400/40 hover:text-white'
                : 'bg-gradient-to-r from-emerald-500 to-pink-500 text-white shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/35 hover:scale-[1.01] active:scale-[0.99]'
            }`}
          >
            {unlocking ? (
              <span className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full" />
            ) : cooldownActive ? (
              <>
                <LuLock size={15} />
                <span>Cooldown active</span>
              </>
            ) : creditsBalance < 1 ? (
              <>
                <LuLockOpen size={15} />
                <span>Unlock (Get Credits)</span>
              </>
            ) : (
              <>
                <LuLockOpen size={15} />
                <span>Unlock Contact &mdash; 1 Credit</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
