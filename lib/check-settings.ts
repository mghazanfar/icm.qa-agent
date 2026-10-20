import { promises as fs } from "fs";
import path from "path";
import { CHECK_ORDER } from "@/lib/types";

export type CheckSettings = { disabled: string[]; updatedAt?: string; updatedBy?: string };
/** The page-load result cannot be switched off: a page that does not open cannot be checked at all. */
export const LOCKED = ["load"];
export const SWITCHABLE = CHECK_ORDER.filter((k) => !LOCKED.includes(k));

const REPO = () => process.env.GITHUB_REPO || "ICMarkets/icm.qa-agent";
const BRANCH = () => process.env.RESULTS_BRANCH || "main";
const token = () => process.env.GITHUB_TOKEN;
const localFile = () => path.join(process.env.DATA_DIR || path.join(process.cwd(), "..", "data"), "checks.json");
const gh = () => ({
  Authorization: `Bearer ${token()}`,
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
});

const clean = (input: unknown): string[] => (Array.isArray(input) ? [...new Set(input.map(String))].filter((k) => SWITCHABLE.includes(k)) : []);

/** Which checks are switched off. Stored as data/checks.json on the results branch; the runner reads it at the start of every run. */
export async function readCheckSettings(): Promise<CheckSettings> {
  try {
    if (token()) {
      const r = await fetch(`https://api.github.com/repos/${REPO()}/contents/data/checks.json?ref=${BRANCH()}`, {
        headers: { ...gh(), Accept: "application/vnd.github.raw+json" },
        cache: "no-store",
      });
      if (!r.ok) return { disabled: [] };
      const j = await r.json();
      return { ...j, disabled: clean(j?.disabled) };
    }
    const j = JSON.parse(await fs.readFile(localFile(), "utf-8"));
    return { ...j, disabled: clean(j?.disabled) };
  } catch {
    return { disabled: [] };
  }
}

/** Switches one check on or off. Reads the current file first so two quick changes do not overwrite each other. */
export async function setCheckEnabled(key: string, enabled: boolean): Promise<{ ok: true; settings: CheckSettings } | { ok: false; error: string }> {
  if (!SWITCHABLE.includes(key)) return { ok: false, error: `The "${key}" check cannot be switched off.` };
  const current = await readCheckSettings();
  const disabled = enabled ? current.disabled.filter((k) => k !== key) : [...new Set([...current.disabled, key])];
  const settings: CheckSettings = { disabled, updatedAt: new Date().toISOString(), updatedBy: "dashboard" };
  const body = JSON.stringify(settings, null, 1) + "\n";
  if (!token()) {
    try {
      await fs.mkdir(path.dirname(localFile()), { recursive: true });
      await fs.writeFile(localFile(), body, "utf-8");
      return { ok: true, settings };
    } catch (e) {
      return { ok: false, error: `Could not save locally: ${(e as Error).message}` };
    }
  }
  const url = `https://api.github.com/repos/${REPO()}/contents/data/checks.json`;
  const cur = await fetch(`${url}?ref=${BRANCH()}`, { headers: gh(), cache: "no-store" });
  const sha = cur.ok ? (await cur.json()).sha : undefined;
  if (!cur.ok && cur.status !== 404) return { ok: false, error: `GitHub refused (${cur.status}). Does the token have Contents access to ${REPO()}?` };
  const put = await fetch(url, {
    method: "PUT",
    headers: gh(),
    body: JSON.stringify({
      message: `checks: ${key} ${enabled ? "on" : "off"} (set from dashboard) [skip ci] [skip netlify]`,
      content: Buffer.from(body).toString("base64"),
      branch: BRANCH(),
      ...(sha ? { sha } : {}),
    }),
  });
  if (!put.ok) {
    const t = await put.text();
    const hint = put.status === 404 ? ` The "${BRANCH()}" branch may not exist yet: run the workflow once.` : put.status === 403 || put.status === 401 ? " The token needs Contents: Read and write." : "";
    return { ok: false, error: `GitHub refused to save the setting (${put.status}).${hint} ${t.slice(0, 120)}` };
  }
  return { ok: true, settings };
}
