"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getStoredMember } from "@/lib/session";

// Single source of truth for "who am I". A provider (mounted once in the root
// layout) owns the state, and every component reads the SAME value via context.
// This avoids the bug where each component had its own copy that was briefly
// null on first render, crashing pages that read member.* immediately.
const IdentityContext = createContext({ member: null, ready: false });

export function IdentityProvider({ children }) {
  const [member, setMember] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => {
      setMember(getStoredMember());
      setReady(true);
    };
    sync();
    // Stay in sync when the member identifies / signs out, here or in another tab.
    window.addEventListener("shredded:identity", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("shredded:identity", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return (
    <IdentityContext.Provider value={{ member, ready }}>
      {children}
    </IdentityContext.Provider>
  );
}

export function useIdentity() {
  return useContext(IdentityContext);
}
