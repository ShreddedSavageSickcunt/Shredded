"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { storeMember, setPendingSignup } from "@/lib/session";
import { useIdentity } from "@/components/useIdentity";
import ConfigNotice from "@/components/ConfigNotice";
import Icon from "@/components/Icon";

export default function LoginPage() {
  const router = useRouter();
  const { member, ready } = useIdentity();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Already signed in on this device → straight to the app.
  useEffect(() => {
    if (ready && member) router.replace("/");
  }, [ready, member, router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!isSupabaseConfigured) {
      setError("Connect Supabase first (see the banner above).");
      return;
    }
    const u = username.trim();
    const p = password;
    if (!u || !p) return;

    setBusy(true);
    // Does this username already exist?
    const { data: existing, error: lookupErr } = await supabase
      .from("members")
      .select("id, name, is_admin, password")
      .ilike("username", u)
      .maybeSingle();

    if (lookupErr) {
      setBusy(false);
      setError("Something went wrong. Please try again.");
      return;
    }

    if (existing) {
      // Returning user — check the password they set.
      if ((existing.password ?? "") !== p) {
        setBusy(false);
        setError("Incorrect password for that username.");
        return;
      }
      storeMember(existing);
      router.replace("/");
      return;
    }

    // New username → carry creds into the welcome/onboarding flow.
    setPendingSignup({ username: u, password: p });
    router.replace("/welcome");
  }

  if (!ready || member) {
    return <div className="py-24 text-center text-zinc-500">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-sm pt-6">
      <ConfigNotice />

      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-flame-500/15 text-flame-400 ring-1 ring-flame-500/20">
          <Icon name="flame" className="h-7 w-7" strokeWidth={1.6} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Shredded</h1>
        <p className="mt-1 text-sm text-zinc-400">Sign in, or pick a username to get started.</p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="label">Username</label>
          <input
            className="input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="yourname"
            autoCapitalize="none"
            autoCorrect="off"
            autoFocus
          />
        </div>
        <div>
          <label className="label">Password</label>
          <input
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        {error && <p className="text-sm font-medium text-red-400">{error}</p>}

        <button className="btn-primary w-full" disabled={busy || !username.trim() || !password}>
          {busy ? "Checking…" : "Continue"}
        </button>
        <p className="text-center text-xs text-zinc-500">
          New here? Just pick a username and password — we’ll set you up.
        </p>
      </form>
    </div>
  );
}
