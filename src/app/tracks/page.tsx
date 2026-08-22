"use client";

// YO'NALISHLAR HUB'I — ilovaning yangi kirish nuqtasi.
// Ilgari `/start` yo'nalish so'rardi-yu, tanlov hech qayerda ishlatilmasdi va
// hamma bir xil IELTS oqimiga tushardi. Endi har yo'nalish alohida joy.

import Link from "next/link";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check, Clock, FileText } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getVisibleTracks, trackScore, type Track } from "@/lib/tracks";
import { trackTheme } from "@/lib/trackTheme";
import { useTestHistory } from "@/lib/useTestHistory";
import { useTrack } from "@/lib/useTrack";

const LANGUAGE_GROUPS: { id: string; label: string }[] = [
  { id: "english", label: "Ingliz tili" },
  { id: "korean", label: "Koreys tili" },
  { id: "chinese", label: "Xitoy tili" },
  { id: "japanese", label: "Yapon tili" },
  { id: "russian", label: "Rus tili" },
];

const STATUS_LABEL: Record<Track["status"], string | null> = {
  live: null,
  beta: "Beta",
  soon: "Tez kunda",
};

function totalMinutes(track: Track): number {
  return track.sections.reduce((sum, s) => sum + s.minutes, 0);
}

export default function TracksPage() {
  const tracks = getVisibleTracks();
  const history = useTestHistory();
  const { trackId: activeId } = useTrack();

  // Har yo'nalish bo'yicha nechta test ishlangan va o'rtacha natija qanday.
  const statsByTrack = useMemo(() => {
    const map = new Map<string, { count: number; avg: number }>();
    for (const r of history) {
      const id = r.trackId || "ielts";
      const prev = map.get(id) || { count: 0, avg: 0 };
      const count = prev.count + 1;
      map.set(id, { count, avg: (prev.avg * prev.count + (Number(r.band) || 0)) / count });
    }
    return map;
  }, [history]);

  const grouped = LANGUAGE_GROUPS.map((g) => ({
    ...g,
    items: tracks.filter((t) => t.language === g.id),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#050505] text-zinc-900 dark:text-zinc-100">
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#050505]/80 backdrop-blur-xl border-b border-zinc-200 dark:border-white/5 py-4 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.jpg" alt="logo" className="w-8 h-8 rounded-full border border-amber-500/20" />
            <span className="text-xl font-black">kmb<span className="text-amber-500">.education</span></span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-3">Yo&apos;nalishni tanlang</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-lg max-w-2xl">
            Har bir yo&apos;nalish alohida tayyorlanadi: o&apos;z formati, o&apos;z vaqti, o&apos;z ball tizimi va
            o&apos;z statistikasi bilan. Natijalar aralashib ketmaydi.
          </p>
        </div>

        {grouped.map((group) => (
          <section key={group.id} className="mb-14">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600 mb-5">
              {group.label}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {group.items.map((track, i) => {
                const theme = trackTheme(track);
                const stats = statsByTrack.get(track.id);
                const isActive = track.id === activeId;
                const badge = STATUS_LABEL[track.status];

                return (
                  <motion.div
                    key={track.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      href={`/t/${track.id}`}
                      className={`group block h-full p-6 rounded-3xl bg-white dark:bg-zinc-900/60 border transition-all hover:shadow-xl hover:-translate-y-0.5 ${
                        isActive
                          ? `${theme.border} ring-2 ${theme.ring}`
                          : "border-zinc-200 dark:border-white/5"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-12 h-12 rounded-2xl ${theme.bg} flex items-center justify-center text-2xl`}>
                          {track.emoji}
                        </div>
                        <div className="flex items-center gap-2">
                          {isActive && (
                            <span className={`text-[10px] font-black uppercase tracking-widest ${theme.text} flex items-center gap-1`}>
                              <Check className="w-3 h-3" /> Aktiv
                            </span>
                          )}
                          {badge && (
                            <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-zinc-100 dark:bg-white/5 text-zinc-500">
                              {badge}
                            </span>
                          )}
                        </div>
                      </div>

                      <h3 className="text-lg font-black mb-1">{track.title}</h3>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-5 min-h-[40px]">{track.subtitle}</p>

                      {track.kind === "exam" ? (
                        <div className="flex flex-wrap gap-3 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-5">
                          <span className="inline-flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5" /> {track.sections.length} bo&apos;lim
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> {totalMinutes(track)} daqiqa
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-3 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-5">
                          <span className="inline-flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5" /> {track.levels.join(" · ")}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-white/5">
                        {stats ? (
                          <span className="text-sm font-bold">
                            <span className={theme.text}>{trackScore(track, stats.avg)}</span>
                            <span className="text-zinc-400 dark:text-zinc-600 font-medium ml-2">
                              {stats.count} ta test
                            </span>
                          </span>
                        ) : (
                          <span className="text-sm text-zinc-400 dark:text-zinc-600 font-medium">Hali boshlanmagan</span>
                        )}
                        <ArrowRight className={`w-4 h-4 ${theme.text} group-hover:translate-x-1 transition-transform`} />
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
