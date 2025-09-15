"use client";

import { BarChart, Bar, Tooltip, XAxis, YAxis, ResponsiveContainer } from "recharts";

type Pt = { date: string; count: number };

export default function BookingsBarChart({ data }: { data: Pt[] }) {
  return (
    <div className="rounded-2xl bg-[#0f172a] border border-white/5 p-4">
      <div className="mb-2 text-sm text-slate-400">Bookings (Bar)</div>
      <div className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="date" hide />
            <YAxis allowDecimals={false} width={30} />
            <Tooltip />
            <Bar dataKey="count" fill="#93c5fd" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}