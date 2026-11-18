import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useState,
  useMemo,
} from 'react';
import supabase from '../lib/supabase';
import {
  DEFAULT_INTENT_VALUES,
  SUPPORT_WHATSAPP,
} from '../lib/data';
import { BANK_DETAILS } from '../lib/constants';
import { formatCountdown } from '../lib/format';

const MeetAmContext = createContext(null);

export function MeetAmProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const [creditsBalance, setCreditsBalance] = useState(0);
  const [unlockedContacts, setUnlockedContacts] = useState([]);
  const [enableMediaUploads, setEnableMediaUploads] = useState(true);
  const [enabledIntentValues, setEnabledIntentValues] = useState(
    DEFAULT_INTENT_VALUES
  );

  const [bankDetails, setBankDetails] = useState(() => {
    try {
      const cached = localStorage.getItem('meetam_bank_details');
      if (cached) return JSON.parse(cached);
    } catch {}
    return {
      bankName: import.meta.env.VITE_BANK_NAME || BANK_DETAILS.bankName,
      accountName: import.meta.env.VITE_BANK_ACCOUNT_NAME || BANK_DETAILS.accountName,
      accountNumber: import.meta.env.VITE_BANK_ACCOUNT_NUMBER || BANK_DETAILS.accountNumber,
      supportWhatsapp: import.meta.env.VITE_SUPPORT_WHATSAPP || SUPPORT_WHATSAPP,
    };
  });

  const [hasOnboarded, setHasOnboarded] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('meetam_onboarded') === '1';
  });
  const [showOnboarding, setShowOnboarding] = useState(!hasOnboarded);
  const [showTopUp, setShowTopUp] = useState(false);
  const [showUnlock, setShowUnlock] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmPayload, setConfirmPayload] = useState(null);

  // ---- Session / auth ----
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s) {
        setUser(s.user);
        loadUserData(s.user.id).catch(() => {});
      } else {
        setUser(null);
        setCreditsBalance(0);
        setUnlockedContacts([]);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
        if (nextSession) {
          setUser(nextSession.user);
          loadUserData(nextSession.user.id).catch(() => {});
        } else {
          setUser(null);
          setCreditsBalance(0);
          setUnlockedContacts([]);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // ---- Data loaders ----
  const loadUserData = useCallback(async (userId) => {
    try {
      const [w, uc] = await Promise.all([
        supabase
          .from('wallets')
          .select('credits_balance')
          .eq('user_id', userId)
          .maybeSingle(),
        supabase
          .from('unlocked_contacts')
          .select('unlocked_at, profile_id, profiles(display_name, full_name, whatsapp_number, snapchat_handle)')
          .eq('user_id', userId)
          .order('unlocked_at', { ascending: false }),
      ]);
      setCreditsBalance(w?.data?.credits_balance ?? 0);

      let contacts = [];
      if (Array.isArray(uc?.data)) {
        contacts = uc.data;
      } else {
        const fallback = await supabase
          .from('unlocked_contacts')
          .select('unlocked_at, profile_id')
          .eq('user_id', userId)
          .order('unlocked_at', { ascending: false });
        if (Array.isArray(fallback?.data)) contacts = fallback.data;
      }

      setUnlockedContacts(contacts);
    } catch (_err) {
      setCreditsBalance(0);
      setUnlockedContacts([]);
    }
  }, []);

  const refreshCredits = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('wallets')
      .select('credits_balance')
      .eq('user_id', user.id)
      .maybeSingle();
    setCreditsBalance(data?.credits_balance ?? 0);
  }, [user]);

  const refreshUnlockedContacts = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('unlocked_contacts')
        .select('unlocked_at, profile_id, profiles(display_name, full_name, whatsapp_number, snapchat_handle)')
        .eq('user_id', user.id)
        .order('unlocked_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        setUnlockedContacts(data);
      } else {
        const fallback = await supabase
          .from('unlocked_contacts')
          .select('unlocked_at, profile_id')
          .eq('user_id', user.id)
          .order('unlocked_at', { ascending: false });
        if (Array.isArray(fallback?.data)) {
          setUnlockedContacts(fallback.data);
        }
      }
    } catch (_err) {
      // Ignored
    }
  }, [user]);

  // ---- Dynamic Bank Details from app_settings ----
  useEffect(() => {
    let cancelled = false;

    const fetchBankDetails = async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('key, value')
          .eq('key', 'bank_details')
          .maybeSingle();

        if (!cancelled && !error && data?.value) {
          const val = data.value;
          setBankDetails((prev) => {
            const next = {
              bankName: val.bankName || prev.bankName,
              accountName: val.accountName || prev.accountName,
              accountNumber: val.accountNumber || prev.accountNumber,
              supportWhatsapp: val.supportWhatsapp || prev.supportWhatsapp,
            };
            try {
              localStorage.setItem('meetam_bank_details', JSON.stringify(next));
            } catch {}
            return next;
          });
        }
      } catch (_err) {
        // Fallback to cache/defaults
      }
    };

    fetchBankDetails();

    const handleCustomEvent = () => {
      try {
        const cached = localStorage.getItem('meetam_bank_details');
        if (cached) setBankDetails(JSON.parse(cached));
      } catch {}
    };

    window.addEventListener('meetam_bank_details_updated', handleCustomEvent);
    return () => {
      cancelled = true;
      window.removeEventListener('meetam_bank_details_updated', handleCustomEvent);
    };
  }, []);

  // ---- Feature flags from app_settings ----
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from('app_settings')
          .select('key, value')
          .eq('key', 'enable_media_uploads');
        if (!cancelled && data && data.length > 0) {
          setEnableMediaUploads(Boolean(data[0].value?.enable_media_uploads));
        }
        const { data: intentsData } = await supabase
          .from('app_settings')
          .select('key, value')
          .eq('key', 'enabled_intents');
        if (!cancelled && intentsData && intentsData.length > 0) {
          const vals = Array.isArray(intentsData[0].value?.intents)
            ? intentsData[0].value.intents.filter((v) => typeof v === 'string')
            : [];
          if (vals.length > 0) setEnabledIntentValues(vals);
        }
      } catch (_err) {
        // Defaults safe
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // ---- RPCs ----
  const unlockContact = useCallback(
    async (profileId) => {
      const { data, error } = await supabase.rpc(
        'unlock_contact',
        { p_profile_id: profileId },
        { count: 'exact' }
      );
      if (error) {
        const msg = error.message || String(error);
        if (msg.includes('INSUFFICIENT_CREDITS')) {
          return { ok: false, error: 'INSUFFICIENT_CREDITS' };
        }
        return { ok: false, error: msg };
      }

      if (data && data.ok) {
        const unlockTime = new Date().toISOString();
        setCreditsBalance((prev) => Math.max(0, prev - 1));
        setUnlockedContacts((prev) => [
          {
            profile_id: profileId,
            unlocked_at: unlockTime,
            whatsapp_number: data.whatsapp_number,
            snapchat_handle: data.snapchat_handle,
            profiles: {
              whatsapp_number: data.whatsapp_number,
              snapchat_handle: data.snapchat_handle,
            },
          },
          ...prev.filter((c) => c.profile_id !== profileId),
        ]);
      }

      return data ?? { ok: true };
    },
    []
  );

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const boostMyProfile = useCallback(async (profileId) => {
    const { data, error } = await supabase.rpc(
      'boost_my_profile',
      { p_profile_id: profileId },
      { count: 'exact' }
    );
    if (error) {
      const msg = error.message || String(error);
      if (msg.includes('INSUFFICIENT_CREDITS')) {
        return { ok: false, error: 'INSUFFICIENT_CREDITS' };
      }
      if (msg.includes('FORBIDDEN')) {
        return { ok: false, error: 'FORBIDDEN' };
      }
      return { ok: false, error: msg };
    }
    return data ?? { ok: true };
  }, []);

  const notifyMatch = useCallback(
    (profileState, profileGender, profileId) => {
      fetch('/api/alerts/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state: profileState,
          gender: profileGender,
          profile_id: profileId,
        }),
      }).catch(() => {});
    },
    []
  );

  // ---- Helpers ----
  const isProfileUnlocked = useCallback(
    (profileId) =>
      unlockedContacts.some((c) => c.profile_id === profileId),
    [unlockedContacts]
  );

  const getUnlockedContact = useCallback(
    (profileId) => {
      const match = unlockedContacts.find(
        (c) => c.profile_id === profileId
      );
      if (!match) return null;
      return {
        whatsapp: match.whatsapp_number || match.profiles?.whatsapp_number || null,
        snapchat: match.snapchat_handle || match.profiles?.snapchat_handle || null,
        unlocked_at: match.unlocked_at,
      };
    },
    [unlockedContacts]
  );

  const value = useMemo(() => {
    const sortedUnlocked = [...unlockedContacts].sort(
      (a, b) => new Date(b.unlocked_at) - new Date(a.unlocked_at)
    );
    return {
      user,
      session,
      loading,
      creditsBalance,
      unlockedContacts: sortedUnlocked,
      bankDetails,
      enableMediaUploads,
      enabledIntentValues,
      hasOnboarded,
      showOnboarding,
      setShowOnboarding,
      showTopUp,
      setShowTopUp,
      showUnlock,
      setShowUnlock,
      showConfirm,
      setShowConfirm,
      confirmPayload,
      setConfirmPayload,
      refreshCredits,
      refreshUnlockedContacts,
      unlockContact,
      boostMyProfile,
      logout,
      notifyMatch,
      isProfileUnlocked,
      getUnlockedContact,
      formatCountdown,
    };
  }, [
    user,
    session,
    loading,
    creditsBalance,
    unlockedContacts,
    bankDetails,
    enableMediaUploads,
    enabledIntentValues,
    hasOnboarded,
    showOnboarding,
    showTopUp,
    showUnlock,
    showConfirm,
    confirmPayload,
    refreshCredits,
    refreshUnlockedContacts,
    unlockContact,
    boostMyProfile,
    logout,
    notifyMatch,
    isProfileUnlocked,
    getUnlockedContact,
  ]);

  return (
    <MeetAmContext.Provider value={value}>
      {children}
    </MeetAmContext.Provider>
  );
}

export function useMeetAm() {
  const ctx = useContext(MeetAmContext);
  if (!ctx) {
    throw new Error('useMeetAm must be used within a MeetAmProvider');
  }
  return ctx;
}
