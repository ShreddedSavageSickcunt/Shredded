"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useIdentity } from "@/components/useIdentity";

// Wrap any page that needs to know "who is this". First-time visitors are sent
// to the onboarding flow; returning visitors (remembered on this device) pass
// straight through.
export default function IdentityGate({ children }) {
  const { member, ready } = useIdentity();
  const router = useRouter();

  useEffect(() => {
    if (ready && !member) router.replace("/login");
  }, [ready, member, router]);

  if (!ready || !member) {
    return <div className="py-24 text-center text-zinc-500">Loading…</div>;
  }

  return children;
}
