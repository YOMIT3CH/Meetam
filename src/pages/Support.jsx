import { Link } from 'react-router-dom';
import { LuSmartphone, LuMail, LuShield, LuUsers, LuClock, LuArrowLeft } from 'react-icons/lu';
import { SUPPORT_WHATSAPP } from '../lib/data';
import { useMeetAm } from '../context/MeetAmContext';

export default function Support() {
  const { bankDetails } = useMeetAm();
  const whatsappUrl = bankDetails?.supportWhatsapp || import.meta.env.VITE_SUPPORT_WHATSAPP || SUPPORT_WHATSAPP;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/5 px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-pink-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">M</span>
            </div>
            <span className="font-bold text-lg sm:text-xl tracking-tight text-white">MeetAm</span>
          </Link>
          <Link
            to="/"
            className="text-xs sm:text-sm text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl hover:bg-white/10"
          >
            <LuArrowLeft size={14} />
            <span>Home</span>
          </Link>
        </div>
      </nav>

      {/* Main Container */}
      <div className="pt-24 px-4 pb-20 max-w-2xl mx-auto">
        <div className="glass-card p-5 sm:p-8 rounded-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <LuShield size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Customer Support</h1>
              <p className="text-xs sm:text-sm text-slate-400">We are here to help 24/7</p>
            </div>
          </div>

          <div className="space-y-4 sm:space-y-6">
            {/* WhatsApp */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6">
              <h3 className="text-white font-semibold text-base mb-2">WhatsApp Direct Support</h3>
              <p className="text-slate-300 text-xs sm:text-sm mb-4 leading-relaxed">
                Chat directly with our care team on WhatsApp for fast account assistance, manual bank transfer verifications, or questions.
              </p>
              <a
                href={whatsappUrl}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all shadow-md shadow-green-500/20"
                target="_blank"
                rel="noreferrer"
              >
                <LuSmartphone size={18} />
                <span>Chat on WhatsApp</span>
              </a>
            </div>

            {/* Email */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6">
              <h3 className="text-white font-semibold text-base mb-2">Email Support</h3>
              <p className="text-slate-300 text-xs sm:text-sm mb-3 leading-relaxed">
                Send an email for non-urgent inquiries or partnership requests. We reply within 24 hours.
              </p>
              <a
                href="mailto:support@meetam.com"
                className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-colors"
              >
                <LuMail size={18} />
                <span>support@meetam.com</span>
              </a>
            </div>

            {/* FAQ quick cards */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6">
              <h3 className="text-white font-semibold text-base mb-3">Quick Help FAQ</h3>
              <div className="space-y-3.5 text-xs sm:text-sm text-slate-300">
                <div className="flex items-start gap-2.5">
                  <LuClock size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block mb-0.5">How long does credit verification take?</strong>
                    <span>Bank transfers are typically verified within 15–60 minutes (maximum 12 hours) after you submit your receipt.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <LuUsers size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block mb-0.5">How do I unlock someone's contact?</strong>
                    <span>Spend 1 credit on any intro card in the feed to reveal their direct WhatsApp and Snapchat handles.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <LuShield size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block mb-0.5">Is my identity and contact safe?</strong>
                    <span>Yes. Contacts remain hidden until unlocked, and commercial solicitation or harassment results in immediate permanent bans.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
