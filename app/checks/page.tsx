import Link from "next/link";
import { CHECKS_INFO, THRESHOLDS_FILE } from "@/lib/checks-info";
import { CHECK_ORDER } from "@/lib/types";

export const metadata = { title: "Checks guide - LP QA Dashboard" };

export default function Checks() {
  return (
    <>
      <div className="pagehead">
        <h1>What the checks mean</h1>
        <p className="muted">Every landing page is put through these checks on each run. Green = passed, amber = passed with notes, red = failed, grey = not applicable / not checked.</p>
      </div>
      <div className="grid checks-grid">
        {CHECK_ORDER.map((k, i) => {
          const c = CHECKS_INFO[k];
          return (
            <article key={k} className="card check-card" id={k}>
              <div className="check-num">{String(i + 1).padStart(2, "0")}</div>
              <h3>{c.title}</h3>
              <p className="verifies">{c.verifies}</p>
              <h4><i className="dot pass" /> Passes when</h4>
              <ul>{c.pass.map((p) => <li key={p}>{p}</li>)}</ul>
              {c.fails && <><h4><i className="dot fail" /> Fails when</h4><p>{c.fails}</p></>}
              {c.amber && <><h4><i className="dot warn" /> Shows amber when</h4><p>{c.amber}</p></>}
              <h4><i className="dot skip" /> Shows grey when</h4><p>{c.grey}</p>
            </article>
          );
        })}
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <h2>Where the thresholds live</h2>
        <p>Limits and expected values (GTM containers, performance and lag limits, custom dictionary) are configured in <code>{THRESHOLDS_FILE}</code> in the qa-agent repo. Change them there, not in the dashboard.</p>
        <p className="muted"><Link href="/">Back to overview</Link></p>
      </div>
    </>
  );
}
