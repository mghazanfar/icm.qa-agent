import { NextRequest, NextResponse } from "next/server";
import { readCheckSettings, setCheckEnabled } from "@/lib/check-settings";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await readCheckSettings());
}

// Body: { key: "redirect", enabled: false }. The next run, scheduled or manual, skips every check that is switched off.
export async function PUT(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { key?: unknown; enabled?: unknown };
  if (typeof body.key !== "string" || typeof body.enabled !== "boolean") {
    return NextResponse.json({ ok: false, error: "Send { key: string, enabled: boolean }." }, { status: 400 });
  }
  const res = await setCheckEnabled(body.key, body.enabled);
  return NextResponse.json(res, { status: res.ok ? 200 : 502 });
}
