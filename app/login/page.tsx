import { LOGO_URL } from "@/lib/config";
import { safeNext } from "@/lib/auth";
import LoginForm from "@/components/LoginForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sign in · LP QA Dashboard" };

const css = `
.lg-wrap { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px 16px; gap: 22px;
  background: radial-gradient(900px 420px at 85% -10%, rgba(58,230,58,.22), transparent 60%), linear-gradient(130deg, var(--green-dark), var(--green-dark2)); }
.lg-brand { display: flex; align-items: center; gap: 12px; }
.lg-brand img { height: 38px; width: auto; display: block; }
.lg-tag { font-weight: 700; font-size: 11px; letter-spacing: .14em; color: var(--glow); border: 1px solid rgba(58,230,58,.5); padding: 3px 9px; border-radius: 99px; }
.lg-card { width: 100%; max-width: 400px; background: #fff; border-radius: 18px; padding: 30px 28px 26px; box-shadow: 0 20px 60px rgba(0,26,2,.45); }
.lg-card h1 { font-size: 22px; margin: 0 0 4px; }
.lg-card p.sub { margin: 0 0 20px; color: var(--muted); }
.lg-card label { display: block; font-weight: 600; font-size: 13px; margin: 14px 0 6px; }
.lg-card input { width: 100%; padding: 11px 12px; border: 1px solid #cfdad1; border-radius: 10px; font: inherit; background: #fbfdfb; }
.lg-card input:focus { outline: 3px solid var(--glow); outline-offset: 1px; border-color: var(--green); }
.lg-btn { margin-top: 22px; width: 100%; padding: 12px; border: 0; border-radius: 10px; font: inherit; font-weight: 700; cursor: pointer; background: var(--glow); color: var(--green-dark); }
.lg-btn:hover { background: #5cf05c; }
.lg-btn:disabled { cursor: progress; opacity: .85; background: #5cf05c; }
.lg-btn { display: flex; align-items: center; justify-content: center; gap: 9px; }
.lg-spin { width: 16px; height: 16px; border-radius: 50%; border: 2.5px solid rgba(0,26,2,.25); border-top-color: var(--green-dark); animation: lgspin .7s linear infinite; }
@keyframes lgspin { to { transform: rotate(360deg); } }
.lg-err { background: #fdecec; border: 1px solid #f3b9b9; color: var(--fail-text); padding: 10px 12px; border-radius: 10px; margin-bottom: 4px; font-weight: 600; }
.lg-foot { color: rgba(255,255,255,.65); font-size: 12px; text-align: center; }
`;

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const sp = await searchParams;
  const next = safeNext(sp.next);
  return (
    <div className="lg-wrap">
      <style>{css}</style>
      <div className="lg-brand">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={LOGO_URL} alt="IC" />
        <span className="lg-tag">LP QA</span>
      </div>
      <LoginForm next={next} error={!!sp.error} />
      <div className="lg-foot">IC · internal tool</div>
    </div>
  );
}
