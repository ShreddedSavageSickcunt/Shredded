"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { clearStoredMember } from "@/lib/session";
import { useIdentity } from "@/components/useIdentity";

const LINKS = [
  { href: "/", label: "Squad", emoji: "🏠" },
  { href: "/checkin", label: "Check in", emoji: "✅" },
  { href: "/goals", label: "Goals", emoji: "🎯" },
  { href: "/admin", label: "Admin", emoji: "⚙️" },
];

export default function Nav() {
  const pathname = usePathname();
  const { member } = useIdentity();
  const [teamName, setTeamName] = useState("Shredded");

  useEffect(() => {
    if (!supabase) return;
    supabase
      .from("group_settings")
      .select("team_name, challenge_name")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.team_name) setTeamName(data.team_name);
      });
  }, []);

  return (
    <header className="sticky top-0 z-20 border-b border-stone-200/70 bg-white/70 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-extrabold tracking-tight">
          <span className="text-xl">🔥</span>
          <span className="bg-gradient-to-r from-flame-600 to-lime-600 bg-clip-text text-transparent">
            {teamName}
          </span>
        </Link>
        <div className="flex items-center gap-1">
          {member ? (
            <button
              onClick={clearStoredMember}
              className="hidden rounded-full px-3 py-1.5 text-sm font-medium text-stone-500 hover:bg-stone-100 sm:block"
              title="Sign out"
            >
              {member.name} · sign out
            </button>
          ) : null}
        </div>
      </div>

      {/* Bottom tab bar — thumb-friendly on phones. */}
      <nav className="mx-auto flex max-w-4xl items-center justify-around px-2 pb-2 sm:justify-start sm:gap-2 sm:px-4">
        {LINKS.map((l) => {
          const active = pathname === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex flex-col items-center rounded-2xl px-4 py-1.5 text-xs font-semibold transition sm:flex-row sm:gap-1.5 sm:text-sm ${
                active
                  ? "bg-flame-100 text-flame-600"
                  : "text-stone-500 hover:bg-stone-100"
              }`}
            >
              <span className="text-base sm:text-sm">{l.emoji}</span>
              {l.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
