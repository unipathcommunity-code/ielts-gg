"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import type { User } from "@supabase/supabase-js";

// Emails that get the admin role (also enforced server-side via ADMIN_EMAIL).
export const ADMIN_EMAILS = ["kmwbb@gmail.com"];

export function isAdminEmail(email?: string | null): boolean {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase());
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  const isAdmin = isAdminEmail(user?.email);
  const name =
    (user?.user_metadata?.full_name as string) ||
    (user?.user_metadata?.name as string) ||
    (user?.email ? user.email.split("@")[0] : "");

  return { user, loading, isAdmin, name, signOut: () => supabase.auth.signOut() };
}
