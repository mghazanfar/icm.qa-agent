import { CHECK_LABELS, CHECK_ORDER, type Check, type Row, type Status } from "@/lib/types";

export const STATUS_LABEL: Record<Status, string> = {
  pass: "Passed", warn: "Passed with notes", fail: "Failed", skip: "Not applicable",
};

/** Text for a check, e.g. "Spelling: Passed with notes - colour, favourite". */
export function checkTitle(key: string, c: Check): string {
  const detail = c.detail ? (c.status === "skip" ? ` - Not checked: ${c.detail}` : ` - ${c.detail}`) : "";
  return `${CHECK_LABELS[key] ?? key}: ${STATUS_LABEL[c.status] ?? c.status}${detail}`;
}

export function Dot({ status, title }: { status: Status; title?: string }) {
  return <span className={`dot ${status}`} title={title} role="img" aria-label={title ?? STATUS_LABEL[status]} />;
}

export function Dots({ checks }: { checks: Row["checks"] }) {
  return (
    <div className="dots">
      {CHECK_ORDER.filter((k) => checks[k]).map((k) => <Dot key={k} status={checks[k].status} title={checkTitle(k, checks[k])} />)}
    </div>
  );
}

/** Pill for a row status; a passing row with warn checks is shown as "pass" + notes tint only if requested. */
export function Pill({ status, children }: { status: Status; children?: React.ReactNode }) {
  return <span className={`pill ${status}`}>{children ?? status}</span>;
}

export function Legend() {
  return (
    <div className="legend" aria-label="Legend">
      <span><i className="dot pass" /> Passed</span>
      <span><i className="dot warn" /> Passed with notes</span>
      <span><i className="dot fail" /> Failed</span>
      <span><i className="dot skip" /> Not applicable / not checked</span>
      <span className="muted">Hover a dot or expand a row for the reason.</span>
    </div>
  );
}

export function TzNote() {
  return <p className="tznote">Times are Dubai time (GST).</p>;
}

export function ProportionBar({ passed, failed, total }: { passed: number; failed: number; total: number }) {
  const t = total || 1;
  return (
    <div className="pbar" role="img" aria-label={`${passed} passed, ${failed} failed of ${total}`}>
      <span className="p" style={{ width: `${(passed / t) * 100}%` }} />
      <span className="f" style={{ width: `${(failed / t) * 100}%` }} />
    </div>
  );
}
