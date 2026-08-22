"use client";

// BITTA GRAMMATIKA DARSI: tushuntirish → misollar → mashqlar → natija.
//
// Mashqlar `/api/grammar/exercises` dan keladi (birinchi marta AI yozadi, keyin
// kontent bankidan). Xato javob uchun tayyor o'zbekcha izoh darhol ko'rsatiladi —
// har xato uchun alohida AI chaqiruvi qilinmaydi, ya'ni bepul va bir zumda.

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowRight, Check, ChevronLeft, Lightbulb, X } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTrack } from "@/lib/useTrack";
import { trackTheme } from "@/lib/trackTheme";
import { getLesson, nextLesson } from "@/lib/grammar";
import { useLessonProgress } from "@/lib/useLessonProgress";
import { aiFetch, QuotaError } from "@/lib/apiClient";

interface Exercise {
  id: string;
  type: "gap" | "choice" | "correct";
  prompt: string;
  options?: string[];
  answer: string;
  explanationUz: string;
}

function normalise(value: string): string {
  return value.trim().toLowerCase().replace(/[.!?]+$/, "").replace(/\s+/g, " ");
}

export default function LessonPage() {
  const params = useParams<{ lesson?: string | string[] }>();
  const raw = params?.lesson;
  const lessonId = Array.isArray(raw) ? raw[0] : raw || "";

  const { track } = useTrack();
  const theme = trackTheme(track);
  const lesson = getLesson(lessonId);
  const { progress, complete } = useLessonProgress();

  const [exercises, setExercises] = useState<Exercise[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!lesson) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await aiFetch("/api/grammar/exercises", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lessonId: lesson.id }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (data.exercises?.length) setExercises(data.exercises);
        else setLoadError("Mashqlarni yuklab bo'lmadi. Qayta urinib ko'ring.");
      } catch (err) {
        if (cancelled) return;
        setLoadError(
          err instanceof QuotaError
            ? err.message
            : "Mashqlarni yuklab bo'lmadi. Internetni tekshiring."
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [lesson]);

  if (!lesson) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#050505] flex flex-col items-center justify-center text-center px-6">
        <h1 className="text-2xl font-black mb-3">Bunday dars topilmadi</h1>
        <Link href={`/t/${track.id}/lessons`} className={`${theme.solid} ${theme.solidText} px-6 py-3 rounded-xl font-bold`}>
          Darslar ro&apos;yxatiga
        </Link>
      </div>
    );
  }

  const correctCount = exercises
    ? exercises.filter((e) => normalise(answers[e.id] || "") === normalise(e.answer)).length
    : 0;
  const score = exercises?.length ? Math.round((correctCount / exercises.length) * 100) : 0;
  const answeredAll = !!exercises && exercises.every((e) => (answers[e.id] || "").trim());
  const next = nextLesson(lesson.id);

  const check = () => {
    if (!exercises) return;
    setChecked(true);
    const done = exercises.filter((e) => normalise(answers[e.id] || "") === normalise(e.answer)).length;
    complete(track.id, lesson.id, Math.round((done / exercises.length) * 100));
  };

  const retry = () => {
    setAnswers({});
    setChecked(false);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#050505] text-zinc-900 dark:text-zinc-100 pb-24">
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#050505]/80 backdrop-blur-xl border-b border-zinc-200 dark:border-white/5 py-3 px-4 md:px-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <Link href={`/t/${track.id}/lessons`} className="flex items-center gap-2 group min-w-0">
            <ChevronLeft className="w-4 h-4 text-zinc-400 group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-sm font-bold truncate">Darslar</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-1 rounded-lg ${theme.bg} ${theme.text} text-[10px] font-black tracking-widest`}>
              {lesson.level}
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">
          {lesson.module}
        </p>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-3">{lesson.title}</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mb-10">{lesson.summary}</p>

        {/* Qoidalar */}
        <section className="p-6 rounded-3xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/5 mb-6">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 mb-4">Qoidalar</h2>
          <ul className="space-y-3">
            {lesson.points.map((point, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed">
                <span className={`font-black ${theme.text} shrink-0`}>{i + 1}.</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Misollar */}
        <section className="p-6 rounded-3xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/5 mb-6">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 mb-4">Misollar</h2>
          <div className="space-y-4">
            {lesson.examples.map((ex, i) => (
              <div key={i}>
                <p className="font-semibold">{ex.en}</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{ex.uz}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Tipik xato */}
        {lesson.commonMistake && (
          <section className="p-6 rounded-3xl bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 mb-10">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-amber-700 dark:text-amber-500 mb-4 flex items-center gap-2">
              <Lightbulb className="w-4 h-4" /> O&apos;zbeklar ko&apos;p qiladigan xato
            </h2>
            <p className="text-sm mb-1">
              <X className="w-4 h-4 text-red-500 inline mr-1.5" />
              <span className="line-through opacity-70">{lesson.commonMistake.wrong}</span>
            </p>
            <p className="text-sm mb-3">
              <Check className="w-4 h-4 text-emerald-500 inline mr-1.5" />
              <strong>{lesson.commonMistake.right}</strong>
            </p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">{lesson.commonMistake.why}</p>
          </section>
        )}

        {/* Mashqlar */}
        <section>
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 mb-4">Mashqlar</h2>

          {loadError && (
            <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/5 text-sm text-zinc-500">
              {loadError}
            </div>
          )}

          {!exercises && !loadError && (
            <div className="p-10 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/5 flex flex-col items-center gap-3">
              <span className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
              <p className="text-sm text-zinc-500">Mashqlar tayyorlanmoqda…</p>
            </div>
          )}

          {exercises && (
            <div className="space-y-4">
              {exercises.map((ex, i) => {
                const given = answers[ex.id] || "";
                const isCorrect = normalise(given) === normalise(ex.answer);

                return (
                  <div
                    key={ex.id}
                    className={`p-5 rounded-2xl border transition-colors ${
                      !checked
                        ? "bg-white dark:bg-zinc-900/60 border-zinc-200 dark:border-white/5"
                        : isCorrect
                          ? "bg-emerald-500/5 border-emerald-500/20"
                          : "bg-red-500/5 border-red-500/20"
                    }`}
                  >
                    <div className="flex gap-3 mb-3">
                      <span className="text-xs font-black text-zinc-400 mt-1 shrink-0">{i + 1}</span>
                      <p className="text-sm font-medium leading-relaxed">{ex.prompt}</p>
                    </div>

                    {ex.type === "choice" && ex.options ? (
                      <div className="flex flex-wrap gap-2 ml-7">
                        {ex.options.map((opt) => {
                          const selected = given === opt;
                          const showAsAnswer = checked && normalise(opt) === normalise(ex.answer);
                          return (
                            <button
                              key={opt}
                              disabled={checked}
                              onClick={() => setAnswers((a) => ({ ...a, [ex.id]: opt }))}
                              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors disabled:cursor-default ${
                                showAsAnswer
                                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                  : selected
                                    ? `${theme.border} ${theme.bg} ${theme.text}`
                                    : "border-zinc-200 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-white/5"
                              }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <input
                        value={given}
                        disabled={checked}
                        onChange={(e) => setAnswers((a) => ({ ...a, [ex.id]: e.target.value }))}
                        placeholder={ex.type === "correct" ? "To'g'rilangan gapni yozing" : "Javobingiz"}
                        className="ml-7 w-[calc(100%-1.75rem)] px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 text-sm outline-none focus:border-amber-500/50 disabled:opacity-70"
                      />
                    )}

                    {checked && (
                      <div className="ml-7 mt-3 text-xs leading-relaxed">
                        {!isCorrect && (
                          <p className="mb-1">
                            To&apos;g&apos;ri javob: <strong className="text-emerald-600 dark:text-emerald-400">{ex.answer}</strong>
                          </p>
                        )}
                        <p className="text-zinc-600 dark:text-zinc-400">{ex.explanationUz}</p>
                      </div>
                    )}
                  </div>
                );
              })}

              {!checked ? (
                <button
                  onClick={check}
                  disabled={!answeredAll}
                  className={`w-full py-4 rounded-2xl font-black ${theme.solid} ${theme.solidText} disabled:opacity-40 transition-opacity`}
                >
                  {answeredAll ? "Tekshirish" : "Barcha savolga javob bering"}
                </button>
              ) : (
                <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/5 text-center">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Natija</p>
                  <p className={`text-5xl font-black ${theme.text} mb-2`}>{score}%</p>
                  <p className="text-sm text-zinc-500 mb-6">
                    {exercises.length} tadan {correctCount} tasi to&apos;g&apos;ri
                    {progress[lesson.id] ? " · natija saqlandi" : ""}
                  </p>
                  <div className="flex flex-wrap gap-3 justify-center">
                    <button
                      onClick={retry}
                      className="px-6 py-3 rounded-xl font-bold border border-zinc-200 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors"
                    >
                      Qayta ishlash
                    </button>
                    {next && (
                      <Link
                        href={`/t/${track.id}/lessons/${next.id}`}
                        className={`px-6 py-3 rounded-xl font-bold ${theme.solid} ${theme.solidText} inline-flex items-center gap-2`}
                      >
                        Keyingi dars: {next.title} <ArrowRight className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
