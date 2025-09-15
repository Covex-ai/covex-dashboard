// components/KpiCard.tsx
import { cn } from "../lib/util";

export default function KpiCard({
  label, value, delta,
}: { label: string; value: string | number; delta?: number; }) {
  const up = (delta ?? 0) >= 0;
  return (
    <div className="kpi">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{typeof value === "number" ? value.toLocaleString() : value}</div>
      {delta !== undefined && (
        <div className={cn("kpi-delta", up ? "text-emerald-400" : "text-rose-400")}>
          <span>{up ? "▲" : "▼"}</span>
          <span>{up ? "+" : ""}{typeof delta === "number" ? (label.includes("Revenue") ? `$${Math.abs(delta).toLocaleString()}` : Math.abs(delta)) : delta}</span>
        </div>
      )}
    </div>
  );
}

// tiny classnames helper
// lib/util.ts