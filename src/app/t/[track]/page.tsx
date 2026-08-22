"use client";

// YO'NALISH DASHBOARD'I — har bir yo'nalishning O'Z boshqaruv paneli.
//
// Eski `/dashboard` dan farqi:
//  · statistika faqat shu yo'nalish bo'yicha hisoblanadi (IELTS va Multilevel
//    natijalari bir o'rtachaga qo'shilib ketmaydi);
//  · bo'limlar ro'yxati `tracks.ts` dan keladi — Multilevel'da 5 qismli Reading,
//    JLPT'da Writing yo'q, grammatikada esa umuman boshqa oqim;
//  · ball shu yo'nalishning o'z shkalasida ko'rsatiladi (band / 0-75 / N-daraja);
//  · "Bugungi vazifa" haqiqiy ma'lumotdan chiqadi — eski dashboard'da matn
//    qattiq kodda yozilgan va sana solishtiruvi buzuq edi (`h.created_at` maydoni
//    umuman mavjud emas, shuning uchun hamma narsa "bugun bajarilgan" ko'rinardi).

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  Circle,
  Crown,
  Headphones,
  Layers,
  Mic,
  PenTool,
  Send,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/lib/useAuth";
import { usePlan } from "@/lib/usePlan";
import { useTrack } from "@/lib/useTrack";
import { useTrackHistory } from "@/lib/useTestHistory";
import { trackTheme } from "@/lib/trackTheme";
import { aiFetch, QuotaError } from "@/lib/apiClient";
import { trackScore, trackLevel, type SkillKey } from "@/lib/tracks";

const SKILL_META: Record<SkillKey, { label: string; icon: React.ReactNode; tone: string }> = {
  reading: { label: "Reading", icon: <BookOpen className="w-5 h-5" />, tone: "text-blue-500 bg-blue-500/10" },
  listening: { label: "Listening", icon: <Headphones className="w-5 h-5" />, tone: "text-amber-500 bg-amber-500/10" },
  writing: { label: "Writing", icon: <PenTool className="w-5 h-5" />, tone: "text-purple-500 bg-purple-500/10" },
  speaking: { label: "Speaking", icon: <Mic className="w-5 h-5" />, tone: "text-emerald-500 bg-emerald-500/10" },
};

interface ChatMessage {
  role: "user" | "ai";
  text: string;
}

function sameDay(iso: string | undefined, day: string): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  return !isNaN(d.getTime()) && d.toDateString() === day;
}

