"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabaseBrowser";

export const dynamic = "force-dynamic";

function SignupInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";
  const supabase = createBrowserSupabaseClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessId, setBusinessId] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSignup(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    // 1) create auth user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: typeof window !== "undefined" ? window.location.origin : "",
      },
    });
    if (error) {
      setLoading(false);
      setErr(error.message);
      return;
    }

    // 2) create profiles row (RLS policy allows self insert)
    const userId = data.user?.id;
    if (!userId) {
      setLoading(false);
      setErr("Sign-up succeeded but no user ID returned.");
      return;
    }

    const { error: pErr } = await supabase
      .from("profiles")
      .insert([{ id: userId, business_id: businessId, role: "member" }]);

    setLoading(false);

    if (pErr) {
      setErr(pErr.message);
      return;
    }

    // If email confirmations are ON, user must verify before session exists.
    // Still send them to login with a helpful message.
    router.replace("/login?next=" + encodeURIComponent(next));
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b1115] text-white p-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-6 shadow-xl">
        <h1 className="text-2xl font-semibold">Create your Covex account</h1>
        <p className="mt-2 text-sm text-white/60">
          Enter your company’s Business ID so we can lock your data correctly.
        </p>

        <form onSubmit={onSignup} className="mt-6 space-y-4">
          <input
            type="text"
            required
            value={businessId}
            onChange={(e) => setBusinessId(e.target.value.trim())}
            placeholder="Business ID (e.g. covex-demo)"
            className="w-full rounded-xl border border-white/10 bg-black/30 p-3 outline-none focus:border-white/30"
          />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="w-full rounded-xl border border-white/10 bg-black/30 p-3 outline-none focus:border-white/30"
          />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a password"
            className="w-full rounded-xl border border-white/10 bg-black/30 p-3 outline-none focus:border-white/30"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-white text-black py-3 font-medium hover:bg-white/90 disabled:opacity-60"
          >
            {loading ? "Creating…" : "Create account"}
          </button>
        </form>

        {err && <div className="mt-4 text-sm text-red-400">{err}</div>}

        <div className="mt-6 text-sm text-white/70">
          Already have an account?{" "}
          <button
            onClick={() => router.push("/login")}
            className="underline hover:text-white"
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="p-6 text-white">Loading…</div>}>
      <SignupInner />
    </Suspense>
  );
}
