"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabaseBrowser";

export default function LoginPage() {
  const router = useRouter();
  const search = useSearchParams();

  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  // If the user is already signed in, bounce them to the dashboard
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        const biz = search?.get("biz");
        router.replace(biz ? `/?biz=${biz}` : "/");
      }
    })();
  }, [router, search, supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setMessage(null);

    try {
      // Preserve ?biz from the current URL if present
      const current = new URL(window.location.href);
      const biz = current.searchParams.get("biz");
      const redirect = biz
        ? `${window.location.origin}/auth/callback?biz=${encodeURIComponent(biz)}`
        : `${window.location.origin}/auth/callback`;

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirect, // <<< THIS IS THE IMPORTANT PART
        },
      });

      if (error) {
        setStatus("error");
        setMessage(error.message || "Failed to send magic link.");
        return;
      }

      setStatus("sent");
      setMessage(
        "Check your email for a magic link. Open it within a minute to finish signing in."
      );
    } catch (err: any) {
      setStatus("error");
      setMessage(err?.message || "Something went wrong.");
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-[#0b1115] text-slate-100">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0f151a] p-6 shadow-xl">
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500" />
            <h1 className="text-xl font-semibold">Sign in to Covex</h1>
          </div>
          <p className="mt-2 text-sm text-slate-400">
            We’ll email you a magic link to sign in.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-white/10 bg-[#0b1115] px-3 py-2 outline-none focus:border-cyan-500"
            />
          </label>

          <button
            type="submit"
            disabled={status === "sending"}
            className="w-full rounded-lg bg-cyan-500 px-4 py-2 font-medium text-black hover:bg-cyan-400 disabled:opacity-60"
          >
            {status === "sending" ? "Sending…" : "Send magic link"}
          </button>
        </form>

        {message && (
          <div
            className={`mt-4 rounded-lg px-3 py-2 text-sm ${
              status === "error" ? "bg-red-500/10 text-red-300" : "bg-white/5 text-slate-200"
            }`}
          >
            {message}
          </div>
        )}

        <div className="mt-6 text-center text-xs text-slate-500">
          This will redirect back to <code>/auth/callback</code> to complete sign-in.
        </div>
      </div>
    </div>
  );
}