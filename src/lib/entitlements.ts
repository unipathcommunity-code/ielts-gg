// ─────────────────────────────────────────────────────────────────────────────
// ENTITLEMENTS — kim nimaga haqli va kuniga qancha AI sarflashi mumkin.
// SERVER-ONLY: bu fayl SUPABASE_SECRET_KEY bilan ishlaydi, klientdan import qilinmaydi.
//
// Nega kerak: ilgari "premium" localStorage'dagi `ielts_premium_unlocked` bayrog'i
// edi — har kim DevTools'dan yoqib olardi va har bir AI chaqiruv bizga pul turardi.
// Endi qaror faqat serverda, Supabase'dagi `entitlements` jadvali asosida qabul
// qilinadi; sarf `usage_events` ga yoziladi.
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { supabaseAdmin } from "./supabaseAdmin";

export type Plan = "guest" | "free" | "pro" | "org";
export type UsageKind = "evaluate" | "chat" | "tts" | "generate";

/** Kunlik limitlar. -1 = cheksiz emas, shunchaki juda baland (suiiste'mol to'sig'i). */
const DAILY_LIMITS: Record<Plan, Record<UsageKind, number>> = {
  guest: { evaluate: 1, chat: 15, tts: 30, generate: 0 },
  free: { evaluate: 3, chat: 40, tts: 80, generate: 0 },
  pro: { evaluate: 100, chat: 1000, tts: 2000, generate: 0 },
  org: { evaluate: 200, chat: 2000, tts: 4000, generate: 0 },
};

export interface Requester {
  userId: string | null;
  /** Login qilmaganlar uchun klient bergan barqaror kalit. */
  anonKey: string | null;
  plan: Plan;
}

/**
 * So'rovdan foydalanuvchini aniqlaydi. Klient `Authorization: Bearer <token>`
 * yuboradi (`authHeaders()` ga qarang). Token bo'lmasa — mehmon.
 */
export async function resolveRequester(req: Request): Promise<Requester> {
  const anonKey = req.headers.get("x-anon-key");
  const auth = req.headers.get("authorization") || "";
  const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";

  if (!token) return { userId: null, anonKey, plan: "guest" };

  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) return { userId: null, anonKey, plan: "guest" };
    const plan = await planForUser(data.user.id);
    return { userId: data.user.id, anonKey, plan };
  } catch {
    return { userId: null, anonKey, plan: "guest" };
  }
}

/** Amaldagi reja: muddati o'tmagan eng kuchli entitlement. */
export async function planForUser(userId: string): Promise<Plan> {
  try {
    const { data, error } = await supabaseAdmin
      .from("entitlements")
      .select("plan,expires_at")
      .eq("user_id", userId);

    if (error || !data?.length) return "free";

    const now = Date.now();
    const active = data.filter(
      (r: { plan: string; expires_at: string | null }) =>
        !r.expires_at || new Date(r.expires_at).getTime() > now
    );
    if (active.some((r) => r.plan === "org")) return "org";
    if (active.some((r) => r.plan === "pro")) return "pro";
    return "free";
  } catch {
    return "free";
  }
}

async function usedToday(who: Requester, kind: UsageKind): Promise<number> {
  const since = new Date();
  since.setHours(0, 0, 0, 0);

  let query = supabaseAdmin
    .from("usage_events")
    .select("units")
    .eq("kind", kind)
    .gte("created_at", since.toISOString());

  if (who.userId) query = query.eq("user_id", who.userId);
  else if (who.anonKey) query = query.eq("anon_key", who.anonKey);
  else return 0;

  const { data, error } = await query;
  if (error || !data) return 0;
  return data.reduce((sum: number, r: { units: number | null }) => sum + (r.units || 1), 0);
}

export async function recordUsage(
  who: Requester,
  kind: UsageKind,
  trackId?: string,
  units = 1
): Promise<void> {
  try {
    await supabaseAdmin.from("usage_events").insert({
      user_id: who.userId,
      anon_key: who.userId ? null : who.anonKey,
      kind,
      track_id: trackId ?? null,
      units,
    });
  } catch {
    // Hisobga olish yiqilsa ham foydalanuvchini to'xtatmaymiz.
  }
}

export interface QuotaDenial {
  response: NextResponse;
}

/**
 * Qimmat route'lar boshida chaqiriladi.
 * Ruxsat bo'lsa `{ who }`, bo'lmasa `{ denied }` qaytaradi — chaqiruvchi
 * `denied.response` ni darhol qaytaradi.
 */
export async function checkQuota(
  req: Request,
  kind: UsageKind,
  trackId?: string
): Promise<{ who: Requester; denied?: undefined } | { who?: undefined; denied: QuotaDenial }> {
  const who = await resolveRequester(req);
  const limit = DAILY_LIMITS[who.plan][kind];

  // Supabase sozlanmagan bo'lsa (lokal ishlab chiqish) — bloklamaymiz.
  if (!process.env.SUPABASE_SECRET_KEY) return { who };

  const used = await usedToday(who, kind);
  if (used >= limit) {
    const isGuest = who.plan === "guest";
    return {
      denied: {
        response: NextResponse.json(
          {
            error: "quota_exceeded",
            plan: who.plan,
            limit,
            used,
            message: isGuest
              ? "Bepul sinov limiti tugadi. Davom etish uchun ro'yxatdan o'ting."
              : who.plan === "free"
                ? `Bugungi bepul limit tugadi (${limit} ta). Pro rejaga o'tsangiz cheksiz davom etasiz.`
                : "Kunlik limitga yetdingiz. Bir ozdan keyin urinib ko'ring.",
            upgradeUrl: isGuest ? "/login" : "/pro",
          },
          { status: 402 }
        ),
      },
    };
  }

  void recordUsage(who, kind, trackId);
  return { who };
}

export function limitsFor(plan: Plan): Record<UsageKind, number> {
  return DAILY_LIMITS[plan];
}
