import { LuShield, LuUsers, LuMapPin } from 'react-icons/lu';

export default function Terms() {
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

      <div className="pt-20 px-4 pb-24 max-w-3xl mx-auto">
        <div className="glass-card p-8">
          <h1 className="text-3xl font-bold text-white mb-6">Terms of Service</h1>

          <div className="space-y-6 max-w-none">
            <h2 className="text-xl font-bold text-white">1. Acceptance of Terms</h2>
            <p className="text-sm leading-relaxed text-slate-300">
              By accessing or using MeetAm, you agree to be bound by these Terms of Service. If you do not agree, you may not use the platform.
            </p>

            <h2 className="text-xl font-bold text-white">2. Eligibility</h2>
            <p className="text-sm leading-relaxed text-slate-300">
              <LuShield size={16} className="inline mr-2 text-emerald-400" />
              You must be 18 years or older to register and use MeetAm. By registering, you confirm you meet this age requirement.
            </p>

            <h2 className="text-xl font-bold text-white">3. Zero Tolerance for Commercial Solicitation</h2>
            <p className="text-sm leading-relaxed text-slate-300">
              MeetAm is a dating platform for genuine personal connections. Commercial solicitation, escort services, paid companionship, or any business-related activity is strictly prohibited. Violating accounts will be permanently removed.
            </p>

            <h2 className="text-xl font-bold text-white">4. Credits & Payments</h2>
            <p className="text-sm leading-relaxed text-slate-300">
              Credits are purchased via manual bank transfer. All credit sales are final and non-refundable. Once credits are added to your wallet, they cannot be converted back to cash. Contact unlocks cost 1 credit each.
            </p>

            <h2 className="text-xl font-bold text-white">5. Third-Party Interactions</h2>
            <p className="text-sm leading-relaxed text-slate-300">
              <LuUsers size={16} className="inline mr-2 text-emerald-400" />
              MeetAm facilitates introductions only. All offline interactions (WhatsApp, Snapchat, in-person meetings) are at your own risk. MeetAm is not liable for any consequences arising from user interactions outside the platform.
            </p>

            <h2 className="text-xl font-bold text-white">6. Privacy</h2>
            <p className="text-sm leading-relaxed text-slate-300">
              Your phone number and Snapchat handle remain masked until another user spends a credit to unlock them. We do not sell your personal data. See our Privacy Policy for details.
            </p>

            <h2 className="text-xl font-bold text-white">7. Account Termination</h2>
            <p className="text-sm leading-relaxed text-slate-300">
              MeetAm reserves the right to suspend or terminate accounts that violate these Terms, including fake profiles, harassment, or commercial activity.
            </p>

            <h2 className="text-xl font-bold text-white">8. Governing Law</h2>
            <p className="text-sm leading-relaxed text-slate-300">
              <LuMapPin size={16} className="inline mr-2 text-emerald-400" />
              These Terms are governed by the laws of the Federal Republic of Nigeria.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}