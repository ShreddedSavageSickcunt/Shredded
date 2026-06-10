"use client";

import { isSupabaseConfigured } from "@/lib/supabaseClient";

// Friendly heads-up shown until the Supabase env vars are wired up, so the app
// never crashes with a blank screen during setup.
export default function ConfigNotice() {
  if (isSupabaseConfigured) return null;
  return (
    <div className="mx-auto mb-4 max-w-2xl rounded-2xl bg-amber-500/10 p-4 text-sm text-amber-200 ring-1 ring-amber-500/30">
      <p className="font-semibold">Almost there — Supabase isn’t connected yet.</p>
      <p className="mt-1 text-amber-200/80">
        Copy <code className="rounded bg-amber-500/20 px-1">.env.local.example</code> to{" "}
        <code className="rounded bg-amber-500/20 px-1">.env.local</code> and add your{" "}
        <code className="rounded bg-amber-500/20 px-1">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
        <code className="rounded bg-amber-500/20 px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, then restart{" "}
        <code className="rounded bg-amber-500/20 px-1">npm run dev</code>.
      </p>
    </div>
  );
}
