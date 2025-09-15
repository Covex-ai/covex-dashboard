"use client";

import { LineChart, Line, Tooltip, ResponsiveContainer, XAxis, YAxis } from "recharts";

type Pt = { date: string; count: number };

export default function BookingsLineChart({ data }: { data: Pt[] }) {
  return (
    <div className="rounded-2xl bg-[#0f172a] border border-white/5 p-4">
      <div className="mb-2 text-sm text-slate-400">Bookings by Day (Last 30)</div>
      <div className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="date" hide />
            <YAxis allowDecimals={false} width={30} />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#60a5fa" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}