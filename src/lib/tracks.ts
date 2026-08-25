// ─────────────────────────────────────────────────────────────────────────────
// TRACK REGISTRY — "foydalanuvchi qaysi yo'nalishda o'qiyapti" ning yagona manbai.
//
// Nega kerak: `/start` funnel allaqachon yo'nalish so'raydi (IELTS / Multilevel /
// Grammatika / TOPIK / HSK / JLPT) va uni localStorage'ga yozadi, lekin bu tanlovni
// kodda hech kim o'qimasdi — hamma yo'nalish bir xil IELTS oqimiga tushardi.
// Endi har bir yo'nalishning o'z formati, o'z vaqti, o'z ball tizimi va o'z sahifasi bor.
//
// `examFormats.ts` o'chirilmaydi — u sertifikat va ball yorliqlari uchun ishlaydi va
// til darajasidagi haqiqat manbai bo'lib qoladi. `tracks.ts` undan yuqori qatlam:
// bitta til ichida bir nechta imtihon/kurs bo'lishi mumkin (ingliz tili → IELTS,
// Multilevel, Grammatika), `examFormats` esa buni ifodalay olmaydi.
// ─────────────────────────────────────────────────────────────────────────────

import { getExamFormat, type PracticeLanguage, type SkillKey } from "./examFormats";

// Chaqiruvchilar bitta joydan import qilishi uchun qayta eksport qilamiz.
export type { PracticeLanguage, SkillKey };

export type TrackKind = "exam" | "course";
export type TrackStatus = "live" | "beta" | "soon";

/** Ichki 0-9 "band-ekvivalenti" qanday ko'rsatilishi. */
export type ScoringScheme =
  | "band-9"      // IELTS: 0.0-9.0
  | "points-75"   // Multilevel: har bo'lim 0-75 ball, umumiy daraja CEFR
  | "cefr"        // A1-C2
  | "topik-level" // 1-6 daraja
  | "hsk-level"   // HSK 1-6
  | "jlpt-level"; // N5-N1

export interface TrackSection {
  skill: SkillKey;
  /** Rasmiy imtihondagi qismlar soni (Listening Part 1-4 kabi). */
  parts: number;
  /** Savollar soni. Writing/Speaking uchun null — ular AI tomonidan baholanadi. */
  questions: number | null;
  /** Writing uchun task soni. */
  tasks?: number;
  /** Bo'limga ajratilgan vaqt (daqiqa). */
  minutes: number;
  /** Rasmiy imtihon tarkibida bormi. false bo'lsa — bu qo'shimcha mashq. */
  official: boolean;
  note?: string;
}

export interface Track {
  id: string;
  language: PracticeLanguage;
  /** `examFormats.ts` dagi format kaliti. null bo'lsa — bu imtihon emas (kurs). */
  examFormat: PracticeLanguage | null;
  kind: TrackKind;
  status: TrackStatus;

  title: string;
  shortTitle: string;
  subtitle: string;
  emoji: string;
  /** Tailwind rang nomi — track kartalari va urg'ular uchun. */
  accent: "amber" | "cyan" | "emerald" | "violet" | "rose" | "sky" | "orange";

  sections: TrackSection[];
  scoring: ScoringScheme;
  /** Ko'rsatiladigan daraja shkalasi, pastdan yuqoriga. */
  levels: string[];
  /** Ball yorlig'i: "IELTS Band", "Umumiy ball (0-75)" ... */
  scoreLabel: string;
  /** Sertifikat uchun kerakli ichki band-ekvivalenti. */
  certificateThreshold: number;
  /** AI baholashga yo'llanma — `examFormats` dagisidan ustun turadi. */
  gradingRubricNote: string;
  /** Bepul rejada kuniga nechta AI baholash (writing/speaking) mumkin. */
  freeDailyAiGrades: number;
}

// ── Bo'lim shablonlari ───────────────────────────────────────────────────────

const IELTS_SECTIONS: TrackSection[] = [
  { skill: "listening", parts: 4, questions: 40, minutes: 30, official: true },
  { skill: "reading", parts: 3, questions: 40, minutes: 60, official: true },
  { skill: "writing", parts: 2, questions: null, tasks: 2, minutes: 60, official: true },
  { skill: "speaking", parts: 3, questions: null, minutes: 14, official: true },
];

// UzBMB rasmiy formati: 3 soat, har bo'lim 0-75 ball.
const MULTILEVEL_SECTIONS: TrackSection[] = [
  { skill: "listening", parts: 4, questions: 35, minutes: 45, official: true },
  { skill: "reading", parts: 5, questions: 35, minutes: 60, official: true },
  { skill: "writing", parts: 2, questions: null, tasks: 2, minutes: 60, official: true },
  { skill: "speaking", parts: 3, questions: null, minutes: 15, official: true },
];

