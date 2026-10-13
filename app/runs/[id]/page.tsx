import { notFound } from "next/navigation";
import UrlTable from "@/components/UrlTable";
import { ProportionBar, TzNote } from "@/components/StatusBits";
import { getRun } from "@/lib/data";
import { fmtDateTime, fmtDuration } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function RunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const run = await getRun(id);
  if (!run) notFound();
  const warnRows = run.results.filter((r) => Object.values(r.checks).some((c) => c.status === "warn")).length;
  return (
    <>
      <section className="hero compact">
        <div>
          <div className="eyebrow">Run {run.id}</div>
          <h1>{fmtDateTime(run.startedAt)}</h1>
          <p className="hero-sub">
            {run.mode === "all" ? "Full sheet" : run.mode} · triggered by {run.trigger} · source {run.source} · took {fmtDuration(run.startedAt, run.finishedAt)}
            {(run.countries?.length ? run.countries.join(", ") : run.country) ? ` · tested from ${run.countries?.length ? run.countries.join(", ") : run.country}` : ""}
          </p>
          <div className="hero-chips">
            <span className="pill pass on-dark">{run.passed} passed</span>
            <span className="pill fail on-dark">{run.failed} failed</span>
            {warnRows > 0 && <span className="pill warn on-dark">{warnRows} with notes</span>}
            {run.skippedAuRows.length > 0 && <span className="pill skip on-dark">{run.skippedAuRows.length} AU rows skipped</span>}
          </div>
          <ProportionBar passed={run.passed} failed={run.failed} total={run.total} />
        </div>
      </section>
      {(run.notes ?? []).length > 0 && (
        <div className="banner info" role="note">{(run.notes ?? []).map((n) => <p key={n}>{n}</p>)}</div>
      )}
      <TzNote />
      <UrlTable rows={run.results} title="All URLs in this run" />
    </>
  );
}
