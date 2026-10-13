import { NextRequest, NextResponse } from "next/server";

// HTTP basic auth for the whole site (internal tool). Credentials come from env; defaults match the agreed login.
export function middleware(req: NextRequest) {
  const user = process.env.DASHBOARD_USER || "admin";
  const pass = process.env.DASHBOARD_PASSWORD || "root123";
  const header = req.headers.get("authorization") || "";
  if (header.startsWith("Basic ")) {
    const [u, ...rest] = atob(header.slice(6)).split(":");
    if (u === user && rest.join(":") === pass) return NextResponse.next();
  }
  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="IC LP QA dashboard"' },
  });
}

export const config = { matcher: "/((?!_next/static|_next/image|favicon.ico).*)" };
