"use client";

import { useEffect, useMemo, useState } from "react";
import { subDays } from "date-fns";
import { createBrowserSupabaseClient } from "../../../lib/supabaseBrowser";

type Appt = {
  business_id: string;
  status: "Booked" | "Rescheduled" | "Cancelled" | "Inquiry";
  normalized_service: string | null;
  service_raw: string | null;
  price_usd: number | null;
  start_ts: string;
};

type Row = {
  service: string;
  count: number;
  revenue: number;
};

async function resolveBusinessId(sb: ReturnType<typeof createBrowserSupabaseClient>) {
  const urlBiz = new URL(window.location.href).searchParams.get("biz");
  if (urlBiz) return urlBiz;

  const { data: userData } = await sb.auth.getUser();
  if (!userData?.user) return null;

  const { data, error } = await sb
    .from("profiles")
    .select("business_id")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (error) {
    console.error("profiles.business_id fetch error:", error);
    return null;
  }
  return data?.business_id ?? null;
}

export default function ServicesPage() {
  const sb = useMemo(() => createBrowserSupabaseClient(), []);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const biz = await resolveBusinessId(sb);
      if (!biz) {
        setRows([]);
        setLoading(false);
        return;
      }

      const from = subDays(new Date(), days).toISOString();

      const { data, error } = await sb
        .from("appointments")
        .select("business_id,status,normalized_service,service_raw,price_usd,start_ts")
        .eq("business_id", biz)
        .gte("start_ts", from);

      if (error) {
        console.error(error);
        setRows([]);
        setLoading(false);
        return;
      }

      const map = new Map<string, { count: number; revenue: number }>();
      (data as Appt[]).forEach((r) => {
        if (r.status === "Cancelled") return;
        const key = r.normalized_service ?? r.service_raw ?? "Unknown";
        const item = map.get(key) ?? { count: 0, revenue: 0 };
        item.count += 1;
        item.revenue += r.price_usd || 0;
        map.set(key, item);
      });

      const out: Row[] = Array.from(map.entries())
        .map(([service, v]) => ({
          service,
          count: v.count,
          revenue: Math.round(v.revenue),
        }))
        .sort((a, b) => b.revenue - a.revenue);

      setRows(out);
      setLoading(false);
    })();
  }, [sb, days]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Services</h1>
        <select
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value, 10))}
          className="bg-[#121a21] border border-white/10 rounded px-3 py-2 text-sm outline-none"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded border border-white/10">
        <table className="min-w-full text-sm">
          <thead className="bg-[#0f151a] text-slate-300">
            <tr>
              <th className="px-3 py-2 text-left">Service</th>
              <th className="px-3 py-2 text-right">Bookings</th>
              <th className="px-3 py-2 text-right">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && !loading && (
              <tr>
                <td colSpan={3} className="px-3 py-8 text-center text-slate-400">
                  No data for this window.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.service} className="odd:bg-[#0c1217]">
                <td className="px-3 py-2">{r.service}</td>
                <td className="px-3 py-2 text-right">{r.count}</td>
                <td className="px-3 py-2 text-right">${r.revenue.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {loading && <div className="text-sm text-slate-400">Loading…</div>}
    </div>
  );
}
