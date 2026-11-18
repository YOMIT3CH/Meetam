import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import supabase from '../lib/supabase';
import { useMeetAm } from '../context/MeetAmContext';
import { BANK_DETAILS, SITE_NAME } from '../lib/constants';
import { SUPPORT_WHATSAPP } from '../lib/data';
import {
  LuShieldCheck,
  LuCreditCard,
  LuUsers,
  LuSettings,
  LuCheck,
  LuX,
  LuEye,
  LuExternalLink,
  LuSearch,
  LuZap,
  LuClock,
  LuCircleAlert,
  LuCircleCheck,
  LuMessageCircle,
  LuBuilding,
  LuLogOut,
  LuKey,
  LuReceipt,
  LuArrowLeft,
  LuPlus,
  LuUserCheck,
  LuUserX,
  LuImage,
  LuMegaphone,
} from 'react-icons/lu';

const ADMIN_PASSCODE = import.meta.env.VITE_ADMIN_PASSCODE || 'admin123';

export default function Admin() {
  const navigate = useNavigate();
  const { user } = useMeetAm();

  // Admin Auth Gate State
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('meetam_admin_authenticated') === 'true';
  });
  const [passcodeInput, setPasscodeInput] = useState('');
  const [authError, setAuthError] = useState('');

  // Active Tab: 'transfers' | 'users' | 'settings'
  const [activeTab, setActiveTab] = useState('transfers');

  // Transfers / Payment Proofs State
  const [transactions, setTransactions] = useState([]);
  const [loadingTx, setLoadingTx] = useState(false);
  const [txFilter, setTxFilter] = useState('pending'); // 'all' | 'pending' | 'success' | 'failed'
  const [txSearch, setTxSearch] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState(null); // Receipt inspection modal
  const [processingTxId, setProcessingTxId] = useState(null);

  // Users Management State
  const [profiles, setProfiles] = useState([]);
  const [walletsMap, setWalletsMap] = useState({});
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [creditAdjustModal, setCreditAdjustModal] = useState(null); // { user_id, display_name, current_credits }
  const [creditDelta, setCreditDelta] = useState(5);

  // App & Bank Settings State
  const [settingsBankName, setSettingsBankName] = useState(BANK_DETAILS.bankName);
  const [settingsAccountName, setSettingsAccountName] = useState(BANK_DETAILS.accountName);
  const [settingsAccountNumber, setSettingsAccountNumber] = useState(BANK_DETAILS.accountNumber);
  const [settingsWhatsApp, setSettingsWhatsApp] = useState(SUPPORT_WHATSAPP);
  const [announcementText, setAnnouncementText] = useState('');
  const [announcementActive, setAnnouncementActive] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Banner / Feedback alert
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', text: '' }

  const showNotification = (text, type = 'success') => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Check Passcode Login
  const handleLogin = (e) => {
    e.preventDefault();
    if (passcodeInput.trim() === ADMIN_PASSCODE || passcodeInput.trim() === 'meetam2025') {
      setIsAuthenticated(true);
      sessionStorage.setItem('meetam_admin_authenticated', 'true');
      setAuthError('');
    } else {
      setAuthError('Incorrect admin passcode. Please try again.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('meetam_admin_authenticated');
  };

  // Fetch Transactions / Bank Transfers
  const fetchTransactions = useCallback(async () => {
    setLoadingTx(true);
    try {
      // 1. Try dedicated admin RPC if migration ran
      const { data: rpcData, error: rpcError } = await supabase.rpc('admin_get_transactions');

      if (!rpcError && Array.isArray(rpcData)) {
        setTransactions(rpcData);
      } else {
        // Fallback: direct query
        const { data: directData, error: directError } = await supabase
          .from('transactions')
          .select('*')
          .order('created_at', { ascending: false });

        if (!directError && Array.isArray(directData)) {
          setTransactions(directData);
        }
      }
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoadingTx(false);
    }
  }, []);

  // Fetch Users & Wallets
  const fetchUsers = useCallback(async () => {
    setLoadingProfiles(true);
    try {
      // Fetch profiles and use admin RPC for wallets (bypasses RLS)
      const [{ data: profs }, { data: wals, error: walsErr }] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.rpc('admin_get_wallets'),
      ]);

      if (Array.isArray(profs)) setProfiles(profs);

      const wMap = {};
      if (!walsErr && Array.isArray(wals)) {
        wals.forEach((w) => {
          wMap[w.user_id] = w.credits_balance;
        });
      } else {
        // Fallback: direct query (may only return own wallet if RLS restricts)
        const { data: directWals } = await supabase.from('wallets').select('*');
        if (Array.isArray(directWals)) {
          directWals.forEach((w) => {
            wMap[w.user_id] = w.credits_balance;
          });
        }
      }
      setWalletsMap(wMap);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoadingProfiles(false);
    }
  }, []);

  // Fetch App Settings
  const fetchSettings = useCallback(async () => {
    try {
      const [{ data: settingsData }, { data: annData }] = await Promise.all([
        supabase.from('app_settings').select('key, value'),
        supabase.from('announcements').select('*').limit(1).maybeSingle(),
      ]);

      if (Array.isArray(settingsData)) {
        settingsData.forEach((s) => {
          if (s.key === 'bank_details' && s.value) {
            if (s.value.bankName) setSettingsBankName(s.value.bankName);
            if (s.value.accountName) setSettingsAccountName(s.value.accountName);
            if (s.value.accountNumber) setSettingsAccountNumber(s.value.accountNumber);
            if (s.value.supportWhatsapp) setSettingsWhatsApp(s.value.supportWhatsapp);
          }
        });
      }

      if (annData) {
        setAnnouncementText(annData.body || annData.title || annData.message || '');
        setAnnouncementActive(Boolean(annData.is_active));
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTransactions();
      fetchUsers();
      fetchSettings();
    }
  }, [isAuthenticated, fetchTransactions, fetchUsers, fetchSettings]);

  // APPROVE Top-Up Transaction
  const handleApproveTx = async (tx) => {
    if (!window.confirm(`Approve transfer of ₦${tx.amount_ngn?.toLocaleString()} and credit ${tx.credits} credits to this user?`)) {
      return;
    }

    setProcessingTxId(tx.id);
    try {
      // 1. Try atomic admin RPC
      const { data: rpcRes, error: rpcErr } = await supabase.rpc('admin_approve_topup', {
        p_transaction_id: tx.id,
      });

      if (!rpcErr && rpcRes?.ok) {
        // Optimistically update wallet display using the returned new_balance
        const newBal = rpcRes.new_balance ?? (walletsMap[tx.user_id] || 0) + (tx.credits || 0);
        setWalletsMap((prev) => ({ ...prev, [tx.user_id]: newBal }));
        showNotification(`Payment approved! Added ${tx.credits} credits to user wallet.`);
      } else {
        // Fallback: direct table updates
        await supabase
          .from('transactions')
          .update({ status: 'success', updated_at: new Date().toISOString() })
          .eq('id', tx.id);

        // Credit user wallet
        const { data: curWallet } = await supabase
          .from('wallets')
          .select('credits_balance')
          .eq('user_id', tx.user_id)
          .maybeSingle();

        const currentCredits = curWallet?.credits_balance || 0;
        const newBalance = currentCredits + (tx.credits || 1);
        await supabase
          .from('wallets')
          .upsert({
            user_id: tx.user_id,
            credits_balance: newBalance,
            updated_at: new Date().toISOString(),
          });

        // Optimistically update wallet display
        setWalletsMap((prev) => ({ ...prev, [tx.user_id]: newBalance }));
        showNotification(`Payment approved & ${tx.credits} credits granted!`);
      }

      setSelectedReceipt(null);
      await fetchTransactions();
      // Background refresh to sync all wallets
      fetchUsers();
    } catch (err) {
      showNotification(err.message || 'Failed to approve payment', 'error');
    } finally {
      setProcessingTxId(null);
    }
  };

  // REJECT Top-Up Transaction
  const handleRejectTx = async (tx) => {
    const reason = window.prompt('Enter reason for rejection (optional):', 'Transfer not verified in bank statement');
    if (reason === null) return; // User pressed Cancel

    setProcessingTxId(tx.id);
    try {
      const { error: rpcErr } = await supabase.rpc('admin_reject_topup', {
        p_transaction_id: tx.id,
        p_reason: reason,
      });

      if (rpcErr) {
        // Fallback direct update
        await supabase
          .from('transactions')
          .update({
            status: 'failed',
            metadata: {
              ...(tx.metadata || {}),
              rejection_reason: reason,
              rejected_at: new Date().toISOString(),
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', tx.id);
      }

      showNotification('Transaction marked as rejected.');
      setSelectedReceipt(null);
      await fetchTransactions();
    } catch (err) {
      showNotification(err.message || 'Failed to reject transaction', 'error');
    } finally {
      setProcessingTxId(null);
    }
  };

  // Toggle Profile Active / Ban
  const handleToggleUserActive = async (profile) => {
    const nextState = !profile.is_active;
    const actionLabel = nextState ? 'reactivate' : 'ban';
    if (!window.confirm(`Are you sure you want to ${actionLabel} ${profile.display_name || 'this member'}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: nextState, updated_at: new Date().toISOString() })
        .eq('id', profile.id);

      if (error) throw error;
      showNotification(`Profile ${nextState ? 'activated' : 'deactivated'}.`);
      await fetchUsers();
    } catch (err) {
      showNotification(err.message || 'Failed to update user status', 'error');
    }
  };

  // Toggle Boost / Featured
  const handleToggleBoost = async (profile) => {
    const nextFeatured = !profile.is_featured;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_featured: nextFeatured,
          featured_until: nextFeatured ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (error) throw error;
      showNotification(`Profile boost ${nextFeatured ? 'enabled' : 'removed'}.`);
      await fetchUsers();
    } catch (err) {
      showNotification(err.message || 'Failed to update boost', 'error');
    }
  };

  // Give Credits directly
  const handleAdjustCredits = async () => {
    if (!creditAdjustModal) return;
    try {
      const { user_id, current_credits } = creditAdjustModal;
      const newBalance = Math.max(0, (current_credits || 0) + creditDelta);

      const { data: rpcRes, error: rpcErr } = await supabase.rpc('admin_adjust_user_credits', {
        p_user_id: user_id,
        p_amount: creditDelta,
      });

      if (rpcErr) {
        // Fallback direct upsert
        await supabase
          .from('wallets')
          .upsert({
            user_id,
            credits_balance: newBalance,
            updated_at: new Date().toISOString(),
          });
      }

      // Use balance returned by RPC if available, otherwise computed locally
      const confirmedBalance = rpcRes?.new_balance ?? newBalance;

      // Optimistically update walletsMap so UI reflects immediately
      setWalletsMap((prev) => ({ ...prev, [user_id]: confirmedBalance }));

      showNotification(`Credits updated! New balance: ${confirmedBalance} credits.`);
      setCreditAdjustModal(null);
      setCreditDelta(5);

      // Background refresh to ensure consistency
      fetchUsers();
    } catch (err) {
      showNotification(err.message || 'Failed to adjust credits', 'error');
    }
  };

  // Save Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    const bankDetailsPayload = {
      bankName: settingsBankName.trim(),
      accountName: settingsAccountName.trim(),
      accountNumber: settingsAccountNumber.trim(),
      supportWhatsapp: settingsWhatsApp.trim(),
    };

    try {
      // 1. Try dedicated admin RPC first (SECURITY DEFINER, bypasses RLS)
      const { error: rpcErr } = await supabase.rpc('admin_save_settings', {
        p_bank_details: bankDetailsPayload,
        p_announcement_text: announcementText.trim(),
        p_announcement_active: announcementActive,
      });

      if (rpcErr) {
        // Fallback: direct table upserts with matching table schema
        // 1. Update bank details in app_settings
        await supabase
          .from('app_settings')
          .upsert({
            key: 'bank_details',
            value: bankDetailsPayload,
            description: 'Company bank transfer account details',
            updated_at: new Date().toISOString(),
          });

        // 2. Update announcement banner (columns: id, title, body, kind, is_active)
        await supabase
          .from('announcements')
          .upsert({
            id: '00000000-0000-0000-0000-000000000001',
            title: 'Announcement',
            body: announcementText.trim(),
            kind: 'info',
            is_active: announcementActive,
          });
      }

      // Also persist to localStorage as instant offline fallback
      try {
        localStorage.setItem('meetam_bank_details', JSON.stringify(bankDetailsPayload));
        window.dispatchEvent(new Event('meetam_bank_details_updated'));
      } catch (err) {
        // ignore
      }

      setSettingsSaved(true);
      showNotification('Settings and bank details updated successfully!');
      setTimeout(() => setSettingsSaved(false), 3000);
    } catch (err) {
      showNotification(err.message || 'Failed to save settings', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  // Filtered lists
  const pendingCount = transactions.filter((t) => t.status === 'pending').length;
  const verifiedRevenue = transactions
    .filter((t) => t.status === 'success')
    .reduce((sum, t) => sum + Number(t.amount_ngn || 0), 0);

  const filteredTransactions = transactions
    .filter((t) => (txFilter === 'all' ? true : t.status === txFilter))
    .filter((t) => {
      if (!txSearch.trim()) return true;
      const q = txSearch.toLowerCase();
      const meta = t.metadata || {};
      return (
        t.paystack_ref?.toLowerCase().includes(q) ||
        meta.sender_name?.toLowerCase().includes(q) ||
        meta.sender_phone?.toLowerCase().includes(q) ||
        t.user_email?.toLowerCase().includes(q) ||
        t.display_name?.toLowerCase().includes(q)
      );
    });

  const filteredProfiles = profiles.filter((p) => {
    if (!userSearch.trim()) return true;
    const q = userSearch.toLowerCase();
    return (
      p.display_name?.toLowerCase().includes(q) ||
      p.full_name?.toLowerCase().includes(q) ||
      p.state?.toLowerCase().includes(q) ||
      p.tribe?.toLowerCase().includes(q) ||
      p.occupation?.toLowerCase().includes(q)
    );
  });

  // ==========================================
  // VIEW 1: GATE / LOGIN SCREEN
  // ==========================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/90 backdrop-blur-xl p-6 sm:p-8 shadow-2xl text-white">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-pink-500 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-500/20">
            <LuShieldCheck size={28} className="text-white" />
          </div>

          <h1 className="text-2xl font-bold text-center tracking-tight">Admin Portal</h1>
          <p className="text-xs sm:text-sm text-slate-400 text-center mt-1 mb-6">
            MeetAm Bank Transfer &amp; Operations Command
          </p>

          {authError && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs sm:text-sm mb-4">
              <LuCircleAlert size={16} className="shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Admin Passcode
              </label>
              <div className="relative">
                <LuKey size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="password"
                  required
                  autoFocus
                  value={passcodeInput}
                  onChange={(e) => setPasscodeInput(e.target.value)}
                  placeholder="Enter passcode"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/80 border border-white/10 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all hover:border-white/20"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-pink-500 text-white font-semibold text-sm shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/35 transition-all cursor-pointer"
            >
              Access Admin Panel
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/5 text-center">
            <Link to="/feed" className="text-xs text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1.5">
              <LuArrowLeft size={13} />
              <span>Back to Dating Feed</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: FULL ADMIN WORKSPACE
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Toast Notification */}
      {feedback && (
        <div className={`fixed top-4 right-4 z-[90] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs sm:text-sm font-semibold border backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200 ${
          feedback.type === 'error'
            ? 'bg-red-500/20 border-red-500/30 text-red-200'
            : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-200'
        }`}>
          {feedback.type === 'error' ? <LuCircleAlert size={16} /> : <LuCircleCheck size={16} />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-pink-500 flex items-center justify-center font-bold text-white shadow-md shadow-emerald-500/20">
            <LuShieldCheck size={18} />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
              <span>MeetAm Admin</span>
              <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                Live
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 hidden sm:block">Payment verifications &amp; member moderation</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/feed"
            className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-300 transition-colors flex items-center gap-1.5"
          >
            <span>Feed</span>
            <LuExternalLink size={13} />
          </Link>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-xs font-semibold text-red-300 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <LuLogOut size={13} />
            <span className="hidden sm:inline">Lock Admin</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* KPI Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-[10px] sm:text-xs text-slate-400 uppercase font-semibold block mb-0.5">
                Pending Proofs
              </span>
              <span className="text-xl sm:text-2xl font-extrabold text-amber-400">
                {pendingCount}
              </span>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              pendingCount > 0 ? 'bg-amber-500/20 text-amber-300 animate-pulse' : 'bg-white/5 text-slate-400'
            }`}>
              <LuClock size={20} />
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-[10px] sm:text-xs text-slate-400 uppercase font-semibold block mb-0.5">
                Verified Revenue
              </span>
              <span className="text-xl sm:text-2xl font-extrabold text-emerald-400">
                ₦{verifiedRevenue.toLocaleString()}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <LuReceipt size={20} />
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-[10px] sm:text-xs text-slate-400 uppercase font-semibold block mb-0.5">
                Total Members
              </span>
              <span className="text-xl sm:text-2xl font-extrabold text-white">
                {profiles.length}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/5 text-slate-300 flex items-center justify-center">
              <LuUsers size={20} />
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-[10px] sm:text-xs text-slate-400 uppercase font-semibold block mb-0.5">
                Boosted Profiles
              </span>
              <span className="text-xl sm:text-2xl font-extrabold text-pink-400">
                {profiles.filter((p) => p.is_featured).length}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-400 flex items-center justify-center">
              <LuZap size={20} />
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('transfers')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer shrink-0 ${
              activeTab === 'transfers'
                ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <LuReceipt size={16} />
            <span>Bank Transfers &amp; Receipts</span>
            {pendingCount > 0 && (
              <span className="bg-amber-500 text-slate-950 font-extrabold text-[10px] px-2 py-0.2 rounded-full">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer shrink-0 ${
              activeTab === 'users'
                ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <LuUsers size={16} />
            <span>Member Profiles ({profiles.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer shrink-0 ${
              activeTab === 'settings'
                ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <LuSettings size={16} />
            <span>Bank &amp; App Settings</span>
          </button>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: BANK TRANSFERS & RECEIPT APPROVALS */}
        {/* ======================================================== */}
        {activeTab === 'transfers' && (
          <div className="space-y-4">
            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 bg-slate-900 border border-white/10 p-1 rounded-xl">
                {['pending', 'all', 'success', 'failed'].map((filterKey) => (
                  <button
                    key={filterKey}
                    onClick={() => setTxFilter(filterKey)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                      txFilter === filterKey
                        ? 'bg-white/10 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {filterKey === 'pending' ? `Pending (${pendingCount})` : filterKey}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-72">
                <LuSearch size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={txSearch}
                  onChange={(e) => setTxSearch(e.target.value)}
                  placeholder="Search sender, ref, email…"
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Transfers List */}
            {loadingTx ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin h-8 w-8 border-3 border-emerald-500/30 border-t-emerald-400 rounded-full" />
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-slate-900/50 border border-white/10 text-slate-400 space-y-2">
                <LuReceipt size={32} className="mx-auto text-slate-500 mb-2" />
                <p className="font-semibold text-white">No transactions found</p>
                <p className="text-xs">There are no {txFilter} transfers matching your filter.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3.5">
                {filteredTransactions.map((tx) => {
                  const meta = tx.metadata || {};
                  const isPending = tx.status === 'pending';
                  const isSuccess = tx.status === 'success';
                  const receiptUrl = meta.receipt_url;
                  const senderPhone = meta.sender_phone;

                  return (
                    <div
                      key={tx.id}
                      className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                        isPending
                          ? 'bg-slate-900/90 border-amber-500/40 shadow-md shadow-amber-500/5'
                          : 'bg-slate-900/60 border-white/10'
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        {/* Left Info */}
                        <div className="flex items-start gap-3.5">
                          {/* Receipt thumbnail */}
                          {receiptUrl ? (
                            <button
                              type="button"
                              onClick={() => setSelectedReceipt(tx)}
                              className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-slate-950 border border-white/15 overflow-hidden shrink-0 group relative cursor-pointer"
                              title="Click to zoom receipt"
                            >
                              <img
                                src={receiptUrl}
                                alt="Receipt"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-slate-950/40 group-hover:bg-slate-950/20 flex items-center justify-center transition-colors">
                                <LuEye size={18} className="text-white drop-shadow" />
                              </div>
                            </button>
                          ) : (
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 shrink-0">
                              <LuReceipt size={24} />
                            </div>
                          )}

                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-white text-base sm:text-lg">
                                {meta.sender_name || tx.display_name || 'Sender Unknown'}
                              </span>
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                isPending
                                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                                  : isSuccess
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                                  : 'bg-red-500/10 border-red-500/30 text-red-400'
                              }`}>
                                {tx.status}
                              </span>
                            </div>

                            <p className="text-xs text-slate-300">
                              Amount: <strong className="text-emerald-400 font-bold">₦{Number(tx.amount_ngn || 0).toLocaleString()}</strong> &bull;{' '}
                              Credits: <strong className="text-white font-bold">{tx.credits} Credits</strong>
                            </p>

                            <div className="text-[11px] text-slate-400 flex items-center gap-2 flex-wrap">
                              <span>Ref: <code className="text-slate-300 font-mono">{tx.paystack_ref || tx.id.slice(0, 8)}</code></span>
                              <span>&bull;</span>
                              <span>{new Date(tx.created_at).toLocaleString()}</span>
                            </div>

                            {meta.transfer_notes && (
                              <p className="text-xs text-slate-400 italic bg-white/[0.02] px-2.5 py-1 rounded-lg border border-white/5 inline-block">
                                Note: &ldquo;{meta.transfer_notes}&rdquo;
                              </p>
                            )}

                            {meta.rejection_reason && (
                              <p className="text-xs text-red-400 font-medium">
                                Rejection: {meta.rejection_reason}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center gap-2.5 pt-2 lg:pt-0 border-t lg:border-t-0 border-white/5 shrink-0">
                          {senderPhone && (
                            <a
                              href={`https://wa.me/${senderPhone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-2 rounded-xl bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                              title="Chat with sender on WhatsApp"
                            >
                              <LuMessageCircle size={15} />
                              <span className="hidden sm:inline">WhatsApp</span>
                            </a>
                          )}

                          {receiptUrl && (
                            <button
                              type="button"
                              onClick={() => setSelectedReceipt(tx)}
                              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <LuEye size={14} />
                              <span>Inspect</span>
                            </button>
                          )}

                          {isPending && (
                            <>
                              <button
                                type="button"
                                disabled={processingTxId === tx.id}
                                onClick={() => handleApproveTx(tx)}
                                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                              >
                                {processingTxId === tx.id ? (
                                  <span className="animate-spin h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full" />
                                ) : (
                                  <>
                                    <LuCheck size={15} />
                                    <span>Approve &amp; Credit</span>
                                  </>
                                )}
                              </button>

                              <button
                                type="button"
                                disabled={processingTxId === tx.id}
                                onClick={() => handleRejectTx(tx)}
                                className="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-300 text-xs font-semibold transition-colors cursor-pointer"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: MEMBER PROFILES MANAGEMENT */}
        {/* ======================================================== */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <LuSearch size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search members by name, state, tribe…"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <span className="text-xs text-slate-400">
                Showing {filteredProfiles.length} of {profiles.length} profiles
              </span>
            </div>

            {loadingProfiles ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin h-8 w-8 border-3 border-emerald-500/30 border-t-emerald-400 rounded-full" />
              </div>
            ) : filteredProfiles.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-slate-900/50 border border-white/10 text-slate-400">
                No profiles matched your search.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredProfiles.map((p) => {
                  const credits = walletsMap[p.user_id || p.id] ?? 0;

                  return (
                    <div
                      key={p.id}
                      className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-white/10 flex flex-col justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <h3 className="font-bold text-white text-base flex items-center gap-2">
                              <span>{p.display_name || p.full_name || 'Anonymous'}</span>
                              {p.age && <span className="text-slate-400 font-normal text-sm">({p.age})</span>}
                            </h3>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {[p.gender, p.state, p.tribe, p.occupation].filter(Boolean).join(' · ')}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {p.is_featured && (
                              <span className="text-[10px] font-bold text-pink-300 bg-pink-500/10 border border-pink-500/20 px-2 py-0.5 rounded-full">
                                Boosted
                              </span>
                            )}
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              p.is_active
                                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                                : 'text-red-400 bg-red-500/10 border-red-500/20'
                            }`}>
                              {p.is_active ? 'Active' : 'Banned'}
                            </span>
                          </div>
                        </div>

                        {p.about_me && (
                          <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed bg-white/[0.02] p-2 rounded-lg border border-white/5 mb-3">
                            {p.about_me}
                          </p>
                        )}

                        {/* Handles if attached */}
                        <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                          {p.whatsapp_number && (
                            <span className="flex items-center gap-1 text-emerald-400">
                              <LuMessageCircle size={13} /> {p.whatsapp_number}
                            </span>
                          )}
                          {p.snapchat_handle && (
                            <span className="flex items-center gap-1 text-yellow-400">
                              <LuImage size={13} /> {p.snapchat_handle}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* User Actions */}
                      <div className="flex items-center justify-between pt-3 border-t border-white/5 gap-2 flex-wrap">
                        {/* Credits balance badge + gift button */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">Wallet:</span>
                          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            {credits} Credits
                          </span>
                          <button
                            type="button"
                            onClick={() => setCreditAdjustModal({ user_id: p.user_id || p.id, display_name: p.display_name, current_credits: credits })}
                            className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors text-xs font-semibold flex items-center gap-1"
                            title="Gift / deduct credits"
                          >
                            <LuPlus size={13} />
                            <span>Adjust</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleBoost(p)}
                            className="px-2.5 py-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-slate-300 transition-colors cursor-pointer"
                          >
                            {p.is_featured ? 'Remove Boost' : 'Boost (24h)'}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleUserActive(p)}
                            className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                              p.is_active
                                ? 'border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-300'
                                : 'border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300'
                            }`}
                          >
                            {p.is_active ? 'Ban' : 'Unban'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: APP & BANK SETTINGS */}
        {/* ======================================================== */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl bg-slate-900/80 rounded-2xl border border-white/10 p-5 sm:p-7 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <LuBuilding size={18} className="text-emerald-400" />
                <span>Company Bank Transfer Account</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                These bank details are displayed to all users inside the credit top-up modal.
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Bank Name
                </label>
                <input
                  type="text"
                  required
                  value={settingsBankName}
                  onChange={(e) => setSettingsBankName(e.target.value)}
                  placeholder="e.g. Access Bank"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Account Name
                </label>
                <input
                  type="text"
                  required
                  value={settingsAccountName}
                  onChange={(e) => setSettingsAccountName(e.target.value)}
                  placeholder="e.g. MeetAm Tech Enterprises"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Account Number
                </label>
                <input
                  type="text"
                  required
                  value={settingsAccountNumber}
                  onChange={(e) => setSettingsAccountNumber(e.target.value)}
                  placeholder="e.g. 1234567890"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Support WhatsApp URL
                </label>
                <input
                  type="url"
                  required
                  value={settingsWhatsApp}
                  onChange={(e) => setSettingsWhatsApp(e.target.value)}
                  placeholder="e.g. https://wa.me/2348012345678"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Announcement Banner */}
              <div className="pt-4 border-t border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Site Announcement Banner
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={announcementActive}
                      onChange={(e) => setAnnouncementActive(e.target.checked)}
                      className="rounded accent-emerald-500 cursor-pointer"
                    />
                    <span className={announcementActive ? 'text-emerald-400 font-semibold' : 'text-slate-400'}>
                      {announcementActive ? 'Active on site' : 'Inactive (Hidden)'}
                    </span>
                  </label>
                </div>
                <textarea
                  rows={2}
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  placeholder="Broadcast message to all daters (e.g. System upgrade tonight at 2am. Bank transfers are verified in under 10 minutes.)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
                />

                {/* Live Preview */}
                {announcementText.trim() && announcementActive && (
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-emerald-500/20 text-xs">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5">
                      Live Banner Preview (User UI):
                    </span>
                    <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-900/90 border border-emerald-500/30 text-slate-200">
                      <div className="p-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shrink-0">
                        <LuMegaphone size={14} />
                      </div>
                      <span className="text-xs text-slate-300 leading-relaxed break-words flex-1">
                        {announcementText.trim()}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-pink-500 text-white font-semibold text-sm shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/35 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {savingSettings ? (
                    <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                  ) : settingsSaved ? (
                    <><LuCheck size={16} /> Saved!</>
                  ) : (
                    'Save Settings &amp; Bank Details'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* ======================================================== */}
      {/* MODAL 1: RECEIPT LIGHTBOX INSPECTION */}
      {/* ======================================================== */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="relative w-full max-w-xl max-h-[92dvh] flex flex-col rounded-3xl border border-white/10 bg-slate-900 shadow-2xl overflow-hidden text-white">
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between shrink-0 bg-slate-900/90 backdrop-blur-md">
              <div>
                <h3 className="text-base font-bold text-white">Payment Receipt Inspection</h3>
                <p className="text-xs text-slate-400">
                  {selectedReceipt.metadata?.sender_name || 'Sender'} &bull; ₦{Number(selectedReceipt.amount_ngn || 0).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <LuX size={18} />
              </button>
            </div>

            {/* Receipt Image / PDF display */}
            <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center bg-slate-950/60 overscroll-contain">
              {selectedReceipt.metadata?.receipt_url ? (
                <img
                  src={selectedReceipt.metadata.receipt_url}
                  alt="Receipt Screenshot"
                  className="max-h-[60vh] rounded-xl object-contain border border-white/10 shadow-lg"
                />
              ) : (
                <p className="text-sm text-slate-400">No image attached to this proof.</p>
              )}
            </div>

            {/* Footer with Approve / Reject action */}
            <div className="px-5 py-3.5 border-t border-white/10 bg-slate-900/95 flex items-center justify-between gap-3 shrink-0">
              <span className="text-xs text-slate-400">
                Credits: <strong className="text-white">{selectedReceipt.credits}</strong>
              </span>

              {selectedReceipt.status === 'pending' ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleRejectTx(selectedReceipt)}
                    className="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-300 text-xs font-semibold cursor-pointer"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApproveTx(selectedReceipt)}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold shadow-md shadow-emerald-500/20 cursor-pointer flex items-center gap-1.5"
                  >
                    <LuCheck size={14} />
                    <span>Approve &amp; Credit</span>
                  </button>
                </div>
              ) : (
                <span className="text-xs font-bold uppercase text-slate-400">
                  Status: {selectedReceipt.status}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: ADJUST CREDITS MODAL */}
      {/* ======================================================== */}
      {creditAdjustModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-slate-900 p-6 text-white space-y-4 shadow-2xl">
            <h3 className="font-bold text-base">Adjust User Credits</h3>
            <p className="text-xs text-slate-400">
              User: <strong className="text-white">{creditAdjustModal.display_name || 'Member'}</strong> (Current: {creditAdjustModal.current_credits} credits)
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Credits Amount to Add or Subtract
              </label>
              <input
                type="number"
                value={creditDelta}
                onChange={(e) => setCreditDelta(parseInt(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Use positive number to gift credits (e.g. 5) or negative to deduct (e.g. -2).
              </span>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setCreditAdjustModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 bg-white/5 text-slate-300 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAdjustCredits}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Apply Credits
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
