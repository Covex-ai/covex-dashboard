// components/PeriodSelector.tsx
"use client";

import { PeriodKey } from "../lib/queries";

const OPTIONS: PeriodKey[] = ["Today", "Last 7 days", "Last 30 days", "This month"];

export default function PeriodSelector({
  value, onChange,
}: { value: PeriodKey; onChange: (p: PeriodKey) => void }) {
  return (
    <div className="flex gap-2">
      {OPTIONS.map(op => (
        <button
          key={op}
          onClick={() => onChange(op)}
          className={`badge ${value === op ? "ring-1 ring-cyan-400 text-white" : ""}`}
        >
          {op}
        </button>
      ))}
    </div>
  );
}