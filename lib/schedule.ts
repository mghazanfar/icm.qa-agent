import { promises as fs } from "fs";
import path from "path";

export type Schedule = { days: number[]; updatedAt?: string; updatedBy?: string };
export const DEFAULT_DAYS = [1, 3, 5]; // Mon, Wed, Fri (ISO weekday: 1 = Monday ... 7 = Sunday)
export const RUN_TIME_UTC = "04:00";   // fixed by the cron line in .github/workflows/qa-agent.yml

const REPO = () => process.env.GITHUB_REPO || "ICMarkets/icm.qa-agent";
const BRANCH = () => process.env.RESULTS_BRANCH || "main";
const token = () => process.env.GITHUB_TOKEN;
const localFile = () => path.join(process.env.DATA_DIR || path.join(process.cwd(), "..", "data"), "schedule.json");
const gh = () => ({
  Authorization: `Bearer ${token()}`,
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
});

export function cleanDays(input: unknown): number[] | null {
  if (!Array.isArray(input)) return null;
  const days = [...new Set(input.map(Number))].filter((d) => Number.isInteger(d) && d >= 1 && d <= 7).sort();
  return days.length === input.length ? days : null;
}

export async function readSchedule(): Promise<Schedule> {
  try {
    if (token()) {
      const r = await fetch(`https://api.github.com/repos/${REPO()}/contents/data/schedule.json?ref=${BRANCH()}`, {
        headers: { ...gh(), Accept: "application/vnd.github.raw+json" },
        cache: "no-store",
      });
      if (!r.ok) return { days: DEFAULT_DAYS };
      const j = await r.json();
      return cleanDays(j?.days) ? j : { days: DEFAULT_DAYS };
    }
    const j = JSON.parse(await fs.readFile(localFile(), "utf-8"));
    return cleanDays(j?.days) ? j : { days: DEFAULT_DAYS };
  } catch {
    return { days: DEFAULT_DAYS };
  }
}

/** Saves the schedule: to data/schedule.json on the results branch (GitHub API) or, without a token, to the local data folder. */
export async function writeSchedule(days: number[]): Promise<{ ok: true; schedule: Schedule } | { ok: false; error: string }> {
  const schedule: Schedule = { days, updatedAt: new Date().toISOString(), updatedBy: "dashboard" };
  const body = JSON.stringify(schedule, null, 1) + "\n";
  if (!token()) {
    try {
      await fs.mkdir(path.dirname(localFile()), { recursive: true });
      await fs.writeFile(localFile(), body, "utf-8");
      return { ok: true, schedule };
    } catch (e) {
      return { ok: false, error: `Could not save locally: ${(e as Error).message}` };
    }
  }
  const url = `https://api.github.com/repos/${REPO()}/contents/data/schedule.json`;
  const cur = await fetch(`${url}?ref=${BRANCH()}`, { headers: gh(), cache: "no-store" });
  const sha = cur.ok ? (await cur.json()).sha : undefined;
  if (!cur.ok && cur.status !== 404) {
    return { ok: false, error: `GitHub refused (${cur.status}). Does the token have Contents access to ${REPO()}?` };
  }
  const put = await fetch(url, {
    method: "PUT",
    headers: gh(),
    body: JSON.stringify({
      message: `schedule: ${days.length ? days.join(",") : "paused"} (set from dashboard)`,
      content: Buffer.from(body).toString("base64"),
      branch: BRANCH(),
      ...(sha ? { sha } : {}),
    }),
  });
  if (!put.ok) {
    const t = await put.text();
    const hint = put.status === 404 ? ` The "${BRANCH()}" branch may not exist yet: run the workflow once.` : put.status === 403 || put.status === 401 ? " The token needs Contents: Read and write." : "";
    return { ok: false, error: `GitHub refused to save the schedule (${put.status}).${hint} ${t.slice(0, 120)}` };
  }
  return { ok: true, schedule };
}