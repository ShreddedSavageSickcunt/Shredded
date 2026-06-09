"use client";

import { useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { storeMember } from "@/lib/session";
import { useIdentity } from "@/components/useIdentity";
import ConfigNotice from "@/components/ConfigNotice";

// Wrap any page that needs to know "who is this". If the visitor hasn't
// identified yet, show a simple name + access-code card. No passwords — this is
// a trusted friend group and just needs to tell members apart.
export default function IdentityGate({ children }) {
  const { member, ready } = useIdentity();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!ready) {
    return <div className="py-16 text-center text-stone-400">Loading…</div>;
  }

  if (member) return children;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!isSupabaseConfigured) {
      setError("Connect Supabase first (see the banner above).");
      return;
    }
    setBusy(true);
    const { data, error: dbError } = await supabase
      .from("members")
      .select("id, name, is_admin, access_code")
      .ilike("name", name.trim())
      .eq("access_code", code.trim())
      .maybeSingle();
    setBusy(false);

    if (dbError) {
      setError("Something went wrong. Try again.");
      return;
    }
    if (!data) {
      setError("Hmm, that name + code didn’t match. Ask your admin to add you.");
      return;
    }
    storeMember(data);
  }

  return (
    <div className="mx-auto max-w-md">
      <ConfigNotice />
      <div className="card">
        <h2 className="text-xl font-bold">👋 Who’s checking in?</h2>
        <p className="mt-1 text-sm text-stone-500">
          Enter your name and the access code your group admin gave you.
        </p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="label">Name</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sam"
              required
            />
          </div>
          <div>
            <label className="label">Access code</label>
            <input
              className="input"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. squad42"
              required
            />
          </div>
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          <button className="btn-primary w-full" disabled={busy}>
            {busy ? "Checking…" : "Let’s go 🚀"}
          </button>
        </form>
      </div>
    </div>
  );
}
