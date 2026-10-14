import { NextRequest, NextResponse } from "next/server";
import { authConfigured, COOKIE, verifySession } from "@/lib/auth";

// Sign-in for the whole site (internal tool). The login comes ONLY from environment variables (DASHBOARD_USER / DASHBOARD_PASSWORD);
// if they are not set the site refuses every request. Signed-in browsers carry a signed, HttpOnly cookie.
export async function middleware(req: NextRequest) {
  if (!authConfigured()) {
    return new NextResponse("DASHBOARD_USER and DASHBOARD_PASSWORD are not configured on this deployment.", { status: 503 });
  }
  const { pathname, search } = req.nextUrl;
  if (pathname === "/login" || pathname === "/api/login") return NextResponse.next();
  if (await verifySession(req.cookies.get(COOKIE)?.value)) return NextResponse.next();
  if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  if (pathname !== "/") url.searchParams.set("next", pathname + search);
  return NextResponse.redirect(url);
}

export const config = { matcher: "/((?!_next/static|_next/image|favicon.ico).*)" };
