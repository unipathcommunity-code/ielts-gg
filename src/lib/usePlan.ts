"use client";

// Klient tomonda amaldagi rejani bilish — FAQAT UI uchun (qaysi tugma qulflangan
// ko'rinishi kerak). Haqiqiy qaror har doim serverda, `entitlements.ts` da qabul
// qilinadi: bu yerdagi qiymatni brauzerdan o'zgartirish hech narsani ochmaydi.

import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabase";
import { useAuth } from "./useAuth";
import { useClientNow } from "./useClientNow";

export type ClientPlan = "guest" | "free" | "pro" | "org";

interface EntitlementRow {
  plan: string;
  expires_at: string | null;
}

export interface PlanState {
  plan: ClientPlan;
  loading: boolean;
  expiresAt: string | null;
  isPro: boolean;
}

export function usePlan(): PlanState {
  const { user, loading: authLoading } = useAuth();
  // null = hali yuklanmagan. Reja shundan HOSILA qilib chiqariladi, shuning uchun
  // effekt ichida sinxron setState chaqirilmaydi.
  const [rows, setRows] = useState<EntitlementRow[] | null>(null);
  // `Date.now()` ni render ichida chaqirib bo'lmaydi (prerender/hydration mos kelmaydi).
  const nowTs = useClientNow();

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    supabase
      .from("entitlements")
      .select("plan,expires_at")
      .eq("user_id", user.id)
      .then(({ data, error }) => {
        if (cancelled) return;
        setRows(error ? [] : ((data as EntitlementRow[]) ?? []));
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  return useMemo<PlanState>(() => {
    if (!user) {
      return { plan: "guest", loading: authLoading, expiresAt: null, isPro: false };
    }
    if (rows === null || nowTs === null) {
      return { plan: "free", loading: true, expiresAt: null, isPro: false };
    }

    const now = nowTs;
    const active = rows.filter((r) => !r.expires_at || new Date(r.expires_at).getTime() > now);
    const plan: ClientPlan = active.some((r) => r.plan === "org")
      ? "org"
      : active.some((r) => r.plan === "pro")
        ? "pro"
        : "free";

    return {
      plan,
      loading: false,
      expiresAt: active.find((r) => r.plan === plan)?.expires_at ?? null,
      isPro: plan === "pro" || plan === "org",
    };
  }, [user, authLoading, rows, nowTs]);
}
