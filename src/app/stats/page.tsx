"use client";

import { useMemo } from "react";
import Link from "next/link";
import { computeStreak } from "@/lib/bandUtils";
import { useTrack } from "@/lib/useTrack";
import { useVocabLearnedCount } from "@/lib/useVocabSrs";
import { useTestHistory } from "@/lib/useTestHistory";
import { useClientNow } from "@/lib/useClientNow";
import { trackScore } from "@/lib/tracks";

const DAY = 86400000;
const dayKey = (d: Date) => d.toISOString().slice(0, 10);

export default function StatsPage() {
  const history = useTestHistory();
  const vocabLearned = useVocabLearnedCount();
  const { track } = useTrack();

  // Streak/heatmap/total-count reflect activity in ANY language (engagement).
  const streak = computeStreak(history.map((h) => h.date));

  // Bo'lim o'rtachalari faqat AKTIV YO'NALISH bo'yicha — IELTS band bilan
  // Multilevel bali yoki TOPIK darajasi bir shkalada emas, ularni qo'shib bo'lmaydi.
  const langHistory = useMemo(
    () => history.filter((h) => (h.trackId || "ielts") === track.id),
    [history, track.id]
  );
  const sections = ["reading", "listening", "writing", "speaking"] as const;
  const sectionStat = (t: string) => {
    const xs = langHistory.filter((h) => h.type === t);
    if (!xs.length) return { avg: 0, count: 0 };
    return { avg: xs.reduce((a, b) => a + b.band, 0) / xs.length, count: xs.length };
  };
  const stats = sections.map((s) => ({ name: s, ...sectionStat(s) }));
  const active = stats.filter((s) => s.count > 0);
  const overall = active.length ? active.reduce((a, b) => a + b.avg, 0) / active.length : 0;

  // Heatmap: last 12 weeks (84 days). Vaqt faqat klientda o'qiladi — aks holda
  // statik prerender qilingan HTML klientdagi sanadan farq qilib, hydration xatosi beradi.
  const nowTs = useClientNow();
  const todayTs = nowTs ?? 0;
  const weeks: { date: Date; count: number }[][] = [];
  if (nowTs !== null) {
    const today = new Date(nowTs);
    const startOffset = (today.getDay() + 6) % 7; // make Monday=0
    const totalDays = 12 * 7;
    const startDate = new Date(nowTs - (totalDays - 1 + startOffset) * DAY);
    const counts: Record<string, number> = {};
    history.forEach((h) => { const k = dayKey(new Date(h.date)); counts[k] = (counts[k] || 0) + 1; });
    for (let w = 0; w < 13; w++) {
      const col: { date: Date; count: number }[] = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(startDate.getTime() + (w * 7 + d) * DAY);
        col.push({ date, count: counts[dayKey(date)] || 0 });
      }
      weeks.push(col);
    }
  }
  const heatColor = (c: number) => c === 0 ? "bg-zinc-900" : c === 1 ? "bg-amber-500/40" : c === 2 ? "bg-amber-500/70" : "bg-amber-500";

  const skillIcon: Record<string, string> = { reading: "📖", listening: "🎧", writing: "✍️", speaking: "🗣️" };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#050505] text-zinc-900 dark:text-[#f4f4f5] font-sans selection:bg-amber-500/30">

      <header className="sticky top-0 z-30 bg-white/80 dark:bg-[#050505]/80 backdrop-blur-xl border-b border-zinc-200 dark:border-white/5">
        <div className="mx-auto max-w-4xl flex h-16 items-center justify-between px-6">
          <Link href="/dashboard" className="text-zinc-500 hover:text-black dark:hover:text-white text-sm font-semibold transition-colors">← Dashboard</Link>
          <span className="text-xs font-bold uppercase tracking-widest text-amber-500">📊 Statistika</span>
          <span className="w-16" />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 md:px-6 py-8 space-y-8 perspective-1000 pb-safe">
        {/* Top cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="glass-card hover-3d-lift rounded-2xl p-6 border-orange-500/20 bg-orange-500/5 shadow-md flex flex-col justify-center items-center">
            <div className="text-4xl font-black text-orange-500">{streak}🔥</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-2">Kun ketma-ket</div>
          </div>
          <div className="glass-card hover-3d-lift rounded-2xl p-6 shadow-md flex flex-col justify-center items-center">
            <div className="text-4xl font-black text-black dark:text-white">{history.length}</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-2">Test topshirildi</div>
          </div>
          <div className="glass-card hover-3d-lift rounded-2xl p-6 shadow-md flex flex-col justify-center items-center">
            <div className="text-4xl font-black text-amber-500">{overall ? (trackScore(track, overall)) : "—"}</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-2">O'rtacha {track.scoreLabel}</div>
          </div>
          <div className="glass-card hover-3d-lift rounded-2xl p-6 border-emerald-500/20 bg-emerald-500/5 shadow-md flex flex-col justify-center items-center">
            <div className="text-4xl font-black text-emerald-500">{vocabLearned}</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-2">So'z o'rganildi</div>
          </div>
        </div>

        {/* Heatmap */}
        <div className="glass-card hover-3d-lift rounded-[2rem] p-8 shadow-xl">
          <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-6">Faollik (so'nggi 12 hafta)</h2>
          <div className="flex gap-1.5 overflow-x-auto pb-4 custom-scrollbar">
            {weeks.map((col, w) => (
              <div key={w} className="flex flex-col gap-1.5">
                {col.map((cell, d) => (
                  <div key={d} title={`${dayKey(cell.date)}: ${cell.count} test`} className={`w-4 h-4 rounded-sm transition-colors ${cell.date.getTime() > todayTs ? "bg-transparent" : heatColor(cell.count)}`} />
                ))}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-4 text-xs font-bold text-zinc-500">
            Kam <span className="w-4 h-4 rounded-sm bg-zinc-900" /><span className="w-4 h-4 rounded-sm bg-amber-500/40" /><span className="w-4 h-4 rounded-sm bg-amber-500/70" /><span className="w-4 h-4 rounded-sm bg-amber-500" /> Ko'p
          </div>
        </div>

        {/* Per-skill */}
        <div className="glass-card hover-3d-lift rounded-[2rem] p-8 shadow-xl">
          <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-6">Bo'limlar bo'yicha</h2>
          <div className="space-y-5">
            {stats.map((s) => (
              <div key={s.name} className="flex items-center gap-3 md:gap-4">
                <span className="text-xl md:text-2xl w-6 md:w-8 text-center">{skillIcon[s.name]}</span>
                <span className="w-16 md:w-24 capitalize text-xs md:text-sm font-bold">{s.name}</span>
                <div className="flex-1 h-3 rounded-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden shadow-inner">
                  <div className="h-full bg-gradient-to-r from-amber-500 to-amber-300 dark:to-yellow-500 transition-all duration-1000" style={{ width: `${(s.avg / 9) * 100}%` }} />
                </div>
                <span className="w-10 md:w-16 text-right font-black text-sm md:text-lg text-amber-500">{s.count ? s.avg.toFixed(1) : "—"}</span>
                <span className="w-14 md:w-20 text-right text-[10px] md:text-xs font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest">{s.count} test</span>
              </div>
            ))}
          </div>
        </div>

        {history.length === 0 && (
          <p className="text-center text-zinc-500 font-bold text-sm bg-white/5 dark:bg-zinc-900/50 p-6 rounded-2xl border border-zinc-200 dark:border-white/5">
            Hali test topshirmadingiz. Boshlash uchun bo'lim tanlang — statistika shu yerda to'ladi.
          </p>
        )}
      </main>
    </div>
  );
}
