"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FlagIcon } from "@/components/FlagIcon";
import { getTracksForLanguage, getTrack } from "@/lib/tracks";
import { enroll } from "@/lib/progress";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";

type Step =
  | { type: "intro" }
  | { type: "language" }
  | { type: "course" }
  | { type: "social" }
  | { type: "question"; id: string; question: string; subtitle?: string; options: { label: string; value: string; emoji?: string }[]; grid?: boolean }
  | { type: "name" }
  | { type: "loading" }
  | { type: "plan" };

// Komponentdan tashqarida: har renderda qayta yaratilmasin va effekt deps'ini buzmasin.
const TARGET_SCORES = ["9.0", "N1", "HSK 6", "C2", "6-daraja"];

const getSteps = (lang: string, course: string): Step[] => {
  const levelQuestion = {
    english: {
      question: "Hozirgi ingliz tili darajangiz qanday?",
      subtitle: "Bu sizga mos rejani tuzishimizga yordam beradi",
      options: [
        { label: "Beginner (A1–A2)", value: "beginner", emoji: "🌱" },
        { label: "Intermediate (B1–B2)", value: "intermediate", emoji: "📘" },
        { label: "Advanced (C1–C2)", value: "advanced", emoji: "🚀" },
        { label: "Bilmayman", value: "unknown", emoji: "🤔" },
      ],
    },
    korean: {
      question: "Hozirgi koreys tili darajangiz qanday?",
      subtitle: "Bu sizga mos rejani tuzishimizga yordam beradi",
      options: [
        { label: "Beginner (TOPIK I)", value: "beginner", emoji: "🌱" },
        { label: "Intermediate (TOPIK II - 3/4-daraja)", value: "intermediate", emoji: "📘" },
        { label: "Advanced (TOPIK II - 5/6-daraja)", value: "advanced", emoji: "🚀" },
        { label: "Bilmayman / Yangi", value: "unknown", emoji: "🤔" },
      ],
    },
    japanese: {
      question: "Hozirgi yapon tili darajangiz qanday?",
      subtitle: "Bu sizga mos rejani tuzishimizga yordam beradi",
      options: [
        { label: "Beginner (JLPT N5–N4)", value: "beginner", emoji: "🌱" },
        { label: "Intermediate (JLPT N3–N2)", value: "intermediate", emoji: "📘" },
        { label: "Advanced (JLPT N1)", value: "advanced", emoji: "🚀" },
        { label: "Bilmayman / Yangi", value: "unknown", emoji: "🤔" },
      ],
    },
    chinese: {
      question: "Hozirgi xitoy tili darajangiz qanday?",
      subtitle: "Bu sizga mos rejani tuzishimizga yordam beradi",
      options: [
        { label: "Beginner (HSK 1–2)", value: "beginner", emoji: "🌱" },
        { label: "Intermediate (HSK 3–4)", value: "intermediate", emoji: "📘" },
        { label: "Advanced (HSK 5–6)", value: "advanced", emoji: "🚀" },
        { label: "Bilmayman / Yangi", value: "unknown", emoji: "🤔" },
      ],
    },
    russian: {
      question: "Hozirgi rus tili darajangiz qanday?",
      subtitle: "Bu sizga mos rejani tuzishimizga yordam beradi",
      options: [
        { label: "Beginner (A1–A2)", value: "beginner", emoji: "🌱" },
        { label: "Intermediate (B1–B2)", value: "intermediate", emoji: "📘" },
        { label: "Advanced (C1–C2)", value: "advanced", emoji: "🚀" },
        { label: "Bilmayman / Yangi", value: "unknown", emoji: "🤔" },
      ],
    },
  }[lang] || {
    question: "Hozirgi til darajangiz qanday?",
    subtitle: "Bu sizga mos rejani tuzishimizga yordam beradi",
    options: [
      { label: "Beginner", value: "beginner", emoji: "🌱" },
      { label: "Intermediate", value: "intermediate", emoji: "📘" },
      { label: "Advanced", value: "advanced", emoji: "🚀" },
      { label: "Bilmayman", value: "unknown", emoji: "🤔" },
    ],
  };

  const targetQuestion = {
    english: {
      question: "Yakuniy balingiz nechi bo'lishi kerak?",
      subtitle: "Maqsadingizni tanlang",
      grid: true,
      options: ["5.5", "6.0", "6.5", "7.0", "7.5", "8.0", "8.5", "9.0"].map((v) => ({ label: v, value: v })),
    },
    korean: {
      question: "Yakuniy TOPIK darajangiz qaysi bo'lishi kerak?",
      subtitle: "Maqsadingizni tanlang",
      grid: true,
      options: ["1-Daraja", "2-Daraja", "3-Daraja", "4-Daraja", "5-Daraja", "6-Daraja"].map((v) => ({ label: v, value: v })),
    },
    japanese: {
      question: "Yakuniy JLPT darajangiz qaysi bo'lishi kerak?",
      subtitle: "Maqsadingizni tanlang",
      grid: true,
      options: ["N5", "N4", "N3", "N2", "N1"].map((v) => ({ label: v, value: v })),
    },
    chinese: {
      question: "Yakuniy HSK darajangiz qaysi bo'lishi kerak?",
      subtitle: "Maqsadingizni tanlang",
      grid: true,
      options: ["HSK 1", "HSK 2", "HSK 3", "HSK 4", "HSK 5", "HSK 6"].map((v) => ({ label: v, value: v })),
    },
    russian: {
      question: "Yakuniy rus tili darajangiz qaysi bo'lishi kerak?",
      subtitle: "Maqsadingizni tanlang",
      grid: true,
      options: ["A1", "A2", "B1", "B2", "C1", "C2"].map((v) => ({ label: v, value: v })),
    },
  }[lang] || {
    question: "Yakuniy balingiz nechi bo'lishi kerak?",
    subtitle: "Maqsadingizni tanlang",
    grid: true,
    options: ["A1", "A2", "B1", "B2", "C1", "C2"].map((v) => ({ label: v, value: v })),
  };

  const weaknessQuestion = {
    english: {
      question: "Qaysi bo'limda ko'proq qiynalasiz?",
      subtitle: "Rejangiz shu bo'limga ko'proq e'tibor beradi",
      options: [
        { label: "Reading / O'qish", value: "reading", emoji: "📖" },
        { label: "Listening / Eshitish", value: "listening", emoji: "🎧" },
        { label: "Writing / Yozish", value: "writing", emoji: "✍️" },
        { label: "Speaking / Gapirish", value: "speaking", emoji: "🗣️" },
      ],
    },
    korean: {
      question: "Qaysi bo'limda ko'proq qiynalasiz?",
      subtitle: "Rejangiz shu bo'limga ko'proq e'tibor beradi",
      options: [
        { label: "O'qish (Reading)", value: "reading", emoji: "📖" },
        { label: "Eshitish (Listening)", value: "listening", emoji: "🎧" },
        { label: "Yozish (Writing)", value: "writing", emoji: "✍️" },
        { label: "Grammatika/Lug'at", value: "vocabulary", emoji: "📚" },
      ],
    },
    japanese: {
      question: "Qaysi bo'limda ko'proq qiynalasiz?",
      subtitle: "Rejangiz shu bo'limga ko'proq e'tibor beradi",
      options: [
        { label: "O'qish (Reading)", value: "reading", emoji: "📖" },
        { label: "Eshitish (Listening)", value: "listening", emoji: "🎧" },
        { label: "Kanji/Lug'at", value: "vocabulary", emoji: "✍️" },
        { label: "Grammatika/Gapirish", value: "grammar", emoji: "🗣️" },
      ],
    },
    chinese: {
      question: "Qaysi bo'limda ko'proq qiynalasiz?",
      subtitle: "Rejangiz shu bo'limga ko'proq e'tibor beradi",
      options: [
        { label: "O'qish (Reading)", value: "reading", emoji: "📖" },
        { label: "Eshitish (Listening)", value: "listening", emoji: "🎧" },
        { label: "Ierogliflar/Yozish", value: "writing", emoji: "✍️" },
        { label: "Ohanglar/Gapirish", value: "speaking", emoji: "🗣️" },
      ],
    },
    russian: {
      question: "Qaysi bo'limda ko'proq qiynalasiz?",
      subtitle: "Rejangiz shu bo'limga ko'proq e'tibor beradi",
      options: [
        { label: "Reading / O'qish", value: "reading", emoji: "📖" },
        { label: "Listening / Eshitish", value: "listening", emoji: "🎧" },
        { label: "Writing / Yozish", value: "writing", emoji: "✍️" },
        { label: "Speaking / Gapirish", value: "speaking", emoji: "🗣️" },
      ],
    },
  }[lang] || {
    question: "Qaysi bo'limda ko'proq qiynalasiz?",
    subtitle: "Rejangiz shu bo'limga ko'proq e'tibor beradi",
    options: [
      { label: "Reading", value: "reading", emoji: "📖" },
      { label: "Listening", value: "listening", emoji: "🎧" },
      { label: "Writing", value: "writing", emoji: "✍️" },
      { label: "Speaking", value: "speaking", emoji: "🗣️" },
    ],
  };

  const examQuestion = {
    english: {
      question: "IELTS imtihoningiz qachon?",
      options: [
        { label: "1–2 hafta ichida", value: "2_weeks", emoji: "🔴" },
        { label: "1 oy ichida", value: "1_month", emoji: "🟠" },
        { label: "2–3 oy ichida", value: "3_months", emoji: "🟢" },
        { label: "Hali band qilmaganman", value: "not_booked", emoji: "📅" },
      ],
    },
    korean: {
      question: "TOPIK imtihoningiz qachon?",
      options: [
        { label: "1–2 hafta ichida", value: "2_weeks", emoji: "🔴" },
        { label: "1 oy ichida", value: "1_month", emoji: "🟠" },
        { label: "2–3 oy ichida", value: "3_months", emoji: "🟢" },
        { label: "Hali band qilmaganman", value: "not_booked", emoji: "📅" },
      ],
    },
    japanese: {
      question: "JLPT imtihoningiz qachon?",
      options: [
        { label: "1–2 hafta ichida", value: "2_weeks", emoji: "🔴" },
        { label: "1 oy ichida", value: "1_month", emoji: "🟠" },
        { label: "2–3 oy ichida", value: "3_months", emoji: "🟢" },
        { label: "Hali band qilmaganman", value: "not_booked", emoji: "📅" },
      ],
    },
    chinese: {
      question: "HSK imtihoningiz qachon?",
      options: [
        { label: "1–2 hafta ichida", value: "2_weeks", emoji: "🔴" },
        { label: "1 oy ichida", value: "1_month", emoji: "🟠" },
        { label: "2–3 oy ichida", value: "3_months", emoji: "🟢" },
        { label: "Hali band qilmaganman", value: "not_booked", emoji: "📅" },
      ],
    },
    russian: {
      question: "Imtihoningiz qachon?",
      options: [
        { label: "1–2 hafta ichida", value: "2_weeks", emoji: "🔴" },
        { label: "1 oy ichida", value: "1_month", emoji: "🟠" },
        { label: "2–3 oy ichida", value: "3_months", emoji: "🟢" },
        { label: "Hali band qilmaganman", value: "not_booked", emoji: "📅" },
      ],
    },
  }[lang] || {
    question: "Imtihoningiz qachon?",
    options: [
      { label: "1–2 hafta ichida", value: "2_weeks", emoji: "🔴" },
      { label: "1 oy ichida", value: "1_month", emoji: "🟠" },
      { label: "2–3 oy ichida", value: "3_months", emoji: "🟢" },
      { label: "Hali band qilmaganman", value: "not_booked", emoji: "📅" },
    ],
  };

  const goalQuestion = {
    english: {
      question: "IELTS sizga nima uchun kerak?",
      options: [
        { label: "Chet elda o'qish", value: "study", emoji: "🎓" },
        { label: "Ish / Karyera", value: "work", emoji: "💼" },
        { label: "Immigratsiya", value: "immigration", emoji: "✈️" },
        { label: "Shaxsiy rivojlanish", value: "personal", emoji: "⭐" },
      ],
    },
    korean: {
      question: "Koreys tili sizga nima uchun kerak?",
      options: [
        { label: "Janubiy Koreyada o'qish / GKS", value: "study", emoji: "🎓" },
        { label: "Koreys kompaniyasida ishlash", value: "work", emoji: "💼" },
        { label: "Koreyaga sayohat / Immigratsiya", value: "immigration", emoji: "✈️" },
        { label: "Drama va K-Pop tushunish (Shaxsiy)", value: "personal", emoji: "⭐" },
      ],
    },
    japanese: {
      question: "Yapon tili sizga nima uchun kerak?",
      options: [
        { label: "Yaponiyada o'qish (MEXT)", value: "study", emoji: "🎓" },
        { label: "Yaponiya ishchi vizasi (Tokutei Ginou)", value: "work", emoji: "💼" },
        { label: "Sayohat / Immigratsiya", value: "immigration", emoji: "✈️" },
        { label: "Anime / Manga (Shaxsiy rivojlanish)", value: "personal", emoji: "⭐" },
      ],
    },
    chinese: {
      question: "Xitoy tili sizga nima uchun kerak?",
      options: [
        { label: "Xitoyda o'qish (CSC)", value: "study", emoji: "🎓" },
        { label: "Xitoy kompaniyalari bilan biznes", value: "work", emoji: "💼" },
        { label: "Sayohat / Immigratsiya", value: "immigration", emoji: "✈️" },
        { label: "Shaxsiy rivojlanish / Madaniyat", value: "personal", emoji: "⭐" },
      ],
    },
    russian: {
      question: "Rus tili sizga nima uchun kerak?",
      options: [
        { label: "O'qish / Ta'lim", value: "study", emoji: "🎓" },
        { label: "Ish / Karyera / Biznes", value: "work", emoji: "💼" },
        { label: "Sayohat / Chet el", value: "immigration", emoji: "✈️" },
        { label: "Shaxsiy rivojlanish", value: "personal", emoji: "⭐" },
      ],
    },
  }[lang] || {
    question: "Bu til sizga nima uchun kerak?",
    options: [
      { label: "O'qish", value: "study", emoji: "🎓" },
      { label: "Ish", value: "work", emoji: "💼" },
      { label: "Immigratsiya", value: "immigration", emoji: "✈️" },
      { label: "Shaxsiy rivojlanish", value: "personal", emoji: "⭐" },
    ],
  };

  // Imtihon yo'nalishimi yoki kurs — endi track registri hal qiladi.
  const isExamCourse = getTrack(course).kind === "exam";

  return [
    { type: "intro" },
    { type: "language" },
    { type: "course" },
    ...(isExamCourse ? [
      { type: "question" as const, id: "level", ...levelQuestion },
      { type: "question" as const, id: "target", ...targetQuestion }
    ] : [
      { type: "question" as const, id: "level", ...levelQuestion } // Still ask current level
    ]),
    { type: "social" },
    { type: "question", id: "weakness", ...weaknessQuestion },
    { type: "question", id: "study_time",
      question: "Kuniga qancha vaqt ajratasiz?",
      subtitle: "Siz uchun reja tayyorlaymiz",
      options: [
        { label: "15 daqiqa — Tezkor", value: "15m", emoji: "⚡" },
        { label: "30 daqiqa — O'rtacha", value: "30m", emoji: "⏱️" },
        { label: "1 soat — To'liq", value: "1h", emoji: "💪" },
        { label: "2+ soat — Intensiv", value: "2h", emoji: "🔥" },
      ]
    },
    ...(isExamCourse ? [
      { type: "question" as const, id: "exam_date", ...examQuestion },
      { type: "question" as const, id: "goal", ...goalQuestion }
    ] : [
      { type: "question" as const, id: "goal", ...goalQuestion } // Ask goal for general too
    ]),
    { type: "name" },
    { type: "loading" },
    { type: "plan" },
  ];
};

