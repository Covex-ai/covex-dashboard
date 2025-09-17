"use client";

import { useEffect, useMemo, useState } from "react";
import { addDays, format, isAfter, parseISO, startOfDay, subDays } from "date-fns";
import { createBrowserSupabaseClient } from "../../lib/supabaseBrowser";

type Appt = {
  business_id: string;
  booking_id: string | null;
  source: string | null;
  status: "Booked" | "Rescheduled" | "Cancelled" | "Inquiry";
  caller_name: string | null;
  caller_phone_e164: string | null;
  service_raw: string | null;
  normalized_service: string | null;
  start_ts: string; // ISO
  end_ts: string | null;
  received_date: string | null;
  price_usd: number | null;
};

type RangeKey = "7" | "30" | "90" | "future";

function phoneFmt(p?: string | null) {
  if (!p) return "";
  // quick pretty: +15551234567 -> (555) 123-4567
  const m = p.replace(/[^\d]/g, "").match(/^1?(\d{3})(\d{3})(\d{4})$/);
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : p;
}

// Resolve business like on dashboard (URL ?biz=… overrides profiles row)
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

export default function AppointmentsPage() {
  const sb = useMemo(() => createBrowserSupabaseClient(), []);
  const [rows, setRows] = useState<Appt[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<RangeKey>("30");
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const biz = await resolveBusinessId(sb);
      if (!biz) {
        setRows([]);
        setLoading(false);
        return;
      }

      let fromISO: string | undefined;
      let toISO: string | undefined;

      if (range === "future") {
        fromISO = new Date().toISOString();
      } else {
        const days = parseInt(range, 10);
        fromISO = subDays(new Date(), days).toISOString();
        toISO = addDays(new Date(), 1).toISOString();
      }

      let query = sb
        .from("appointments")
        .select(
          "business_id, booking_id, source, status, caller_name, caller_phone_e164, service_raw, normalized_service, start_ts, end_ts, received_date, price_usd"
        )
        .eq("business_id", biz)
        .order("start_ts", { ascending: true });

      if (fromISO) query = query.gte("start_ts", fromISO);
      if (toISO) query = query.lte("start_ts", toISO);

      const { data, error } = await query;
      if (error) {
        console.error(error);
        setRows([]);
      } else {
        setRows((data || []) as Appt[]);
      }
      setLoading(false);
    })();
  }, [sb, range]);

  const filtered = rows.filter((r) => {
    if (!q) return true;
    const hay =
      `${r.caller_name ?? ""} ${r.caller_phone_e164 ?? ""} ${r.normalized_service ?? ""} ${
        r.service_raw ?? ""
      } ${r.source ?? ""}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Appointments</h1>
        <div className="flex items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name/phone/service…"
            className="bg-[#121a21] border border-white/10 rounded px-3 py-2 text-sm outline-none"
          />
          <select
            value={range}
            onChange={(e) => setRange(e.target.value as RangeKey)}
            className="bg-[#121a21] border border-white/10 rounded px-3 py-2 text-sm outline-none"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="future">All future</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded border border-white/10">
        <table className="min-w-full text-sm">
          <thead className="bg-[#0f151a] text-slate-300">
            <tr>
              <th className="px-3 py-2 text-left">Date</th>
              <th className="px-3 py-2 text-left">Time</th>
              <th className="px-3 py-2 text-left">Service</th>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Phone</th>
              <th className="px-3 py-2 text-left">Source</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-right">Price</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && !loading && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-slate-400">
                  No appointments found for this range.
                </td>
              </tr>
            )}
            {filtered.map((r, idx) => {
              const d = parseISO(r.start_ts);
              return (
                <tr key={`${r.booking_id ?? r.start_ts}-${idx}`} className="odd:bg-[#0c1217]">
                  <td className="px-3 py-2">{format(d, "PP")}</td>
                  <td className="px-3 py-2">{format(d, "p")}</td>
                  <td className="px-3 py-2">{r.normalized_service ?? r.service_raw ?? "—"}</td>
                  <td className="px-3 py-2">{r.caller_name ?? "—"}</td>
                  <td className="px-3 py-2">{phoneFmt(r.caller_phone_e164)}</td>
                  <td className="px-3 py-2">{r.source ?? "—"}</td>
                  <td className="px-3 py-2">{r.status}</td>
                  <td className="px-3 py-2 text-right">
                    {typeof r.price_usd === "number" ? `$${r.price_usd.toFixed(2)}` : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {loading && <div className="text-sm text-slate-400">Loading…</div>}
    </div>
  );
}
