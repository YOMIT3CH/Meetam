import { useEffect, useState } from 'react';
import { LuMegaphone, LuX, LuCircleAlert, LuCircleCheck } from 'react-icons/lu';
import supabase from '../lib/supabase';
import { useMeetAm } from '../context/MeetAmContext';

export default function AnnouncementBanner() {
  const { loading } = useMeetAm();

  const [announcements, setAnnouncements] = useState([]);
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.localStorage.getItem('meetam_dismissed_announcements');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (loading) return;
    let cancelled = false;

    const fetchAnnouncements = async () => {
      try {
        const { data, error } = await supabase
          .from('announcements')
          .select('id, title, body, kind, is_active')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(5);

        if (!cancelled && !error && Array.isArray(data)) {
          setAnnouncements(data);
        }
      } catch (err) {
        console.error('Failed to load announcements:', err);
      }
    };

    fetchAnnouncements();

    return () => {
      cancelled = true;
    };
  }, [loading]);

  const dismiss = (id) => {
    const next = [...dismissed, id];
    setDismissed(next);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(
          'meetam_dismissed_announcements',
          JSON.stringify(next)
        );
      } catch {
        // ignore
      }
    }
  };

  if (loading) return null;

  // Filter out dismissed or empty announcements
  const activeAnnouncements = announcements.filter(
    (a) => !dismissed.includes(a.id) && (a.body?.trim() || a.title?.trim())
  );

  if (activeAnnouncements.length === 0) return null;

  return (
    <div className="relative z-30 w-full bg-slate-950/80 border-b border-white/5 py-2.5 px-3 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-2">
        {activeAnnouncements.map((a) => {
          const kind = a.kind || 'info';
          const isWarning = kind === 'warning';
          const isError = kind === 'error';
          const isSuccess = kind === 'success';

          const badgeClasses = isWarning
            ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
            : isError
            ? 'bg-red-500/15 border-red-500/30 text-red-300'
            : isSuccess
            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
            : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300';

          const cardBorder = isWarning
            ? 'border-amber-500/30 bg-amber-950/20 shadow-amber-950/10'
            : isError
            ? 'border-red-500/30 bg-red-950/20 shadow-red-950/10'
            : isSuccess
            ? 'border-emerald-500/30 bg-emerald-950/20 shadow-emerald-950/10'
            : 'border-emerald-500/30 bg-slate-900/95 shadow-emerald-950/10';

          const icon = isWarning ? (
            <LuCircleAlert className="text-amber-400 shrink-0" size={16} />
          ) : isError ? (
            <LuCircleAlert className="text-red-400 shrink-0" size={16} />
          ) : isSuccess ? (
            <LuCircleCheck className="text-emerald-400 shrink-0" size={16} />
          ) : (
            <LuMegaphone className="text-emerald-400 shrink-0" size={16} />
          );

          // Avoid duplicating title if it is generic "Announcement"
          const hasDistinctTitle =
            a.title &&
            a.title.toLowerCase() !== 'announcement' &&
            a.title.trim() !== a.body?.trim();

          const messageText = a.body?.trim() || a.title?.trim() || '';

          return (
            <div
              key={a.id}
              className={`flex items-start sm:items-center justify-between gap-3 p-3 sm:px-4 sm:py-2.5 rounded-2xl border shadow-lg backdrop-blur-md transition-all ${cardBorder}`}
            >
              <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
                <div className={`p-1.5 rounded-xl border shrink-0 mt-0.5 sm:mt-0 ${badgeClasses}`}>
                  {icon}
                </div>

                <div className="text-xs sm:text-sm text-slate-200 leading-relaxed break-words">
                  {hasDistinctTitle && (
                    <span className="font-bold text-white mr-1.5 inline-block">
                      {a.title}:
                    </span>
                  )}
                  <span className="text-slate-300 font-normal">
                    {messageText}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => dismiss(a.id)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer mt-0.5 sm:mt-0"
                title="Dismiss announcement"
                aria-label="Dismiss announcement"
              >
                <LuX size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

