"use client";

// Dars progressi: localStorage (mehmon uchun) + Supabase (login qilganda).
// `progress.ts` dagi bilan bir xil yondashuv — UI har doim lokal keshdan o'qiydi,
// server esa fon rejimida sinxronlanadi.

import { useCallback } from "react";
import { supabase } from "./supabase";
import { useStoredJSON, writeJSON, readJSON } from "./clientStore";

const KEY = "kmb_lesson_progress";

export interface LessonRecord {
  status: "done";
  score: number;
  completedAt: string;
}

type ProgressMap = Record<string, LessonRecord>;

const EMPTY: ProgressMap = {};

export function useLessonProgress(): {
  progress: ProgressMap;
  complete: (trackId: string, lessonId: string, score: number) => void;
} {
  const progress = useStoredJSON<ProgressMap>(KEY, EMPTY);

  const complete = useCallback((trackId: string, lessonId: string, score: number) => {
    const current = readJSON<ProgressMap>(KEY, {});
    const record: LessonRecord = {
      status: "done",
      score,
      completedAt: new Date().toISOString(),
    };
    writeJSON(KEY, { ...current, [lessonId]: record });

    void (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const userId = data.user?.id;
        if (!userId) return;
        await supabase.from("lesson_progress").upsert(
          {
            user_id: userId,
            track_id: trackId,
            lesson_id: lessonId,
            status: "done",
            score,
            completed_at: record.completedAt,
          },
          { onConflict: "user_id,track_id,lesson_id" }
        );
      } catch (e) {
        console.warn("lesson progress sync deferred:", e);
      }
    })();
  }, []);

  return { progress, complete };
}
