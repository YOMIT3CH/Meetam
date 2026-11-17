// Small UI/format helpers shared across MeetAm pages.

export function normalizeWhatsapp(raw) {
  if (!raw) return '';
  let digits = String(raw).replace(/[^0-9+]/g, '');
  if (digits.startsWith('234')) return digits;
  if (digits.startsWith('0')) {
    digits = '234' + digits.slice(1);
  }
  return digits;
}

export function waLink(number) {
  const clean = normalizeWhatsapp(number).replace(/[^0-9]/g, '');
  return clean ? `https://wa.me/${clean}` : '#';
}

export function formatCountdown(ms) {
  if (!ms || ms < 0) return 'Available now';
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const parts = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0 || h === 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(' ');
}

export function formatDate(iso) {
  if (!iso) return 'Never';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 'Never';
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.round((today.getTime() - d.getTime()) / 86400000);
  if (diff < 0) return 'Later';
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 30) return `${diff} days ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
}
