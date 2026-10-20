import Link from "next/link";
import CheckSwitch from "@/components/CheckSwitch";
import { CHECKS_INFO, THRESHOLDS_FILE } from "@/lib/checks-info";
import { LOCKED, readCheckSettings } from "@/lib/check-settings";
import { CHECK_ORDER } from "@/lib/types";

export const metadata = { title: "Checks guide - LP QA Dashboard" };
export const dynamic = "force-dynamic";

const css = `
.checkswitch { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin: 4px 0 10px; }
.sw { position: relative; width: 44px; height: 24px; border-radius: 99px; border: 0; padding: 0; cursor: pointer; background: #c3cfc6; transition: background .15s; }
.sw.on { background: var(--green-text); }
.sw:disabled { opacity: .6; cursor: progress; }
.sw .knob { position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,.3); transition: transform .15s; }
.sw.on .knob { transform: translateX(20px); }
.sw-label { font-weight: 600; font-size: 13px; }
.sw-ok { color: var(--green-text); font-size: 13px; } .sw-err { color: var(--fail-text); font-size: 13px; }
.check-card.check-off { background: #f6f8f6; border-top-color: #c3cfc6; }
.check-card.check-off h3, .check-card.check-off .verifies, .check-card.check-off ul, .check-card.check-off p { opacity: .55; }
.locked { margin: 4px 0 10px; font-size: 13px; }
`;

export default async function Checks() {
  const { disabled } = await readCheckSettings();
  const off = new Set(disabled);
  return (
    <>
      <style>{css}</style>
      <div className="pagehead">
        <h1>What the checks mean</h1>
        <p className="muted">Every landing page is put through these checks on each run. Green = passed, amber = passed with notes, red = failed, grey = not applicable / not checked.</p>
      </div>
      <div className="banner info" role="note">
        <b>Switch checks on or off</b>
        <p>Every check has a switch. A check that is off is left out of the very next run, whether it starts on schedule, by hand or from this dashboard, and its results and failures no longer appear in new runs or in Slack. Older runs keep what they recorded. The page-load result is always on.</p>
      </div>
      <div className="grid checks-grid">
        {CHECK_ORDER.map((k, i) => {
          const c = CHECKS_INFO[k];
          const locked = LOCKED.includes(k);
          return (
            <article key={k} className={`card check-card${off.has(k) ? " check-off" : ""}`} id={k}>
              <div className="check-num">{String(i + 1).padStart(2, "0")}</div>
              <h3>{c.title}</h3>
              {locked ? <p className="muted locked">Always on: a page that does not open cannot be checked.</p> : <CheckSwitch checkKey={k} initialOn={!off.has(k)} label={c.title} />}
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
