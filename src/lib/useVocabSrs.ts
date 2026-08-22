"use client";

// Lug'at SRS (intervalli takror) ma'lumotini o'qish.
// Ilgari `stats`, `profile` va `vocabulary` sahifalarining har biri o'z effekti
// ichida `localStorage.getItem("ielts_vocab_srs")` ni parse qilib setState qilardi.

import { useMemo } from "react";
import { useStoredJSON } from "./clientStore";

export interface SrsEntry {
  interval: number;
  ease?: number;
  due?: number;
  reps?: number;
}

const EMPTY: Record<string, SrsEntry> = {};

export function useVocabSrs(): Record<string, SrsEntry> {
  return useStoredJSON<Record<string, SrsEntry>>("ielts_vocab_srs", EMPTY);
}

/** Kamida bir marta muvaffaqiyatli takrorlangan (interval >= 1 kun) so'zlar soni. */
export function useVocabLearnedCount(): number {
  const srs = useVocabSrs();
  return useMemo(
    () => Object.values(srs).filter((s) => (s?.interval ?? 0) >= 1).length,
    [srs]
  );
}
