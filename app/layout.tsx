import "./globals.css";
import Link from "next/link";
import type { Metadata } from "next";
import RunButton from "@/components/RunButton";
import NavLinks from "@/components/NavLinks";
import LiveRunBanner from "@/components/LiveRunBanner";
import { LOGO_URL, SHEET_URL } from "@/lib/config";

export const metadata: Metadata = { title: "LP QA Dashboard", description: "IC Markets landing-page QA results" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="skiplink" href="#main">Skip to content</a>
        <header className="top">
          <div className="top-in">
            <Link className="brand" href="/" aria-label="IC Markets LP QA - home">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={LOGO_URL} alt="IC Markets" height={30} />
              <span className="brand-sub">LP QA</span>
            </Link>
            <NavLinks />
            <span className="spacer" />
            <a className="btn ghost" href={SHEET_URL} target="_blank" rel="noreferrer" aria-label="Open LP sheet in a new tab">
              <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true"><path d="M9 2h5v5M14 2L7 9M12 10v3a1 1 0 01-1 1H3a1 1 0 01-1-1V5a1 1 0 011-1h3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Open LP sheet
            </a>
            <RunButton all label="Run full sheet" />
          </div>
        </header>
        <main id="main">
          <LiveRunBanner />
          {children}
        </main>
        <footer className="foot">IC Markets LP QA · internal tool · times are Dubai time (GST)</footer>
      </body>
    </html>
  );
}
