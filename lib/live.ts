import { getIndex } from "./data";
import { buildLive, medianSeconds, type GhJob, type GhRun, type LiveCore, type Progress } from "./live-logic";

const API = () => process.env.GITHUB_API_URL || "https://api.github.com"; // override only for local testing
const REPO = () => process.env.GITHUB_REPO || "ICMarkets/icm.qa-agent";
const WORKFLOW = () => process.env.WORKFLOW_FILE || "qa-agent.yml";
const token = () => process.env.GITHUB_TOKEN;
const gh = () => ({ Authorization: `Bearer ${token()}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" });

export type LiveState = Partial<LiveCore> & {
  configured: boolean;
  active: boolean;
  runId?: number;
  url?: string;
  startedAt?: string;       // ISO, when the run was created
  typicalSec?: number;      // typical duration of a full run, from earlier runs
  latest?: { conclusion: string | null; finishedAt: string | null; url: string } | null;
};

let cache: { at: number; value: LiveState } | null = null;

async function typicalSeconds(): Promise<number> {
  try {
    const idx = (await getIndex()).filter((r) => r.mode === "all").slice(-5);
    return medianSeconds(idx.map((r) => (new Date(r.finishedAt).getTime() - new Date(r.startedAt).getTime()) / 1000));
  } catch {
    return 900;
  }
}

// The runner force-pushes progress.json to the qa-progress branch while it tests (see progress.py); null when there is none.
async function readProgress(repo: string): Promise<Progress | null> {
  try {
    const r = await fetch(`${API()}/repos/${repo}/contents/progress.json?ref=qa-progress`, {
      headers: { ...gh(), Accept: "application/vnd.github.raw+json" }, cache: "no-store" });
    return r.ok ? ((await r.json()) as Progress) : null;
  } catch {
    return null;
  }
}

export async function getLiveState(): Promise<LiveState> {
  if (!token()) return { configured: false, active: false };
  if (cache && Date.now() - cache.at < 4000) return cache.value;
  const repo = REPO();
  let value: LiveState = { configured: true, active: false };
  try {
    const r = await fetch(`${API()}/repos/${repo}/actions/workflows/${WORKFLOW()}/runs?per_page=5`, { headers: gh(), cache: "no-store" });
    if (!r.ok) return { configured: true, active: false };
    const runs = ((await r.json()).workflow_runs ?? []) as GhRun[];
    const live = runs.find((x) => x.status !== "completed");
    const done = runs.find((x) => x.status === "completed");
    value.latest = done ? { conclusion: done.conclusion, finishedAt: done.updated_at, url: done.html_url } : null;
    if (live) {
      const jr = await fetch(`${API()}/repos/${repo}/actions/runs/${live.id}/jobs`, { headers: gh(), cache: "no-store" });
      const jobs = jr.ok ? (((await jr.json()).jobs ?? []) as GhJob[]) : [];
      const typical = await typicalSeconds();
      const qaJob = jobs.find((j) => j.name === "qa");
      const testing = qaJob?.steps?.some((st) => st.name === "Run QA agent" && st.status === "in_progress");
      const core = buildLive(live, jobs, typical, Date.now(), testing ? await readProgress(repo) : null);
      value = { ...value, ...core, runId: live.id, url: live.html_url, startedAt: live.created_at, typicalSec: Math.round(typical) };
    }
  } catch {
    value = { configured: true, active: false };
  }
  cache = { at: Date.now(), value };
  return value;
}
