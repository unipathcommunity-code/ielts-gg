"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/useAuth";
import { roundIelts, computeStreak, formatUzbekDate } from "@/lib/bandUtils";
import { useTrack } from "@/lib/useTrack";
import { usePrepPlan } from "@/lib/usePrepPlan";
import { useVocabLearnedCount } from "@/lib/useVocabSrs";
import { useTestHistory } from "@/lib/useTestHistory";
import { trackScore } from "@/lib/tracks";
import { listMyCertificates, type CertificateRecord } from "@/lib/certificates";
import { Certificate } from "@/components/Certificate";

export default function ProfilePage() {
  const { user, loading, name, isAdmin, signOut } = useAuth();
  const history = useTestHistory();
  const vocabLearned = useVocabLearnedCount();
  const prep = usePrepPlan();
  const { track } = useTrack();
  const [certificates, setCertificates] = useState<CertificateRecord[]>([]);
  const [viewingCert, setViewingCert] = useState<CertificateRecord | null>(null);

  useEffect(() => {
    if (user) listMyCertificates(user.id).then(setCertificates);
  }, [user]);

  // Faqat aktiv YO'NALISH natijalari o'rtachaga kiradi — IELTS band, Multilevel
  // bali va TOPIK darajasi bir shkalada emas.
  const langHistory = history.filter((h) => (h.trackId || "ielts") === track.id);

  const sections = ["reading", "listening", "writing", "speaking"] as const;
  const secStat = (t: string) => { const xs = langHistory.filter((h) => h.type === t); return xs.length ? xs.reduce((a, b) => a + b.band, 0) / xs.length : 0; };
  const stats = sections.map((s) => ({ name: s, avg: secStat(s) }));
  const active = stats.filter((s) => s.avg > 0);
  const overall = active.length ? roundIelts(active.reduce((a, b) => a + b.avg, 0) / active.length) : null;

  // Streak reflects activity in ANY language (engagement), unlike the band average above
  // which is scoped to the current language (different exams use incomparable scales).
  const streak = computeStreak(history.map((h) => h.date));

  const skillIcon: Record<string, string> = { reading: "📖", listening: "🎧", writing: "✍️", speaking: "🗣️" };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#050505] text-zinc-900 dark:text-[#f4f4f5] font-sans selection:bg-amber-500/30">

      <header className="sticky top-0 z-30 bg-white/80 dark:bg-[#050505]/80 backdrop-blur-xl border-b border-zinc-200 dark:border-white/5">
        <div className="mx-auto max-w-3xl flex h-16 items-center justify-between px-6">
          <Link href="/dashboard" className="text-zinc-500 hover:text-black dark:hover:text-white text-sm font-semibold transition-colors">← Dashboard</Link>
          <span className="text-xs font-bold uppercase tracking-widest text-amber-500">👤 Shaxsiy Kabinet</span>
          <span className="w-16" />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10 perspective-1000 pb-safe">
        {loading ? (
          <p className="text-center text-zinc-500 py-20">Yuklanmoqda…</p>
        ) : !user ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔒</div>
            <h1 className="text-xl font-bold mb-2">Kabinetingizni ko'rish uchun kiring</h1>
            <p className="text-zinc-500 text-sm mb-6">Hisobingizga kirsangiz, natijalaringiz va sozlamalaringiz shu yerda bo'ladi.</p>
            <Link href="/login" className="inline-block bg-amber-500 text-black font-bold px-8 py-3 rounded-full hover:bg-amber-400">Kirish / Ro'yxatdan o'tish</Link>
          </div>
        ) : (
          <>
            {/* Account card */}
            <div className="glass-card hover-3d-lift rounded-[2rem] p-8 mb-8 flex flex-col md:flex-row items-center gap-6 shadow-xl relative overflow-hidden group">
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/20 rounded-full blur-[60px] group-hover:bg-amber-500/30 transition-colors duration-500"></div>
              
              <div className="h-24 w-24 rounded-[1.5rem] bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-white font-black text-4xl uppercase shrink-0 shadow-[0_0_30px_rgba(245,158,11,0.3)]">
                {(name || "U").slice(0, 1)}
              </div>
              
              <div className="flex-1 min-w-0 text-center md:text-left z-10">
                <div className="font-black text-2xl flex items-center justify-center md:justify-start gap-3">
                  {name} 
                  {isAdmin && <span className="text-[10px] bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-full uppercase tracking-widest">ADMIN</span>}
                </div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400 truncate mt-1">{user.email}</div>
                {prep?.target && <div className="inline-flex mt-3 items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-500 text-xs font-bold rounded-lg uppercase tracking-widest">
                  🎯 Maqsad: {prep.target}
                </div>}
              </div>
              
              <button onClick={() => signOut()} className="text-xs font-bold px-6 py-3 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all shrink-0 z-10 uppercase tracking-widest">
                Chiqish
              </button>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="glass-card hover-3d-lift rounded-2xl p-6 text-center shadow-md">
                <div className="text-3xl font-black text-amber-500">{overall ? trackScore(track, overall) : "—"}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-2">O'rtacha {track.scoreLabel}</div>
              </div>
              <div className="glass-card hover-3d-lift rounded-2xl p-6 text-center shadow-md border-orange-500/20 bg-orange-500/5">
                <div className="text-3xl font-black text-orange-500">{streak}🔥</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-2">Kun ketma-ket</div>
              </div>
              <div className="glass-card hover-3d-lift rounded-2xl p-6 text-center shadow-md border-emerald-500/20 bg-emerald-500/5">
                <div className="text-3xl font-black text-emerald-500">{vocabLearned}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-2">O'rganilgan so'z</div>
              </div>
            </div>

            {/* Per-skill */}
            <div className="glass-card hover-3d-lift rounded-[2rem] p-8 mb-8 shadow-xl">
              <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-4">Bo'limlar bo'yicha</h2>
              <div className="space-y-3">
                {stats.map((s) => (
                  <div key={s.name} className="flex items-center gap-3">
                    <span className="text-lg w-6">{skillIcon[s.name]}</span>
                    <span className="w-24 capitalize text-sm">{s.name}</span>
                    <div className="flex-1 h-2 rounded-full bg-zinc-900 overflow-hidden"><div className="h-full bg-gradient-to-r from-amber-500 to-yellow-500" style={{ width: `${(s.avg / 9) * 100}%` }} /></div>
                    <span className="w-10 text-right font-mono font-bold text-amber-500">{s.avg ? s.avg.toFixed(1) : "—"}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Certificates */}
            {certificates.length > 0 && (
              <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 mb-6">
                <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-4">🎓 Sertifikatlarim</h2>
                <div className="space-y-2">
                  {certificates.map((c) => (
                    <div key={c.id} className="flex items-center gap-3 bg-zinc-900/60 border border-zinc-800 rounded-xl p-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm">{c.exam_name} — {c.native_score}</div>
                        <div className="text-[11px] text-zinc-500">{formatUzbekDate(c.issued_at)}</div>
                      </div>
                      <button onClick={() => setViewingCert(c)} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20 shrink-0">
                        Ko'rish
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Shortcuts */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[{ h: "/stats", l: "📊 Statistika" }, { h: "/vocabulary", l: "📚 Lug'at" }, { h: "/test/mock", l: "🎓 Mock" }, { h: "/dashboard", l: "🏠 Dashboard" }].map((x) => (
                <Link key={x.h} href={x.h} className="bg-zinc-950 border border-zinc-900 rounded-xl p-4 text-center text-sm font-bold hover:border-amber-500/40 transition-colors">{x.l}</Link>
              ))}
            </div>
          </>
        )}
      </main>
      {viewingCert && <Certificate cert={viewingCert} onClose={() => setViewingCert(null)} />}
    </div>
  );
}
