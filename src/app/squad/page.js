"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { storeMember } from "@/lib/session";
import { useIdentity } from "@/components/useIdentity";
import IdentityGate from "@/components/IdentityGate";
import Icon from "@/components/Icon";
import { formatKg } from "@/lib/format";

function makeJoinCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function SquadInner() {
  const router = useRouter();
  const { member } = useIdentity();
  const [me, setMe] = useState(null);
  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  // solo form
  const [mode, setMode] = useState("create");
  const [teamName, setTeamName] = useState("");
  const [joinCode, setJoinCode] = useState("");

  // settings form
  const [name, setName] = useState("");
  const [cadence, setCadence] = useState(7);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    const { data: meRow } = await supabase
      .from("members")
      .select("*, teams(*)")
      .eq("id", member.id)
      .maybeSingle();
    setMe(meRow || null);
    setTeam(meRow?.teams || null);
    if (meRow?.teams) {
      setName(meRow.teams.name || "");
      setCadence(meRow.teams.cadence_days || 7);
      const { data: ms } = await supabase.from("members").select("*").eq("team_id", meRow.team_id).order("join_date");
      setMembers(ms || []);
    }
    setLoading(false);
  }, [member.id]);

  useEffect(() => { load(); }, [load]);

  async function createTeam(e) {
    e.preventDefault();
    if (!teamName.trim()) return;
    setBusy(true);
    const { data: t, error } = await supabase
      .from("teams")
      .insert({ name: teamName.trim(), join_code: makeJoinCode() })
      .select("id")
      .single();
    if (error) { setBusy(false); return setMsg("Couldn’t create: " + error.message); }
    await supabase.from("members").update({ team_id: t.id, is_admin: true }).eq("id", member.id);
    storeMember({ id: member.id, name: member.name, is_admin: true });
    router.replace("/");
  }

  async function joinTeam(e) {
    e.preventDefault();
    if (!joinCode.trim()) return;
    setBusy(true);
    const { data: t, error } = await supabase
      .from("teams")
      .select("id")
      .ilike("join_code", joinCode.trim())
      .maybeSingle();
    if (error || !t) { setBusy(false); return setMsg(t ? "Something went wrong." : "No squad found with that code."); }
    await supabase.from("members").update({ team_id: t.id }).eq("id", member.id);
    router.replace("/");
  }

  async function saveSettings(e) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const { error } = await supabase
      .from("teams")
      .update({ name: name.trim(), cadence_days: Number(cadence) || 7 })
      .eq("id", team.id);
    setBusy(false);
    if (error) return setMsg("Couldn’t save: " + error.message);
    setMsg("Saved.");
    load();
  }

  function copyCode() {
    navigator.clipboard?.writeText(team.join_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (loading) return <div className="py-16 text-center text-zinc-500">Loading…</div>;

  // ----- Solo: create or join -----
  if (!team) {
    return (
      <div className="mx-auto max-w-md space-y-5">
        <header>
          <h1 className="text-2xl font-bold tracking-tight">Find your squad</h1>
          <p className="mt-1 text-sm text-zinc-400">Create a squad and invite friends, or join one with a code.</p>
        </header>

        <div className="seg w-full">
          {[["create", "Create"], ["join", "Join"]].map(([k, lbl]) => (
            <button key={k} onClick={() => setMode(k)} className={`seg-item flex-1 ${mode === k ? "seg-item-active" : ""}`}>{lbl}</button>
          ))}
        </div>

        {mode === "create" ? (
          <form onSubmit={createTeam} className="card space-y-3">
            <div>
              <label className="label">Squad name</label>
              <input className="input" value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Enter a squad name" autoFocus />
            </div>
            {msg && <p className="text-sm text-red-400">{msg}</p>}
            <button className="btn-primary w-full" disabled={busy}>Create squad</button>
          </form>
        ) : (
          <form onSubmit={joinTeam} className="card space-y-3">
            <div>
              <label className="label">Squad code</label>
              <input className="input uppercase tracking-widest" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="AB12CD" autoFocus />
            </div>
            {msg && <p className="text-sm text-red-400">{msg}</p>}
            <button className="btn-primary w-full" disabled={busy}>Join squad</button>
          </form>
        )}
      </div>
    );
  }

  // ----- In a team: settings -----
  const isAdmin = me?.is_admin;
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Squad settings</h1>
      {msg && <p className="rounded-2xl bg-ink-850 px-4 py-2 text-sm font-medium ring-1 ring-white/10">{msg}</p>}

      {/* Invite code */}
      <section className="card">
        <p className="stat-label">Invite code</p>
        <div className="mt-2 flex items-center gap-3">
          <span className="font-mono text-2xl font-bold tracking-[0.3em] text-flame-400">{team.join_code}</span>
          <button onClick={copyCode} className="btn-ghost !px-3 !py-2 text-sm">{copied ? "Copied" : "Copy"}</button>
        </div>
        <p className="mt-2 text-xs text-zinc-500">Share this with friends so they can join your squad.</p>
      </section>

      {/* Settings */}
      <form onSubmit={saveSettings} className="card space-y-4">
        <h2 className="font-semibold text-zinc-100">Details</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Squad name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} disabled={!isAdmin} />
          </div>
          <div>
            <label className="label">Check in every (days)</label>
            <input type="number" className="input" value={cadence} onChange={(e) => setCadence(e.target.value)} disabled={!isAdmin} />
          </div>
        </div>
        {isAdmin ? (
          <button className="btn-primary" disabled={busy}>Save</button>
        ) : (
          <p className="text-xs text-zinc-500">Only the squad admin can change these.</p>
        )}
      </form>

      {/* Members */}
      <section className="card">
        <h2 className="mb-3 font-semibold text-zinc-100">Members ({members.length})</h2>
        <ul className="space-y-2">
          {members.map((m) => (
            <li key={m.id} className="flex items-center gap-3 rounded-2xl bg-ink-850 p-3 ring-1 ring-white/5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-flame-500/15 text-sm font-bold text-flame-400 ring-1 ring-flame-500/20">
                {m.name?.[0]?.toUpperCase()}
              </span>
              <span className="flex-1 text-sm font-semibold text-zinc-100">
                {m.name} {m.is_admin && <span className="text-xs font-normal text-zinc-500">· admin</span>}
              </span>
              <span className="text-sm text-zinc-400">{formatKg(m.current_weight_kg)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default function SquadPage() {
  return (
    <IdentityGate>
      <SquadInner />
    </IdentityGate>
  );
}
