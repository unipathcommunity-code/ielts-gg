// Shared band-rounding + streak-calculation helpers, previously copy-pasted
// independently in src/app/{profile,stats,test/mock}/page.tsx.

const UZ_MONTHS = [
  "yanvar", "fevral", "mart", "aprel", "may", "iyun",
  "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr",
];

/**
 * Formats a date as "12 iyul 2026" in Uzbek. Node's ICU build on Vercel only ships
 * full data for a handful of locales — toLocaleDateString("uz-UZ", {month:"long"})
 * silently falls back to "M07" instead of throwing, so we spell months out by hand.
 */
export function formatUzbekDate(input: string | Date): string {
  const d = new Date(input);
  return `${d.getDate()} ${UZ_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** Same as formatUzbekDate but appends "HH:MM" for history/log-style timestamps. */
export function formatUzbekDateTime(input: string | Date): string {
  const d = new Date(input);
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  return `${formatUzbekDate(d)}, ${hh}:${mm}`;
}

/** Rounds a raw average band to the nearest official IELTS-style 0.5 step. */
export function roundIelts(v: number): number {
  const dec = v - Math.floor(v);
  if (dec < 0.25) return Math.floor(v);
  if (dec < 0.75) return Math.floor(v) + 0.5;
  return Math.ceil(v);
}

const DAY_MS = 86400000;

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Consecutive-day streak (including today) ending at the most recent active day. */
export function computeStreak(activityDates: (string | Date)[]): number {
  const activeDays = new Set(activityDates.map((d) => dayKey(new Date(d))));
  let streak = 0;
  for (let i = 0; i < 400; i++) {
    const d = new Date(Date.now() - i * DAY_MS);
    if (activeDays.has(dayKey(d))) {
      streak++;
    } else if (i === 0) {
      continue;
    } else {
      break;
    }
  }
  return streak;
}
