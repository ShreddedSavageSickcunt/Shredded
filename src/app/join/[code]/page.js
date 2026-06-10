"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useIdentity } from "@/components/useIdentity";
import { setInvite, clearInvite } from "@/lib/session";

// Invite-link landing. If already signed in, join the squad immediately;
// otherwise remember the squad and send them through login / onboarding.
export default function JoinPage({ params }) {
  const { code } = params;
  const router = useRouter();
  const { member, ready } = useIdentity();
  const [status, setStatus] = useState("loading"); // loading | invalid

  useEffect(() => {
    if (!ready || !supabase) return;
    (async () => {
      const { data: team } = await supabase
        .from("teams")
        .select("id, name, join_code")
        .ilike("join_code", code)
        .maybeSingle();

      if (!team) {
        setStatus("invalid");
        return;
      }

      if (member) {
        await supabase.from("members").update({ team_id: team.id }).eq("id", member.id);
        clearInvite();
        router.replace("/");
      } else {
        setInvite({ code: team.join_code, teamName: team.name });
        router.replace("/login");
      }
    })();
  }, [ready, member, code, router]);

  return (
    <div className="mx-auto max-w-sm pt-20 text-center">
      {status === "invalid" ? (
        <>
          <h1 className="text-xl font-bold tracking-tight">Invite not found</h1>
          <p className="mt-2 text-sm text-zinc-400">
            That link looks invalid or expired. Ask your friend for a fresh invite.
          </p>
        </>
      ) : (
        <p className="text-zinc-500">Joining your squad…</p>
      )}
    </div>
  );
}
