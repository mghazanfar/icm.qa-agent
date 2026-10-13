// Pure logic for the live run banner (no network): turns GitHub's run/job data into steps, progress and an ETA.

export type GhStep = { name: string; status: string; conclusion: string | null; started_at: string | null; completed_at: string | null };
export type GhJob = { name: string; status: string; conclusion: string | null; steps?: GhStep[] };
export type GhRun = { id: number; status: string; conclusion: string | null; event: string; display_title: string; created_at: string; html_url: string; updated_at: string };

export type StepView = { label: string; state: "done" | "active" | "pending" | "failed" };
export type LiveCore = {
  active: boolean; skipped: boolean;
  trigger: "scheduled" | "manual" | "dashboard" | "other"; target: string;
  percent: number; phase: string; steps: StepView[];
  etaAt?: string; remainingSec?: number; overrun?: boolean;
  stepStartedAt?: string;
};

export function parseTitle(title: string, event: string): { trigger: LiveCore["trigger"]; target: string } {
  // the workflow's run-name looks like "LP QA · dashboard · all" (older runs only have the plain workflow name)
  const parts = title.split("·").map((s) => s.trim());
  const t = (parts[1] || "").toLowerCase();
  const target = parts[2] || "all";
  if (t === "scheduled" || event === "schedule") return { trigger: "scheduled", target };
  if (t === "dashboard") return { trigger: "dashboard", target };
  if (event === "workflow_dispatch") return { trigger: "manual", target };
  return { trigger: "other", target };
}

const GROUPS: { label: string; match: (n: string) => boolean }[] = [
  { label: "Starting the runner", match: (n) => n === "Set up job" || n.startsWith("Run actions/checkout") },
  { label: "Installing Python tools", match: (n) => n.startsWith("Run actions/setup-python") || n.startsWith("Run pip install") },
  { label: "Installing the browser", match: (n) => n.startsWith("Run playwright install") },
  { label: "Opening the results store", match: (n) => n.startsWith("Check out the results branch") },
  { label: "Testing landing pages and posting the Slack summary", match: (n) => n === "Run QA agent" },
  { label: "Saving results to the dashboard", match: (n) => n.startsWith("Save results") },
];

function groupState(steps: GhStep[], match: (n: string) => boolean): StepView["state"] {
  const mine = steps.filter((s) => match(s.name));
  if (!mine.length) return "pending";
  if (mine.some((s) => s.conclusion === "failure")) return "failed";
  if (mine.some((s) => s.status === "in_progress")) return "active";
  if (mine.every((s) => s.status === "completed")) return "done";
  return mine.some((s) => s.status === "completed") ? "active" : "pending";
}

export function buildLive(run: GhRun, jobs: GhJob[], typicalSec: number, nowMs: number): LiveCore {
  const { trigger, target } = parseTitle(run.display_title, run.event);
  const gate = jobs.find((j) => j.name === "gate");
  const qa = jobs.find((j) => j.name === "qa");
  const base = { trigger, target };
  if (qa && qa.conclusion === "skipped") {
    return { ...base, active: false, skipped: true, percent: 0, phase: "", steps: [] };   // a day the schedule card has switched off
  }
  const gateState: StepView["state"] = !gate ? "active" : gate.conclusion === "failure" ? "failed" : gate.status === "completed" ? "done" : "active";
  const steps: StepView[] = [{ label: "Checking the schedule", state: gateState }];
  const qs = qa?.steps ?? [];
  for (const g of GROUPS) steps.push({ label: g.label, state: qa ? groupState(qs, g.match) : "pending" });
  if (qa && qa.status === "queued") steps[1] = { ...steps[1], state: "active" };   // waiting for a runner

  const main = qs.find((s) => s.name === "Run QA agent");
  const save = qs.find((s) => s.name.startsWith("Save results"));
  const single = target !== "all";
  const typical = single ? 120 : typicalSec;                 // a one-URL run is much shorter than a full run
  let percent = 2, phase = "Checking the schedule", remaining = typical + 90;
  let elapsedMain = 0;
  if (gate && gate.status === "completed" && !qa) { percent = 4; phase = "Waiting for a runner"; remaining = typical + 90; }
  if (qa && qa.status === "queued") { percent = 4; phase = "Waiting for a runner"; }
  else if (qa && (!main || main.status === "pending" || main.status === "queued")) { percent = 8; phase = "Preparing the runner (installing browsers)"; remaining = typical + 60; }
  else if (main && main.status === "in_progress") {
    elapsedMain = (nowMs - new Date(main.started_at ?? run.created_at).getTime()) / 1000;
    percent = Math.round(10 + 82 * Math.min(elapsedMain / typical, 0.98));
    phase = "Testing landing pages";
    remaining = Math.max(30, typical - elapsedMain) + 40;
  } else if (main && main.status === "completed" && save && save.status !== "completed") { percent = 94; phase = "Saving the results"; remaining = 25; }
  else if (main && main.status === "completed") { percent = 97; phase = "Finishing up"; remaining = 15; }

  const overrun = elapsedMain > typical * 1.15;
  return { ...base, active: true, skipped: false, percent, phase, steps, remainingSec: Math.round(remaining),
           etaAt: new Date(nowMs + remaining * 1000).toISOString(), overrun, stepStartedAt: main?.started_at ?? undefined };
}

export function medianSeconds(durations: number[], fallback = 900): number {
  const d = durations.filter((n) => n > 60).sort((a, b) => a - b);
  return d.length ? d[Math.floor(d.length / 2)] : fallback;
}
