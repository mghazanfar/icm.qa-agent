"use client";
import Link from "next/link";
import { Fragment, useMemo, useState } from "react";
import RunButton from "./RunButton";
import { Dot, Dots, Legend, Pill, STATUS_LABEL } from "./StatusBits";
import { CHECKS_INFO } from "@/lib/checks-info";
import { CHECK_LABELS, CHECK_ORDER, type Metrics, type Row } from "@/lib/types";

const hasWarn = (r: Row) => Object.values(r.checks).some((c) => c.status === "warn");

function metricList(m: Metrics) {
  const s = (ms: number) => (ms / 1000).toFixed(2) + " s";
  return [
    { k: "LCP", v: m.lcp != null ? s(m.lcp) : "n/a", bad: m.lcp != null && m.lcp > 2500, hint: "limit 2.5 s" },
    { k: "TTFB", v: Math.round(m.ttfb) + " ms", bad: m.ttfb > 800, hint: "limit 800 ms" },
    { k: "Load", v: s(m.load), bad: m.load > 5000, hint: "limit 5 s" },
    { k: "CLS", v: m.cls.toFixed(3), bad: m.cls >= 0.1, hint: "limit 0.1" },
    { k: "INP", v: m.inp != null ? Math.round(m.inp) + " ms" : "n/a", bad: m.inp != null && m.inp > 220, hint: "limit 200 ms" },
    { k: "Longest task", v: Math.round(m.long_task_max) + " ms", bad: m.long_task_max > 500, hint: "limit 500 ms" },
  ];
}

function Details({ row }: { row: Row }) {
  const keys = [...CHECK_ORDER.filter((k) => row.checks[k]), ...Object.keys(row.checks).filter((k) => !CHECK_ORDER.includes(k))];
  return (
    <div className="details">
      <ul className="checklist">
        {keys.map((k) => {
          const c = row.checks[k];
          const info = CHECKS_INFO[k];
          const detail = c.detail ? (c.status === "skip" ? `Not checked: ${c.detail}` : c.detail) : "";
          return (
            <li key={k}>
              <Dot status={c.status} title={STATUS_LABEL[c.status]} />
              <div>
                <div className="ck-head"><b>{info?.title ?? CHECK_LABELS[k] ?? k}</b><span className={`ck-status ${c.status}`}>{STATUS_LABEL[c.status] ?? c.status}</span></div>
                {info && <div className="muted ck-short">{info.short}</div>}
                {detail && <div className={`ck-detail ${c.status}`}>{detail}</div>}
              </div>
            </li>
          );
        })}
      </ul>
      {row.metrics && (
        <div className="metrics" aria-label="Metrics">
          {metricList(row.metrics).map((m) => (
            <div key={m.k} className={`metric ${m.bad ? "bad" : ""}`} title={m.hint}><span>{m.k}</span><b>{m.v}</b></div>
          ))}
        </div>
      )}
      <div className="details-foot"><Link href={`/url?u=${encodeURIComponent(row.url)}`}>History for this LP</Link> · <Link href="/checks">What the checks mean</Link></div>
    </div>
  );
}

