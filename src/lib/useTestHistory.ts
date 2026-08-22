/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo } from "react";
import { useStoredJSON } from "./clientStore";
import { HISTORY_KEY, loadHistory, saveAttempt } from "./progress";

const EMPTY: TestHistoryRecord[] = [];

export interface TestHistoryRecord {
  id: string;
  type: "reading" | "listening" | "writing" | "speaking" | "mock";
  date: string;
  band: number;
  correct?: number;
  total?: number;
  passageId?: string;
  criteria?: Record<string, any>;
  improvements?: string[];
  /** Eski yozuvlarda bor — qaysi tilda topshirilgani. */
  language?: string;
  /** Qaysi yo'nalishda topshirilgan. Eski yozuvlarda yo'q -> "ielts" deb qaraladi. */
  trackId?: string;
  [key: string]: any;
}

export function loadTestHistory(): TestHistoryRecord[] {
  return loadHistory();
}

/**
 * Yangi yozuvni qo'shadi va saqlaydi. Endi faqat localStorage emas — login
 * qilingan bo'lsa Supabase'ga ham ketadi (`progress.saveAttempt`).
 */
export function appendTestHistory(record: TestHistoryRecord): TestHistoryRecord[] {
  return saveAttempt(record);
}

export function clearTestHistory(): void {
  // Lokal keshni tozalaydi. Serverdagi yozuvlarga tegmaydi — keyingi kirishda qaytadi.
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch {}
    window.dispatchEvent(new Event("kmb:store-changed"));
  }
}

/** Barcha yo'nalishlar bo'yicha tarix — jonli, tablar aro sinxron. */
export function useTestHistory(): TestHistoryRecord[] {
  return useStoredJSON<TestHistoryRecord[]>(HISTORY_KEY, EMPTY);
}

/**
 * Faqat bitta yo'nalishning tarixi. Aynan shu narsa yetishmasdi: har yo'nalish
 * o'z statistikasini ko'rsatishi kerak, IELTS va Multilevel natijalari
 * bir o'rtachaga qo'shilib ketmasligi kerak.
 */
export function useTrackHistory(trackId: string): TestHistoryRecord[] {
  const all = useTestHistory();
  return useMemo(
    () => all.filter((r) => (r.trackId || "ielts") === trackId),
    [all, trackId]
  );
}
