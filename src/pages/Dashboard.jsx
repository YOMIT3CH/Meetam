import { useState } from 'react';
import { LuUsers, LuCreditCard, LuShield, LuLogOut } from 'react-icons/lu';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { key: 'profile', label: 'My Profile', icon: <LuUsers size={18} /> },
    { key: 'unlocks', label: 'Unlocked Contacts', icon: <LuShield size={18} /> },
    { key: 'credits', label: 'Credits', icon: <LuCreditCard size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/5 px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-emerald-500 to-pink-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">M</span>
            </div>
            <span className="font-bold text-lg tracking-tight text-white">MeetAm</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-xs text-slate-300 flex items-center gap-2">
              <LuCreditCard size={14} className="text-emerald-400" />
              <span id="credit-balance">0 credits</span>
            </div>
            <button className="text-slate-300 hover:text-white transition-colors">
              <LuLogOut size={20} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </nav>

      <div className="pt-20 px-4 pb-24 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>

        <div className="flex gap-1 mb-8">
          {tabs.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.key ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400' : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-300'}`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="glass-card p-6">
              <h2 className="text-lg font-bold text-white mb-4">Your Intro Profile</h2>
              <p className="text-slate-400 text-sm mb-4">
                You haven't posted an intro yet. Create your personality card to start matching.
              </p>
              <button className="bg-gradient-to-r from-emerald-500 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all">
                Post Your Intro
              </button>
            </div>
            <div className="glass-card p-6">
              <h2 className="text-lg font-bold text-white mb-4">Spotlight Boost</h2>
              <p className="text-slate-400 text-sm mb-4">
                Pin your profile to the top of the feed for 24 hours. Cost: 1 credit.
              </p>
              <button className="bg-white/5 border border-white/10 text-slate-300 px-6 py-3 rounded-xl font-semibold hover:bg-white/10 hover:text-white transition-all">
                Activate Spotlight (1 Credit)
              </button>
            </div>
          </div>
        )}
        {activeTab === 'unlocks' && (
          <div className="glass-card p-6">
            <h2 className="text-lg font-bold text-white mb-4">Unlocked Contacts</h2>
            <p className="text-slate-400 text-sm mb-6">
              You haven't unlocked any contacts yet. Unlock profiles in Browse to see their WhatsApp and Snapchat here.
            </p>
            <div className="text-center py-10 text-slate-500">
              <LuShield size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-sm">No unlocked contacts yet</p>
            </div>
          </div>
        )}
        {activeTab === 'credits' && (
          <div className="glass-card p-6">
            <h2 className="text-lg font-bold text-white mb-4">Buy Credits</h2>
            <p className="text-slate-400 text-sm mb-6">
              1 Credit = ₦1,000. Transfer to the account below, upload your receipt, and wait for admin confirmation (usually within 12 hours).
            </p>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
              <h3 className="text-white font-semibold mb-4">Bank Details</h3>
              <div className="space-y-3 text-sm text-slate-300">
                <p><strong>Bank:</strong> Access Bank</p>
                <p><strong>Account Name:</strong> MeetAm Technologies Ltd</p>
                <p><strong>Account Number:</strong> 1234 5678 90</p>
              </div>
            </div>
            <div className="space-y-4">
              <label className="block text-sm text-slate-300 mb-2">Select Credit Bundle</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[1, 3, 5].map((credits) => (
                  <button key={credits} className="border border-white/10 bg-white/5 px-4 py-3 rounded-xl text-sm text-slate-300 hover:bg-white/10 hover:text-white transition-all">
                    {credits} Credit{credits > 1 ? 's' : ''} <br />
                    <span className="text-emerald-400 font-semibold">₦{credits * 1000}</span>
                  </button>
                ))}
              </div>
              <div className="mt-4">
                <label className="block text-sm text-slate-300 mb-2">Upload Payment Receipt</label>
                <input type="file" accept="image/*,application/pdf" className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-emerald-500 file:text-white hover:file:bg-emerald-600" />
              </div>
              <button className="bg-gradient-to-r from-emerald-500 to-pink-500 text-white w-full py-3 rounded-xl font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all">
                Submit Payment Request
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}