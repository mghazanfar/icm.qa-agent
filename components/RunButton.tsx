"use client";
import { useState } from "react";

export default function RunButton({ url, all, label }: { url?: string; all?: boolean; label?: string }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function go() {
    if (all && !confirm("Run all LPs in the sheet now? This takes several minutes and posts a summary to Slack.")) return;
    setBusy(true);
    try {
      const r = await fetch("/api/run", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(all ? { all: true } : { url }) });
      const j = await r.json();
      setMsg(j.ok ? `${j.message} Results appear here when it finishes (a few minutes).` : j.error);
    } catch {
      setMsg("Could not reach the server.");
    }
    setBusy(false);
    setTimeout(() => setMsg(null), 7000);
  }

  return (
    <>
      {all ? (
        <button className="primary" disabled={busy} onClick={go}>{busy ? "Queuing…" : `▶ ${label ?? "Run"}`}</button>
      ) : (
        <button className="play" title="Run this URL now" aria-label="Run this URL now" disabled={busy} onClick={go}>▶</button>
      )}
      {msg && <div className="toast">{msg}</div>}
    </>
  );
}
