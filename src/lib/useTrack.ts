"use client";

// ─────────────────────────────────────────────────────────────────────────────
// "Men hozir qaysi yo'nalishdaman" — bitta javob beruvchi hook.
//
// Ustuvorlik: URL (/t/[track]/...) → saqlangan aktiv yo'nalish → eski funnel
// kaliti (`ielts_practice_course`) → IELTS.
//
// URL birinchi o'rinda turishi muhim: shu tufayli ikki yo'nalishni ikki tabda
// ochib, ularni aralashtirib yubormasdan ishlash mumkin.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useStoredRaw } from "./clientStore";
import { ACTIVE_TRACK_KEY, LEGACY_COURSE_KEY, normalizeLegacyCourse, setActiveTrackId } from "./progress";
import { DEFAULT_TRACK_ID, getTrack, isTrackId, type Track } from "./tracks";

export interface TrackState {
  track: Track;
  trackId: string;
  /** URL'dan kelganmi (ya'ni yo'nalish sahifasi ichidamizmi). */
  fromRoute: boolean;
  setTrack: (id: string) => void;
}

export function useTrack(): TrackState {
  const params = useParams<{ track?: string | string[] }>();
  const raw = params?.track;
  const routeTrack = Array.isArray(raw) ? raw[0] : raw;
  const fromRoute = isTrackId(routeTrack);

  const stored = useStoredRaw(ACTIVE_TRACK_KEY, "");
  const legacy = useStoredRaw(LEGACY_COURSE_KEY, "");

  let trackId = DEFAULT_TRACK_ID;
  if (fromRoute && routeTrack) trackId = routeTrack;
  else if (isTrackId(stored)) trackId = stored;
  else if (legacy) trackId = normalizeLegacyCourse(legacy);

  // URL bo'yicha kelgan yo'nalishni aktiv qilib qo'yamiz, shunda foydalanuvchi
  // `/dashboard` ga qaytganda ham o'sha yo'nalishda qoladi.
  useEffect(() => {
    if (fromRoute && routeTrack && routeTrack !== stored) setActiveTrackId(routeTrack);
  }, [fromRoute, routeTrack, stored]);

  return {
    track: getTrack(trackId),
    trackId,
    fromRoute,
    setTrack: setActiveTrackId,
  };
}
