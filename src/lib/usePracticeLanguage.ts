"use client";

// ─────────────────────────────────────────────────────────────────────────────
// MOSLIK QATLAMI. Ilgari bu hook mustaqil `ielts_practice_language` kalitini
// boshqarardi va "qaysi imtihon" degan savolga TIL orqali javob berardi. Bu
// noto'g'ri edi: bitta tilda bir nechta imtihon bo'ladi (ingliz tili → IELTS,
// Multilevel, Grammatika), til esa ularni ajrata olmaydi.
//
// Endi haqiqat manbai — aktiv YO'NALISH (`useTrack`). Bu hook o'sha yo'nalishning
// tilini qaytaradi, shuning uchun uni chaqiruvchi o'nlab joyni o'zgartirish
// shart bo'lmadi. Yangi kod to'g'ridan-to'g'ri `useTrack()` ni ishlatsin.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback } from "react";
import { useTrack } from "./useTrack";
import { getTracksForLanguage } from "./tracks";
import { getActiveTrackId, setActiveTrackId } from "./progress";
import { getTrack } from "./tracks";

/** Hook'siz o'qish kerak bo'lgan joylar uchun (masalan event handler ichida). */
export function getStoredPracticeLanguage(): string {
  try {
    return getTrack(getActiveTrackId()).language;
  } catch {
    return "english";
  }
}

export function usePracticeLanguage(): [string, (lang: string) => void] {
  const { track } = useTrack();

  // Tilni almashtirish = o'sha tildagi birinchi yo'nalishga o'tish.
  const setLanguage = useCallback((lang: string) => {
    const candidates = getTracksForLanguage(lang);
    if (candidates.length) setActiveTrackId(candidates[0].id);
  }, []);

  return [track.language, setLanguage];
}
