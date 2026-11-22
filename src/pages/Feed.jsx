import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../lib/supabase';
import { useMeetAm } from '../context/MeetAmContext';
import AppNavbar from '../components/AppNavbar';
import CreditTopUpModal from '../components/CreditTopUpModal';
import AnnouncementBanner from '../components/AnnouncementBanner';
import { rankProfiles } from '../lib/feedAlgorithm';
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
  LuEye,
  LuShieldCheck,
} from 'react-icons/lu';

const PAGE_SIZE = 20;

export default function Feed() {
  const navigate = useNavigate();
  const {
    user,
    loading: authLoading,
    creditsBalance,
    unlockContact,
    isProfileUnlocked,
    getUnlockedContact,
    refreshCredits,
    refreshUnlockedContacts,
    unlockedContacts,
    showTopUp,
    setShowTopUp,
  } = useMeetAm();

  // Redirect unauthenticated users
  useEffect(() => {
    if (!authLoading && !user) navigate('/login', { replace: true });
  }, [authLoading, user, navigate]);

  // ---- Viewer's own profile (for algorithm personalisation) ----
  const [viewerMeta, setViewerMeta] = useState({ state: '', tribe: '', intent: '' });

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('state, location_state, tribe, intent')
      .or(`id.eq.${user.id},user_id.eq.${user.id}`)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setViewerMeta({
            state: data.state || data.location_state || '',
            tribe: data.tribe || '',
            intent: data.intent || '',
          });
        }
      })
      .catch(() => { });
  }, [user]);

  // ---- Filters ----
  const [filterState, setFilterState] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [filterIntents, setFilterIntents] = useState([]);
  const [search, setSearch] = useState('');

  // ---- Profiles ----
  const [profiles, setProfiles] = useState([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // ---- Unlock state ----
  const [unlockingId, setUnlockingId] = useState(null);
  const [unlockResult, setUnlockResult] = useState({}); // profileId -> { whatsapp, snapchat, error }
  const [selectedProfile, setSelectedProfile] = useState(null);

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

    // ── Run ranking algorithm ──────────────────────────────────────────
    const unlockedIds = unlockedContacts.map((c) => c.profile_id);
    const ranked = rankProfiles(data, viewerMeta, unlockedIds);
    // ──────────────────────────────────────────────────────────────────

    setHasMore(data.length === PAGE_SIZE);
    if (reset) {
      setProfiles(ranked);
      setPage(1);
    } else {
      setProfiles((prev) => [...prev, ...ranked]);
      setPage((p) => p + 1);
    }
  }, [page, filterState, filterGender, filterIntents, user, viewerMeta, unlockedContacts]);

  // Initial load + filter changes
  useEffect(() => {
    if (!authLoading && user) fetchProfiles(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, filterState, filterGender, filterIntents]);

  // Re-rank in-memory when viewer's own profile loads (async after feed)
  useEffect(() => {
    if (!viewerMeta.state && !viewerMeta.tribe && !viewerMeta.intent) return;
    if (profiles.length === 0) return;
    const unlockedIds = unlockedContacts.map((c) => c.profile_id);
    setProfiles((prev) => rankProfiles(prev, viewerMeta, unlockedIds));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewerMeta]);

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

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-[calc(5rem+env(safe-area-inset-bottom,0px))]">
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
          <div className="flex gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-1 sm:py-0 sm:flex-wrap items-center w-full">
            {/* Default "All Intents" pill */}
            <button
              onClick={() => setFilterIntents([])}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border shrink-0 cursor-pointer ${filterIntents.length === 0
                  ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300 shadow-sm shadow-emerald-500/10 ring-1 ring-emerald-400/30'
                  : 'bg-slate-900/90 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                }`}
            >
              All Intents
            </button>

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
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all border shrink-0 cursor-pointer ${active
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
                getUnlockedContact={getUnlockedContact}
                onUnlock={() => handleUnlock(profile.id)}
                onCardClick={() => setSelectedProfile(profile)}
                unlocking={unlockingId === profile.id}
                creditsBalance={creditsBalance}
                score={profile._score}
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

      {/* Full Profile Details Modal */}
      {selectedProfile && (
        <ProfileDetailModal
          profile={selectedProfile}
          onClose={() => setSelectedProfile(null)}
          isUnlocked={isProfileUnlocked(selectedProfile.id)}
          unlockData={unlockResult[selectedProfile.id]}
          getUnlockedContact={getUnlockedContact}
          onUnlock={() => handleUnlock(selectedProfile.id)}
          unlocking={unlockingId === selectedProfile.id}
          creditsBalance={creditsBalance}
        />
      )}
    </div>
  );
}

// ---- Comprehensive Dating Intro Profile Card ----
function ProfileCard({
  profile,
  isUnlocked,
  unlockData,
  getUnlockedContact,
  onUnlock,
  onCardClick,
  unlocking,
  creditsBalance,
  score,
}) {
  const intentLabel = INTENT_LOOKUP[profile.intent] || profile.intent || null;

  // Retrieve contact details from active unlock state or persisted unlockedContacts
  const storedContact = getUnlockedContact ? getUnlockedContact(profile.id) : null;
  const whatsappNumber = unlockData?.whatsapp || storedContact?.whatsapp || profile.whatsapp_number || null;
  const snapchatHandle = unlockData?.snapchat || storedContact?.snapchat || profile.snapchat_handle || null;
  const revealed = isUnlocked || !!unlockData || !!storedContact;

  const displayName = profile.display_name || profile.full_name || 'Anonymous';
  const age = profile.age;
  const state = profile.state || profile.location_state;
  const area = profile.area || profile.location_city;
  const locationText = [area, state].filter(Boolean).join(', ');
  const bio = profile.about_me || profile.bio;
  const lookingFor = profile.looking_for;

  // "For You" = algorithm scored this profile highly (≥ 55) but it's not boosted
  const isForYou = typeof score === 'number' && score >= 55 && !profile.is_featured;

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

  // Gather core dating intro attributes
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

  // Initials for avatar fallback
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'M';

  return (
    <div
      onClick={onCardClick}
      className={`relative rounded-3xl border bg-slate-900/80 p-4 sm:p-5 flex flex-col gap-3.5 sm:gap-4 transition-all duration-200 hover:bg-slate-900 hover:shadow-xl hover:shadow-emerald-500/10 cursor-pointer group hover:-translate-y-0.5 active:scale-[0.99] ${profile.is_featured
          ? 'border-emerald-400/50 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-400/20'
          : isForYou
            ? 'border-pink-400/30 shadow-md shadow-pink-500/5'
            : 'border-white/10 hover:border-white/20'
        }`}
    >
      {/* Top Bar: Avatar, Name & Age, Badges */}
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          {/* Avatar — photo or initials */}
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl overflow-hidden border border-white/10 shrink-0">
              {
                profile.photo_url && profile.show_photo !== false ? (
                  <img
                    src={profile.photo_url}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-emerald-400/20 to-pink-500/20 flex items-center justify-center font-bold text-white text-sm sm:text-base">
                    {initials}
                  </div>
                )
              }
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-white text-base sm:text-lg tracking-tight truncate group-hover:text-emerald-300 transition-colors">
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

        {/* Top-right badges & View details hint */}
        <div className="flex items-center gap-1.5 shrink-0">
          {profile.is_featured ? (
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-400/30 px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
              <LuZap size={10} /> Boosted
            </span>
          ) : isForYou ? (
            <span className="flex items-center gap-1 text-[10px] font-bold text-pink-300 bg-pink-500/15 border border-pink-400/30 px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
              <LuHeart size={10} /> For You
            </span>
          ) : null}
          <span className="text-[10px] text-slate-400 group-hover:text-emerald-300 font-medium flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/5 border border-white/5 group-hover:border-emerald-500/30 group-hover:bg-emerald-500/10 transition-all">
            <LuEye size={12} />
            <span className="hidden sm:inline">Details</span>
          </span>
        </div>
      </div>

      {/* Relationship Intent Pill (if specified) */}
      {intentLabel && (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-xs font-semibold bg-pink-500/15 border border-pink-500/30 text-pink-300">
            <LuHeart size={12} />
            <span>Looking for {intentLabel}</span>
          </span>
        </div>
      )}

      {/* Personality Intro / Bio ("About Me") */}
      <div className="bg-slate-950/70 border border-white/5 rounded-2xl p-3 sm:p-3.5 space-y-1">
        <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <LuQuote size={12} className="text-emerald-400 shrink-0" />
            <span>Dating Intro &amp; Bio</span>
          </span>
          <span className="text-[10px] font-normal text-emerald-400 group-hover:underline flex items-center gap-0.5">
            View full &rarr;
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line line-clamp-3 break-words">
          {bio || 'No bio written yet.'}
        </p>
      </div>

      {/* Dating Intro Attributes Matrix: State, Gender, Tribe, Occupation, Body Type, Height, Religion */}
      {specs.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-0.5">
            Personal Details
          </span>
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
            {specs.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="p-1.5 sm:p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-1.5 sm:gap-2 hover:bg-white/[0.06] transition-colors min-w-0"
                >
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                    <Icon size={13} />
                  </div>
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <span className="text-[9px] sm:text-[10px] text-slate-400 block uppercase tracking-wider leading-none mb-0.5 truncate">
                      {item.label}
                    </span>
                    <span className="text-[11px] sm:text-xs font-semibold text-white block truncate">
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
          <p className="text-pink-100/90 italic leading-relaxed text-xs line-clamp-2">
            &ldquo;{lookingFor}&rdquo;
          </p>
        </div>
      )}

      {/* Contact Reveal / Unlock CTA */}
      <div 
        className="mt-auto pt-3 border-t border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {revealed ? (
          <div className="space-y-2.5 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                <LuLockOpen size={13} className="text-emerald-400" />
                <span>Contact Unlocked</span>
              </p>
              <span className="text-[10px] text-emerald-400/90 font-semibold bg-emerald-500/20 px-2 py-0.5 rounded-full">
                Revealed
              </span>
            </div>

            <div className="space-y-2">
              {whatsappNumber ? (
                <a
                  href={`https://wa.me/${whatsappNumber.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-950/80 hover:bg-emerald-950/70 border border-emerald-500/30 text-white transition-all group cursor-pointer shadow-sm"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-green-500/20 text-green-400 flex items-center justify-center shrink-0">
                      <LuMessageCircle size={18} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-400 block uppercase tracking-wider leading-none mb-0.5">
                        WhatsApp Number
                      </span>
                      <span className="text-xs sm:text-sm font-mono font-bold text-emerald-300 truncate block">
                        {whatsappNumber}
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-green-500 hover:bg-green-400 text-white text-[11px] font-bold shrink-0 transition-colors">
                    Chat &rarr;
                  </span>
                </a>
              ) : null}

              {snapchatHandle ? (
                <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-950/80 border border-yellow-500/30 text-white shadow-sm">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-yellow-500/20 text-yellow-400 flex items-center justify-center shrink-0">
                      <LuGhost size={18} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-400 block uppercase tracking-wider leading-none mb-0.5">
                        Snapchat Handle
                      </span>
                      <span className="text-xs sm:text-sm font-mono font-bold text-yellow-300 truncate block">
                        {snapchatHandle.startsWith('@') ? snapchatHandle : `@${snapchatHandle}`}
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 text-[10px] font-bold shrink-0">
                    Snap
                  </span>
                </div>
              ) : null}

              {!whatsappNumber && !snapchatHandle && (
                <p className="text-xs text-slate-300 italic p-2 bg-slate-950/50 rounded-lg">
                  Contact unlocked, but user has not attached WhatsApp or Snapchat handles yet.
                </p>
              )}
            </div>
          </div>
        ) : (
          <button
            onClick={onUnlock}
            disabled={unlocking || creditsBalance < 1}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${unlocking
                ? 'bg-white/5 border border-white/10 text-slate-500 cursor-wait'
                : creditsBalance < 1
                  ? 'bg-white/5 border border-white/10 text-slate-400 hover:border-emerald-400/40 hover:text-white'
                  : 'bg-gradient-to-r from-emerald-500 to-pink-500 text-white shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/35 hover:scale-[1.01] active:scale-[0.99]'
              }`}
          >
            {unlocking ? (
              <span className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full" />
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

// ---- Full Profile Details Modal ----
function ProfileDetailModal({
  profile,
  onClose,
  isUnlocked,
  unlockData,
  getUnlockedContact,
  onUnlock,
  unlocking,
  creditsBalance,
}) {
  if (!profile) return null;

  const displayName = profile.display_name || profile.full_name || 'Anonymous';
  const age = profile.age;
  const state = profile.state || profile.location_state;
  const area = profile.area || profile.location_city;
  const locationText = [area, state].filter(Boolean).join(', ');
  const bio = profile.about_me || profile.bio;
  const lookingFor = profile.looking_for;
  const intentLabel = INTENT_LOOKUP[profile.intent] || profile.intent || null;

  const storedContact = getUnlockedContact ? getUnlockedContact(profile.id) : null;
  const whatsappNumber = unlockData?.whatsapp || storedContact?.whatsapp || profile.whatsapp_number || null;
  const snapchatHandle = unlockData?.snapchat || storedContact?.snapchat || profile.snapchat_handle || null;
  const revealed = isUnlocked || !!unlockData || !!storedContact;

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

  const genderDisplay = profile.gender
    ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1).toLowerCase()
    : null;

  const specs = [
    genderDisplay && { label: 'Gender', value: genderDisplay, icon: LuUser, color: 'text-pink-400', bg: 'bg-pink-500/10' },
    state && { label: 'State', value: state, icon: LuMapPin, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    area && { label: 'City / Area', value: area, icon: LuMapPin, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    profile.tribe && { label: 'Tribe', value: profile.tribe, icon: LuGlobe, color: 'text-sky-400', bg: 'bg-sky-500/10' },
    profile.religion && { label: 'Religion', value: profile.religion, icon: LuHeart, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    profile.occupation && { label: 'Occupation', value: profile.occupation, icon: LuBriefcase, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    bodyTypeDisplay && { label: 'Body Type', value: bodyTypeDisplay, icon: LuSparkles, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    profile.height && { label: 'Height', value: profile.height, icon: LuRuler, color: 'text-teal-400', bg: 'bg-teal-500/10' },
    profile.orientation && { label: 'Orientation', value: profile.orientation, icon: LuUser, color: 'text-rose-400', bg: 'bg-rose-500/10' },
  ].filter(Boolean);

  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'M';

  const hasPhoto = profile.photo_url && profile.show_photo !== false;

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="fixed inset-0 cursor-pointer" onClick={onClose} />

      <div className="relative w-full max-w-2xl max-h-[94dvh] sm:max-h-[90vh] flex flex-col rounded-t-[32px] sm:rounded-3xl border-t sm:border border-white/15 bg-slate-900 shadow-2xl shadow-emerald-500/10 z-10 overflow-hidden text-white animate-in slide-in-from-bottom-5 sm:zoom-in-95 duration-200">
        
        {/* Mobile Pull Indicator */}
        <div className="w-full pt-3 pb-1 flex justify-center sm:hidden shrink-0 bg-slate-900">
          <div className="w-12 h-1.5 bg-white/25 rounded-full" />
        </div>

        {/* Ambient Top Glow Banner */}
        <div className="relative shrink-0 overflow-hidden px-6 pt-5 pb-6 border-b border-white/10 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-pink-950/30">
          <div className="absolute top-0 -left-10 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-0 -right-10 w-48 h-48 bg-pink-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Floating Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 sm:top-5 sm:right-5 w-9 h-9 rounded-full bg-slate-950/70 border border-white/15 text-slate-300 hover:text-white hover:bg-white/10 flex items-center justify-center transition-all cursor-pointer shadow-lg hover:scale-105 active:scale-95 z-20"
            aria-label="Close details"
          >
            <LuX size={18} />
          </button>

          {/* Hero Row: Avatar + Name + Badges */}
          <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* Avatar / Photo */}
            <div className="relative shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden border-2 border-white/20 shadow-2xl bg-slate-950 ring-4 ring-emerald-500/20">
                {hasPhoto ? (
                  <img
                    src={profile.photo_url}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-emerald-500 via-teal-600 to-pink-500 flex items-center justify-center font-bold text-white text-3xl sm:text-4xl shadow-inner">
                    {initials}
                  </div>
                )}
              </div>
              {profile.is_featured && (
                <span className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-lg flex items-center gap-1 uppercase tracking-wider">
                  <LuZap size={11} /> Boosted
                </span>
              )}
            </div>

            {/* Profile Header Details */}
            <div className="flex-1 min-w-0 text-center sm:text-left space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {displayName}
                  {age ? <span className="text-slate-400 font-normal">, {age}</span> : ''}
                </h2>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  <LuShieldCheck size={13} /> Verified
                </span>
              </div>

              {locationText && (
                <p className="text-xs sm:text-sm text-slate-300 flex items-center justify-center sm:justify-start gap-1.5 font-medium">
                  <LuMapPin size={14} className="text-emerald-400 shrink-0" />
                  <span>{locationText}</span>
                </p>
              )}

              {/* Badges / Intent Row */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                {intentLabel && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-pink-500/15 border border-pink-500/30 text-pink-300 shadow-sm">
                    <LuHeart size={13} />
                    <span>Looking for {intentLabel}</span>
                  </span>
                )}
                {profile.tribe && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/15 border border-sky-500/30 text-sky-300">
                    <LuGlobe size={13} />
                    <span>{profile.tribe}</span>
                  </span>
                )}
                {profile.occupation && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-300">
                    <LuBriefcase size={13} />
                    <span className="truncate max-w-[150px]">{profile.occupation}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-5 overscroll-contain no-scrollbar">
          
          {/* Personality Intro / Bio ("About Me") */}
          <div className="rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/20 via-slate-950/60 to-slate-950/80 p-4 sm:p-5 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                <LuQuote size={14} />
              </div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                About Me &amp; Personality
              </span>
            </div>
            <p className="text-sm sm:text-base text-slate-100 leading-relaxed whitespace-pre-line font-normal">
              {bio || 'No bio written yet.'}
            </p>
          </div>

          {/* Looking For / Ideal Match */}
          {lookingFor && (
            <div className="rounded-3xl border border-pink-500/25 bg-gradient-to-br from-pink-950/20 via-slate-950/60 to-slate-950/80 p-4 sm:p-5 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-7 h-7 rounded-lg bg-pink-500/15 text-pink-400 flex items-center justify-center">
                  <LuHeart size={14} />
                </div>
                <span className="text-xs font-bold text-pink-300 uppercase tracking-wider">
                  What I'm Looking For In A Partner
                </span>
              </div>
              <p className="text-sm sm:text-base text-pink-100 italic leading-relaxed font-normal">
                &ldquo;{lookingFor}&rdquo;
              </p>
            </div>
          )}

          {/* Personal Details & Dating Matrix */}
          {specs.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Dating &amp; Personal Specs
                </span>
                <span className="text-[11px] text-slate-500">
                  {specs.length} verified attributes
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {specs.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-slate-950/60 border border-white/8 hover:border-white/15 transition-all flex items-center gap-2.5 shadow-sm"
                    >
                      <div className={`w-8 h-8 rounded-xl ${item.bg} ${item.color} flex items-center justify-center shrink-0`}>
                        <Icon size={15} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] text-slate-400 block uppercase tracking-wider leading-tight mb-0.5 truncate font-medium">
                          {item.label}
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-white block truncate">
                          {item.value}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Interests & Lifestyle Tags */}
          {Array.isArray(profile.interests) && profile.interests.length > 0 && (
            <div className="space-y-2.5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block px-1">
                Interests &amp; Passions
              </span>
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold shadow-sm hover:border-emerald-500/40 transition-colors"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Privacy & Safety Note */}
          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/[0.02] border border-white/5 text-[11px] text-slate-400">
            <LuShieldCheck size={16} className="text-emerald-400 shrink-0" />
            <span>Private contact details are encrypted and only revealed to members who unlock this intro.</span>
          </div>
        </div>

        {/* Sticky Footer: Unlock CTA or Unlocked Handles */}
        <div className="shrink-0 px-5 sm:px-6 py-4 pb-[max(1.25rem,calc(env(safe-area-inset-bottom,0px)+1rem))] border-t border-white/10 bg-slate-950/98 backdrop-blur-xl shadow-2xl">
          {revealed ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                  <LuLockOpen size={14} className="text-emerald-400" />
                  <span>Contact Unlocked &bull; Direct Chat</span>
                </p>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  Ready to connect
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                {whatsappNumber ? (
                  <a
                    href={`https://wa.me/${whatsappNumber.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2.5 py-3.5 px-5 rounded-2xl bg-green-500 hover:bg-green-400 text-white font-bold text-sm transition-all shadow-lg shadow-green-500/25 active:scale-[0.98] cursor-pointer"
                  >
                    <LuMessageCircle size={18} />
                    <span>Chat on WhatsApp ({whatsappNumber})</span>
                  </a>
                ) : null}

                {snapchatHandle ? (
                  <div className="flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-yellow-500/15 border border-yellow-500/30 text-yellow-300 font-semibold text-xs sm:text-sm">
                    <LuGhost size={18} />
                    <span>Snapchat: {snapchatHandle.startsWith('@') ? snapchatHandle : `@${snapchatHandle}`}</span>
                  </div>
                ) : null}

                {!whatsappNumber && !snapchatHandle && (
                  <p className="text-xs text-slate-400 italic py-2 text-center bg-slate-900 rounded-xl">
                    Contact unlocked, but user has not attached WhatsApp or Snapchat handles yet.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={() => onUnlock(profile.id)}
                disabled={unlocking || creditsBalance < 1}
                className={`w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl text-sm font-bold transition-all shadow-xl cursor-pointer ${
                  unlocking
                    ? 'bg-white/5 border border-white/10 text-slate-500 cursor-wait'
                    : creditsBalance < 1
                      ? 'bg-white/5 border border-white/10 text-slate-400 hover:border-emerald-400/40 hover:text-white'
                      : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-pink-500 hover:from-emerald-400 hover:to-pink-400 text-white shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.01] active:scale-[0.99]'
                }`}
              >
                {unlocking ? (
                  <span className="animate-spin h-5 w-5 border-2 border-white/20 border-t-white rounded-full" />
                ) : creditsBalance < 1 ? (
                  <>
                    <LuLockOpen size={17} />
                    <span>Unlock Contact (Top Up Credits)</span>
                  </>
                ) : (
                  <>
                    <LuLockOpen size={17} />
                    <span>Unlock Contact &mdash; 1 Credit</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                <span>Your credits: <strong className="text-emerald-400">{creditsBalance}</strong></span>
                <span>Reveals verified WhatsApp &amp; Snapchat handles</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
