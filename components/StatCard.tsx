"use client";

type Props = {
  title: string;
  value: string | number;
  delta?: number; // positive/negative change indicator
  subtitle?: string;
};

export default function StatCard({ title, value, delta, subtitle }: Props) {
  const up = typeof delta === "number" && delta > 0;
  const down = typeof delta === "number" && delta < 0;
  return (
    <div className="rounded-2xl bg-[#0f172a] border border-white/5 p-4">
      <div className="text-sm text-slate-400">{title}</div>
      <div className="mt-1 text-3xl font-semibold">{value}</div>
      <div className="mt-1 text-xs text-slate-400">
        {up && <span className="text-emerald-400">▲ {Math.abs(delta)}</span>}
        {down && <span className="text-rose-400">▼ {Math.abs(delta)}</span>}
        {subtitle ? <span className="ml-2">{subtitle}</span> : null}
      </div>
    </div>
  );
}