export default function UrlTable({ rows, title = "All URLs" }: { rows: Row[]; title?: string }) {
  const [q, setQ] = useState("");
  const [entity, setEntity] = useState("");
  const [lang, setLang] = useState("");
  const [status, setStatus] = useState("");
  const [check, setCheck] = useState("");
  const [open, setOpen] = useState<Set<string>>(new Set());
  const uniq = (f: (r: Row) => string) => [...new Set(rows.map(f))].sort();
  const keyOf = (r: Row, i: number) => r.url + "|" + r.language + "|" + i;
  const shown = useMemo(
    () => rows.map((r, i) => ({ r, key: keyOf(r, i) })).filter(({ r }) =>
      (!q || (r.label + r.url).toLowerCase().includes(q.toLowerCase())) && (!entity || r.entity === entity) &&
      (!lang || r.language === lang) &&
      // with a check chosen, the status filter is about that check (default: where it failed)
      (check ? (r.checks[check]?.status ?? "skip") === (status || "fail") : !status || (status === "warn" ? hasWarn(r) : r.status === status))),
    [rows, q, entity, lang, status, check],
  );
  const checkOptions = CHECK_ORDER.filter((k) => rows.some((r) => r.checks[k])).map((k) => ({
    k, fails: rows.filter((r) => r.checks[k]?.status === "fail").length,
  }));
  const filtered = !!(q || entity || lang || status || check);
  const clear = () => { setQ(""); setEntity(""); setLang(""); setStatus(""); setCheck(""); };
  const toggle = (k: string) => setOpen((s) => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); return n; });

  return (
    <div className="card">
      <h2>{title} ({shown.length} of {rows.length})</h2>
      <div className="filters">
        <input aria-label="Search product or URL" placeholder="Search product or URL…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select aria-label="Regulator" value={entity} onChange={(e) => setEntity(e.target.value)}><option value="">All regulators</option>{uniq((r) => r.entity).map((v) => <option key={v}>{v}</option>)}</select>
        <select aria-label="Language" value={lang} onChange={(e) => setLang(e.target.value)}><option value="">All languages</option>{uniq((r) => r.language).map((v) => <option key={v}>{v}</option>)}</select>
        <select aria-label="Check" value={check} onChange={(e) => setCheck(e.target.value)}>
          <option value="">All checks</option>
          {checkOptions.map(({ k, fails }) => <option key={k} value={k}>{CHECK_LABELS[k] ?? k} ({fails} failing)</option>)}
        </select>
        <select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">{check ? "Failing (default)" : "All statuses"}</option>
          <option value="fail">Failing</option><option value="pass">Passing</option><option value="warn">Passed with notes</option>
        </select>
        {filtered && <button type="button" className="btn" style={{ border: "1px solid var(--line)", background: "#fff", color: "var(--ink)" }} onClick={clear}>Clear filters</button>}
      </div>
      <Legend />
      <div className="scroll">
        <table className="urltable">
          <thead><tr><th aria-label="Run"></th><th aria-label="Expand"></th><th>LP</th><th>Reg.</th><th>Lang</th><th>Status</th><th>Checks</th><th className="hide-sm">Issues</th></tr></thead>
          <tbody>
            {shown.map(({ r, key }) => {
              const isOpen = open.has(key);
              const issues = Object.entries(r.checks).filter(([, c]) => c.status === "fail" || c.status === "warn");
              return (
                <Fragment key={key}>
                  <tr className={`datarow ${isOpen ? "open" : ""}`} onClick={(e) => { if (!(e.target as HTMLElement).closest("a,button,input,select")) toggle(key); }}>
                    <td><RunButton url={r.url} /></td>
                    <td>
                      <button className="chev" aria-expanded={isOpen} aria-label={`${isOpen ? "Hide" : "Show"} check details for ${r.label}`} onClick={() => toggle(key)}>
                        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M4 5l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </button>
                    </td>
                    <td>
                      <Link href={`/url?u=${encodeURIComponent(r.url)}`}>{r.label}</Link>
                      <div className="muted urlline"><a href={r.url} target="_blank" rel="noreferrer">{r.url.replace(/^https?:\/\//, "")}</a></div>
                    </td>
                    <td>{r.entity}</td>
                    <td>{r.language}</td>
                    <td><Pill status={r.status}>{r.status}</Pill>{r.status === "pass" && hasWarn(r) && <span className="notes-tag" title="Passed with notes">notes</span>}</td>
                    <td><Dots checks={r.checks} /></td>
                    <td className="detail hide-sm">{issues.map(([k, c]) => <div key={k}><b>{CHECK_LABELS[k] ?? k}{c.status === "warn" ? " (notes)" : ""}:</b> {c.detail}</div>)}</td>
                  </tr>
                  {isOpen && <tr className="detailrow"><td colSpan={8}><Details row={r} /></td></tr>}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      {shown.length === 0 && <p className="muted">No URLs match these filters.</p>}
    </div>
  );
}
