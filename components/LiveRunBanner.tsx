"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { fmtDateTime } from "@/lib/format";
import type { LiveState } from "@/lib/live";

const LABEL: Record<string, string> = { scheduled: "Scheduled run", manual: "Manual run", dashboard: "Run started from the dashboard", other: "Run" };
const fmtTime = (iso: string) => {
  const p = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Dubai", hour: "2-digit", minute: "2-digit", hour12: true }).formatToParts(new Date(iso));
  const g = (k: string) => p.find((x) => x.type === k)?.value ?? "";
  return `${g("hour")}:${g("minute")}${g("dayPeriod").toUpperCase()} Dubai time`;
};
const mmss = (s: number) => `${Math.floor(s / 60)}m ${String(Math.floor(s % 60)).padStart(2, "0")}s`;

export default function LiveRunBanner() {
  const router = useRouter();
  const [live, setLive] = useState<LiveState | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [done, setDone] = useState<{ ok: boolean; url?: string } | null>(null);
  const wasActive = useRef(false);
  const fast = useRef(0); // keep polling quickly until this timestamp (after a run is queued)

  useEffect(() => {
    let stop = false;
    let timer: ReturnType<typeof setTimeout>;
    async function poll() {
      if (stop) return;
      if (document.visibilityState === "visible") {
        try {
          const j = (await (await fetch("/api/live", { cache: "no-store" })).json()) as LiveState;
          if (stop) return;
          setLive(j);
          if (wasActive.current && !j.active) {
            setDone({ ok: j.latest?.conclusion === "success", url: j.latest?.url });
            router.refresh();                       // new results are on the page
            setTimeout(() => router.refresh(), 20000);
            setTimeout(() => setDone(null), 15000);
          }
          if (j.active) setDone(null);
          wasActive.current = j.active;
        } catch { /* keep the last state */ }
      }
      const active = wasActive.current;
      timer = setTimeout(poll, active || Date.now() < fast.current ? 8000 : 30000);
    }
    const onQueued = () => { fast.current = Date.now() + 120000; clearTimeout(timer); timer = setTimeout(poll, 3000); };
    window.addEventListener("qa-run-queued", onQueued);
    poll();
    return () => { stop = true; clearTimeout(timer); window.removeEventListener("qa-run-queued", onQueued); };
  }, [router]);

  useEffect(() => {
    if (!live?.active) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [live?.active]);

  if (!live?.configured) return null;

  if (live.active) {
    const started = live.startedAt ? new Date(live.startedAt).getTime() : now;
    const elapsed = Math.max(0, (now - started) / 1000);
    const single = live.target && live.target !== "all";
    return (
      <section className="live" role="status" aria-live="polite">
        <div className="live-top">
          <span className="live-dot" aria-hidden="true" />
          <b>{single ? "Single-URL run in progress" : "Full-sheet run in progress"}</b>
          <span className="live-meta">{LABEL[live.trigger ?? "other"]} · started {fmtDateTime(live.startedAt)} · {mmss(elapsed)} elapsed</span>
          {live.url && <a className="live-link" href={live.url} target="_blank" rel="noreferrer">View in GitHub ↗</a>}
        </div>
        <div className="live-bar" aria-hidden="true"><i style={{ width: `${live.percent ?? 5}%` }} /></div>
        <div className="live-foot">
          <span><b>{live.phase}</b></span>
          <span>
            {live.percent ?? 0}% done
            {live.etaAt && (live.overrun
              ? " · taking a bit longer than usual"
              : ` · about ${Math.max(1, Math.round(((new Date(live.etaAt).getTime() - now) > 0 ? (new Date(live.etaAt).getTime() - now) : 60000) / 60000))} min left, finishing around ${fmtTime(live.etaAt)}`)}
            {live.typicalSec && !single ? ` (a full run usually takes about ${Math.round(live.typicalSec / 60)} min)` : ""}
          </span>
        </div>
        {(live.steps ?? []).length > 0 && (
          <ol className="live-steps" aria-label="What the run is doing">
            {(live.steps ?? []).map((s) => (
              <li key={s.label} className={`st-${s.state}`}>
                <span className="st-ico" aria-hidden="true">{s.state === "done" ? "✓" : s.state === "failed" ? "✕" : s.state === "active" ? "●" : "○"}</span>
                <span>{s.label}</span>
              </li>
            ))}
          </ol>
        )}
      </section>
    );
  }
  if (done) {
    return (
      <section className={`live done ${done.ok ? "ok" : "bad"}`} role="status">
        <b>{done.ok ? "Run finished: results updated below." : "The run did not finish successfully."}</b>
        {done.url && <a className="live-link" href={done.url} target="_blank" rel="noreferrer">View in GitHub ↗</a>}
      </section>
    );
  }
  return null;
}
