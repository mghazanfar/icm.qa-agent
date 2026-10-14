import { NextRequest, NextResponse } from "next/server";
import { checkLogin, COOKIE, MAX_AGE, makeSession, safeNext } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const user = String(form.get("username") || "").trim();
  const pass = String(form.get("password") || "");
  const next = safeNext(String(form.get("next") || "/"));
  if (!(await checkLogin(user, pass))) {
    await new Promise((r) => setTimeout(r, 700)); // slows down password guessing
    const back = new URL("/login", req.url);
    back.searchParams.set("error", "1");
    if (next !== "/") back.searchParams.set("next", next);
    return NextResponse.redirect(back, 303);
  }
  const res = NextResponse.redirect(new URL(next, req.url), 303);
  res.cookies.set(COOKIE, await makeSession(), {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: MAX_AGE,
  });
  return res;
}
