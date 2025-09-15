// app/layout.tsx
import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "Covex Dashboard",
  description: "Analytics & Performance",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // 👇 ignore client-vs-server diffs on <html> (prevents hydration error)
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className="bg-[#0b1115] text-slate-200 min-h-screen">
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <aside className="w-64 bg-[#0f151a] border-r border-white/10 p-5">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500" />
              <div className="text-xl font-semibold">Covex</div>
            </div>
            <nav className="flex flex-col gap-2">
              <Link href="/" className="navlink">
                Overview
              </Link>
              <Link href="/appointments" className="navlink">
                Appointments
              </Link>
              <Link href="/services" className="navlink">
                Services
              </Link>
              <Link href="/settings" className="navlink">
                Settings
              </Link>
            </nav>
          </aside>

          {/* Main */}
          <main className="flex-1 p-8">{children}</main>
        </div>
      </body>
    </html>
  );
}