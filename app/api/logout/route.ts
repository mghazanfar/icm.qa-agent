import { NextRequest, NextResponse } from "next/server";
import { COOKIE } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const res = NextResponse.redirect(new URL("/login", req.url), 303);
  res.cookies.set(COOKIE, "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 });
  return res;
}
