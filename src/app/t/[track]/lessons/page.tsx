"use client";

// GRAMMATIKA KURSI — darslar ro'yxati.
// Yo'nalish `course` turida bo'lsa ochiladi (grammar-en, speaking-en).

import Link from "next/link";
import { ChevronLeft, CheckCircle2, Circle, Lock } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTrack } from "@/lib/useTrack";
import { trackTheme } from "@/lib/trackTheme";
import { GRAMMAR_LEVELS, lessonsByLevel } from "@/lib/grammar";
import { useLessonProgress } from "@/lib/useLessonProgress";

export default function LessonsPage() {
  const { track } = useTrack();
  const theme = trackTheme(track);
  const { progress } = useLessonProgress();

  // Darslar banki hozircha faqat ingliz tili grammatikasi uchun tayyor.
  // Boshqa yo'nalishda bu sahifani ko'rsatish noto'g'ri ma'lumot berardi.
  if (track.id !== "grammar-en") {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#050505] flex flex-col items-center justify-center text-center px-6">
        <div className="text-5xl mb-4">{track.emoji}</div>
        <h1 className="text-2xl font-black mb-2">{track.title} uchun darslar hali tayyor emas</h1>
        <p className="text-zinc-500 max-w-md mb-6">
          Hozircha darslar kursi faqat ingliz tili grammatikasi yo&apos;nalishida mavjud.
        </p>
        <div className="flex gap-3">
          <Link href={`/t/${track.id}`} className={`${theme.solid} ${theme.solidText} px-6 py-3 rounded-xl font-bold`}>
            Yo&apos;nalishga qaytish
          </Link>
          <Link href="/t/grammar-en/lessons" className="px-6 py-3 rounded-xl font-bold border border-zinc-200 dark:border-white/10">
            Grammatika kursi
          </Link>
        </div>
      </div>
    );
  }

  const doneCount = GRAMMAR_LEVELS.reduce(
    (sum, level) => sum + lessonsByLevel(level).filter((l) => progress[l.id]).length,
    0
  );
  const totalCount = GRAMMAR_LEVELS.reduce((sum, level) => sum + lessonsByLevel(level).length, 0);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#050505] text-zinc-900 dark:text-zinc-100 pb-24">
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#050505]/80 backdrop-blur-xl border-b border-zinc-200 dark:border-white/5 py-3 px-4 md:px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <Link href={`/t/${track.id}`} className="flex items-center gap-2 group min-w-0">
            <ChevronLeft className="w-4 h-4 text-zinc-400 group-hover:-translate-x-0.5 transition-transform" />
            <span className={`w-9 h-9 rounded-xl ${theme.bg} flex items-center justify-center text-lg`}>
              {track.emoji}
            </span>
            <span className="text-sm font-black truncate">{track.shortTitle}</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-zinc-400">
              {doneCount}/{totalCount} dars
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-3">Grammatika kursi</h1>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-2xl">
            A1 dan C1 gacha — har dars o&apos;zbekcha tushuntirish, misollar va shu mavzu
            bo&apos;yicha mashqlardan iborat. Darajangizni bilmasangiz, A1 dan boshlab tez o&apos;ting:
            bilgan mavzuingizni bir urinishda yopasiz.
          </p>
        </div>

        <div className="mb-8 h-2 bg-zinc-200 dark:bg-zinc-900 rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${theme.gradient} transition-all duration-700`}
            style={{ width: `${totalCount ? (doneCount / totalCount) * 100 : 0}%` }}
          />
        </div>

        {GRAMMAR_LEVELS.map((level) => {
          const lessons = lessonsByLevel(level);
          const levelDone = lessons.filter((l) => progress[l.id]).length;

          return (
            <section key={level} className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <span className={`px-3 py-1 rounded-lg ${theme.bg} ${theme.text} text-xs font-black tracking-widest`}>
                  {level}
                </span>
                <span className="text-xs text-zinc-400 font-bold">
                  {levelDone}/{lessons.length} bajarildi
                </span>
              </div>

              <div className="space-y-2">
                {lessons.map((lesson, i) => {
                  const done = !!progress[lesson.id];
                  // Ketma-ketlik: oldingi dars bajarilmagan bo'lsa ham ochiq qoldiramiz —
                  // kattalar o'z yo'lini o'zi tanlaydi, lekin tavsiya tartibi ko'rinib turadi.
                  const isNext = !done && lessons.slice(0, i).every((l) => progress[l.id]);

                  return (
                    <Link
                      key={lesson.id}
                      href={`/t/${track.id}/lessons/${lesson.id}`}
                      className={`flex items-center gap-4 p-4 rounded-2xl border transition-all hover:-translate-y-0.5 hover:shadow-md ${
                        done
                          ? "bg-emerald-500/5 border-emerald-500/20"
                          : isNext
                            ? `bg-white dark:bg-zinc-900/60 ${theme.border}`
                            : "bg-white dark:bg-zinc-900/60 border-zinc-200 dark:border-white/5"
                      }`}
                    >
                      {done ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-zinc-300 dark:text-zinc-700 shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold truncate">{lesson.title}</h3>
                          <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">
                            {lesson.module}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                          {lesson.summary}
                        </p>
                      </div>
                      {done && (
                        <span className="text-sm font-black text-emerald-500 shrink-0">
                          {progress[lesson.id].score}%
                        </span>
                      )}
                      {isNext && !done && (
                        <span className={`text-[10px] font-black uppercase tracking-widest ${theme.text} shrink-0`}>
                          Keyingi
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}

        <p className="text-xs text-zinc-400 flex items-start gap-2 max-w-2xl">
          <Lock className="w-4 h-4 mt-0.5 shrink-0" />
          Kurs kengaytirilmoqda: hozir {totalCount} ta asosiy mavzu tayyor. Har bir darsning
          mashqlari birinchi ochilganda AI tomonidan yaratiladi va kontent bankiga saqlanadi —
          keyingi safar bir xil mashqlar chiqadi.
        </p>
      </main>
    </div>
  );
}
