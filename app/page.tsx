"use client";

import { useEffect, useMemo, useState } from "react";
import { startOfDay, subDays, format, addDays, isAfter } from "date-fns";
import StatCard from "../components/StatCard";
import BookingsLineChart from "../components/BookingsLineChart";
import BookingsBarChart from "../components/BookingsBarChart";
import TopServicesBar from "../components/TopServicesBar";
import UpcomingTable from "../components/UpcomingTable";
import { createBrowserSupabaseClient } from "../lib/supabaseBrowser";

type Appt = {
  business_id: string;
  booking_id: string | null;
  source: string | null;
  status: "Booked" | "Rescheduled" | "Cancelled" | "Inquiry";
  caller_name: string | null;
  caller_phone_e164: string | null;
  service_raw: string | null;
  normalized_service: string | null;
  start_ts: string;
  end_ts: string | null;
  received_date: string | null;
  price_usd: number | null;
};

// ---- Helper: resolve the business_id (URL ?biz=... first, then profiles row) ----
async function resolveBusinessId(
  sb: ReturnType<typeof createBrowserSupabaseClient>,
  userId: string
): Promise<string | null> {
  // 1) URL override wins
  const urlBiz = new URL(window.location.href).searchParams.get("biz");
  if (urlBiz) return urlBiz;

  // 2) profiles row (RLS must allow)
  const { data, error } = await sb
    .from("profiles")
    .select("business_id")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch profiles.business_id:", error);
    return null;
  }
  return data?.business_id ?? null;
}

export default function DashboardPage() {
  const sb = useMemo(() => createBrowserSupabaseClient(), []);
  const [rows, setRows] = useState<Appt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);

      // ----- Require a valid session; otherwise send to /login (preserving ?biz) -----
      const {
        data: { session },
        error: sessionErr,
      } = await sb.auth.getSession();

      if (sessionErr) {
        console.error("getSession error:", sessionErr);
      }

      if (!session) {
        const urlBiz = new URL(window.location.href).searchParams.get("biz");
        const to = urlBiz ? `/login?biz=${urlBiz}` : "/login";
        window.location.href = to;
        return; // stop here; user will be redirected
      }

      // ----- Find business id (URL first, then profiles row) -----
      const biz = await resolveBusinessId(sb, session.user.id);

      if (!biz) {
        // No business tied to this user and no ?biz override.
        setRows([]);
        setLoading(false);
        return;
      }

      // ----- Query appointments for last 60 days through next 7 days -----
      const from = subDays(new Date(), 60).toISOString();
      const to = addDays(new Date(), 7).toISOString();

      const { data, error } = await sb
        .from("appointments")
        .select(
          "business_id, booking_id, source, status, caller_name, caller_phone_e164, service_raw, normalized_service, start_ts, end_ts, received_date, price_usd"
        )
        .eq("business_id", biz)
        .gte("start_ts", from)
        .lte("start_ts", to)
        .order("start_ts", { ascending: true });

      if (error) {
        console.error(error);
        setRows([]);
      } else {
        setRows((data || []) as Appt[]);
      }
      setLoading(false);
    })();
  }, [sb]);

  // ---------- KPI calculations ----------
  const today = startOfDay(new Date());
  const last7 = subDays(today, 7);
  const last30 = subDays(today, 30);

  const active = rows.filter((r) => r.status !== "Cancelled");

  const appts7 = active.filter((r) => new Date(r.start_ts) >= last7).length;
  const bookings7 = active.filter((r) => r.booking_id && new Date(r.start_ts) >= last7).length;
  const resched7 = active.filter((r) => r.status === "Rescheduled" && new Date(r.start_ts) >= last7)
    .length;
  const revenue7 = active
    .filter((r) => new Date(r.start_ts) >= last7)
    .reduce((acc, r) => acc + (r.price_usd || 0), 0);

  // Deltas (compare to prior 7 days)
  const prev7 = subDays(last7, 7);
  const apptsPrev7 = active.filter(
    (r) => new Date(r.start_ts) >= prev7 && new Date(r.start_ts) < last7
  ).length;
  const bookingsPrev7 = active.filter(
    (r) => r.booking_id && new Date(r.start_ts) >= prev7 && new Date(r.start_ts) < last7
  ).length;
  const reschedPrev7 = active.filter(
    (r) => r.status === "Rescheduled" && new Date(r.start_ts) >= prev7 && new Date(r.start_ts) < last7
  ).length;
  const revenuePrev7 = active
    .filter((r) => new Date(r.start_ts) >= prev7 && new Date(r.start_ts) < last7)
    .reduce((acc, r) => acc + (r.price_usd || 0), 0);

  // Bookings by day (last 30)
  const days: { date: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = subDays(today, i);
    const count = active.filter(
      (r) => startOfDay(new Date(r.start_ts)).getTime() === d.getTime()
    ).length;
    days.push({ date: format(d, "yyyy-MM-dd"), count });
  }

  // Top services by revenue (last 30)
  const byService = new Map<string, number>();
  active
    .filter((r) => new Date(r.start_ts) >= last30)
    .forEach((r) => {
      const key = r.normalized_service ?? r.service_raw ?? "Unknown";
      byService.set(key, (byService.get(key) || 0) + (r.price_usd || 0));
    });
  const topServices = Array.from(byService.entries())
    .map(([service, revenue]) => ({ service, revenue: Math.round(revenue) }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Upcoming (next 7 days, not cancelled)
  const upcoming = active
    .filter((r) => isAfter(new Date(r.start_ts), today))
    .filter((r) => new Date(r.start_ts) <= addDays(today, 7))
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Analytics & Performance</h1>
        <div className="text-xs text-slate-400">Updated {format(new Date(), "PP, p")}</div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard title="Appointments" value={appts7} delta={appts7 - apptsPrev7} />
        <StatCard title="Bookings" value={bookings7} delta={bookings7 - bookingsPrev7} />
        <StatCard title="Reschedules" value={resched7} delta={resched7 - reschedPrev7} />
        <StatCard
          title="Est. Revenue"
          value={`$${revenue7.toLocaleString()}`}
          delta={Math.round(revenue7 - revenuePrev7)}
          subtitle="last 7 days"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BookingsLineChart data={days} />
        <BookingsBarChart data={days} />
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TopServicesBar data={topServices} />
        <UpcomingTable rows={upcoming} />
      </div>

      {loading && <div className="text-sm text-slate-400">Loading…</div>}
    </div>
  );
}