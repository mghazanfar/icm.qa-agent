"use client";
import { useRef, useState } from "react";

/** On / off switch of one check. Off = the next run (scheduled, manual or from the dashboard) leaves this check out. */
export default function CheckSwitch({ checkKey, initialOn, label }: { checkKey: string; initialOn: boolean; label: string }) {
  const [on, setOn] = useState(initialOn);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const root = useRef<HTMLDivElement>(null);

  const paint = (value: boolean) => root.current?.closest(".check-card")?.classList.toggle("check-off", !value);

  async function flip() {
    const next = !on;
    setOn(next);
    paint(next);
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch("/api/checks", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: checkKey, enabled: next }) });
      const j = await r.json();
      if (j.ok) setMsg({ ok: true, text: next ? "On. The next run includes this check." : "Off. The next run leaves this check out." });
      else throw new Error(j.error ?? "Could not save.");
    } catch (e) {
      setOn(!next);
      paint(!next);
      setMsg({ ok: false, text: (e as Error).message || "Could not reach the server." });
    }
    setBusy(false);
  }

  return (
    <div className="checkswitch" ref={root}>
      <button type="button" role="switch" aria-checked={on} aria-label={`${label} check`} className={`sw${on ? " on" : ""}`} disabled={busy} onClick={flip}>
        <span className="knob" />
      </button>
      <span className="sw-label">{on ? "On" : "Off"}</span>
      {msg && <span className={msg.ok ? "sw-ok" : "sw-err"} role="status">{msg.text}</span>}
    </div>
  );
}