const TOPIK2_SECTIONS: TrackSection[] = [
  { skill: "listening", parts: 1, questions: 50, minutes: 60, official: true },
  { skill: "reading", parts: 1, questions: 50, minutes: 70, official: true },
  { skill: "writing", parts: 1, questions: null, tasks: 4, minutes: 50, official: true },
  {
    skill: "speaking",
    parts: 1,
    questions: null,
    minutes: 15,
    official: false,
    note: "Standart TOPIK II tarkibida rasmiy Speaking bo'limi yo'q — bu qo'shimcha suhbat mashqi.",
  },
];

const HSK_SECTIONS: TrackSection[] = [
  { skill: "listening", parts: 3, questions: 40, minutes: 35, official: true },
  { skill: "reading", parts: 3, questions: 40, minutes: 40, official: true },
  { skill: "writing", parts: 1, questions: null, tasks: 1, minutes: 25, official: true },
  {
    skill: "speaking",
    parts: 3,
    questions: null,
    minutes: 12,
    official: false,
    note: "Rasmiy og'zaki imtihon (HSKK) asosiy HSK'dan alohida topshiriladi.",
  },
];

const JLPT_SECTIONS: TrackSection[] = [
  { skill: "reading", parts: 3, questions: 45, minutes: 70, official: true },
  { skill: "listening", parts: 5, questions: 35, minutes: 40, official: true },
  {
    skill: "writing",
    parts: 1,
    questions: null,
    tasks: 1,
    minutes: 30,
    official: false,
    note: "JLPT formatida yozma ijodiy bo'lim yo'q — bu qo'shimcha mashq.",
  },
  {
    skill: "speaking",
    parts: 3,
    questions: null,
    minutes: 12,
    official: false,
    note: "JLPT formatida Speaking bo'limi yo'q — bu qo'shimcha suhbat mashqi.",
  },
];

const TORFL_SECTIONS: TrackSection[] = [
  { skill: "listening", parts: 2, questions: 30, minutes: 35, official: true },
  { skill: "reading", parts: 3, questions: 25, minutes: 50, official: true },
  { skill: "writing", parts: 2, questions: null, tasks: 2, minutes: 50, official: true },
  { skill: "speaking", parts: 4, questions: null, minutes: 25, official: true },
];

const GOETHE_SECTIONS: TrackSection[] = [
  { skill: "listening", parts: 4, questions: 30, minutes: 40, official: true },
  { skill: "reading", parts: 5, questions: 30, minutes: 65, official: true },
  { skill: "writing", parts: 2, questions: null, tasks: 2, minutes: 60, official: true },
  { skill: "speaking", parts: 3, questions: null, minutes: 15, official: true },
];

// ── Registr ──────────────────────────────────────────────────────────────────

