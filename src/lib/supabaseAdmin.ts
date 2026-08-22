import { createClient } from "@supabase/supabase-js";

// Server-only Supabase client using the SECRET key (bypasses RLS for writes).
// NEVER import this from a client component — the secret must stay on the server.
// Fallbacks keep createClient from throwing during build before env vars are set;
// real values are injected from the server environment at runtime.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const secret = process.env.SUPABASE_SECRET_KEY || "placeholder-secret-key";

export const supabaseAdmin = createClient(url, secret, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Email + password gate for admin endpoints (credentials live in server env).
export function adminAuthorized(req: Request): boolean {
  const email = req.headers.get("x-admin-email");
  const password = req.headers.get("x-admin-key");
  const expEmail = process.env.ADMIN_EMAIL;
  const expPassword = process.env.ADMIN_PASSWORD;
  if (!expPassword || password !== expPassword) return false;
  if (expEmail && email !== expEmail) return false;
  return true;
}
