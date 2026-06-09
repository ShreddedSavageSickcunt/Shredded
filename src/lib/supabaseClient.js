"use client";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const PHOTO_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_PHOTO_BUCKET || "checkin-photos";

// A single shared browser client. There is no auth yet — the app uses the
// public "anon" key and Supabase Row Level Security policies that allow the
// group to read/write everything (fully transparent, see supabase/schema.sql).
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// Helps surface a friendly message instead of a cryptic crash when the
// environment variables haven't been configured yet.
export const isSupabaseConfigured = Boolean(supabase);
