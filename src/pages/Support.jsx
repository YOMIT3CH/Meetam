import { LuSmartphone, LuMail, LuPhone, LuShield, LuUsers, LuClock } from 'react-icons/lu';

export default function Support() {
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
          <a href="/" className="text-slate-300 hover:text-white transition-colors">
            ← Back to home
          </a>
        </div>
      </nav>

      <div className="pt-20 px-4 pb-24 max-w-2xl mx-auto">
        <div className="glass-card p-8">
          <div className="flex items-center gap-3 mb-6">
            <LuShield size={24} className="text-emerald-400" />
            <h1 className="text-2xl font-bold text-white">Customer Support</h1>
          </div>

          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-white font-semibold mb-3">WhatsApp Support</h3>
              <p className="text-slate-300 text-sm mb-3">
                Chat directly with our customer care team on WhatsApp for account help, payment issues, or general questions.
              </p>
              <a href="https://wa.me/2348012345678" className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-semibold transition-all" target="_blank" rel="noreferrer">
                <LuSmartphone size={20} />
                <span>Chat on WhatsApp</span>
              </a>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-white font-semibold mb-3">Email Support</h3>
              <p className="text-slate-300 text-sm mb-3">
                Send us an email for non-urgent inquiries. We typically respond within 24 hours.
              </p>
              <a href="mailto:support@meetam.com" className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors">
                <LuMail size={20} />
                <span>support@meetam.com</span>
              </a>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-white font-semibold mb-3">FAQ</h3>
              <div className="space-y-3 text-sm text-slate-300">
                <p>
                  <LuClock size={14} className="inline mr-2 text-slate-500" />
                  <strong>How long does credit confirmation take?</strong><br />
                  Usually within 12 hours after you upload your payment receipt.
                </p>
                <p>
                  <LuUsers size={14} className="inline mr-2 text-slate-500" />
                  <strong>How do I unlock a contact?</strong><br />
                  Spend 1 credit on any profile to reveal their WhatsApp and Snapchat.
                </p>
                <p>
                  <LuShield size={14} className="inline mr-2 text-slate-500" />
                  <strong>Is MeetAm safe?</strong><br />
                  Yes. Contacts are masked until unlocked, and we prohibit commercial solicitation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}