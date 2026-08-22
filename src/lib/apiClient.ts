"use client";

// ─────────────────────────────────────────────────────────────────────────────
// AI route'lariga so'rov yuborish uchun yagona nuqta.
//
// Ikki vazifasi bor:
//  1. Kim so'rayotganini serverga bildirish — Supabase sessiya tokeni + mehmonlar
//     uchun barqaror anon kalit. Serverdagi `entitlements.ts` shu asosda kvota qo'yadi.
//  2. Limit tugaganda (HTTP 402) tushunarli o'zbekcha xato berish, "Failed to fetch"
//     emas.
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from "./supabase";

const ANON_KEY_STORAGE = "kmb_anon_key";

export function getAnonKey(): string {
  try {
    let key = localStorage.getItem(ANON_KEY_STORAGE);
    if (!key) {
      key = crypto.randomUUID();
      localStorage.setItem(ANON_KEY_STORAGE, key);
    }
    return key;
  } catch {
    return "anonymous";
  }
}

export async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { "x-anon-key": getAnonKey() };
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) headers.Authorization = `Bearer ${token}`;
  } catch {}
  return headers;
}

export class QuotaError extends Error {
  readonly plan: string;
  readonly limit: number;
  readonly upgradeUrl: string;
  constructor(payload: { message?: string; plan?: string; limit?: number; upgradeUrl?: string }) {
    super(payload.message || "Kunlik limit tugadi.");
    this.name = "QuotaError";
    this.plan = payload.plan || "free";
    this.limit = payload.limit ?? 0;
    this.upgradeUrl = payload.upgradeUrl || "/pro";
  }
}

/**
 * `fetch` bilan bir xil imzo — mavjud chaqiruvlar shunchaki nomini almashtiradi.
 * Kvota tugagan bo'lsa QuotaError otadi.
 */
export async function aiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const extra = await authHeaders();
  const headers = new Headers(init.headers || {});
  for (const [k, v] of Object.entries(extra)) headers.set(k, v);

  const res = await fetch(input, { ...init, headers });

  if (res.status === 402) {
    let payload: Record<string, unknown> = {};
    try {
      payload = await res.clone().json();
    } catch {}
    throw new QuotaError(payload as { message?: string; plan?: string; limit?: number; upgradeUrl?: string });
  }

  return res;
}