export default function StartQuiz() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [name, setName] = useState("");
  const [selectedLang, setSelectedLang] = useState<string>("english");
  const [selectedCourse, setSelectedCourse] = useState<string>("ielts");
  const [loadPct, setLoadPct] = useState(0);
  const router = useRouter();
  
  const [targetIndex, setTargetIndex] = useState(0);

  useEffect(() => {
    if (step !== 0) return;
    const interval = setInterval(() => {
      setTargetIndex((prev) => (prev + 1) % TARGET_SCORES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [step]);

  const STEPS = getSteps(selectedLang, selectedCourse);
  const current = STEPS[step];

  const progress = (step / (Math.max(1, STEPS.length - 1))) * 100;

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const select = (id: string, value: string) => {
    setAnswers((a) => ({ ...a, [id]: value }));
    setTimeout(next, 150);
  };

  // Yuklash animatsiyasi → rejaga o'tish.
  // Hisoblagichni NOLLASH endi render vaqtida, qadam o'zgarganda bajariladi
  // (React'ning "prop o'zgarganda state'ni moslash" naqshi). Ilgari bu effekt
  // ichida edi — bu qo'shimcha render va React 19 lint xatosini keltirardi.
  const isLoadingStep = current?.type === "loading";
  const [wasLoadingStep, setWasLoadingStep] = useState(false);
  if (isLoadingStep !== wasLoadingStep) {
    setWasLoadingStep(isLoadingStep);
    if (isLoadingStep) setLoadPct(0);
  }

  useEffect(() => {
    if (!isLoadingStep) return;
    const iv = setInterval(() => {
      setLoadPct((p) => {
        if (p >= 100) { clearInterval(iv); setTimeout(next, 400); return 100; }
        return p + 4;
      });
    }, 60);
    return () => clearInterval(iv);
    // `next` faqat setStep'ning funksional shaklini chaqiradi — deps'ga qo'shilsa
    // har renderda effekt qayta ishga tushib, yuklash animatsiyasi qayta boshlanardi.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.type]);

  const savePlan = () => {
    // `selectedCourse` endi to'g'ridan-to'g'ri TRACK ID (tracks.ts dagi).
    // Ilgari bu qiymat localStorage'ga yozilardi-yu, hech kim o'qimasdi —
    // shuning uchun "Multilevel" tanlagan odam ham IELTS dashboard'iga tushardi.
    const track = getTrack(selectedCourse);
    const defaultTarget = track.levels[Math.floor(track.levels.length / 2)];
    const data = {
      ...answers,
      name,
      language: track.language,
      course: track.id,
      exam_date: answers.exam_date || "not_booked",
      level: answers.level || "unknown",
      target: answers.target || defaultTarget,
      weakness: answers.weakness || "writing",
    };
    localStorage.setItem("ielts_prep_data", JSON.stringify(data));

    void enroll({
      trackId: track.id,
      startLevel: data.level,
      targetScore: data.target,
      weakness: data.weakness,
      deadline: answers.exam_date && answers.exam_date !== "not_booked" ? answers.exam_date : undefined,
    });

    router.push(`/t/${track.id}`);
  };

  const getProjectedLevel = (lang: string, levelValue: string) => {
    if (lang === "english") {
      return levelValue === "beginner" ? "5.0" : levelValue === "intermediate" ? "6.0" : levelValue === "advanced" ? "7.5" : "5.5";
    }
    if (lang === "korean") {
      return levelValue === "beginner" ? "TOPIK 1" : levelValue === "intermediate" ? "TOPIK 3" : levelValue === "advanced" ? "TOPIK 5" : "TOPIK 2";
    }
    if (lang === "japanese") {
      return levelValue === "beginner" ? "N5" : levelValue === "intermediate" ? "N3" : levelValue === "advanced" ? "N2" : "N4";
    }
    if (lang === "chinese") {
      return levelValue === "beginner" ? "HSK 1" : levelValue === "intermediate" ? "HSK 3" : levelValue === "advanced" ? "HSK 5" : "HSK 2";
    }
    return levelValue === "beginner" ? "A2" : levelValue === "intermediate" ? "B1" : levelValue === "advanced" ? "C1" : "B1";
  };

  // Derived plan
  const targetBand = answers.target || (selectedLang === "english" ? "7.0" : selectedLang === "korean" ? "4-Daraja" : selectedLang === "japanese" ? "N2" : selectedLang === "chinese" ? "HSK 4" : "B2");
  const projectedStr = getProjectedLevel(selectedLang, answers.level || "unknown");
  
  const weaknessLabel: Record<string, string> = { 
    reading: "Reading (O'qish)", 
    listening: "Listening (Eshitish)", 
    writing: "Writing (Yozish)", 
    speaking: "Speaking (Gapirish)",
    vocabulary: "Lug'at / So'z boyligi",
    grammar: "Grammatika"
  };
  const weakness = weaknessLabel[answers.weakness] || "Writing";

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-[#f4f4f5] font-sans relative overflow-hidden">
      <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[140px] -z-10 pointer-events-none" />

      {/* Header / progress */}
      <header className="w-full px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 shrink-0">
          {step > 1 && current?.type !== "plan" && (
            <button onClick={back} className="text-zinc-500 hover:text-black dark:hover:text-white text-sm">←</button>
          )}
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.jpg" alt="logo" className="w-6 h-6 rounded-full border border-amber-500/20" />
            <span className="text-sm font-bold tracking-tight text-black dark:text-white hidden sm:inline">kmb<span className="text-amber-500">.education</span></span>
          </Link>
        </div>
        
        <div className="flex-1 max-w-xl mx-auto h-1.5 bg-zinc-200 dark:bg-zinc-900 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-500 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-2xl mx-auto text-center">
        {/* INTRO */}
        {current?.type === "intro" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="h-28 mb-4 flex items-center justify-center overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={TARGET_SCORES[targetIndex]}
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -40, opacity: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="text-7xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-amber-400 to-amber-600"
                >
                  {TARGET_SCORES[targetIndex]}
                </motion.div>
              </AnimatePresence>
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold mb-4 leading-tight text-black dark:text-white">Orzu qilgan ballni <span className="text-amber-500">birinchi urinishda</span> oling</h1>
            <p className="text-zinc-500 dark:text-zinc-400 mb-10 text-lg">Bir necha savolga javob bering — shaxsiy AI rejangizga ega bo'ling.</p>
            <button onClick={next} className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-10 py-4 rounded-full text-lg transition-all hover:-translate-y-0.5 shadow-xl shadow-amber-500/20">
              Boshlash →
            </button>
            <div className="mt-8 text-xs text-zinc-500 dark:text-zinc-600">⭐ 4.8 · minglab o'quvchi ishonadi</div>
          </div>
        )}

        {/* LANGUAGE SELECTION */}
        {current?.type === "language" && (
          <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-300" key={step}>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Qaysi tilni o'rganmoqchisiz?</h1>
            <p className="text-zinc-500 mb-8">O'rganish kursini tanlang — keyinroq o'zgartirish mumkin</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { id: "english", name: "English", native: "IELTS · Academic" },
                { id: "russian", name: "Русский", native: "Разговорный курс" },
                { id: "japanese", name: "日本語", native: "Japanese · JLPT" },
                { id: "korean", name: "한국어", native: "Korean · TOPIK" },
                { id: "chinese", name: "中文", native: "Chinese · HSK" },
              ].map((lang) => {
                const isActive = selectedLang === lang.id;
                return (
                  <button
                    key={lang.id}
                    onClick={() => { setSelectedLang(lang.id); setTimeout(next, 200); }}
                    className={`p-5 rounded-3xl border-2 transition-all duration-300 flex flex-col items-center gap-3 backdrop-blur-md ${
                      isActive 
                        ? "border-amber-500 bg-amber-500/10 shadow-xl shadow-amber-500/10 scale-105" 
                        : "border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-950/60 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-white/80 dark:hover:bg-zinc-900/80 hover:-translate-y-1"
                    }`}
                  >
                    <FlagIcon lang={lang.id} className="w-12 h-12 rounded-full overflow-hidden shadow-md select-none" />
                    <span className="font-extrabold text-sm">{lang.name}</span>
                    <span className="text-[10px] text-zinc-500">{lang.native}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* COURSE SELECTION */}
        {current?.type === "course" && (() => {
          // Ro'yxat `tracks.ts` dan quriladi — funnel'dagi tanlov bilan ilovadagi
          // haqiqiy yo'nalishlar orasida farq qolmasligi uchun.
          const options = getTracksForLanguage(selectedLang)
            .filter((t) => t.status !== "soon")
            .map((t) => ({ id: t.id, name: t.shortTitle, desc: t.subtitle, emoji: t.emoji }));

          return (
            <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-300" key={step}>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">Qaysi yo'nalishda o'qiysiz?</h1>
              <p className="text-zinc-500 mb-8">Maqsadingizga qarab tizim moslashadi</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {options.map((course) => {
                  const isActive = selectedCourse === course.id;
                  return (
                    <button
                      key={course.id}
                      onClick={() => { setSelectedCourse(course.id); setTimeout(next, 200); }}
                      className={`p-5 rounded-3xl border-2 transition-all duration-300 flex items-center gap-4 text-left backdrop-blur-md ${
                        isActive 
                          ? "border-amber-500 bg-amber-500/10 shadow-xl shadow-amber-500/10 scale-105" 
                          : "border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-950/60 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-white/80 dark:hover:bg-zinc-900/80 hover:-translate-y-1"
                      }`}
                    >
                      <span className="text-4xl drop-shadow-md select-none">{course.emoji}</span>
                      <div className="flex flex-col">
                        <span className="font-extrabold text-base text-black dark:text-white">{course.name}</span>
                        <span className="text-xs text-zinc-500 mt-0.5">{course.desc}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* QUESTION */}
        {current?.type === "question" && (
          <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-300" key={step}>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">{current.question}</h1>
            {current.subtitle && <p className="text-zinc-500 mb-8">{current.subtitle}</p>}
            <div className={current.grid ? "grid grid-cols-2 sm:grid-cols-4 gap-3" : "flex flex-col gap-3"}>
              {current.options.map((o) => {
                const selected = answers[current.id] === o.value;
                return (
                  <button
                    key={o.value}
                    onClick={() => select(current.id, o.value)}
                    className={`group text-left p-4 rounded-2xl border-2 transition-all duration-300 backdrop-blur-md flex items-center gap-3 ${
                      selected 
                        ? "border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/10 scale-[1.02]" 
                        : "border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-950/60 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-white/80 dark:hover:bg-zinc-900/80 hover:-translate-y-0.5"
                    } ${current.grid ? "flex-col justify-center text-center p-6" : ""}`}
                  >
                    {o.emoji && <span className="text-2xl group-hover:scale-110 transition-transform">{o.emoji}</span>}
                    <span className="font-bold">{o.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* SOCIAL PROOF */}
        {current?.type === "social" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-2xl md:text-3xl font-bold mb-6">Siz to'g'ri joydasiz</h2>
            <div className="space-y-3 mb-8 text-left">
              {[
                { n: "Aziz", t: "Atigi 6 hafta tayyorlanib 7.5 oldim. Speaking eng ko'p qo'rqardim — har kuni AI bilan mashq qildim." },
                { n: "Malika", t: "AI Writing'ni shunchalik aniq baholaydi deb kutmagandim. Haqiqiy imtihonim bilan atigi 0.5 farq." },
              ].map((r, i) => (
                <div key={i} className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-xl p-4 shadow-sm dark:shadow-none">
                  <div className="text-amber-500 text-sm mb-1">★★★★★</div>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">"{r.t}"</p>
                  <div className="text-xs text-zinc-500 mt-2">— {r.n}</div>
                </div>
              ))}
            </div>
            <p className="text-2xl font-bold mb-6">Va yana minglab 5 baholi izoh ⭐</p>
            <button onClick={next} className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-10 py-3.5 rounded-full transition-all">Davom etish →</button>
          </div>
        )}

        {/* NAME */}
        {current?.type === "name" && (() => {
          const isNameValid = name.trim().length >= 3 && /^[a-zA-Zа-яА-ЯёЁoʻgʻʼ\s]+$/.test(name.trim());
          return (
            <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">Ismingiz nima?</h1>
              <p className="text-zinc-500 mb-8">Rejangizni shaxsiylashtirish uchun</p>
              <input
                value={name} onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && isNameValid && next()}
                placeholder="Ismingiz (kamida 3 ta harf)" autoFocus
                className="w-full h-14 bg-white dark:bg-zinc-950 border-2 border-zinc-200 dark:border-zinc-800 rounded-2xl px-5 text-lg text-black dark:text-white outline-none focus:border-amber-500 dark:focus:border-amber-500 text-center mb-2 shadow-sm dark:shadow-none"
              />
              {name.trim() && !isNameValid && (
                <p className="text-red-400 text-xs mb-4">Ismingiz kamida 3 ta harfdan iborat bo'lishi va faqat harflardan tashkil topishi kerak.</p>
              )}
              <button onClick={() => isNameValid && next()} disabled={!isNameValid} className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-10 py-3.5 rounded-full transition-all disabled:opacity-40">
                Davom etish →
              </button>
            </div>
          );
        })()}

        {/* LOADING */}
        {current?.type === "loading" && (
          <div className="animate-in fade-in duration-300 flex flex-col items-center">
            <div className="relative w-28 h-28 mb-8">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="44" fill="none" stroke="#27272a" strokeWidth="8" />
                <circle cx="50" cy="50" r="44" fill="none" stroke="#f59e0b" strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 44}`} strokeDashoffset={`${2 * Math.PI * 44 * (1 - loadPct / 100)}`} className="transition-all duration-100" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-2xl font-black">{loadPct}%</div>
            </div>
            <h2 className="text-xl font-bold mb-2">Shaxsiy rejangizni yaratyapmiz…</h2>
            <p className="text-zinc-500 text-sm">Javoblaringizni tahlil qilyapmiz</p>
          </div>
        )}

        {/* PLAN */}
        {current?.type === "plan" && (
          <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-2xl md:text-3xl font-extrabold mb-2">{name ? `${name}, ` : ""}rejangiz tayyor! 🎯</h1>
            <p className="text-zinc-400 mb-8">Maqsadingiz uchun shaxsiy yo'l tuzdik.</p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5">
                <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Hozirgi (taxminiy)</div>
                <div className="text-3xl font-black text-zinc-300">{projectedStr}</div>
              </div>
              <div className="bg-amber-500/5 border border-amber-500/30 rounded-2xl p-5">
                <div className="text-[10px] uppercase tracking-widest text-amber-500 mb-1">Maqsad</div>
                <div className="text-3xl font-black text-amber-500">{targetBand}</div>
              </div>
            </div>

            <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 mb-8 text-left text-zinc-300">
              <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-3">Sizning haftalik fokus</div>
              <ul className="space-y-3 text-sm">
                <li className="flex gap-3"><span className="text-amber-500 font-bold">1</span> <span><b className="text-white">{weakness}</b> — kuchsiz bo'limingiz, har kuni 1 mashq</span></li>
                <li className="flex gap-3"><span className="text-amber-500 font-bold">2</span> Jonli AI Speaking suhbati + talaffuz mashqi</li>
                <li className="flex gap-3"><span className="text-amber-500 font-bold">3</span> AI baholash bilan Writing (TR/CC/LR/GRA)</li>
                <li className="flex gap-3"><span className="text-amber-500 font-bold">4</span> Lug'at va kunlik so'z mashqi</li>
              </ul>
            </div>

            <button onClick={savePlan} className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-4 rounded-full text-lg transition-all shadow-xl shadow-amber-500/20">
              Rejani boshlash →
            </button>
            <p className="text-xs text-zinc-600 mt-4">Bepul boshlang — karta talab qilinmaydi.</p>
          </div>
        )}
      </main>
    </div>
  );
}
