"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, PHOTO_BUCKET } from "@/lib/supabaseClient";
import { useIdentity } from "@/components/useIdentity";
import IdentityGate from "@/components/IdentityGate";
import { VIBE_LABELS } from "@/lib/format";

function CheckinForm() {
  const router = useRouter();
  const { member } = useIdentity();
  const today = new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState({
    checkin_date: today,
    weight_kg: "",
    calories_consumed: "",
    vibe_rating: 4,
    notes: "",
  });
  const [photo, setPhoto] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);

    let photo_url = null;
    try {
      if (photo) {
        const ext = photo.name.split(".").pop();
        const path = `${member.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from(PHOTO_BUCKET)
          .upload(path, photo, { upsert: false });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path);
        photo_url = pub.publicUrl;
      }

      const { error: insErr } = await supabase.from("checkins").insert({
        member_id: member.id,
        checkin_date: form.checkin_date,
        weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
        calories_consumed: form.calories_consumed ? Number(form.calories_consumed) : null,
        vibe_rating: Number(form.vibe_rating),
        notes: form.notes || null,
        photo_url,
      });
      if (insErr) throw insErr;

      router.push(`/member/${member.id}`);
    } catch (err) {
      setError(err.message || "Couldn’t save your check-in. Try again.");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Check in, {member.name}</h1>
      <p className="mb-5 text-sm text-zinc-400">How did the period go? Be honest — the squad’s got you.</p>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Date</label>
            <input type="date" className="input" value={form.checkin_date} onChange={set("checkin_date")} required />
          </div>
          <div>
            <label className="label">Weight (kg)</label>
            <input type="number" step="0.1" inputMode="decimal" className="input" value={form.weight_kg} onChange={set("weight_kg")} placeholder="82.4" />
          </div>
        </div>

        <div>
          <label className="label">Calories consumed (avg/day)</label>
          <input type="number" inputMode="numeric" className="input" value={form.calories_consumed} onChange={set("calories_consumed")} placeholder="2100" />
        </div>

        <div>
          <label className="label">How did it feel?</label>
          <div className="flex gap-1.5">
            {VIBE_LABELS.map((lbl, i) => {
              const rating = i + 1;
              const active = Number(form.vibe_rating) === rating;
              return (
                <button
                  type="button"
                  key={rating}
                  onClick={() => setForm({ ...form, vibe_rating: rating })}
                  className={`flex-1 rounded-xl py-2.5 text-xs font-semibold transition ${
                    active
                      ? "bg-flame-500/15 text-flame-400 ring-1 ring-flame-500/50"
                      : "bg-ink-850 text-zinc-400 ring-1 ring-white/5 hover:bg-ink-800"
                  }`}
                >
                  {lbl}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="label">Notes</label>
          <textarea className="input min-h-24" value={form.notes} onChange={set("notes")} placeholder="Wins, struggles, what you’re proud of…" />
        </div>

        <div>
          <label className="label">Progress photo (optional)</label>
          <input type="file" accept="image/*" className="input file:mr-3 file:rounded-full file:border-0 file:bg-flame-500 file:px-3 file:py-1 file:text-white" onChange={(e) => setPhoto(e.target.files?.[0] || null)} />
        </div>

        {error && <p className="text-sm font-medium text-red-400">{error}</p>}

        <button className="btn-primary w-full" disabled={busy}>
          {busy ? "Saving…" : "Post check-in"}
        </button>
      </form>
    </div>
  );
}

export default function CheckinPage() {
  return (
    <IdentityGate>
      <CheckinForm />
    </IdentityGate>
  );
}
