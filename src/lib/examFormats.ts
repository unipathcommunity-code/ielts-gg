// Single source of truth for "which real-world exam does each practice language map to".
// English keeps IELTS band scoring untouched everywhere (see PROJECT_RULES.md hard rules).
// The other languages get their own exam name, skill availability, and native score scale —
// instead of silently reusing the IELTS Reading/Listening/Writing/Speaking + 0-9 band shape.

export type PracticeLanguage = "english" | "russian" | "japanese" | "korean" | "chinese";
export type SkillKey = "reading" | "listening" | "writing" | "speaking";

export interface SkillAvailability {
  /** Part of the real standardized exam for this language. */
  official: boolean;
  /** Shown to the user when official === false, explaining why and that it's still useful practice. */
  note?: string;
}

export interface ExamFormat {
  id: PracticeLanguage;
  /** Native/Uzbek name of the language itself, e.g. "Koreys tili". */
  languageName: string;
  /** The real standardized exam this language's practice is modeled on. */
  examName: string;
  /** Short label used wherever the UI used to hardcode "IELTS Band" / "Overall Band". */
  scoreLabel: string;
  availableSkills: Record<SkillKey, SkillAvailability>;
  /**
   * Converts an internal 0-9 band-equivalent score (computed the same way for every language,
   * so history/averaging/streaks keep working unmodified) into the exam's native scale for display.
   * This is an approximation calibrated to official cut-off proportions, not an official conversion.
   */
  nativeScoreFromBand: (band: number) => string;
  /** How the grading AI should be instructed to judge writing/speaking responses. */
  gradingRubricNote: string;
  /**
   * Internal 0-9 band-equivalent a mock-exam average must reach to unlock a certificate.
   * Approximate per-format equivalents, not an official pass/fail line.
   */
  certificateThreshold: number;
}

const EXAM_FORMATS: Record<PracticeLanguage, ExamFormat> = {
  english: {
    id: "english",
    languageName: "Ingliz tili",
    examName: "IELTS",
    scoreLabel: "IELTS Band",
    availableSkills: {
      reading: { official: true },
      listening: { official: true },
      writing: { official: true },
      speaking: { official: true },
    },
    // Unchanged from the existing bandFromScore()/IELTS convention — band IS the native scale.
    nativeScoreFromBand: (band) => band.toFixed(1),
    gradingRubricNote: "Grade strictly against the official Cambridge IELTS band descriptors (Task Achievement/Response, Coherence & Cohesion, Lexical Resource, Grammatical Range & Accuracy).",
    certificateThreshold: 6.0,
  },
  russian: {
    id: "russian",
    languageName: "Rus tili",
    examName: "TORFL / TRKI",
    scoreLabel: "TRKI Darajasi",
    availableSkills: {
      reading: { official: true },
      listening: { official: true },
      writing: { official: true },
      speaking: { official: true },
    },
    nativeScoreFromBand: (band) => {
      if (band >= 8.5) return "C2";
      if (band >= 7.5) return "C1";
      if (band >= 6.5) return "B2";
      if (band >= 5.5) return "B1";
      if (band >= 4.0) return "A2";
      return "A1";
    },
    gradingRubricNote: "Grade against TORFL/TRKI (CEFR-aligned) criteria: lexical-grammatical accuracy, reading/listening comprehension depth, written coherence, and communicative competence — not IELTS descriptors.",
    certificateThreshold: 6.0,
  },
  korean: {
    id: "korean",
    languageName: "Koreys tili",
    examName: "TOPIK",
    scoreLabel: "TOPIK Darajasi",
    availableSkills: {
      reading: { official: true },
      listening: { official: true },
      writing: { official: true },
      speaking: { official: false, note: "Standart TOPIK I/II tarkibida rasmiy Speaking bo'limi yo'q. Bu — qo'shimcha erkin suhbat mashqi." },
    },
    nativeScoreFromBand: (band) => {
      if (band >= 8.5) return "6-Daraja";
      if (band >= 7.5) return "5-Daraja";
      if (band >= 6.5) return "4-Daraja";
      if (band >= 5.5) return "3-Daraja";
      if (band >= 4.0) return "2-Daraja";
      return "1-Daraja";
    },
    gradingRubricNote: "Grade against official TOPIK II criteria (for reading/listening: comprehension accuracy across levels 3-6; for writing: task completion, content diversity, and grammatical/vocabulary appropriateness per the official TOPIK writing rubric) — not IELTS descriptors.",
    certificateThreshold: 6.5,
  },
  chinese: {
    id: "chinese",
    languageName: "Xitoy tili",
    examName: "HSK",
    scoreLabel: "HSK Darajasi",
    availableSkills: {
      reading: { official: true },
      listening: { official: true },
      writing: { official: true },
      speaking: { official: false, note: "Rasmiy og'zaki imtihon (HSKK) asosiy HSK'dan alohida va ixtiyoriy hisoblanadi. Bu — qo'shimcha erkin suhbat mashqi." },
    },
    nativeScoreFromBand: (band) => {
      if (band >= 8.5) return "HSK 6";
      if (band >= 7.5) return "HSK 5";
      if (band >= 6.5) return "HSK 4";
      if (band >= 5.5) return "HSK 3";
      if (band >= 4.0) return "HSK 2";
      return "HSK 1";
    },
    gradingRubricNote: "Grade against official HSK criteria for the appropriate level: character/vocabulary accuracy, grammar patterns expected at that HSK level, and (for writing) sentence composition or character-copying tasks as appropriate — not IELTS descriptors.",
    certificateThreshold: 6.5,
  },
  japanese: {
    id: "japanese",
    languageName: "Yapon tili",
    examName: "JLPT",
    scoreLabel: "JLPT Darajasi (taxminiy)",
    availableSkills: {
      reading: { official: true },
      listening: { official: true },
      writing: { official: false, note: "JLPT rasmiy formatida Writing (yozma ijodiy) bo'limi umuman yo'q — faqat grammatika/lug'at/kanji bilim darajasi tekshiriladi. Bu — qo'shimcha yozish mashqi." },
      speaking: { official: false, note: "JLPT rasmiy formatida Speaking bo'limi umuman yo'q. Bu — qo'shimcha erkin suhbat mashqi." },
    },
    nativeScoreFromBand: (band) => {
      if (band >= 8.0) return "N1";
      if (band >= 6.5) return "N2";
      if (band >= 5.0) return "N3";
      if (band >= 3.5) return "N4";
      return "N5";
    },
    gradingRubricNote: "Grade against JLPT-style expectations for the relevant N-level: grammar-point accuracy, vocabulary/kanji range, and reading/listening comprehension — not IELTS descriptors. Note JLPT itself has no official writing/speaking section, so treat these as supplementary skill practice.",
    certificateThreshold: 6.5,
  },
};

export function getExamFormat(language: string | null | undefined): ExamFormat {
  return EXAM_FORMATS[(language as PracticeLanguage) || "english"] || EXAM_FORMATS.english;
}

export function getAllExamFormats(): ExamFormat[] {
  return Object.values(EXAM_FORMATS);
}

/** Native-scale score string for a given language + internal 0-9 band-equivalent. */
export function nativeScoreLabel(language: string | null | undefined, band: number): string {
  return getExamFormat(language).nativeScoreFromBand(band);
}

/** Which skills are part of the real standardized exam for this language. */
export function availableSkillsFor(language: string | null | undefined): SkillKey[] {
  const fmt = getExamFormat(language);
  return (Object.keys(fmt.availableSkills) as SkillKey[]).filter((k) => fmt.availableSkills[k].official);
}
