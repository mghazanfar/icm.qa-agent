import { NextResponse } from "next/server";
import { checkSource } from "@/lib/data";

export const dynamic = "force-dynamic";

// Open /api/health (after login) to see what this deployment can see. Only true/false for secrets, never their values.
export async function GET() {
  const has = (k: string) => Boolean(process.env[k]);
  const src = await checkSource();
  return NextResponse.json({
    mode: process.env.GITHUB_TOKEN ? "reads results from GitHub" : "NO GITHUB_TOKEN: looks for local files only (none exist on Netlify)",
    envPresent: {
      GITHUB_TOKEN: has("GITHUB_TOKEN"), GITHUB_REPO: has("GITHUB_REPO"), RESULTS_BRANCH: has("RESULTS_BRANCH"),
      WORKFLOW_FILE: has("WORKFLOW_FILE"), WORKFLOW_REF: has("WORKFLOW_REF"), DASHBOARD_USER: has("DASHBOARD_USER"),
      DASHBOARD_PASSWORD: has("DASHBOARD_PASSWORD"),
    },
    using: {
      repo: process.env.GITHUB_REPO || "ICMarkets/icm.qa-agent (default)",
      branch: process.env.RESULTS_BRANCH || "main (default)",
      workflowFile: process.env.WORKFLOW_FILE || "qa-agent.yml (default)",
      workflowRef: process.env.WORKFLOW_REF || "main (default)",
    },
    githubCheck: src,
  });
}
