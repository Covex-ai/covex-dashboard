"use client";

import { format } from "date-fns";

type Row = {
  start_ts: string;
  service_raw: string | null;
  caller_name: string | null;
  caller_phone_e164: string | null;
};

export default function UpcomingTable({ rows }: { rows: Row[] }) {
  return (
    <div className="rounded-2xl bg-[#0f172a] border border-white/5 p-4">
      <div className="mb-3 text-sm text-slate-400">Upcoming</div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-slate-400">
            <tr className="[&>th]:text-left [&>th]:font-medium [&>th]:py-2">
              <th>Date</th>
              <th>Time</th>
              <th>Service</th>
              <th>Name</th>
              <th>Phone</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.length === 0 && (
              <tr>
                <td className="py-3 text-slate-400" colSpan={5}>
                  No upcoming appointments.
                </td>
              </tr>
            )}
            {rows.map((r, i) => {
              const d = new Date(r.start_ts);
              return (
                <tr key={i} className="[&>td]:py-2">
                  <td>{format(d, "M/d/yyyy")}</td>
                  <td>{format(d, "h:mm a")}</td>
                  <td>{r.service_raw ?? "-"}</td>
                  <td>{r.caller_name ?? "-"}</td>
                  <td>{r.caller_phone_e164 ?? "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}