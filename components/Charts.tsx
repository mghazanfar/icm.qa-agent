"use client";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

const C = { pass: "#0A8F1E", glow: "#3AE63A", fail: "#D64545", warn: "#D9892B", grid: "#dfe7e1", axis: "#4b5a50", dark: "#002900" };
const box = { height: 260 };
const tick = { fontSize: 12, fill: C.axis };
const tip = { contentStyle: { borderRadius: 10, border: "1px solid #dfe7e1", boxShadow: "0 6px 20px rgba(0,26,2,.12)", fontSize: 13 }, cursor: { fill: "rgba(58,230,58,.08)" } };
const whenLabel = (_: unknown, p: readonly { payload?: { when?: string } }[]) => p?.[0]?.payload?.when ?? "";
const pointer = { cursor: "pointer" } as const;

type PointState = { activePayload?: { payload?: { id?: string } }[] };
const pickRun = (cb?: (id: string) => void) => (s: PointState) => {
  const id = s?.activePayload?.[0]?.payload?.id;
  if (id && cb) cb(id);
};

/** Click a point to open that run. */
export function TrendChart({ data, onRun }: { data: { id: string; date: string; when: string; passRate: number; failed: number }[]; onRun?: (id: string) => void }) {
  return (
    <div style={{ ...box, ...pointer }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ left: -10, right: 10, top: 5 }} onClick={pickRun(onRun)}>
          <defs>
            <linearGradient id="gPass" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C.glow} stopOpacity={0.55} /><stop offset="100%" stopColor={C.glow} stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={C.grid} vertical={false} />
          <XAxis dataKey="date" tick={tick} tickLine={false} /><YAxis domain={[0, 100]} unit="%" tick={tick} tickLine={false} axisLine={false} />
          <Tooltip {...tip} labelFormatter={whenLabel} />
          <Area type="monotone" dataKey="passRate" name="Pass rate %" stroke={C.pass} strokeWidth={2.5} fill="url(#gPass)" dot={{ r: 3, fill: C.pass }} activeDot={{ r: 6 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Click a bar to list the LPs failing that check. `key` is the check key. */
export function FailsByCheck({ data, onSelect }: { data: { key: string; name: string; fails: number }[]; onSelect?: (key: string) => void }) {
  return (
    <div style={box}>
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 16 }}>
          <CartesianGrid stroke={C.grid} horizontal={false} />
          <XAxis type="number" tick={tick} allowDecimals={false} tickLine={false} /><YAxis type="category" dataKey="name" tick={tick} width={110} tickLine={false} axisLine={false} />
          <Tooltip {...tip} />
          <Bar dataKey="fails" name="Failing LPs" fill={C.fail} radius={[0, 5, 5, 0]} style={pointer} onClick={(d: { key?: string; payload?: { key?: string } }) => { const k = d?.payload?.key ?? d?.key; if (k && onSelect) onSelect(k); }} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Click either part of a bar to list every LP of that group, with its result. */
export function PassFailBars({ data, onSelect }: { data: { name: string; passed: number; failed: number }[]; onSelect?: (name: string) => void }) {
  const click = (d: { name?: string; payload?: { name?: string } }) => { const n = d?.payload?.name ?? d?.name; if (n && onSelect) onSelect(n); };
  return (
    <div style={box}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ left: -10, right: 10 }}>
          <CartesianGrid stroke={C.grid} vertical={false} />
          <XAxis dataKey="name" tick={tick} tickLine={false} /><YAxis tick={tick} allowDecimals={false} tickLine={false} axisLine={false} />
          <Tooltip {...tip} /><Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="passed" name="Passed" stackId="a" fill={C.pass} style={pointer} onClick={click} />
          <Bar dataKey="failed" name="Failed" stackId="a" fill={C.fail} radius={[5, 5, 0, 0]} style={pointer} onClick={click} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Click a point to open that run. */
export function LcpTrend({ data, onRun }: { data: { id: string; date: string; when: string; lcp: number | null }[]; onRun?: (id: string) => void }) {
  return (
    <div style={{ ...box, ...pointer }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ left: -10, right: 10, top: 5 }} onClick={pickRun(onRun)}>
          <CartesianGrid stroke={C.grid} vertical={false} />
          <XAxis dataKey="date" tick={tick} tickLine={false} /><YAxis unit="s" tick={tick} tickLine={false} axisLine={false} domain={[0, (m: number) => Math.max(3, Math.ceil(m))]} />
          <Tooltip {...tip} labelFormatter={whenLabel} />
          <ReferenceLine y={2.5} stroke={C.warn} strokeDasharray="5 4" label={{ value: "2.5s limit", fill: "#8a5200", fontSize: 11, position: "insideTopRight" }} />
          <Line type="monotone" dataKey="lcp" name="Median LCP (s)" stroke={C.dark} strokeWidth={2.5} dot={{ r: 3.5, fill: C.glow, stroke: C.dark, strokeWidth: 1.5 }} activeDot={{ r: 6 }} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
