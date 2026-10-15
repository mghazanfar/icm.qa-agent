/** "warn" = passed, but with notes (e.g. a few unknown words from the spell check). Never counts as a failure. */
export type Status = "pass" | "fail" | "skip" | "warn";
export type Check = { status: Status; detail: string };
export type Metrics = { lcp: number | null; ttfb: number; load: number; cls: number; inp: number | null; long_task_max: number };
export type Row = {
  product: string; language: string; label: string; url: string; entity: string;
  status: "pass" | "fail"; checks: Record<string, Check>; metrics: Metrics | null;
  /** URL actually opened (the sheet URL plus the sample tracking parameters) and the URL the browser ended on */
  tested_url?: string | null; final_url?: string | null;
};
export type RunSummary = {
  id: string; startedAt: string; finishedAt: string; trigger: string; mode: string; source: string;
  total: number; passed: number; failed: number; skippedAu: number;
  checkFails?: Record<string, number>;
  byEntity?: Record<string, { total: number; failed: number }>;
  byLanguage?: Record<string, { total: number; failed: number }>;
  medianLcp?: number | null;
  notes?: string[];
  country?: string | null;
  countries?: string[] | null;
};
export type Run = RunSummary & { skippedAuRows: { label: string; url: string }[]; results: Row[] };

export const CHECK_LABELS: Record<string, string> = {
  gtm: "GTM integration", tracking: "Tracking", cta_endpoint: "CTA endpoints", cta_params: "CTA tracking",
  consistency: "Consistency", spelling: "Spelling", performance: "Load time", mobile: "Mobile", lag: "Lag",
  redirect: "Redirect", param_pass: "Param pass-through", load: "Page load",
};
export const CHECK_ORDER = Object.keys(CHECK_LABELS);
