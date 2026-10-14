import Link from "next/link";
import ChartsPanel from "@/components/ChartsPanel";
import UrlTable from "@/components/UrlTable";
import ScheduleCard from "@/components/ScheduleCard";
import { readSchedule } from "@/lib/schedule";
import { ProportionBar, TzNote } from "@/components/StatusBits";
import { checkSource, getIndex, getLatestFull, getRuns } from "@/lib/data";
import { SHEET_URL } from "@/lib/config";
import { fmtDateTime, fmtDuration, fmtShortDay } from "@/lib/format";
import { CHECK_LABELS } from "@/lib/types";

export const dynamic = "force-dynamic";
const shortDay = fmtShortDay;

export default async function Overview() {
  const schedule = await readSchedule();
  const index = await getIndex();
  const latest = await getLatestFull(index);
  if (!latest) {
    const src = await checkSource();
    return (
      <>
        <ScheduleCard initial={schedule.days} />
        <div className="card">
          <h2>No data to show</h2>
          {src.ok && !process.env.GITHUB_TOKEN ? (
            <div className="banner info" role="alert"><b>No GITHUB_TOKEN on this deployment</b><p>The dashboard reads results from the QA repository through GitHub, and this deployment has no <code>GITHUB_TOKEN</code> environment variable, so it only looks for local files (there are none here). Add the variable in the hosting settings, make sure its scopes include runtime/functions, then redeploy. Open <code>/api/health</code> to see what the server can see.</p></div>
          ) : src.ok ? (
            <p>Run the QA agent (Run full sheet, or <code>python runner.py --data-dir data</code> locally) and results will show up here.</p>
          ) : (
            <div className="banner info" role="alert"><b>Could not load results</b><p>{src.message}</p></div>
          )}
        </div>
      </>
    );
  }
  const fullRuns = index.filter((r) => r.mode === "all");
  const trend = fullRuns.slice(-30).map((r) => ({ id: r.id, date: shortDay(r.startedAt), when: fmtDateTime(r.startedAt), passRate: Math.round((r.passed / r.total) * 1000) / 10, failed: r.failed }));
  const lcpTrend = fullRuns.slice(-30).map((r) => ({ id: r.id, date: shortDay(r.startedAt), when: fmtDateTime(r.startedAt), lcp: r.medianLcp ? Math.round(r.medianLcp / 100) / 10 : null }));
  const fails = Object.entries(latest.checkFails ?? {}).map(([k, v]) => ({ key: k, name: CHECK_LABELS[k] ?? k, fails: v })).sort((a, b) => b.fails - a.fails);
  const bars = (o?: Record<string, { total: number; failed: number }>) =>
    Object.entries(o ?? {}).map(([name, v]) => ({ name, passed: v.total - v.failed, failed: v.failed })).sort((a, b) => a.name.localeCompare(b.name));

  // persistently failing LPs across the last 5 full runs
  const recent = await getRuns(fullRuns.slice(-5).map((r) => r.id));
  const tally = new Map<string, { label: string; url: string; n: number }>();
  for (const run of recent) for (const row of run.results) if (row.status === "fail") {
    const t = tally.get(row.url + row.language) ?? { label: row.label, url: row.url, n: 0 };
    t.n++; tally.set(row.url + row.language, t);
  }
  const worst = [...tally.values()].sort((a, b) => b.n - a.n).slice(0, 8);
  const rate = Math.round((latest.passed / latest.total) * 1000) / 10;
  const warnRows = latest.results.filter((r) => Object.values(r.checks).some((c) => c.status === "warn")).length;
  const duration = fmtDuration(latest.startedAt, latest.finishedAt);

  return (
    <>
      <div className="herogrid">
        <section className="hero">
          <div className="hero-main">
            <div className="eyebrow">Latest {latest.mode === "all" ? "full-sheet" : latest.mode} run</div>
            <div className="hero-rate">{rate}<small>%</small></div>
            <p className="hero-sub">{latest.passed} of {latest.total} landing pages passed · {fmtDateTime(latest.finishedAt)}</p>
            <ProportionBar passed={latest.passed} failed={latest.failed} total={latest.total} />
            <div className="hero-chips">
              <span className="pill pass on-dark">{latest.passed} passed</span>
              <span className="pill fail on-dark">{latest.failed} failed</span>
              {warnRows > 0 && <span className="pill warn on-dark">{warnRows} with notes</span>}
              <Link className="btn solid" href={`/runs/${latest.id}`}>Run details</Link>
            </div>
          </div>
        </section>
        <section className="card sheetcard">
          <div className="sheet-ic" aria-hidden="true">
            <svg width="26" height="26" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M3 9h18M3 15h18M9 3v18" stroke="currentColor" strokeWidth="1.8" /></svg>
          </div>
          <h2>LP source sheet</h2>
          <p className="muted">Every landing page checked here comes from the Google sheet. Add, edit or remove LPs there; the next run picks the change up.</p>
          <a className="btn solid-dark" href={SHEET_URL} target="_blank" rel="noreferrer" aria-label="Open or edit the LP source sheet in a new tab">Open / edit sheet ↗</a>
        </section>
      </div>

      {(latest.notes ?? []).length > 0 && (
        <div className="banner info" role="note">
          <b>Run notes</b>
          {(latest.notes ?? []).map((n) => <p key={n}>{n}</p>)}
        </div>
      )}

      <ScheduleCard initial={schedule.days} />

      <div className="grid kpis">
        <div className="card kpi"><h2>Pass rate</h2><div className="v" style={{ color: rate >= 80 ? "var(--green-text)" : "var(--fail-text)" }}>{rate}%</div><div className="s">{latest.passed}/{latest.total} LPs passed</div></div>
        <div className="card kpi"><h2>Failing LPs</h2><div className="v">{latest.failed}</div><div className="s">in the latest {latest.mode === "all" ? "full" : latest.mode} run</div></div>
        <div className="card kpi"><h2>Latest run</h2><div className="v small">{fmtDateTime(latest.finishedAt)}</div><div className="s">{latest.trigger} · <Link href={`/runs/${latest.id}`}>details</Link></div></div>
        <div className="card kpi"><h2>Run duration</h2><div className="v">{duration}</div><div className="s">start to finish</div></div>
        <div className="card kpi"><h2>Median LCP</h2><div className="v">{latest.medianLcp ? (latest.medianLcp / 1000).toFixed(1) + "s" : "n/a"}</div><div className="s">threshold 2.5s</div></div>
        <div className="card kpi"><h2>Runs recorded</h2><div className="v">{index.length}</div><div className="s">{fullRuns.length} full-sheet</div></div>
      </div>
      <TzNote />
      <ChartsPanel rows={latest.results} trend={trend} lcpTrend={lcpTrend} fails={fails} byEntity={bars(latest.byEntity)} byLanguage={bars(latest.byLanguage)}>
        <div className="card">
          <h2>Failing most often (last {recent.length} full run{recent.length === 1 ? "" : "s"})</h2>
          {worst.length === 0 ? <p className="muted">No failures.</p> : (
            <table className="compact"><tbody>{worst.map((w) => <tr key={w.url + w.label}><td><Link href={`/url?u=${encodeURIComponent(w.url)}`}>{w.label}</Link></td><td className="muted hide-sm">{w.url.replace(/^https?:\/\//, "").slice(0, 48)}</td><td className="nowrap"><span className="pill fail">{w.n}/{recent.length}</span></td></tr>)}</tbody></table>
          )}
          {latest.skippedAu > 0 && <p className="muted" style={{ marginTop: 12 }}>{latest.skippedAu} AU rows skipped (AU IP/proxy required) in the latest run.</p>}
        </div>
      </ChartsPanel>
      <UrlTable rows={latest.results} title="All URLs — latest full run" />
    </>
  );
}
