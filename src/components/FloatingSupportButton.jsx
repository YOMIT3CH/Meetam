import { useState } from 'react';
import { LuMessageCircle } from 'react-icons/lu';
import { useMeetAm } from '../context/MeetAmContext';

const DEFAULT_WHATSAPP = import.meta.env.VITE_SUPPORT_WHATSAPP || 'https://wa.me/2348012345678';

export default function FloatingSupportButton() {
  const [open, setOpen] = useState(false);
  const { bankDetails } = useMeetAm();
  const supportUrl = bankDetails?.supportWhatsapp || DEFAULT_WHATSAPP;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[60] flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-green-500 text-white shadow-lg shadow-emerald-500/30 hover:bg-green-400 hover:scale-105 active:scale-95 transition-transform cursor-pointer"
        aria-label="Open customer support on WhatsApp"
      >
        <LuMessageCircle size={24} className="sm:hidden" />
        <LuMessageCircle size={26} className="hidden sm:block" />
      </button>

      {open && (
        <div className="fixed bottom-18 right-4 sm:bottom-24 sm:right-6 z-[60] w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-white/10 bg-slate-950/95 backdrop-blur-md shadow-2xl p-4 sm:p-5 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
              <LuMessageCircle size={20} />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Customer Care</p>
              <p className="text-slate-400 text-xs">24/7 support</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-slate-400 hover:text-white text-xl leading-none"
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <p className="text-slate-300 text-sm mb-4 leading-relaxed">
            Need help? Our support team is here for you on WhatsApp. Reach out
            anytime for account, payment, or general questions.
          </p>
          <a
            href={supportUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 w-full rounded-xl bg-green-500 hover:bg-green-400 text-white font-semibold py-3 transition-colors"
          >
            <LuMessageCircle size={18} /> Chat on WhatsApp
          </a>
        </div>
      )}
    </>
  );
}
