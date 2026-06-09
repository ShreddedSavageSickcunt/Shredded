"use client";

import { useEffect, useState } from "react";
import { getStoredMember } from "@/lib/session";

// Returns the currently identified member (from localStorage) and stays in sync
// when they identify / sign out elsewhere in the app.
export function useIdentity() {
  const [member, setMember] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => {
      setMember(getStoredMember());
      setReady(true);
    };
    sync();
    window.addEventListener("shredded:identity", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("shredded:identity", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return { member, ready };
}
