"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabaseBrowser";

// Prevent static export/prerender for this page (safer for auth)
// and remove the CSR bailout warning during build.
export const dynamic = "force-dynamic";

function LoginInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [message, setMessage] = useState<string>("");

  // Optional: if we arrive with `?redirect=...` we’ll use it later
  const redirect = searchParams.get("redirect") || "/";

  // If already signed in, go home
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/");
    });
  }, [router, supabase]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setMessage("");

    try {
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const emailRedirectTo = `${origin}/auth/callback?next=${encodeURIComponent(
        redirect
      )}`;

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo },
      });

      if (error) {
        setStatus("error");
        setMessage(error.message || "Failed to send magic link.");
        return;
      }
      setStatus("sent");
      setMessage(
        "Magic link sent! Check your email and open the link on this device."
      );
    } catch (err: any) {
      setStatus("error");
      setMessage(err?.message ?? "Something went wrong.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b1115] text-white p-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-6 shadow-xl">
        <h1 className="text-2xl font-semibold">Sign in to Covex</h1>
        <p className="mt-2 text-sm text-white/60">
          We’ll email you a magic link to log in.
        </p>

        <form onSubmit={handleSend} className="mt-6 space-y-4">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="w-full rounded-xl border border-white/10 bg-black/30 p-3 outline-none focus:border-white/30"
          />
          <button
            type="submit"
            disabled={status === "sending"}
            className="w-full rounded-xl bg-white text-black py-3 font-medium hover:bg-white/90 disabled:opacity-60"
          >
            {status === "sending" ? "Sending..." : "Send magic link"}
          </button>
        </form>

        {message && (
          <div
            className={`mt-4 text-sm ${
              status === "error" ? "text-red-400" : "text-green-400"
            }`}
          >
            {message}
          </div>
        )}

        <div className="mt-6">
          <button
            onClick={() => router.push("/")}
            className="text-sm text-white/70 hover:text-white"
          >
            Continue without logging in
          </button>
        </div>
      </div>
    </div>
  );
}

// Wrap the component that calls useSearchParams in Suspense
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-6 text-white">Loading…</div>}>
      <LoginInner />
    </Suspense>
  );
}
