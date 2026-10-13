import { NextRequest, NextResponse } from "next/server";

// HTTP basic auth for the whole site (internal tool). The login comes ONLY from environment variables:
// no username or password is stored in the code. If they are not set, the site refuses every request.
export function middleware(req: NextRequest) {
  const user = process.env.DASHBOARD_USER;
  const pass = process.env.DASHBOARD_PASSWORD;
  if (!user || !pass) {
    return new NextResponse("DASHBOARD_USER and DASHBOARD_PASSWORD are not configured on this deployment.", { status: 503 });
  }
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
