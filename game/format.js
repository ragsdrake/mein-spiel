/** Compact German number formatting: 1.234 · 12,3 Tsd. · 4,5 Mio. */
export function fmt(n) {
  const v = Math.floor(n);
  if (v < 100000) return String(v).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  if (v < 1e6) return `${(v / 1e3).toFixed(1).replace('.', ',')} Tsd.`;
  if (v < 1e9) return `${(v / 1e6).toFixed(2).replace('.', ',')} Mio.`;
  return `${(v / 1e9).toFixed(2).replace('.', ',')} Mrd.`;
}

export function fmtDuration(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  return `${m}:${String(r).padStart(2, '0')}`;
}
