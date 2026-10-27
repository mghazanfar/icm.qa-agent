import { NextRequest, NextResponse } from "next/server";

// Play buttons: dispatch the GitHub Actions workflow for the whole sheet ("all") or a single URL.
export async function POST(req: NextRequest) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return NextResponse.json(
      { ok: false, error: "GITHUB_TOKEN is not configured on this deployment, so runs can't be triggered from here yet." },
      { status: 501 },
    );
  }
  const body = (await req.json().catch(() => ({}))) as { url?: string; all?: boolean; includeFalseFlag?: boolean };
  const target = body.all ? "all" : body.url;
  if (!target || (target !== "all" && !/^https?:\/\//.test(target))) {
    return NextResponse.json({ ok: false, error: "Provide { all: true } or { url }" }, { status: 400 });
  }
  const repo = process.env.GITHUB_REPO || "ICMarkets/icm.qa-agent";
  const wf = process.env.WORKFLOW_FILE || "qa-agent.yml";
  const r = await fetch(`https://api.github.com/repos/${repo}/actions/workflows/${wf}/dispatches`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" },
    body: JSON.stringify({ ref: process.env.WORKFLOW_REF || "main", inputs: { target, dry_run: "false", trigger: "dashboard", include_false_flag: body.includeFalseFlag === false ? "false" : "true" } }),
  });
  if (!r.ok) {
    let hint = "";
    if (r.status === 404 || r.status === 403 || r.status === 401) {
      const h = { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" };
      const repoRes = await fetch(`https://api.github.com/repos/${repo}`, { headers: h });
      if (repoRes.status === 401) hint = " The token is invalid or expired.";
      else if (repoRes.status === 404)
        hint = ` The token cannot see ${repo}: create it with Resource owner = ICMarkets and select this repository (an org owner may need to approve it), and check GITHUB_REPO.`;
      else {
        const wfRes = await fetch(`https://api.github.com/repos/${repo}/actions/workflows/${wf}`, { headers: h });
        hint = wfRes.status === 404
          ? ` The repository is reachable but workflow "${wf}" was not found: check WORKFLOW_FILE.`
          : ` The workflow exists; check that the token has Actions: Read and write and that WORKFLOW_REF ("${process.env.WORKFLOW_REF || "main"}") is a branch that contains it.`;
      }
    }
    return NextResponse.json({ ok: false, error: `GitHub refused the dispatch (${r.status}).${hint}` }, { status: 502 });
  }
  return NextResponse.json({ ok: true, message: target === "all" ? (body.includeFalseFlag === false ? "Full-sheet run queued (without the false-flag check)." : "Full-sheet run queued.") : "Run queued for this URL." });
}
