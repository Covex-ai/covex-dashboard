import "@/app/globals.css";
import Logo from "@/components/Logo"; // we’ll add this next if you don’t have it

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-covex-black">
      <div className="absolute top-6 left-8">
        <Logo />
      </div>
      {children}
    </div>
  );
}
