"use client";

// ─────────────────────────────────────────────────────────────────────────────
// localStorage uchun SSR-xavfsiz, hook-buglarsiz qatlam.
//
// Muammo: kodbazada 27 joyda bir xil naqsh bor edi —
//     const [x, setX] = useState(fallback);
//     useEffect(() => { setX(JSON.parse(localStorage.getItem(k))) }, []);
// Bu React 19 da `react-hooks/set-state-in-effect` xatosi beradi va haqiqiy zarari
// ham bor: birinchi kadr har doim noto'g'ri qiymat bilan chiziladi (ekran "sakraydi"),
// boshqa tab yoki boshqa komponent qiymatni o'zgartirsa — bu komponent bilmay qoladi.
//
// Yechim: `useSyncExternalStore`. React'ning tashqi manba bilan sinxronlash uchun
// mo'ljallangan rasmiy API'si — effekt ham, setState ham kerak emas, hydration
// mos keladi va bir kalitni o'qiyotgan hamma komponent bir vaqtda yangilanadi.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useSyncExternalStore } from "react";

const CHANGE_EVENT = "kmb:store-changed";

/**
 * getSnapshot referensial barqaror bo'lishi SHART — aks holda React cheksiz
 * qayta chizadi. Shuning uchun xom satrni ham, parse qilingan qiymatni ham
 * keshlaymiz va xom satr o'zgarmagunicha aynan o'sha obyektni qaytaramiz.
 */
const snapshotCache = new Map<string, { raw: string | null; parsed: unknown }>();

/** SSR va birinchi kadr uchun barqaror fallback identifikatorlari. */
const fallbackCache = new Map<string, unknown>();

function stableFallback<T>(key: string, fallback: T): T {
  if (!fallbackCache.has(key)) fallbackCache.set(key, fallback);
  return fallbackCache.get(key) as T;
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function notify(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(CHANGE_EVENT));
}

// ── To'g'ridan-to'g'ri o'qish/yozish (hook emas) ──────────────────────────────

/** Xom satr. Hech qachon otmaydi (private rejimda localStorage bloklanishi mumkin). */
export function readRaw(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function readJSON<T>(key: string, fallback: T): T {
  const raw = readRaw(key);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
  notify();
}

export function writeRaw(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {}
  notify();
}

export function removeKey(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {}
  notify();
}

/** Boshqa modul localStorage'ni to'g'ridan-to'g'ri o'zgartirgan bo'lsa chaqiriladi. */
export function notifyStoreChanged(): void {
  notify();
}

// ── Hooklar ──────────────────────────────────────────────────────────────────

const alwaysTrue = () => true;
const alwaysFalse = () => false;
const noopSubscribe = () => () => {};

/**
 * Klientda hydration tugaganini bildiradi — `useState(false)` + `useEffect(setTrue)`
 * naqshining setState'siz o'rnini bosadi. Faqat brauzerda ma'noga ega narsani
 * (masalan `window`, `Date.now()`) chizishdan oldin ishlatiladi.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(noopSubscribe, alwaysTrue, alwaysFalse);
}

/** Kalitning JSON qiymati — jonli, tablar aro sinxron, faqat o'qish uchun. */
export function useStoredJSON<T>(key: string, fallback: T): T {
  const initial = stableFallback(key, fallback);

  const getSnapshot = useCallback((): T => {
    const raw = readRaw(key);
    const cached = snapshotCache.get(key);
    if (cached && cached.raw === raw) return cached.parsed as T;

    let parsed: T = initial;
    if (raw !== null) {
      try {
        parsed = JSON.parse(raw) as T;
      } catch {
        parsed = initial;
      }
    }
    snapshotCache.set(key, { raw, parsed });
    return parsed;
  }, [key, initial]);

  const getServerSnapshot = useCallback(() => initial, [initial]);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Kalitning xom satr qiymati (JSON emas — tema, til kodi kabi oddiy qiymatlar). */
export function useStoredRaw(key: string, fallback: string): string {
  const initial = stableFallback(`raw:${key}`, fallback);
  const getSnapshot = useCallback(() => readRaw(key) ?? initial, [key, initial]);
  const getServerSnapshot = useCallback(() => initial, [initial]);
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** `useState` ga o'xshash, lekin qiymat localStorage'da va hamma joyda sinxron. */
export function useStoredState<T>(key: string, fallback: T): [T, (value: T) => void] {
  const value = useStoredJSON<T>(key, fallback);
  const setValue = useCallback((next: T) => writeJSON(key, next), [key]);
  return [value, setValue];
}

/** Xom satrli variant. */
export function useStoredRawState(key: string, fallback: string): [string, (value: string) => void] {
  const value = useStoredRaw(key, fallback);
  const setValue = useCallback((next: string) => writeRaw(key, next), [key]);
  return [value, setValue];
}
