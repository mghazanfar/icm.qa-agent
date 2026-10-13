import { promises as fs } from "fs";
import path from "path";
import type { Run, RunSummary } from "./types";

const REPO = process.env.GITHUB_REPO || "ICMarkets/icm.qa-agent";
const BRANCH = process.env.RESULTS_BRANCH || "main";
const token = () => process.env.GITHUB_TOKEN;
const localDir = () => process.env.DATA_DIR || path.join(process.cwd(), "..", "data");

async function readJson<T>(rel: string): Promise<T | null> {
  try {
    if (token()) {
      const r = await fetch(`https://api.github.com/repos/${REPO}/contents/data/${rel}?ref=${BRANCH}`, {
        headers: { Authorization: `Bearer ${token()}`, Accept: "application/vnd.github.raw+json", "X-GitHub-Api-Version": "2022-11-28" },
        next: { revalidate: 60 },
      });
      if (!r.ok) return null;
      return (await r.json()) as T;
    }
    return JSON.parse(await fs.readFile(path.join(localDir(), rel), "utf-8")) as T;
  } catch {
    return null;
  }
}

export async function getIndex(): Promise<RunSummary[]> {
  const idx = await readJson<{ runs: RunSummary[] }>("index.json");
  return (idx?.runs ?? []).slice().sort((a, b) => a.id.localeCompare(b.id));
}

export const getRun = (id: string) => readJson<Run>(`runs/${id}.json`);

/** Latest run that covered the whole sheet (mode "all"), falling back to the latest run of any mode. */
export async function getLatestFull(index: RunSummary[]): Promise<Run | null> {
  const full = [...index].reverse().find((r) => r.mode === "all") ?? index[index.length - 1];
  return full ? getRun(full.id) : null;
}

export async function getRuns(ids: string[]): Promise<Run[]> {
  return (await Promise.all(ids.map(getRun))).filter((r): r is Run => !!r);
}


/** When a GitHub token is set but nothing loads, say why (instead of a silent "No data yet"). */
export async function checkSource(): Promise<{ ok: boolean; message?: string }> {
  if (!token()) return { ok: true };
  const h = { Authorization: `Bearer ${token()}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" };
  try {
    const repo = await fetch(`https://api.github.com/repos/${REPO}`, { headers: h, cache: "no-store" });
    if (repo.status === 401) return { ok: false, message: "GitHub rejected the token (401): it is invalid or expired." };
    if (repo.status === 404)
      return { ok: false, message: `The token cannot see ${REPO} (404). Create the token with Resource owner = ICMarkets and select this repository; if the organisation requires approval for fine-grained tokens, an owner must approve it. Also check GITHUB_REPO.` };
    const file = await fetch(`https://api.github.com/repos/${REPO}/contents/data/index.json?ref=${BRANCH}`, { headers: h, cache: "no-store" });
    if (file.status === 404) return { ok: false, message: `The repository is reachable, but there is no data/index.json on the "${BRANCH}" branch yet. Run the workflow once, or check RESULTS_BRANCH.` };
    if (file.status === 403) return { ok: false, message: "The token needs Contents: Read (and write, to save the schedule)." };
    return file.ok ? { ok: true } : { ok: false, message: `GitHub answered ${file.status} when reading the results.` };
  } catch {
    return { ok: false, message: "Could not reach GitHub from the server." };
  }
}
