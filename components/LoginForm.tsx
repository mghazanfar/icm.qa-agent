"use client";
import { useEffect, useState } from "react";

export default function LoginForm({ next, error }: { next: string; error: boolean }) {
  const [busy, setBusy] = useState(false);
  // coming back with the browser's Back button must not leave the button stuck
  useEffect(() => {
    const reset = () => setBusy(false);
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);
  // suppressHydrationWarning: password managers (Keeper, 1Password...) add attributes to inputs before React loads; that is harmless
  return (
    <form className="lg-card" method="post" action="/api/login" onSubmit={() => setBusy(true)} aria-busy={busy}>
      <h1>Sign in</h1>
      <p className="sub">Landing-page QA dashboard</p>
      {error && <div className="lg-err" role="alert">Wrong username or password.</div>}
      <input type="hidden" name="next" value={next} />
      <label htmlFor="username">Username</label>
      <input id="username" name="username" autoComplete="username" autoFocus required readOnly={busy} suppressHydrationWarning />
      <label htmlFor="password">Password</label>
      <input id="password" name="password" type="password" autoComplete="current-password" required readOnly={busy} suppressHydrationWarning />
      <button className="lg-btn" type="submit" disabled={busy}>
        {busy ? <><span className="lg-spin" aria-hidden="true" /> Signing in…</> : "Sign in"}
      </button>
    </form>
  );
}
