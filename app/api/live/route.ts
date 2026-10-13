import { NextResponse } from "next/server";
import { getLiveState } from "@/lib/live";

export const dynamic = "force-dynamic";

// Polled by the live-run banner: is a QA run active right now, and roughly how far along is it?
export async function GET() {
  return NextResponse.json(await getLiveState());
}
