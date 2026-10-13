const TZ = "Asia/Dubai";
const dtf = new Intl.DateTimeFormat("en-GB", {
  timeZone: TZ, day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true,
});

/** "02 December 2026 12:12PM" in Dubai time (GST). */
export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return "–";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "–";
  const p: Record<string, string> = {};
  for (const x of dtf.formatToParts(d)) p[x.type] = x.value;
  return `${p.day} ${p.month} ${p.year} ${p.hour}:${p.minute}${(p.dayPeriod || "").toUpperCase()}`;
}

/** Seconds between two ISO timestamps, or null. */
export function durationSeconds(startIso: string, endIso: string): number | null {
  const a = new Date(startIso).getTime(), b = new Date(endIso).getTime();
  if (isNaN(a) || isNaN(b) || b < a) return null;
  return Math.round((b - a) / 1000);
}

/** "14m 22s" / "1h 03m" / "45s". */
export function fmtDuration(startIso: string, endIso: string): string {
  const s = durationSeconds(startIso, endIso);
  if (s == null) return "–";
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  if (m > 0) return `${m}m ${String(sec).padStart(2, "0")}s`;
  return `${sec}s`;
}