const TRACKS: Track[] = [
  {
    id: "ielts",
    language: "english",
    examFormat: "english",
    kind: "exam",
    status: "live",
    title: "IELTS Academic",
    shortTitle: "IELTS",
    subtitle: "Xalqaro imtihon — 4 ko'nikma, 0-9 band",
    emoji: "🎓",
    accent: "amber",
    sections: IELTS_SECTIONS,
    scoring: "band-9",
    levels: ["4.0", "4.5", "5.0", "5.5", "6.0", "6.5", "7.0", "7.5", "8.0", "8.5", "9.0"],
    scoreLabel: "IELTS Band",
    certificateThreshold: 6.0,
    gradingRubricNote:
      "Grade strictly against the official Cambridge IELTS band descriptors (Task Achievement/Response, Coherence & Cohesion, Lexical Resource, Grammatical Range & Accuracy).",
    freeDailyAiGrades: 1,
  },
  {
    id: "multilevel",
    language: "english",
    examFormat: null,
    kind: "exam",
    status: "live",
    title: "Multilevel (Milliy sertifikat)",
    shortTitle: "Multilevel",
    subtitle: "UzBMB CEFR imtihoni — har bo'lim 0-75 ball, B1/B2/C1",
    emoji: "🏆",
    accent: "emerald",
    sections: MULTILEVEL_SECTIONS,
    scoring: "points-75",
    levels: ["A2 va past", "B1", "B2", "C1"],
    scoreLabel: "Umumiy ball (0-75)",
    certificateThreshold: 5.5, // ≈ B2 chegarasi
    gradingRubricNote:
      "Grade against the Uzbekistan national Multilevel (CEFR) exam criteria used by UzBMB: task fulfilment, coherence, lexical range and grammatical accuracy, scored per section on a 0-75 scale and mapped to CEFR B1/B2/C1. Do NOT use IELTS band descriptors or mention IELTS bands.",
    freeDailyAiGrades: 1,
  },
  {
    id: "grammar-en",
    language: "english",
    examFormat: null,
    kind: "course",
    status: "beta",
    title: "Ingliz tili grammatikasi",
    shortTitle: "Grammatika",
    subtitle: "A1 dan C1 gacha — darslar, mashqlar, xato tahlili",
    emoji: "📚",
    accent: "violet",
    sections: [],
    scoring: "cefr",
    levels: ["A1", "A2", "B1", "B2", "C1"],
    scoreLabel: "CEFR darajasi",
    certificateThreshold: 5.0,
    gradingRubricNote:
      "Explain grammar mistakes in Uzbek, name the exact grammar rule involved, and give one corrected example. Judge against CEFR level descriptors, not IELTS bands.",
    freeDailyAiGrades: 3,
  },
  {
    id: "speaking-en",
    language: "english",
    examFormat: null,
    kind: "course",
    status: "live",
    title: "Ingliz tili so'zlashuv",
    shortTitle: "So'zlashuv",
    subtitle: "Jonli AI suhbatdosh — imtihonsiz, erkin gapirish",
    emoji: "🗣️",
    accent: "sky",
    sections: [{ skill: "speaking", parts: 1, questions: null, minutes: 15, official: false }],
    scoring: "cefr",
    levels: ["A1", "A2", "B1", "B2", "C1", "C2"],
    scoreLabel: "CEFR darajasi",
    certificateThreshold: 5.0,
    gradingRubricNote:
      "Judge conversational fluency and comprehensibility against CEFR descriptors. Be encouraging: this is free practice, not an exam.",
    freeDailyAiGrades: 3,
  },
  {
    id: "topik",
    language: "korean",
    examFormat: "korean",
    kind: "exam",
    status: "beta",
    title: "TOPIK II",
    shortTitle: "TOPIK",
    subtitle: "Koreys tili — 3, 4, 5, 6-darajalar",
    emoji: "🇰🇷",
    accent: "rose",
    sections: TOPIK2_SECTIONS,
    scoring: "topik-level",
    levels: ["1-daraja", "2-daraja", "3-daraja", "4-daraja", "5-daraja", "6-daraja"],
    scoreLabel: "TOPIK darajasi",
    certificateThreshold: 6.5,
    gradingRubricNote: getExamFormat("korean").gradingRubricNote,
    freeDailyAiGrades: 1,
  },
  {
    id: "hsk",
    language: "chinese",
    examFormat: "chinese",
    kind: "exam",
    status: "beta",
    title: "HSK",
    shortTitle: "HSK",
    subtitle: "Xitoy tili — HSK 1 dan 6 gacha",
    emoji: "🇨🇳",
    accent: "orange",
    sections: HSK_SECTIONS,
    scoring: "hsk-level",
    levels: ["HSK 1", "HSK 2", "HSK 3", "HSK 4", "HSK 5", "HSK 6"],
    scoreLabel: "HSK darajasi",
    certificateThreshold: 6.5,
    gradingRubricNote: getExamFormat("chinese").gradingRubricNote,
    freeDailyAiGrades: 1,
  },
  {
    id: "jlpt",
    language: "japanese",
    examFormat: "japanese",
    kind: "exam",
    status: "beta",
    title: "JLPT",
    shortTitle: "JLPT",
    subtitle: "Yapon tili — N5 dan N1 gacha",
    emoji: "🇯🇵",
    accent: "cyan",
    sections: JLPT_SECTIONS,
    scoring: "jlpt-level",
    levels: ["N5", "N4", "N3", "N2", "N1"],
    scoreLabel: "JLPT darajasi",
    certificateThreshold: 6.5,
    gradingRubricNote: getExamFormat("japanese").gradingRubricNote,
    freeDailyAiGrades: 1,
  },
  {
    id: "torfl",
    language: "russian",
    examFormat: "russian",
    kind: "exam",
    status: "beta",
    title: "TORFL / ТРКИ",
    shortTitle: "TORFL",
    subtitle: "Rus tili — A1 dan C2 gacha",
    emoji: "🇷🇺",
    accent: "sky",
    sections: TORFL_SECTIONS,
    scoring: "cefr",
    levels: ["A1", "A2", "B1", "B2", "C1", "C2"],
    scoreLabel: "TRKI darajasi",
    certificateThreshold: 6.0,
    gradingRubricNote: getExamFormat("russian").gradingRubricNote,
    freeDailyAiGrades: 1,
  },
  {
    id: "goethe",
    language: "german",
    examFormat: "german",
    kind: "exam",
    status: "beta",
    title: "Goethe-Zertifikat",
    shortTitle: "Goethe",
    subtitle: "Nemis tili — A1 dan C2 gacha",
    emoji: "🇩🇪",
    accent: "rose",
    sections: GOETHE_SECTIONS,
    scoring: "cefr",
    levels: ["A1", "A2", "B1", "B2", "C1", "C2"],
    scoreLabel: "CEFR darajasi",
    certificateThreshold: 6.0,
    gradingRubricNote: getExamFormat("german").gradingRubricNote,
    freeDailyAiGrades: 1,
  },
];

