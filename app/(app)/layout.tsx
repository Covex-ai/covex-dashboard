import "@/app/globals.css";
import Sidebar from "@/components/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid grid-cols-[260px_1fr] bg-covex-black">
      <aside className="sticky top-0 h-screen bg-covex-steel/70 backdrop-blur border-r border-white/10">
        <Sidebar />
      </aside>
      <main className="p-8">{children}</main>
    </div>
  );
}
