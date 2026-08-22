"use client";

// `/start` funnel'ida tuzilgan shaxsiy reja (`ielts_prep_data`) ni o'qish.
// Ilgari har sahifa buni o'z effekti ichida JSON.parse qilib setState qilardi —
// 6 joyda takrorlangan, birinchi kadrda har doim bo'sh qiymat ko'rsatadigan va
// React 19 lint'ida xato beradigan naqsh edi.

import { useStoredJSON } from "./clientStore";

export interface PrepPlan {
  name?: string;
  language?: string;
  course?: string;
  exam_date?: string;
  level?: string;
  target?: string;
  weakness?: string;
}

const EMPTY: PrepPlan = {};

export function usePrepPlan(): PrepPlan {
  return useStoredJSON<PrepPlan>("ielts_prep_data", EMPTY);
}

/** Foydalanuvchi maqsad qilgan daraja ("7.0", "B2", "N2"...). */
export function useTargetLevel(): string {
  return usePrepPlan().target || "";
}
