import { Link } from 'react-router-dom';
import { LuShield, LuUsers, LuMapPin, LuArrowLeft } from 'react-icons/lu';

export default function Terms() {
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
      <div className="pt-24 px-4 pb-20 max-w-3xl mx-auto">
        <div className="glass-card p-5 sm:p-8 md:p-10 rounded-2xl">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6 tracking-tight">Terms of Service</h1>

          <div className="space-y-6 text-slate-300 text-xs sm:text-sm leading-relaxed">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white mb-1.5">1. Acceptance of Terms</h2>
              <p>
                By accessing or using MeetAm, you agree to be bound by these Terms of Service. If you do not agree, you may not use the platform.
              </p>
            </div>

            <div>
              <h2 className="text-base sm:text-lg font-bold text-white mb-1.5 flex items-center gap-2">
                <LuShield size={16} className="text-emerald-400 shrink-0" />
                <span>2. Eligibility</span>
              </h2>
              <p>
                You must be 18 years or older to register and use MeetAm. By registering, you confirm you meet this age requirement.
              </p>
            </div>

            <div>
              <h2 className="text-base sm:text-lg font-bold text-white mb-1.5">3. Zero Tolerance for Commercial Solicitation</h2>
              <p>
                MeetAm is a dating platform for genuine personal connections. Commercial solicitation, escort services, paid companionship, or any business-related activity is strictly prohibited. Violating accounts will be permanently removed.
              </p>
            </div>

            <div>
              <h2 className="text-base sm:text-lg font-bold text-white mb-1.5">4. Credits & Payments</h2>
              <p>
                Credits are purchased via manual bank transfer. All credit sales are final and non-refundable. Once credits are added to your wallet, they cannot be converted back to cash. Contact unlocks cost 1 credit each.
              </p>
            </div>

            <div>
              <h2 className="text-base sm:text-lg font-bold text-white mb-1.5 flex items-center gap-2">
                <LuUsers size={16} className="text-emerald-400 shrink-0" />
                <span>5. Third-Party Interactions</span>
              </h2>
              <p>
                MeetAm facilitates introductions only. All offline interactions (WhatsApp, Snapchat, in-person meetings) are at your own risk. MeetAm is not liable for any consequences arising from user interactions outside the platform.
              </p>
            </div>

            <div>
              <h2 className="text-base sm:text-lg font-bold text-white mb-1.5">6. Privacy & Masked Contacts</h2>
              <p>
                Your phone number and Snapchat handle remain masked until another user spends a credit to unlock them. We do not sell your personal data.
              </p>
            </div>

            <div>
              <h2 className="text-base sm:text-lg font-bold text-white mb-1.5">7. Account Termination</h2>
              <p>
                MeetAm reserves the right to suspend or terminate accounts that violate these Terms, including fake profiles, harassment, or commercial activity.
              </p>
            </div>

            <div>
              <h2 className="text-base sm:text-lg font-bold text-white mb-1.5 flex items-center gap-2">
                <LuMapPin size={16} className="text-emerald-400 shrink-0" />
                <span>8. Governing Law</span>
              </h2>
              <p>
                These Terms are governed by the laws of the Federal Republic of Nigeria.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
