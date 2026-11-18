import { useEffect, useState, useCallback } from 'react';
import { LuMegaphone, LuX, LuCircleAlert, LuCircleCheck } from 'react-icons/lu';
import supabase from '../lib/supabase';

export default function AnnouncementBanner() {
  // 1. Initial state checks local storage so it renders with ZERO delay
  const [announcements, setAnnouncements] = useState(() => {
    try {
      const cached = localStorage.getItem('meetam_site_announcement');
      if (cached) {
        const parsed = JSON.parse(cached);
        const text = (parsed.text || parsed.body || '').trim();
        if (parsed.is_active && text) {
          return [{
            id: 'local_cached',
            title: 'Announcement',
            body: text,
            kind: 'info',
            is_active: true,
          }];
        }
      }
    } catch {
      // ignore
    }
    return [];
  });

  // Track dismissed messages by text content signature so new announcements are never blocked
  const [dismissedMessages, setDismissedMessages] = useState(() => {
    try {
      const raw = localStorage.getItem('meetam_dismissed_messages');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Loader function: checks Supabase announcements -> app_settings -> localStorage
  const loadAnnouncements = useCallback(async () => {
    let items = [];

    // Layer 1: Query announcements table
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(3);

      if (!error && Array.isArray(data) && data.length > 0) {
        items = data;
      }
    } catch (e) {
      // fall through
    }

    // Layer 2: If table empty/inaccessible, query app_settings for 'site_announcement'
    if (items.length === 0) {
      try {
        const { data: settingData } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'site_announcement')
          .maybeSingle();

        if (settingData?.value?.is_active && settingData?.value?.text) {
          items = [{
            id: 'setting_announcement',
            title: 'Announcement',
            body: settingData.value.text,
            kind: 'info',
            is_active: true,
          }];
        }
      } catch (e) {
        // fall through
      }
    }

    // Layer 3: If still empty, check localStorage cache
    if (items.length === 0) {
      try {
        const cached = localStorage.getItem('meetam_site_announcement');
        if (cached) {
          const parsed = JSON.parse(cached);
          const text = (parsed.text || parsed.body || '').trim();
          if (parsed.is_active && text) {
            items = [{
              id: 'local_cached',
              title: 'Announcement',
              body: text,
              kind: 'info',
              is_active: true,
            }];
          }
        }
      } catch (e) {
        // ignore
      }
    }

    if (items.length > 0) {
      setAnnouncements(items);
    } else {
      setAnnouncements([]);
    }
  }, []);

  useEffect(() => {
    loadAnnouncements();

    const handleEvent = () => {
      loadAnnouncements();
      // Reload dismissed list in case admin cleared it
      try {
        const raw = localStorage.getItem('meetam_dismissed_messages');
        setDismissedMessages(raw ? JSON.parse(raw) : []);
      } catch {
        setDismissedMessages([]);
      }
    };

    window.addEventListener('meetam_announcement_updated', handleEvent);
    return () => {
      window.removeEventListener('meetam_announcement_updated', handleEvent);
    };
  }, [loadAnnouncements]);

  const dismiss = (messageContent) => {
    const key = (messageContent || '').trim();
    const next = [...dismissedMessages.filter((m) => m !== key), key];
    setDismissedMessages(next);
    try {
      localStorage.setItem('meetam_dismissed_messages', JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  // Filter out any announcement whose text is dismissed
  const activeAnnouncements = announcements.filter((a) => {
    const msg = (a.body || a.title || a.message || '').trim();
    if (!msg) return false;
    if (a.is_active === false) return false;
    return !dismissedMessages.includes(msg);
  });

  if (activeAnnouncements.length === 0) return null;

  return (
    <div className="relative z-30 w-full bg-slate-950/80 border-b border-white/5 py-2.5 px-3 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-2">
        {activeAnnouncements.map((a, idx) => {
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

          const hasDistinctTitle =
            a.title &&
            a.title.toLowerCase() !== 'announcement' &&
            a.title.trim() !== (a.body || a.message || '').trim();

          const messageText = (a.body || a.message || a.title || '').trim();

          return (
            <div
              key={a.id || idx}
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
                onClick={() => dismiss(messageText)}
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

