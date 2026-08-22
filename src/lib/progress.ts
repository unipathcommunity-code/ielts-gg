"use client";

// ─────────────────────────────────────────────────────────────────────────────
// PROGRESS — test tarixi va yo'nalishga yozilish uchun yagona qatlam.
//
// Strategiya: localStorage har doim yoziladi va UI faqat undan o'qiydi (tez,
// offline ishlaydi, mehmon foydalanuvchi ham yo'qotmaydi). Login qilingan bo'lsa
// har yozuv fon rejimida Supabase'ga ham ketadi, kirish paytida esa serverdagi
// yozuvlar lokal keshga qo'shiladi. Shu sababli telefonda topshirilgan test
// kompyuterda ham ko'rinadi, lekin bironta sahifa qayta yozilmaydi.
//
// Eski `ielts_test_history` kaliti ATAYIN saqlanadi — mavjud foydalanuvchilarning
// tarixi migratsiyada yo'qolmasligi kerak.
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from "./supabase";
import { readJSON, writeJSON, notifyStoreChanged } from "./clientStore";
import { DEFAULT_TRACK_ID } from "./tracks";
import type { TestHistoryRecord } from "./useTestHistory";

export const HISTORY_KEY = "ielts_test_history";
export const ACTIVE_TRACK_KEY = "kmb_active_track";
/** Eski funnel kaliti — mavjud brauzerlarda turgan qiymatni tashlab yubormaymiz. */
export const LEGACY_COURSE_KEY = "ielts_practice_course";

interface AttemptRow {
  client_id: string;
  track_id: string;
  skill: string;
  content_id: string | null;
  band: number;
  correct: number | null;
  total: number | null;
  duration_sec: number | null;
  detail: Record<string, unknown>;
  created_at: string;
}

// ── Lokal tarix ──────────────────────────────────────────────────────────────

export function loadHistory(): TestHistoryRecord[] {
  const raw = readJSON<TestHistoryRecord[]>(HISTORY_KEY, []);
  return Array.isArray(raw) ? raw : [];
}

function saveHistory(records: TestHistoryRecord[]): void {
  writeJSON(HISTORY_KEY, records);
}

/** Yozuvlarni client id bo'yicha takrorsiz birlashtirib, yangidan eskiga saralaydi. */
function mergeRecords(a: TestHistoryRecord[], b: TestHistoryRecord[]): TestHistoryRecord[] {
  const byId = new Map<string, TestHistoryRecord>();
  for (const r of [...a, ...b]) {
    if (!r || !r.id) continue;
    const existing = byId.get(r.id);
    // Serverdan kelgan yozuv lokaldagini to'ldiradi, lekin ustidan bosib yozmaydi.
    byId.set(r.id, existing ? { ...r, ...existing } : r);
  }
  return [...byId.values()].sort((x, y) => (y.date || "").localeCompare(x.date || ""));
}

// ── Track ↔ yozuv ────────────────────────────────────────────────────────────

export function getActiveTrackId(): string {
  try {
    const stored = localStorage.getItem(ACTIVE_TRACK_KEY);
    if (stored) return stored;
    // Funnel eski kalitga yozgan bo'lishi mumkin: "multilevel", "grammar", "topik2"...
    const legacy = localStorage.getItem(LEGACY_COURSE_KEY);
    if (legacy) return normalizeLegacyCourse(legacy);
  } catch {}
  return DEFAULT_TRACK_ID;
}

export function setActiveTrackId(trackId: string): void {
  try {
    localStorage.setItem(ACTIVE_TRACK_KEY, trackId);
  } catch {}
  notifyStoreChanged();
}

/** `/start` funnel'ining eski kurs kalitlarini track id'lariga o'giradi. */
export function normalizeLegacyCourse(course: string): string {
  const map: Record<string, string> = {
    ielts: "ielts",
    multilevel: "multilevel",
    grammar: "grammar-en",
    speaking: "speaking-en",
    general: "speaking-en",
    topik1: "topik",
    topik2: "topik",
    eps: "topik",
    jlpt: "jlpt",
    hsk: "hsk",
  };
  return map[course] || DEFAULT_TRACK_ID;
}

function recordToRow(r: TestHistoryRecord): AttemptRow {
  const { id, type, date, band, correct, total, passageId, trackId, ...rest } = r;
  return {
    client_id: id,
    track_id: trackId || getActiveTrackId(),
    skill: type,
    content_id: passageId ?? null,
    band: Number(band) || 0,
    correct: correct ?? null,
    total: total ?? null,
    duration_sec: (rest.durationSec as number) ?? null,
    detail: rest as Record<string, unknown>,
    created_at: date,
  };
}

