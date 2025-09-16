"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabaseBrowser";

// Prevent static prerender; this page handles auth tokens in URL.
export const dynamic = "force-dynamic";

function CallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createBrowserSupabaseClient();

  useEffect(() => {
    async function completeLogin() {
      try {
        // Supabase JS v2 will parse & store the session if magic-link
        // tokens are present in the URL fragment. Calling getSession()
        // ensures the client finishes initialization on this page.
        await supabase.auth.getSession();
      } catch {
        // swallow — we still route the user
      }

      const next = searchParams.get("next") || "/";
      router.replace(next);
    }
    completeLogin();
  }, [router, searchParams, supabase]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b1115] text-white p-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4">
        Signing you in…
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="p-6 text-white">Loading…</div>}>
      <CallbackInner />
    </Suspense>
  );
}
