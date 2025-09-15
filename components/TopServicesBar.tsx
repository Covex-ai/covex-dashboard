"use client";

type Row = { service: string; revenue: number };

export default function TopServicesBar({ data }: { data: Row[] }) {
  const max = Math.max(1, ...data.map((d) => d.revenue));
  return (
    <div className="rounded-2xl bg-[#0f172a] border border-white/5 p-4">
      <div className="mb-2 text-sm text-slate-400">Top Services by Revenue</div>
      <div className="flex flex-col gap-3">
        {data.map((d) => (
          <div key={d.service}>
            <div className="mb-1 text-xs text-slate-400 flex justify-between">
              <span>{d.service}</span>
              <span>${d.revenue.toLocaleString()}</span>
            </div>
            <div className="h-2 w-full rounded bg-white/10">
              <div
                className="h-2 rounded bg-blue-400"
                style={{ width: `${(d.revenue / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}