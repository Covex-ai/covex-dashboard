"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabaseBrowser";

export default function AuthCallbackPage() {
  const router = useRouter();
  const search = useSearchParams();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [message, setMessage] = useState("Completing sign-in…");

  useEffect(() => {
    const goHome = (biz?: string | null) => {
      router.replace(biz ? `/?biz=${encodeURIComponent(biz)}` : "/");
    };

    (async () => {
      // Supabase magic-link returns tokens in the URL hash: #access_token=...&refresh_token=...
      const hash = window.location.hash; // includes leading "#"
      const params = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);

      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");
      const error =
        params.get("error_description") || params.get("error") || undefined;

      const biz = search?.get("biz");

      if (error) {
        setMessage(decodeURIComponent(error));
        return;
      }

      if (access_token && refresh_token) {
        // Set the session from the magic-link tokens
        const { error: setErr } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });
        if (setErr) {
          setMessage(setErr.message);
          return;
        }
        goHome(biz);
        return;
      }

      // If no tokens in the hash, user may already be signed in
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        goHome(biz);
        return;
      }

      setMessage(
        "Link is invalid or expired. Please request a new magic link from the login page."
      );
    })();
  }, [router, search, supabase]);

  return (
    <div className="min-h-screen grid place-items-center bg-[#0b1115] text-slate-100">
      <div className="rounded-xl border border-white/10 bg-[#0f151a] px-6 py-8 text-center shadow-xl">
        <div className="text-lg">{message}</div>
        <a
          href="/login"
          className="mt-4 inline-block text-cyan-400 underline underline-offset-4"
        >
          Back to login
        </a>
      </div>
    </div>
  );
}