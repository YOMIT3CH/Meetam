import { useState, useEffect } from 'react';
import { LuDownload, LuX, LuShare, LuPlus, LuCheck } from 'react-icons/lu';

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // 1. Check if already installed (standalone mode)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    if (isStandalone) {
      setInstalled(true);
      return;
    }

    // 2. Check if user dismissed banner recently (within 5 days)
    const dismissedAt = localStorage.getItem('meetam_pwa_dismissed');
    if (dismissedAt) {
      const days = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
      if (days < 5) return;
    }

    // 3. Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/crios|fxios|chrome/.test(userAgent);
    if (isAppleDevice && isSafari) {
      setIsIOS(true);
      setShowBanner(true);
    }

    // 4. Capture beforeinstallprompt event (Android / Chromium)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleExternalTrigger = () => {
      setShowBanner(true);
      const isApple = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
      if (isApple) {
        setShowIOSModal(true);
      } else if (deferredPrompt) {
        deferredPrompt.prompt();
      }
    };
    window.addEventListener('meetam_trigger_pwa_install', handleExternalTrigger);

    window.addEventListener('appinstalled', () => {
      setInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('meetam_trigger_pwa_install', handleExternalTrigger);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstalled(true);
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('meetam_pwa_dismissed', Date.now().toString());
  };

  if (installed || !showBanner) return null;

  return (
    <>
      {/* Floating Bottom Install Prompt */}
      <div className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] left-3 right-3 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-sm z-[80] animate-in slide-in-from-bottom-5 duration-300">
        <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-white/15 shadow-2xl shadow-emerald-500/10 flex items-center justify-between gap-3 text-white">
          <div className="flex items-center gap-3 min-w-0">
            {/* App Icon */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-pink-500 flex items-center justify-center font-bold text-white text-base shrink-0 shadow-md shadow-emerald-500/20">
              M
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-bold text-white truncate">
                Install MeetAm App
              </p>
              <p className="text-[11px] text-slate-400 truncate">
                Fast, lightweight &amp; tap to open
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleInstallClick}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-pink-500 text-white text-xs font-semibold shadow-md shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center gap-1.5"
            >
              <LuDownload size={13} />
              <span>Install</span>
            </button>
            <button
              onClick={handleDismiss}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Dismiss install prompt"
            >
              <LuX size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* iOS Safari Instruction Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="fixed inset-0 cursor-pointer"
            onClick={() => setShowIOSModal(false)}
          />
          <div className="relative w-full max-w-sm rounded-3xl border border-white/15 bg-slate-900 p-5 sm:p-6 shadow-2xl z-10 text-white space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-pink-500 flex items-center justify-center font-bold text-white text-sm">
                  M
                </div>
                <h3 className="font-bold text-base text-white">Install on iPhone</h3>
              </div>
              <button
                onClick={() => setShowIOSModal(false)}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <LuX size={16} />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Install MeetAm on your home screen for the full app experience:
            </p>

            <div className="space-y-3 bg-slate-950/60 p-3.5 rounded-2xl border border-white/8 text-xs text-slate-300">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-sky-400 shrink-0">
                  <LuShare size={15} />
                </div>
                <span>
                  1. Tap the <strong>Share</strong> button at the bottom of Safari.
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-emerald-400 shrink-0">
                  <LuPlus size={15} />
                </div>
                <span>
                  2. Scroll down and tap <strong>Add to Home Screen</strong>.
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setShowIOSModal(false);
                handleDismiss();
              }}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-pink-500 text-white font-semibold text-xs transition-all"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
