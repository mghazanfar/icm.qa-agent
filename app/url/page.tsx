import Link from "next/link";
import RunButton from "@/components/RunButton";
import { Dots, Pill, TzNote, Legend } from "@/components/StatusBits";
import { getIndex, getRuns } from "@/lib/data";
import { fmtDateTime } from "@/lib/format";
import { CHECK_LABELS } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function UrlHistory({ searchParams }: { searchParams: Promise<{ u?: string }> }) {
  const { u } = await searchParams;
  if (!u) return <div className="card">No URL selected. <Link href="/">Back to overview</Link></div>;
  const index = await getIndex();
  const runs = (await getRuns(index.slice(-30).map((r) => r.id))).reverse();
  const history = runs.flatMap((run) => run.results.filter((r) => r.url === u).map((row) => ({ run, row })));
  const first = history[0]?.row;
  const title = first?.product ?? u;
  return (
    <>
      <section className="hero compact">
        <div>
          <div className="eyebrow">LP history</div>
          <h1>{title}</h1>
          <p className="hero-sub">
            <a className="on-dark-link" href={u} target="_blank" rel="noreferrer">{u} ↗</a>
            {first && <> · {first.entity} · {first.language}</>}
          </p>
        </div>
        <RunButton url={u} />
      </section>
      <div className="card">
        <h2>History (last {runs.length} runs)</h2>
        <TzNote />
        <Legend />
        <div className="scroll">
          <table>
            <thead><tr><th>Date</th><th>Lang</th><th>Status</th><th>Checks</th><th>LCP</th><th>TTFB</th><th>Load</th><th>Issues</th></tr></thead>
            <tbody>
              {history.map(({ run, row }, i) => (
                <tr key={run.id + i}>
                  <td className="nowrap"><Link href={`/runs/${run.id}`}>{fmtDateTime(run.startedAt)}</Link></td>
                  <td>{row.language}</td>
                  <td><Pill status={row.status}>{row.status}</Pill></td>
                  <td><Dots checks={row.checks} /></td>
                  <td className="nowrap">{row.metrics?.lcp != null ? (row.metrics.lcp / 1000).toFixed(1) + "s" : "–"}</td>
                  <td className="nowrap">{row.metrics ? Math.round(row.metrics.ttfb) + "ms" : "–"}</td>
                  <td className="nowrap">{row.metrics ? (row.metrics.load / 1000).toFixed(1) + "s" : "–"}</td>
                  <td className="detail">
                    {Object.entries(row.checks).filter(([, c]) => c.status === "fail" || c.status === "warn").map(([k, c]) => (
                      <div key={k}><span className={`dot ${c.status}`} /> <b>{CHECK_LABELS[k] ?? k}{c.status === "warn" ? " (notes)" : ""}:</b> {c.detail}</div>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {history.length === 0 && <p className="muted">No results for this URL yet.</p>}
      </div>
    </>
  );
}
