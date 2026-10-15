"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import RunButton from "./RunButton";
import NavLinks from "./NavLinks";
import LiveRunBanner from "./LiveRunBanner";
import { LOGO_URL, SHEET_URL } from "@/lib/config";

/** Page chrome (header, live banner, footer). The sign-in page is shown without it. */
export default function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname() || "/";
  if (path === "/login") return <>{children}</>;
  return (
    <>
      {/* a <button> is white by default; the ghost style only sets border and colour. :not(:hover) keeps the hover tint working */}
      <style>{"button.btn.ghost{font-family:inherit}button.btn.ghost:not(:hover){background:transparent}"}</style>
      <a className="skiplink" href="#main">Skip to content</a>
      <header className="top">
        <div className="top-in">
          <Link className="brand" href="/" aria-label="IC LP QA - home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO_URL} alt="IC" height={30} />
            <span className="brand-sub">LP QA</span>
          </Link>
          <NavLinks />
          <span className="spacer" />
          <a className="btn ghost" href={SHEET_URL} target="_blank" rel="noreferrer" aria-label="Open LP sheet in a new tab">
            <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true"><path d="M9 2h5v5M14 2L7 9M12 10v3a1 1 0 01-1 1H3a1 1 0 01-1-1V5a1 1 0 011-1h3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Open LP sheet
          </a>
          <RunButton all label="Run full sheet" />
          <form method="post" action="/api/logout"><button className="btn ghost" type="submit">Sign out</button></form>
        </div>
      </header>
      <main id="main">
        <LiveRunBanner />
        {children}
      </main>
      <footer className="foot">IC LP QA · internal tool · times are Dubai time (GST)</footer>
    </>
  );
}
