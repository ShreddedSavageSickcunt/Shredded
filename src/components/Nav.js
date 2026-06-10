"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { clearStoredMember } from "@/lib/session";
import { useIdentity } from "@/components/useIdentity";
import Icon from "@/components/Icon";

const LINKS = [
  { href: "/", label: "Squad", icon: "home" },
  { href: "/checkin", label: "Check in", icon: "checkin" },
  { href: "/goals", label: "Goals", icon: "target" },
  { href: "/admin", label: "Admin", icon: "cog" },
];

export default function Nav() {
  const pathname = usePathname();
  const { member } = useIdentity();
  const [teamName, setTeamName] = useState("Shredded");

  useEffect(() => {
    if (!supabase || !member) return;
    supabase
      .from("members")
      .select("team_id, teams(name)")
      .eq("id", member.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.teams?.name) setTeamName(data.teams.name);
      });
  }, [member]);

  // Hide the app chrome on the login + onboarding screens.
  if (pathname === "/login" || pathname === "/welcome") return null;

  return (
    <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-ink-950/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-flame-500/15 text-flame-400 ring-1 ring-flame-500/20">
            <Icon name="flame" className="h-4 w-4" strokeWidth={1.6} />
          </span>
          <span className="font-semibold tracking-tight text-zinc-100">{teamName}</span>
        </Link>
        {member ? (
          <button
            onClick={clearStoredMember}
            className="flex items-center gap-2 rounded-full bg-ink-850 py-1 pl-1 pr-3 text-sm font-medium text-zinc-300 ring-1 ring-white/10 transition hover:bg-ink-800"
            title="Sign out"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-flame-500/20 text-[11px] font-semibold text-flame-400">
              {member.name?.[0]?.toUpperCase()}
            </span>
            <span className="max-w-[7rem] truncate">{member.name}</span>
            <Icon name="logout" className="h-4 w-4 text-zinc-500" />
          </button>
        ) : null}
      </div>

      {/* Tab bar — thumb-friendly on phones. */}
      <nav className="mx-auto flex max-w-4xl items-center justify-around px-2 pb-2 sm:justify-start sm:gap-1 sm:px-4">
        {LINKS.map((l) => {
          const active = pathname === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex flex-col items-center gap-0.5 rounded-2xl px-4 py-1.5 text-xs font-medium transition sm:flex-row sm:gap-2 sm:text-sm ${
                active
                  ? "bg-flame-500/15 text-flame-400"
                  : "text-zinc-500 hover:bg-ink-850 hover:text-zinc-300"
              }`}
            >
              <Icon name={l.icon} className="h-5 w-5 sm:h-4 sm:w-4" />
              {l.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
