"use client";
import { useEffect, useState } from "react";

export default function RunButton({ url, all, label }: { url?: string; all?: boolean; label?: string }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [falseFlag, setFalseFlag] = useState(true);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !busy) setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy]);

  async function go() {
    setBusy(true);
    try {
      const r = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(all ? { all: true, includeFalseFlag: falseFlag } : { url }),
      });
      const j = await r.json();
      setMsg(j.ok ? `${j.message} Progress shows at the top of the page.` : j.error);
      if (j.ok) window.dispatchEvent(new Event("qa-run-queued"));
    } catch {
      setMsg("Could not reach the server.");
    }
    setBusy(false);
    setOpen(false);
    setTimeout(() => setMsg(null), 7000);
  }

  return (
    <>
      {all ? (
        <button className="primary" disabled={busy} onClick={() => setOpen(true)}>{busy ? "Queuing…" : `▶ ${label ?? "Run"}`}</button>
      ) : (
        <button className="play" title="Run this URL now" aria-label="Run this URL now" disabled={busy} onClick={go}>▶</button>
      )}
      {open && (
        <div className="modal-back" onClick={() => !busy && setOpen(false)}>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="run-modal-title" onClick={(e) => e.stopPropagation()}>
            <h2 id="run-modal-title">Run the full sheet?</h2>
            <p>Tests every landing page in the LP sheet and posts the summary to Slack. A full run takes about an hour.</p>
            <p className="muted">Rows marked <b>Testable = FALSE</b> in the sheet are skipped.</p>
            <label className="modal-opt">
              <input type="checkbox" checked={falseFlag} onChange={(e) => setFalseFlag(e.target.checked)} disabled={busy} autoFocus />
              <span>
                <b>Include the false-flag check (FALSE Youtube)</b>
                <small>A page that is meant to fail, to prove the agent catches problems. Untick it for a clean run, for example a demo.</small>
              </span>
            </label>
            <div className="modal-actions">
              <button onClick={() => setOpen(false)} disabled={busy}>Cancel</button>
              <button className="primary" onClick={go} disabled={busy}>{busy ? "Queuing…" : "Start run"}</button>
            </div>
          </div>
        </div>
      )}
      {msg && <div className="toast">{msg}</div>}
    </>
  );
}
