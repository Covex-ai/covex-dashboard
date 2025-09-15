// lib/queries.ts
"use client";

import { supabase } from "./supabaseBrowser";
import {
  addDays, subDays, startOfDay, endOfDay, format, isValid, parseISO,
} from "date-fns";

export type PeriodKey = "Today" | "Last 7 days" | "Last 30 days" | "This month";

export function computePeriod(period: PeriodKey) {
  const now = new Date();
  let start = startOfDay(now);
  let end = endOfDay(now);

  if (period === "Last 7 days") {
    start = startOfDay(subDays(now, 6));
  } else if (period === "Last 30 days") {
    start = startOfDay(subDays(now, 29));
  } else if (period === "This month") {
    start = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
  }
  // we’ll query with [gte start, lt endPlusOneDay] to be inclusive
  const endLt = addDays(end, 1);
  const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1);
  return { start, end, endLt, days };
}

export async function getBusinessId(): Promise<string | null> {
  const { data: session } = await supabase.auth.getSession();
  const uid = session.session?.user?.id;
  if (!uid) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("business_id")
    .eq("id", uid)
    .single();

  if (error) return null;
  return data?.business_id ?? null;
}

type Row = {
  id: string;
  business_id: string;
  status: "Booked" | "Rescheduled" | "Cancelled" | string;
  price_usd: number | null;
  service_raw: string | null;
  normalized_service: string | null;
  caller_name: string | null;
  caller_phone_e164: string | null;
  start_ts: string; // ISO
  end_ts: string;   // ISO
  timezone: string | null;
  source: string | null;
};

function inRange(rows: Row[], start: Date, endLt: Date) {
  const s = start.getTime();
  const e = endLt.getTime();
  return rows.filter(r => {
    const t = parseISO(r.start_ts).getTime();
    return t >= s && t < e;
  });
}

function excludeCancelled(rows: Row[]) {
  return rows.filter(r => r.status !== "Cancelled");
}

export async function getRowsInPeriod(businessId: string, start: Date, endLt: Date) {
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("business_id", businessId)
    .gte("start_ts", start.toISOString())
    .lt("start_ts", endLt.toISOString())
    .order("start_ts", { ascending: true });

  if (error || !data) return [];
  return data as Row[];
}

export async function getAllForLastNDays(businessId: string, n: number) {
  const end = endOfDay(new Date());
  const endLt = addDays(end, 1);
  const start = startOfDay(subDays(end, n - 1));
  return getRowsInPeriod(businessId, start, endLt);
}

export async function getKpis(businessId: string, start: Date, endLt: Date) {
  const rows = await getRowsInPeriod(businessId, start, endLt);
  const active = excludeCancelled(rows);
  const appointmentsActive = active.length;
  const bookings = active.filter(r => r.status === "Booked").length;
  const reschedules = active.filter(r => r.status === "Rescheduled").length;
  const estRevenue = active.reduce((s, r) => s + (Number(r.price_usd) || 0), 0);

  // prior window
  const windowDays = Math.max(1, Math.ceil((endLt.getTime() - start.getTime()) / 86400000));
  const prevStart = subDays(start, windowDays);
  const prevEndLt = subDays(endLt, windowDays);
  const prevRows = await getRowsInPeriod(businessId, prevStart, prevEndLt);
  const prevActive = excludeCancelled(prevRows);
  const prev = {
    appointmentsActive: prevActive.length,
    bookings: prevActive.filter(r => r.status === "Booked").length,
    reschedules: prevActive.filter(r => r.status === "Rescheduled").length,
    estRevenue: prevActive.reduce((s, r) => s + (Number(r.price_usd) || 0), 0),
  };

  return {
    current: { appointmentsActive, bookings, reschedules, estRevenue },
    delta: {
      appointmentsActive: appointmentsActive - prev.appointmentsActive,
      bookings: bookings - prev.bookings,
      reschedules: reschedules - prev.reschedules,
      estRevenue: estRevenue - prev.estRevenue,
    },
  };
}

export async function getBookingsByDay(businessId: string, lastNDays = 30) {
  const rows = await getAllForLastNDays(businessId, lastNDays);
  const active = excludeCancelled(rows);
  const map = new Map<string, number>();
  for (let i = 0; i < lastNDays; i++) {
    const d = format(subDays(new Date(), lastNDays - 1 - i), "yyyy-MM-dd");
    map.set(d, 0);
  }
  active.forEach(r => {
    const d = format(parseISO(r.start_ts), "yyyy-MM-dd");
    if (map.has(d)) map.set(d, (map.get(d) || 0) + 1);
  });
  return Array.from(map.entries()).map(([date, bookings]) => ({ date, bookings }));
}

export async function getTopServicesByRevenue(businessId: string, start: Date, endLt: Date) {
  const rows = excludeCancelled(await getRowsInPeriod(businessId, start, endLt));
  const totals = new Map<string, number>();
  for (const r of rows) {
    const key = (r.normalized_service || r.service_raw || "Unknown").trim();
    totals.set(key, (totals.get(key) || 0) + (Number(r.price_usd) || 0));
  }
  return Array.from(totals.entries())
    .map(([service, revenue]) => ({ service, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6);
}

export async function getTopServicesByCount(businessId: string, start: Date, endLt: Date) {
  const rows = excludeCancelled(await getRowsInPeriod(businessId, start, endLt));
  const counts = new Map<string, number>();
  for (const r of rows) {
    const key = (r.normalized_service || r.service_raw || "Unknown").trim();
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([service, count]) => ({ service, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

export async function getUpcoming14(businessId: string) {
  const now = new Date();
  const endLt = addDays(now, 14);
  const { data, error } = await supabase
    .from("appointments")
    .select("start_ts,end_ts,normalized_service,service_raw,caller_name,caller_phone_e164,status")
    .eq("business_id", businessId)
    .gte("start_ts", now.toISOString())
    .lt("start_ts", endLt.toISOString())
    .neq("status", "Cancelled")
    .order("start_ts", { ascending: true });

  const rows = (data || []) as Row[];
  return rows.map(r => ({
    date: format(parseISO(r.start_ts), "MMM d, yyyy"),
    time: format(parseISO(r.start_ts), "h:mm a"),
    service: r.normalized_service || r.service_raw || "Unknown",
    name: r.caller_name || "",
    phone: r.caller_phone_e164 || "",
  }));
}

export async function getAppointmentsTable(
  businessId: string,
  opts: {
    start?: Date; endLt?: Date; status?: string; q?: string;
    limit?: number; offset?: number;
  } = {}
) {
  let query = supabase
    .from("appointments")
    .select("id,start_ts,end_ts,status,source,caller_name,caller_phone_e164,normalized_service,service_raw", { count: "exact" })
    .eq("business_id", businessId);

  if (opts.start) query = query.gte("start_ts", opts.start.toISOString());
  if (opts.endLt) query = query.lt("start_ts", opts.endLt.toISOString());
  if (opts.status && opts.status !== "All") query = query.eq("status", opts.status);

  // simple text search across a few fields
  if (opts.q && opts.q.trim()) {
    const q = opts.q.trim();
    query = query.or(`caller_name.ilike.%${q}%,caller_phone_e164.ilike.%${q}%,service_raw.ilike.%${q}%,normalized_service.ilike.%${q}%`);
  }

  if (opts.limit) query = query.limit(opts.limit);
  if (opts.offset) query = query.range(opts.offset, (opts.offset + (opts.limit || 50)) - 1);

  query = query.order("start_ts", { ascending: false });

  const { data, error, count } = await query;
  return { rows: (data || []) as Row[], count: count || 0 };
}