"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FailsByCheck, LcpTrend, PassFailBars, TrendChart } from "./Charts";
import { Pill } from "./StatusBits";
import { CHECK_LABELS, type Row } from "@/lib/types";

type Bars = { name: string; passed: number; failed: number }[];
type Sel = { title: string; rows: Row[]; check?: string };

export default function ChartsPanel({ rows, trend, lcpTrend, fails, byEntity, byLanguage, children }: {
  rows: Row[];
  trend: { id: string; date: string; when: string; passRate: number; failed: number }[];
  lcpTrend: { id: string; date: string; when: string; lcp: number | null }[];
  fails: { key: string; name: string; fails: number }[];
  byEntity: Bars; byLanguage: Bars;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const [sel, setSel] = useState<Sel | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (sel) ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [sel]);

  const openRun = (id: string) => router.push(`/runs/${id}`);
  const failFirst = (a: Row, b: Row) => (a.status === b.status ? a.label.localeCompare(b.label) : a.status === "fail" ? -1 : 1);

  return (
    <>
      <p className="muted" style={{ margin: "0 0 8px", fontSize: 12 }}>Tip: click a bar to list its LPs, or a point on a trend to open that run.</p>
      <div className="grid two">
        <div className="card"><h2>Pass rate by run (full sheet)</h2><TrendChart data={trend} onRun={openRun} /></div>
        <div className="card"><h2>Failing LPs by check — latest run</h2>
          <FailsByCheck data={fails} onSelect={(k) => setSel({ title: `Failing: ${CHECK_LABELS[k] ?? k}`, check: k, rows: rows.filter((r) => r.checks[k]?.status === "fail").sort(failFirst) })} />
        </div>
        <div className="card"><h2>By regulator — latest run</h2>
          <PassFailBars data={byEntity} onSelect={(n) => setSel({ title: `Regulator ${n}`, rows: rows.filter((r) => r.entity === n).sort(failFirst) })} />
        </div>
        <div className="card"><h2>By language — latest run</h2>
          <PassFailBars data={byLanguage} onSelect={(n) => setSel({ title: `Language ${n}`, rows: rows.filter((r) => r.language === n).sort(failFirst) })} />
        </div>
        <div className="card"><h2>Median LCP by run</h2><LcpTrend data={lcpTrend} onRun={openRun} /></div>
        {children}
      </div>
      {sel && (
        <div className="card" ref={ref} style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <h2 style={{ margin: 0 }}>{sel.title} ({sel.rows.length})</h2>
            <button type="button" className="btn" style={{ border: "1px solid var(--line)", background: "#fff", color: "var(--ink)" }} onClick={() => setSel(null)}>Close</button>
          </div>
          <div className="scroll" style={{ marginTop: 10 }}>
            <table>
              <thead><tr><th>LP</th><th>Reg.</th><th>Lang</th><th>Result</th><th>{sel.check ? CHECK_LABELS[sel.check] ?? sel.check : "Issues"}</th></tr></thead>
              <tbody>
                {sel.rows.map((r, i) => {
                  const issues = Object.entries(r.checks).filter(([, c]) => c.status === "fail" || c.status === "warn");
                  return (
                    <tr key={r.url + i}>
                      <td><Link href={`/url?u=${encodeURIComponent(r.url)}`}>{r.label}</Link><div className="muted urlline">{r.url.replace(/^https?:\/\//, "")}</div></td>
                      <td>{r.entity}</td><td>{r.language}</td>
                      <td><Pill status={r.status}>{r.status === "pass" ? "passed" : "failed"}</Pill></td>
                      <td className="detail">
                        {sel.check ? r.checks[sel.check]?.detail : issues.length ? issues.map(([k, c]) => <div key={k}><b>{CHECK_LABELS[k] ?? k}:</b> {c.detail}</div>) : <span className="muted">All checks passed</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {sel.rows.length === 0 && <p className="muted">Nothing to show.</p>}
        </div>
      )}
    </>
  );
}