export const DEFAULT_TRACK_ID = "ielts";

const BY_ID = new Map(TRACKS.map((t) => [t.id, t]));

export function getTrack(id: string | null | undefined): Track {
  return BY_ID.get(id || "") || BY_ID.get(DEFAULT_TRACK_ID)!;
}

export function isTrackId(id: string | null | undefined): boolean {
  return !!id && BY_ID.has(id);
}

export function getAllTracks(): Track[] {
  return TRACKS;
}

/** Faqat foydalanuvchiga ochiq yo'nalishlar ("soon" yashiriladi). */
export function getVisibleTracks(): Track[] {
  return TRACKS.filter((t) => t.status !== "soon");
}

export function getTracksForLanguage(language: string): Track[] {
  return TRACKS.filter((t) => t.language === language);
}

/** Shu track'da qaysi ko'nikmalar mashq qilinadi (rasmiy bo'lmaganlari ham). */
export function trackSkills(track: Track): SkillKey[] {
  return track.sections.map((s) => s.skill);
}

export function trackSection(track: Track, skill: SkillKey): TrackSection | undefined {
  return track.sections.find((s) => s.skill === skill);
}

// ── Ball ko'rsatish ──────────────────────────────────────────────────────────
//
// Ichkarida hamma narsa 0-9 "band-ekvivalenti"da saqlanadi (mavjud tarix, o'rtacha
// hisoblash va streak mantiqi shunga bog'liq — buzmaymiz). Faqat KO'RSATISHDA
// har track o'z shkalasiga o'giradi.

/** Multilevel 0-75 ball — ichki bandning chiziqli o'girmasi. */
export function bandToMultilevelPoints(band: number): number {
  return Math.max(0, Math.min(75, Math.round((band / 9) * 75)));
}

/** Multilevel ballidan CEFR darajasi. Taxminiy kesim — rasmiy jadval e'lon qilinmagan. */
export function multilevelLevelFromPoints(points: number): string {
  if (points >= 70) return "C1";
  if (points >= 60) return "B2";
  if (points >= 45) return "B1";
  return "A2 va past";
}

function cefrFromBand(band: number): string {
  if (band >= 8.5) return "C2";
  if (band >= 7.0) return "C1";
  if (band >= 5.5) return "B2";
  if (band >= 4.0) return "B1";
  if (band >= 3.0) return "A2";
  return "A1";
}

/** Track shkalasidagi asosiy ko'rsatkich, masalan "7.0", "64 ball", "4-daraja". */
export function trackScore(track: Track, band: number): string {
  switch (track.scoring) {
    case "band-9":
      return band.toFixed(1);
    case "points-75":
      return `${bandToMultilevelPoints(band)}`;
    case "cefr":
      return cefrFromBand(band);
    case "topik-level":
    case "hsk-level":
    case "jlpt-level":
      return track.examFormat ? getExamFormat(track.examFormat).nativeScoreFromBand(band) : cefrFromBand(band);
    default:
      return band.toFixed(1);
  }
}

/** Ko'rsatkich ostidagi daraja izohi, masalan "B2" yoki "Yaxshi". null bo'lishi mumkin. */
export function trackLevel(track: Track, band: number): string | null {
  if (track.scoring === "points-75") return multilevelLevelFromPoints(bandToMultilevelPoints(band));
  if (track.scoring === "band-9") return cefrFromBand(band);
  return null;
}

/** To'liq ko'rsatish matni: "7.0 band", "64 / 75 ball (B2)". */
export function trackScoreDisplay(track: Track, band: number): string {
  const score = trackScore(track, band);
  if (track.scoring === "points-75") {
    return `${score} / 75 · ${multilevelLevelFromPoints(Number(score))}`;
  }
  if (track.scoring === "band-9") return `${score} band`;
  return score;
}
