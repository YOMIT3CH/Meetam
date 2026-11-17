import { useEffect, useState } from 'react';
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
  const [visible, setVisible] = useState([]);

  useEffect(() => {
    if (loading) return;
    let cancelled = false;
    supabase
      .from('announcements')
      .select('id, title, body, kind')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(8)
      .then(({ data }) => {
        if (!cancelled && data) setAnnouncements(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [loading]);

  const dismiss = (id) => {
    const next = [...dismissed, id];
    setDismissed(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(
        'meetam_dismissed_announcements',
        JSON.stringify(next)
      );
    }
    setVisible((prev) => prev.filter((a) => a.id !== id));
  };

  if (loading) return null;

  if (announcements.length === 0) return null;

  return (
    <div className="relative z-[60] pointer-events-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-3 overflow-x-auto py-3 text-sm text-slate-200 snap-x">
          {announcements.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-3 border border-white/10 pointer-events-auto shrink-0"
              style={{
                borderLeft:
                  a.kind === 'success'
                    ? '4px solid #10b981'
                    : a.kind === 'warning'
                    ? '4px solid #f59e0b'
                    : a.kind === 'error'
                    ? '4px solid #ef4444'
                    : '4px solid #3b82f6',
              }}
            >
              <span
                className={`inline-flex h-2.5 w-2.5 rounded-full ${
                  a.kind === 'success'
                    ? 'bg-emerald-400'
                    : a.kind === 'warning'
                    ? 'bg-amber-400'
                    : a.kind === 'error'
                    ? 'bg-red-400'
                    : 'bg-blue-400'
                }`}
              />
              <span className="truncate font-medium text-white">{a.title}</span>
              <span className="hidden sm:inline text-slate-400 truncate">
                {a.body}
              </span>
              {dismissed.includes(a.id) ? (
                <span className="text-slate-500 text-xs">Dismissed</span>
              ) : (
                <button
                  onClick={() => dismiss(a.id)}
                  className="ml-2 text-slate-500 hover:text-white text-xs transition-colors"
                  aria-label="Dismiss"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

