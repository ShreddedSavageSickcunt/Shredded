"use client";

// Lightweight "who am I" helper. There is no real auth yet: a member types
// their name + access code once, we verify it against the members table, and
// remember them in localStorage so they stay identified on this device.

const STORAGE_KEY = "shredded:member";
const PENDING_KEY = "shredded:pending";

export function getStoredMember() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function storeMember(member) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      id: member.id,
      name: member.name,
      is_admin: member.is_admin,
    })
  );
  // Let other components in the app react to the identity change.
  window.dispatchEvent(new Event("shredded:identity"));
}

export function clearStoredMember() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event("shredded:identity"));
}

// A "pending signup" carries the chosen username + password from the login
// screen into the onboarding flow, where the account row is finally created.
export function getPendingSignup() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PENDING_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setPendingSignup(creds) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PENDING_KEY, JSON.stringify(creds));
}

export function clearPendingSignup() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PENDING_KEY);
}
