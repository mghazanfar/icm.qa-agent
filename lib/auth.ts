// Session cookie helpers. Works in the Edge middleware and in route handlers (Web Crypto only).
// No password is stored in code: the login comes from DASHBOARD_USER / DASHBOARD_PASSWORD (environment variables).
// The cookie is signed with a key derived from those values (plus the optional SESSION_SECRET), so changing the
// password signs everybody out.
export const COOKIE = "icqa_session";
export const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

const enc = new TextEncoder();
const secret = () => `${process.env.SESSION_SECRET || ""}|${process.env.DASHBOARD_PASSWORD || ""}|${process.env.DASHBOARD_USER || ""}`;

async function hmac(msg: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(msg));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function same(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

export const authConfigured = () => !!(process.env.DASHBOARD_USER && process.env.DASHBOARD_PASSWORD);

export async function makeSession(): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE;
  return `${exp}.${await hmac("session|" + exp)}`;
}

export async function verifySession(value?: string): Promise<boolean> {
  if (!value || !authConfigured()) return false;
  const [exp, sig] = value.split(".");
  const e = Number(exp);
  if (!Number.isFinite(e) || !sig || e < Date.now() / 1000) return false;
  return same(sig, await hmac("session|" + e));
}

/** Compares the submitted login with the configured one without leaking where they differ. */
export async function checkLogin(user: string, pass: string): Promise<boolean> {
  if (!authConfigured()) return false;
  const a = await hmac(`u|${user}|p|${pass}`);
  const b = await hmac(`u|${process.env.DASHBOARD_USER}|p|${process.env.DASHBOARD_PASSWORD}`);
  return same(a, b);
}

/** Only allow redirects to a path on this site. */
export function safeNext(next: string | null | undefined): string {
  const n = next || "/";
  return n.startsWith("/") && !n.startsWith("//") && !n.startsWith("/\\") ? n : "/";
}
