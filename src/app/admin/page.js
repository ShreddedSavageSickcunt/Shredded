"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useIdentity } from "@/components/useIdentity";
import IdentityGate from "@/components/IdentityGate";
import { formatDate } from "@/lib/format";

function AdminPanel() {
  const { member } = useIdentity();
  const [settings, setSettings] = useState({
    challenge_name: "",
    team_name: "",
    start_date: "",
    end_date: "",
    checkin_frequency_days: 7,
  });
  const [settingsId, setSettingsId] = useState(null);
  const [members, setMembers] = useState([]);
  const [newMember, setNewMember] = useState({ name: "", access_code: "", is_admin: false });
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadMembers() {
    const { data } = await supabase.from("members").select("*").order("join_date", { ascending: true });
    setMembers(data || []);
  }

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("group_settings")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) {
        setSettingsId(data.id);
        setSettings({
          challenge_name: data.challenge_name ?? "",
          team_name: data.team_name ?? "",
          start_date: data.start_date ?? "",
          end_date: data.end_date ?? "",
          checkin_frequency_days: data.checkin_frequency_days ?? 7,
        });
      }
      await loadMembers();
    })();
  }, []);

  if (!member.is_admin) {
    return (
      <div className="card mx-auto max-w-md text-center">
        <p className="text-lg font-bold">🔒 Admins only</p>
        <p className="mt-1 text-sm text-stone-500">
          Ask a group admin to make changes here.
        </p>
      </div>
    );
  }

  const setS = (k) => (e) => setSettings({ ...settings, [k]: e.target.value });

  async function saveSettings(e) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const payload = {
      challenge_name: settings.challenge_name || null,
      team_name: settings.team_name || null,
      start_date: settings.start_date || null,
      end_date: settings.end_date || null,
      checkin_frequency_days: settings.checkin_frequency_days
        ? Number(settings.checkin_frequency_days)
        : null,
    };
    const query = settingsId
      ? supabase.from("group_settings").update(payload).eq("id", settingsId)
      : supabase.from("group_settings").insert(payload).select("id").single();
    const { data, error } = await query;
    setBusy(false);
    if (error) return setMsg("⚠️ " + error.message);
    if (data?.id) setSettingsId(data.id);
    setMsg("✅ Challenge saved!");
  }

  async function addMember(e) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const { error } = await supabase.from("members").insert({
      name: newMember.name,
      access_code: newMember.access_code,
      is_admin: newMember.is_admin,
      join_date: new Date().toISOString().slice(0, 10),
    });
    setBusy(false);
    if (error) return setMsg("⚠️ " + error.message);
    setNewMember({ name: "", access_code: "", is_admin: false });
    setMsg("✅ Member added!");
    loadMembers();
  }

  async function removeMember(id) {
    const { error } = await supabase.from("members").delete().eq("id", id);
    if (error) return setMsg("⚠️ " + error.message);
    loadMembers();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-extrabold">⚙️ Admin panel</h1>
      {msg && <p className="rounded-2xl bg-stone-100 px-4 py-2 text-sm font-medium">{msg}</p>}

      {/* Challenge settings */}
      <form onSubmit={saveSettings} className="card space-y-4">
        <h2 className="text-lg font-bold">The challenge</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Challenge name</label>
            <input className="input" value={settings.challenge_name} onChange={setS("challenge_name")} placeholder="Summer Shred 2026" />
          </div>
          <div>
            <label className="label">Team name</label>
            <input className="input" value={settings.team_name} onChange={setS("team_name")} placeholder="The Shredded Squad" />
          </div>
          <div>
            <label className="label">Start date</label>
            <input type="date" className="input" value={settings.start_date} onChange={setS("start_date")} />
          </div>
          <div>
            <label className="label">End date</label>
            <input type="date" className="input" value={settings.end_date} onChange={setS("end_date")} />
          </div>
          <div>
            <label className="label">Check-in every (days)</label>
            <input type="number" className="input" value={settings.checkin_frequency_days} onChange={setS("checkin_frequency_days")} placeholder="7" />
          </div>
        </div>
        <button className="btn-primary" disabled={busy}>Save challenge</button>
      </form>

      {/* Members */}
      <div className="card space-y-4">
        <h2 className="text-lg font-bold">The crew ({members.length})</h2>
        <ul className="divide-y divide-stone-100">
          {members.map((m) => (
            <li key={m.id} className="flex items-center gap-3 py-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-flame-100 font-bold text-flame-600">
                {m.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="font-semibold">
                  {m.name}{" "}
                  {m.is_admin && <span className="text-xs text-stone-400">· admin</span>}
                </p>
                <p className="text-xs text-stone-400">
                  code: {m.access_code} · joined {formatDate(m.join_date)}
                </p>
              </div>
              <button onClick={() => removeMember(m.id)} className="rounded-full px-3 py-1 text-sm text-red-500 hover:bg-red-50">
                remove
              </button>
            </li>
          ))}
          {members.length === 0 && <li className="py-2 text-sm text-stone-400">No members yet.</li>}
        </ul>

        <form onSubmit={addMember} className="space-y-3 border-t border-stone-100 pt-4">
          <h3 className="font-semibold">Add a member</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="input" value={newMember.name} onChange={(e) => setNewMember({ ...newMember, name: e.target.value })} placeholder="Name" required />
            <input className="input" value={newMember.access_code} onChange={(e) => setNewMember({ ...newMember, access_code: e.target.value })} placeholder="Access code" required />
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-stone-600">
            <input type="checkbox" checked={newMember.is_admin} onChange={(e) => setNewMember({ ...newMember, is_admin: e.target.checked })} />
            Make this person an admin
          </label>
          <button className="btn-ghost" disabled={busy}>＋ Add member</button>
        </form>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <IdentityGate>
      <AdminPanel />
    </IdentityGate>
  );
}
