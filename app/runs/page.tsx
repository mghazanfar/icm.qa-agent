import Link from "next/link";
import { ProportionBar, TzNote } from "@/components/StatusBits";
import { getIndex } from "@/lib/data";
import { fmtDateTime, fmtDuration } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Runs() {
  const runs = (await getIndex()).slice().reverse();
  return (
    <>
      <div className="pagehead"><h1>Runs</h1><p className="muted">Every QA run, newest first.</p></div>
      <div className="card">
        <TzNote />
        <div className="scroll">
          <table>
            <thead><tr><th>Date</th><th>Duration</th><th>Scope</th><th>Trigger</th><th>Passed / failed</th><th>AU skipped</th><th>Egress</th></tr></thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.id}>
                  <td className="nowrap"><Link href={`/runs/${r.id}`}>{fmtDateTime(r.startedAt)}</Link></td>
                  <td className="nowrap">{fmtDuration(r.startedAt, r.finishedAt)}</td>
                  <td><span className="chip">{r.mode === "all" ? "all (full sheet)" : r.mode}</span></td>
                  <td>{r.trigger}</td>
                  <td>
                    <div className="countcell">
                      <span className="pill pass">{r.passed} passed</span>
                      {r.failed > 0 ? <span className="pill fail">{r.failed} failed</span> : <span className="muted">0 failed</span>}
                    </div>
                    <ProportionBar passed={r.passed} failed={r.failed} total={r.total} />
                  </td>
                  <td>{r.skippedAu}</td>
                  <td>{r.countries?.length ? r.countries.join(", ") : r.country ?? <span className="muted">–</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {runs.length === 0 && <p className="muted">No runs recorded yet.</p>}
      </div>
    </>
  );
}
