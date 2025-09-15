"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "../lib/utils";
import { Home, CalendarDays, Wrench, Settings } from "lucide-react";

const items = [
  { href: "/", label: "Overview", icon: Home },
  { href: "/appointments", label: "Appointments", icon: CalendarDays },
  { href: "/services", label: "Services", icon: Wrench },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="h-screen w-[260px] shrink-0 bg-[#0f172a] text-slate-200 border-r border-white/5">
      <div className="px-5 py-6 text-xl font-semibold">Covex</div>
      <nav className="flex flex-col gap-1 px-3">
        {items.map((it) => {
          const Icon = it.icon;
          const active = pathname === it.href;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm",
                active ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5"
              )}
            >
              <Icon size={18} />
              {it.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

// tiny classnames helper if you don't want a full util lib