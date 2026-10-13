import { NextRequest, NextResponse } from "next/server";
import { cleanDays, readSchedule, writeSchedule } from "@/lib/schedule";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await readSchedule());
}

// Body: { days: [1,3,5] }  (ISO weekdays, 1 = Monday ... 7 = Sunday; an empty list pauses the schedule)
export async function PUT(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { days?: unknown };
  const days = cleanDays(body.days);
  if (!days) return NextResponse.json({ ok: false, error: "days must be a list of weekday numbers 1-7" }, { status: 400 });
  const res = await writeSchedule(days);
  return NextResponse.json(res, { status: res.ok ? 200 : 502 });
}
