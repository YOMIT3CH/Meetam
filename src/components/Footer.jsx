import { LuMail, LuSmartphone } from 'react-icons/lu';

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-slate-950 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12 mb-8 sm:mb-12">
          <div className="sm:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 bg-gradient-to-br from-emerald-500 to-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-[10px] font-bold">M</span>
              </div>
              <span className="font-bold text-lg tracking-tight text-white">MeetAm</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              Personality-first dating for Nigerian singles. Privacy and intentionality over public photo-swiping.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-slate-400 text-sm">
              <li><a href="/browse" className="hover:text-white transition-colors">Browse Singles</a></li>
              <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
              <li><a href="#safety" className="hover:text-white transition-colors">Safety</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-slate-400 text-sm">
              <li><a href="/terms" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-slate-400 text-sm">
              <li className="flex items-center gap-2">
                <LuSmartphone size={16} strokeWidth={1.5} />
                <a href="https://wa.me/2348012345678" className="hover:text-emerald-400 transition-colors" target="_blank" rel="noreferrer">
                  WhatsApp Support
                </a>
              </li>
              <li className="flex items-center gap-2">
                <LuMail size={16} strokeWidth={1.5} />
                <a href="mailto:support@meetam.com" className="hover:text-emerald-400 transition-colors">
                  support@meetam.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 text-center">
          <p className="text-xs text-slate-500">
            MeetAm &copy; {new Date().getFullYear()}. Personality-first dating for Nigerian singles.
          </p>
        </div>
      </div>
    </footer>
  );
}