export default function TrackDashboard() {
  const { track, trackId } = useTrack();
  const theme = trackTheme(track);
  const { user } = useAuth();
  const { plan, isPro } = usePlan();
  const history = useTrackHistory(trackId);

  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "ai", text: `Salom! Men ${track.title} bo'yicha ustozingizman. Nimadan boshlaymiz?` },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const statsBySkill = useMemo(() => {
    const map = new Map<string, { count: number; avg: number; last: number }>();
    for (const r of history) {
      const prev = map.get(r.type) || { count: 0, avg: 0, last: 0 };
      const count = prev.count + 1;
      map.set(r.type, {
        count,
        avg: (prev.avg * prev.count + (Number(r.band) || 0)) / count,
        last: prev.count === 0 ? Number(r.band) || 0 : prev.last,
      });
    }
    return map;
  }, [history]);

  const overall = useMemo(() => {
    const values = track.sections
      .map((s) => statsBySkill.get(s.skill))
      .filter((v): v is { count: number; avg: number; last: number } => !!v && v.count > 0)
      .map((v) => v.avg);
    if (!values.length) return null;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }, [track, statsBySkill]);

  // Eng zaif bo'lim — "bugungi missiya" shundan chiqadi, qattiq kodlangan matndan emas.
  const weakest = useMemo(() => {
    const scored = track.sections
      .map((s) => ({ skill: s.skill, stat: statsBySkill.get(s.skill) }))
      .filter((x) => x.stat && x.stat.count > 0);
    if (!scored.length) return track.sections[0]?.skill ?? null;
    return scored.sort((a, b) => (a.stat!.avg ?? 9) - (b.stat!.avg ?? 9))[0].skill;
  }, [track, statsBySkill]);

  const today = new Date().toDateString();
  const doneToday = useMemo(
    () => new Set(history.filter((r) => sameDay(r.date, today)).map((r) => r.type)),
    [history, today]
  );

  const streak = useMemo(() => {
    const days = new Set(
      history
        .map((r) => (r.date ? new Date(r.date).toDateString() : null))
        .filter((d): d is string => !!d)
    );
    let count = 0;
    const cursor = new Date();
    // Bugundan orqaga qarab uzluksiz kunlarni sanaymiz.
    while (days.has(cursor.toDateString())) {
      count += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return count;
  }, [history]);

  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setInput("");
    const next = [...messages, { role: "user" as const, text }];
    setMessages(next);
    setSending(true);

    try {
      const res = await aiFetch("/api/tutor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: next.slice(-8),
          language: track.language,
          trackId: track.id,
          examName: track.title,
        }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: data.reply || "Javob kelmadi, qaytadan urinib ko'ring." },
      ]);
    } catch (err) {
      const message =
        err instanceof QuotaError
          ? err.message
          : `Xatolik: ${err instanceof Error ? err.message : "noma'lum"}`;
      setMessages((prev) => [...prev, { role: "ai", text: message }]);
    } finally {
      setSending(false);
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const isCourse = track.kind === "course";

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#050505] text-zinc-900 dark:text-zinc-100 pb-24">
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#050505]/80 backdrop-blur-xl border-b border-zinc-200 dark:border-white/5 py-3 px-4 md:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <Link
            href="/tracks"
            className="flex items-center gap-2 min-w-0 group"
            title="Yo'nalishni almashtirish"
          >
            <ChevronLeft className="w-4 h-4 text-zinc-400 group-hover:-translate-x-0.5 transition-transform shrink-0" />
            <span className={`w-9 h-9 rounded-xl ${theme.bg} flex items-center justify-center text-lg shrink-0`}>
              {track.emoji}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-black truncate">{track.title}</span>
              <span className="block text-[10px] uppercase tracking-widest text-zinc-400">
                Yo&apos;nalishni almashtirish
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-3 shrink-0">
            {isPro ? (
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/30">
                <Crown className="w-3 h-3" /> {plan === "org" ? "Markaz" : "Pro"}
              </span>
            ) : (
              <Link
                href="/pro"
                className="hidden sm:inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-black hover:opacity-90 transition-opacity"
              >
                <Crown className="w-3 h-3" /> Pro
              </Link>
            )}
            <ThemeToggle />
            <Link href="/profile">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-cyan-500 p-0.5 hover:scale-105 transition-transform">
                <div className="w-full h-full bg-black rounded-full flex items-center justify-center text-xs font-bold text-white">
                  {user?.email?.[0]?.toUpperCase() || "U"}
                </div>
              </div>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Asosiy ko'rsatkich */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 relative p-8 rounded-3xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/5 overflow-hidden"
          >
            <div className={`absolute -top-24 -right-24 w-64 h-64 rounded-full blur-[80px] ${theme.bg}`} />
            <div className="relative">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2 mb-4">
                <Target className={`w-4 h-4 ${theme.text}`} /> {track.scoreLabel}
              </h2>

              {overall === null ? (
                <>
                  <p className="text-4xl font-black mb-2">Hali natija yo&apos;q</p>
                  <p className="text-zinc-500 dark:text-zinc-400 max-w-md">
                    Birinchi testni topshiring — shundan keyin bu yerda haqiqiy darajangiz va
                    zaif bo&apos;limlaringiz ko&apos;rinadi.
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-end gap-3">
                    <span className={`text-6xl md:text-7xl font-black ${theme.text}`}>
                      {trackScore(track, overall)}
                    </span>
                    {track.scoring === "points-75" && (
                      <span className="text-zinc-400 text-lg mb-3 font-medium">/ 75</span>
                    )}
                    {track.scoring === "band-9" && (
                      <span className="text-zinc-400 text-lg mb-3 font-medium">/ 9.0</span>
                    )}
                    {trackLevel(track, overall) && (
                      <span className="mb-3 px-3 py-1 rounded-full bg-zinc-100 dark:bg-white/5 text-xs font-black tracking-widest">
                        {trackLevel(track, overall)}
                      </span>
                    )}
                  </div>
                  <p className="text-zinc-500 dark:text-zinc-400 mt-4 text-sm max-w-md">
                    {history.length} ta test asosidagi o&apos;rtacha. Bu — taxminiy baho, rasmiy
                    imtihon natijasi emas.
                  </p>
                </>
              )}

              <div className="mt-8 flex flex-wrap gap-3">
                {!isCourse && (
                  <Link
                    href={`/t/${track.id}/test/mock`}
                    className={`${theme.solid} ${theme.solidText} px-6 py-3 rounded-xl font-bold inline-flex items-center gap-2 transition-colors`}
                  >
                    To&apos;liq mock imtihon <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
                <Link
                  href="/jarvis"
                  className="px-6 py-3 rounded-xl font-bold border border-zinc-200 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-white/5 inline-flex items-center gap-2 transition-colors"
                >
                  <Mic className="w-4 h-4" /> Jonli AI suhbat
                </Link>
              </div>
            </div>
          </motion.section>

          {/* Streak + bugungi vazifalar */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="p-6 rounded-3xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/5"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-500" /> Bugungi vazifalar
              </h3>
              <span className="text-xs font-black text-zinc-400">{streak} kun ketma-ket</span>
            </div>

            <div className="space-y-2">
              {(isCourse
                ? [{ skill: "speaking" as SkillKey, label: "Bitta suhbat mashqi", href: "/jarvis" }]
                : track.sections.slice(0, 3).map((s) => ({
                    skill: s.skill,
                    label: `${SKILL_META[s.skill].label} bo'limidan bitta test`,
                    href: `/t/${track.id}/test/${s.skill}`,
                  }))
              ).map((task) => {
                const done = doneToday.has(task.skill);
                return (
                  <Link
                    key={task.skill}
                    href={task.href}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border transition-colors ${
                      done
                        ? "bg-emerald-500/5 border-emerald-500/20"
                        : "bg-zinc-50 dark:bg-black/30 border-zinc-200 dark:border-white/5 hover:bg-zinc-100 dark:hover:bg-white/5"
                    }`}
                  >
                    {done ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-zinc-300 dark:text-zinc-700 shrink-0" />
                    )}
                    <span className={`text-sm font-medium ${done ? "line-through opacity-60" : ""}`}>
                      {task.label}
                    </span>
                  </Link>
                );
              })}
              <Link
                href="/vocabulary"
                className="flex items-center gap-3 p-3.5 rounded-xl border bg-zinc-50 dark:bg-black/30 border-zinc-200 dark:border-white/5 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
              >
                <Circle className="w-5 h-5 text-zinc-300 dark:text-zinc-700 shrink-0" />
                <span className="text-sm font-medium">Lug&apos;at takrori (SRS)</span>
              </Link>
            </div>
          </motion.section>
        </div>

        {/* Bugungi tavsiya — haqiqiy zaif bo'limdan */}
        {weakest && !isCourse && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`p-6 md:p-8 rounded-3xl border ${theme.border} bg-gradient-to-r from-zinc-900 to-zinc-950 text-white relative overflow-hidden`}
          >
            <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px] ${theme.bg}`} />
            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${theme.bg} ${theme.text} mb-3`}>
                  <Sparkles className="w-3 h-3" /> Bugungi tavsiya
                </span>
                <h3 className="text-xl md:text-2xl font-black mb-2">
                  {SKILL_META[weakest].label} bo&apos;limini mustahkamlang
                </h3>
                <p className="text-zinc-400 text-sm max-w-xl">
                  {statsBySkill.get(weakest)?.count
                    ? `Bu bo'limdagi o'rtachangiz — ${trackScore(track, statsBySkill.get(weakest)!.avg)}, boshqa bo'limlardan past.`
                    : "Bu bo'limda hali test ishlamagansiz. Darajangizni aniqlash uchun shundan boshlang."}
                </p>
              </div>
              <Link
                href={`/t/${track.id}/test/${weakest}`}
                className={`${theme.solid} ${theme.solidText} px-6 py-3.5 rounded-2xl font-black shrink-0 inline-flex items-center gap-2 transition-colors`}
              >
                Boshlash <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.section>
        )}

        {/* Bo'limlar */}
        {!isCourse && (
          <section>
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4" /> {track.title} bo&apos;limlari
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {track.sections.map((section) => {
                const meta = SKILL_META[section.skill];
                const stat = statsBySkill.get(section.skill);
                return (
                  <Link
                    key={section.skill}
                    href={`/t/${track.id}/test/${section.skill}`}
                    className="group p-6 rounded-3xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/5 hover:shadow-lg hover:-translate-y-0.5 transition-all"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className={`p-3 rounded-2xl ${meta.tone}`}>{meta.icon}</div>
                      <div className="text-right">
                        <div className="text-2xl font-black">
                          {stat ? trackScore(track, stat.avg) : "—"}
                        </div>
                        <div className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">
                          o&apos;rtacha
                        </div>
                      </div>
                    </div>
                    <h3 className="font-bold text-lg">{meta.label}</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      {section.questions
                        ? `${section.parts} qism · ${section.questions} savol · ${section.minutes} daq`
                        : `${section.tasks ?? section.parts} ta topshiriq · ${section.minutes} daq`}
                    </p>
                    {!section.official && section.note && (
                      <p className="mt-3 text-[11px] leading-snug text-amber-600 dark:text-amber-500/80 bg-amber-500/5 border border-amber-500/20 rounded-lg p-2">
                        {section.note}
                      </p>
                    )}
                    <p className="text-xs text-zinc-400 mt-3">
                      {stat ? `${stat.count} ta test ishlangan` : "Hali boshlanmagan"}
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Kurs yo'nalishlari uchun */}
        {isCourse && (
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              // Darslar kursi hozircha faqat grammatika yo'nalishida mavjud —
              // so'zlashuv yo'nalishida bu kartani ko'rsatish yolg'on bo'lardi.
              ...(track.id === "grammar-en"
                ? [
                    {
                      title: "Darslar",
                      desc: `${track.levels.join(" · ")} — bosqichma-bosqich`,
                      href: `/t/${track.id}/lessons`,
                      icon: <BookOpen className="w-5 h-5" />,
                      tone: "text-violet-500 bg-violet-500/10",
                    },
                  ]
                : []),
              {
                title: "Jonli suhbat",
                desc: "AI bilan erkin gapirish mashqi",
                href: "/jarvis",
                icon: <Mic className="w-5 h-5" />,
                tone: "text-emerald-500 bg-emerald-500/10",
              },
              {
                title: "Lug'at (SRS)",
                desc: "Intervalli takror bilan yodlash",
                href: "/vocabulary",
                icon: <Layers className="w-5 h-5" />,
                tone: "text-pink-500 bg-pink-500/10",
              },
            ].map((card) => (
              <Link
                key={card.title}
                href={card.href}
                className="p-6 rounded-3xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/5 hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                <div className={`p-3 rounded-2xl w-fit mb-4 ${card.tone}`}>{card.icon}</div>
                <h3 className="font-bold text-lg">{card.title}</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{card.desc}</p>
              </Link>
            ))}
          </section>
        )}

        {/* AI ustoz + oxirgi natijalar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="p-6 rounded-3xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/5 flex flex-col">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-zinc-100 dark:border-white/5">
              <div className={`w-10 h-10 rounded-xl ${theme.bg} flex items-center justify-center`}>
                <Zap className={`w-5 h-5 ${theme.text}`} />
              </div>
              <div>
                <h3 className="font-bold">AI Ustoz</h3>
                <p className="text-[10px] uppercase tracking-widest text-zinc-400">
                  {track.title} bo&apos;yicha savol bering
                </p>
              </div>
            </div>

            <div className="flex-1 space-y-3 max-h-72 overflow-y-auto pr-1 mb-4">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-2xl text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-zinc-100 dark:bg-white/5 ml-8"
                      : `${theme.bg} mr-8`
                  }`}
                >
                  {m.text}
                </div>
              ))}
              {sending && (
                <div className="text-xs text-zinc-400 flex items-center gap-2">
                  <span className="w-3 h-3 border-2 border-zinc-300 border-t-transparent rounded-full animate-spin" />
                  yozmoqda…
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={sendMessage} className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Savolingizni yozing…"
                className="flex-1 px-4 py-3 rounded-xl bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 text-sm outline-none focus:border-amber-500/50"
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className={`px-4 rounded-xl ${theme.solid} ${theme.solidText} disabled:opacity-40 transition-opacity`}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </section>

          <section className="p-6 rounded-3xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-500" /> Oxirgi natijalar
              </h3>
              <Link href="/stats" className="text-xs font-bold text-zinc-400 hover:text-amber-500">
                Barchasi →
              </Link>
            </div>

            {history.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400 py-8 text-center">
                Bu yo&apos;nalishda hali test topshirmagansiz.
              </p>
            ) : (
              <div className="space-y-2">
                {history.slice(0, 6).map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-black/30 border border-zinc-100 dark:border-white/5"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold capitalize">
                        {SKILL_META[r.type as SkillKey]?.label || r.type}
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        {r.date ? new Date(r.date).toLocaleDateString("uz-UZ") : ""}
                        {r.correct != null && r.total != null ? ` · ${r.correct}/${r.total}` : ""}
                      </p>
                    </div>
                    <span className={`text-lg font-black ${theme.text}`}>
                      {trackScore(track, Number(r.band) || 0)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
