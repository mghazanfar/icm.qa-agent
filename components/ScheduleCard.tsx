"use client";
import { useMemo, useState } from "react";
import { fmtDateTime } from "@/lib/format";

const NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DEFAULT = [1, 3, 5];
const HOUR_UTC = 4; // matches the cron line in the workflow (04:00 UTC = 08:00 Dubai)

function nextRun(days: number[]): string | null {
  if (!days.length) return null;
  const now = new Date();
  for (let i = 0; i < 8; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + i, HOUR_UTC, 0, 0));
    const iso = ((d.getUTCDay() + 6) % 7) + 1; // 1 = Monday
    if (days.includes(iso) && d.getTime() > now.getTime()) return d.toISOString();
  }
  return null;
}

export default function ScheduleCard({ initial }: { initial: number[] }) {
  const [saved, setSaved] = useState<number[]>(initial);
  const [days, setDays] = useState<number[]>(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const dirty = useMemo(() => days.join() !== saved.join(), [days, saved]);
  const next = useMemo(() => nextRun(saved), [saved]);

  const toggle = (n: number) => setDays((d) => (d.includes(n) ? d.filter((x) => x !== n) : [...d, n].sort()));

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch("/api/schedule", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ days }) });
      const j = await r.json();
      if (j.ok) {
        setSaved(days);
        setMsg({ ok: true, text: days.length ? "Schedule saved. The next scheduled run will follow it." : "Schedule saved: scheduled runs are paused." });
      } else setMsg({ ok: false, text: j.error ?? "Could not save the schedule." });
    } catch {
      setMsg({ ok: false, text: "Could not reach the server." });
    }
    setBusy(false);
  }

  return (
    <section className="card schedcard" aria-labelledby="sched-h">
      <div className="sched-top">
        <div>
          <h2 id="sched-h">Run schedule</h2>
          <p className="muted">Full-sheet runs start automatically on the days you pick, at {String(HOUR_UTC).padStart(2, "0")}:00 UTC ({String(HOUR_UTC + 4).padStart(2, "0")}:00 Dubai).</p>
        </div>
        <div className="sched-next">
          <span>Next scheduled run</span>
          <b>{next ? fmtDateTime(next) : "paused"}</b>
        </div>
      </div>
      <div className="daychips" role="group" aria-label="Days of the week">
        {NAMES.map((n, i) => {
          const on = days.includes(i + 1);
          return (
            <button key={n} type="button" className={`daychip${on ? " on" : ""}`} aria-pressed={on} onClick={() => toggle(i + 1)}>{n}</button>
          );
        })}
      </div>
      <div className="sched-actions">
        <button type="button" className="btn solid-dark" disabled={!dirty || busy} onClick={save}>{busy ? "Saving…" : "Save schedule"}</button>
        <button type="button" className="btn outline" disabled={busy || days.join() === DEFAULT.join()} onClick={() => setDays(DEFAULT)}>Reset to Mon / Wed / Fri</button>
        {days.length === 0 && <span className="muted">No days selected: scheduled runs will be paused.</span>}
        {msg && <span className={msg.ok ? "sched-ok" : "sched-err"} role="status">{msg.text}</span>}
      </div>
    </section>
  );
}