function rowToRecord(row: AttemptRow): TestHistoryRecord {
  const detail = (row.detail || {}) as Record<string, unknown>;
  return {
    ...detail,
    id: row.client_id,
    type: row.skill as TestHistoryRecord["type"],
    date: row.created_at,
    band: Number(row.band),
    correct: row.correct ?? undefined,
    total: row.total ?? undefined,
    passageId: row.content_id ?? undefined,
    trackId: row.track_id,
  };
}

// ── Yozish ───────────────────────────────────────────────────────────────────

/**
 * Test natijasini saqlaydi: darhol localStorage'ga, keyin (login bo'lsa) Supabase'ga.
 * Supabase yiqilsa ham UI ishlayveradi — yozuv keyingi kirishda yuboriladi.
 */
export function saveAttempt(record: TestHistoryRecord): TestHistoryRecord[] {
  const withTrack: TestHistoryRecord = {
    ...record,
    trackId: record.trackId || getActiveTrackId(),
  };
  const next = mergeRecords([withTrack], loadHistory());
  saveHistory(next);
  void pushAttempt(withTrack);
  return next;
}

async function pushAttempt(record: TestHistoryRecord): Promise<void> {
  try {
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id;
    if (!userId) return;
    await supabase
      .from("attempts")
      .upsert({ user_id: userId, ...recordToRow(record) }, { onConflict: "user_id,client_id" });
  } catch (e) {
    console.warn("attempt sync deferred:", e);
  }
}

// ── Sinxronizatsiya ──────────────────────────────────────────────────────────

/**
 * Kirishdan keyin bir marta chaqiriladi: serverdagi yozuvlarni lokalga qo'shadi va
 * hali yuborilmagan lokal yozuvlarni serverga jo'natadi. Hech narsa o'chirilmaydi.
 */
export async function syncProgress(userId: string): Promise<void> {
  try {
    const { data, error } = await supabase
      .from("attempts")
      .select("client_id,track_id,skill,content_id,band,correct,total,duration_sec,detail,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      console.warn("progress sync (pull) failed:", error.message);
      return;
    }

    const remote = (data as AttemptRow[] | null)?.map(rowToRecord) ?? [];
    const local = loadHistory();
    const merged = mergeRecords(local, remote);
    saveHistory(merged);

    const remoteIds = new Set(remote.map((r) => r.id));
    const pending = local.filter((r) => !remoteIds.has(r.id));
    if (pending.length) {
      const rows = pending.map((r) => ({ user_id: userId, ...recordToRow(r) }));
      const { error: pushError } = await supabase
        .from("attempts")
        .upsert(rows, { onConflict: "user_id,client_id" });
      if (pushError) console.warn("progress sync (push) failed:", pushError.message);
    }
  } catch (e) {
    console.warn("progress sync failed:", e);
  }
}

// ── Yo'nalishga yozilish ─────────────────────────────────────────────────────

export interface EnrollmentInput {
  trackId: string;
  startLevel?: string;
  targetScore?: string;
  weakness?: string;
  deadline?: string;
}

/** Foydalanuvchini yo'nalishga yozadi va uni aktiv qiladi. Mehmon uchun lokal. */
export async function enroll(input: EnrollmentInput): Promise<void> {
  setActiveTrackId(input.trackId);
  try {
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id;
    if (!userId) return;

    await supabase.from("enrollments").upsert(
      {
        user_id: userId,
        track_id: input.trackId,
        start_level: input.startLevel ?? null,
        target_score: input.targetScore ?? null,
        weakness: input.weakness ?? null,
        deadline: input.deadline ?? null,
        last_active: new Date().toISOString().slice(0, 10),
      },
      { onConflict: "user_id,track_id" }
    );

    await supabase
      .from("profiles")
      .upsert({ user_id: userId, active_track: input.trackId, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  } catch (e) {
    console.warn("enroll deferred:", e);
  }
}

export interface EnrollmentRow {
  track_id: string;
  start_level: string | null;
  target_score: string | null;
  weakness: string | null;
  deadline: string | null;
  streak_days: number;
}

export async function listEnrollments(userId: string): Promise<EnrollmentRow[]> {
  const { data, error } = await supabase
    .from("enrollments")
    .select("track_id,start_level,target_score,weakness,deadline,streak_days")
    .eq("user_id", userId);
  if (error) {
    console.warn("enrollments load failed:", error.message);
    return [];
  }
  return (data as EnrollmentRow[]) || [];
}
