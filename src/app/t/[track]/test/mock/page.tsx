"use client";

// TO'LIQ MOCK IMTIHON — endi yo'nalishga bog'langan.
// Ilgari bo'limlar ro'yxati TIL orqali aniqlanardi, shuning uchun Multilevel
// tanlagan odam ham IELTS bo'limlarini va "Band 7.0" yozuvini ko'rardi.
// Endi bo'limlar, vaqtlar va ball shkalasi `tracks.ts` dan keladi.

import { useState } from "react";
import Link from "next/link";
import { useTrack } from "@/lib/useTrack";
import { useTrackHistory } from "@/lib/useTestHistory";
import { roundIelts } from "@/lib/bandUtils";
import { trackScore, trackLevel, type SkillKey } from "@/lib/tracks";
import { trackTheme } from "@/lib/trackTheme";
import { useAuth } from "@/lib/useAuth";
import { issueCertificate, type CertificateRecord } from "@/lib/certificates";
import { Certificate } from "@/components/Certificate";
import { fireConfetti } from "@/components/Confetti";

const SKILL_LABEL: Record<SkillKey, { label: string; icon: string }> = {
  listening: { label: "Listening (Tinglash)", icon: "🎧" },
  reading: { label: "Reading (O'qish)", icon: "📖" },
  writing: { label: "Writing (Yozish)", icon: "✍️" },
  speaking: { label: "Speaking (Gapirish)", icon: "🗣️" },
};

export default function MockExam() {
  const { track } = useTrack();
  const theme = trackTheme(track);
  const history = useTrackHistory(track.id);
  const { user, name } = useAuth();

  // Bo'sh bo'lsa akkaunt ismi ishlatiladi — ilgari buni effekt qilardi va
  // foydalanuvchi maydonni ataylab tozalasa, ism qayta yozilib qolardi.
  const [typedName, setTypedName] = useState<string | null>(null);
  const fullName = typedName ?? name ?? "";
  const setFullName = (v: string) => setTypedName(v);
  const [issuing, setIssuing] = useState(false);
  const [issueError, setIssueError] = useState<string | null>(null);
  const [issuedCert, setIssuedCert] = useState<CertificateRecord | null>(null);

  const latest = (type: string) => {
    const xs = history
      .filter((h) => h.type === type)
      .sort((a, b) => +new Date(b.date) - +new Date(a.date));
    return xs[0];
  };

  // Faqat shu imtihonning RASMIY bo'limlari mock hisobiga kiradi — qo'shimcha
  // mashqlar (masalan JLPT'dagi Speaking) sertifikat shartiga ta'sir qilmaydi.
  const sections = track.sections
    .filter((s) => s.official)
    .map((s) => ({
      key: s.skill,
      label: SKILL_LABEL[s.skill].label,
      icon: SKILL_LABEL[s.skill].icon,
      href: `/t/${track.id}/test/${s.skill}`,
      time: `~${s.minutes} daqiqa`,
    }));

  const results = sections.map((s) => ({ ...s, rec: latest(s.key) }));
  const doneCount = results.filter((r) => r.rec).length;
  const allDone = sections.length > 0 && doneCount === sections.length;
  const overall = allDone
    ? roundIelts(results.reduce((a, r) => a + (r.rec!.band || 0), 0) / sections.length)
    : null;
  const eligibleForCertificate = allDone && overall !== null && overall >= track.certificateThreshold;


  const handleClaim = async () => {
    if (!user || overall === null) return;
    const trimmedName = fullName.trim();
    if (trimmedName.split(/\s+/).length < 2 || trimmedName.length < 5) {
      setIssueError("Sertifikat uchun to'liq Ism va Familiyangizni kiriting");
      return;
    }
    setIssuing(true);
    setIssueError(null);
    const breakdown = results.reduce(
      (acc, r) => ({ ...acc, [r.label.split(" ")[0]]: trackScore(track, r.rec!.band) }),
      {}
    );

    const { data, error } = await issueCertificate({
      userId: user.id,
      fullName: trimmedName,
      examFormat: track.examFormat || track.id,
      examName: track.title,
      scoreLabel: JSON.stringify({ label: track.scoreLabel, breakdown }),
      nativeScore: trackScore(track, overall),
      bandNumeric: overall,
    });
    setIssuing(false);
    if (error) {
      setIssueError(error);
      return;
    }
    setIssuedCert(data);
    fireConfetti();
  };

  if (sections.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#050505] flex flex-col items-center justify-center text-center px-6">
        <div className="text-5xl mb-4">{track.emoji}</div>
        <h1 className="text-2xl font-black mb-2">{track.title} — mock imtihon yo&apos;q</h1>
        <p className="text-zinc-500 max-w-md mb-6">
          Bu yo&apos;nalish imtihon emas, kurs. Darslar va mashqlar orqali davom eting.
        </p>
        <Link href={`/t/${track.id}`} className={`${theme.solid} ${theme.solidText} px-6 py-3 rounded-xl font-bold`}>
          Yo&apos;nalishga qaytish
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#050505] text-zinc-900 dark:text-[#f4f4f5] font-sans selection:bg-amber-500/30">
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-[#050505]/80 backdrop-blur-xl border-b border-zinc-200 dark:border-white/5">
        <div className="mx-auto max-w-3xl flex h-16 items-center justify-between px-6">
          <Link
            href={`/t/${track.id}`}
            className="text-zinc-500 hover:text-black dark:hover:text-white text-sm font-semibold transition-colors"
          >
            ← {track.shortTitle}
          </Link>
          <span className={`text-xs font-bold uppercase tracking-widest ${theme.text}`}>
            🎓 {track.shortTitle} Mock Imtihon
          </span>
          <span className="text-xs text-zinc-500 font-mono bg-zinc-200 dark:bg-zinc-900 px-3 py-1 rounded-full">
            {doneCount}/{sections.length}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10 pb-safe">
        <div className="text-center mb-10">
          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full ${theme.bg} ${theme.text} text-xs font-black uppercase tracking-widest mb-6 border ${theme.border}`}>
            <span className={`w-2.5 h-2.5 rounded-full ${theme.solid.split(" ")[0]} animate-pulse`} />
            {track.title} simulyatsiyasi
          </div>
          <h1 className="text-3xl md:text-5xl font-black mb-4">To&apos;liq imtihonni topshiring</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm md:text-base max-w-xl mx-auto">
            {track.title} formatidagi {sections.length} ta bo&apos;limni ({sections.map((s) => s.label.split(" ")[0]).join(", ")})
            ketma-ket topshiring. Har bo&apos;lim tugagach umumiy natija hisoblanadi.
          </p>
        </div>

        <div className="mb-10 bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 p-5 rounded-2xl flex gap-4 items-start">
          <span className="text-2xl mt-1">⏱️</span>
          <div>
            <h3 className="font-bold text-amber-700 dark:text-amber-400 text-sm mb-1 uppercase tracking-widest">
              Vaqt nazorati
            </h3>
            <p className="text-xs text-amber-700/80 dark:text-amber-400/80 font-medium">
              Har bo&apos;limda rasmiy imtihondagi vaqt qo&apos;yiladi
              ({track.sections.filter((s) => s.official).map((s) => `${SKILL_LABEL[s.skill].label.split(" ")[0]} ${s.minutes} daq`).join(" · ")}).
              Haqiqiy sharoitni his qilish uchun bo&apos;limlarni bir o&apos;tirishda bajaring.
            </p>
          </div>
        </div>

        <div className="h-3 bg-zinc-200 dark:bg-zinc-900 rounded-full overflow-hidden mb-10 shadow-inner">
          <div
            className={`h-full bg-gradient-to-r ${theme.gradient} transition-all duration-1000`}
            style={{ width: `${(doneCount / sections.length) * 100}%` }}
          />
        </div>

        <div className="space-y-4 mb-12">
          {results.map((r, i) => (
            <div
              key={r.key}
              className={`flex items-center gap-5 p-6 rounded-[2rem] border bg-white dark:bg-zinc-900/60 transition-all ${
                r.rec
                  ? "border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/5"
                  : "border-zinc-200 dark:border-white/5"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shrink-0 ${
                  r.rec
                    ? "bg-gradient-to-tr from-emerald-500 to-emerald-400 text-white"
                    : "bg-white dark:bg-zinc-900 text-zinc-400 border border-zinc-200 dark:border-zinc-800"
                }`}
              >
                {r.rec ? "✓" : i + 1}
              </div>
              <span className="text-3xl">{r.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-lg truncate">{r.label}</div>
                <div className="text-xs font-semibold mt-1 text-zinc-500">
                  {r.rec ? (
                    <span className="text-emerald-600 dark:text-emerald-400">
                      Oxirgi natija: {trackScore(track, r.rec.band)}
                    </span>
                  ) : (
                    <span className={`flex items-center gap-1 ${theme.text}`}>⏳ {r.time}</span>
                  )}
                </div>
              </div>
              <Link
                href={r.href}
                className={`text-xs font-black uppercase tracking-widest px-6 py-3 rounded-xl shrink-0 transition-all ${
                  r.rec
                    ? "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-black dark:hover:text-white"
                    : `${theme.solid} ${theme.solidText}`
                }`}
              >
                {r.rec ? "Qayta" : "Boshlash"} →
              </Link>
            </div>
          ))}
        </div>

        {allDone ? (
          <div className="rounded-[2rem] p-10 text-center relative overflow-hidden bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/5">
            <div className={`absolute -top-32 -left-32 w-64 h-64 rounded-full blur-[80px] ${theme.bg}`} />
            <div className="relative">
              <div className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-4">
                Umumiy natija · {track.scoreLabel}
              </div>
              <div className={`text-[5rem] leading-none font-black ${theme.text} mb-2`}>
                {trackScore(track, overall!)}
              </div>
              {trackLevel(track, overall!) && (
                <div className="text-sm text-zinc-500 font-bold mb-6">
                  Daraja: {trackLevel(track, overall!)}
                </div>
              )}

              <div
                className="grid gap-4 mt-8"
                style={{ gridTemplateColumns: `repeat(${sections.length}, minmax(0, 1fr))` }}
              >
                {results.map((r) => (
                  <div
                    key={r.key}
                    className="bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4"
                  >
                    <div className="text-2xl mb-1">{r.icon}</div>
                    <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">
                      {r.label.slice(0, 4)}
                    </div>
                    <div className={`font-black text-xl ${theme.text} mt-1`}>
                      {trackScore(track, r.rec!.band)}
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-[11px] text-zinc-400 mt-8 max-w-md mx-auto">
                Bu — mashq natijasi asosidagi taxminiy baho. Rasmiy imtihon natijasi emas.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/5 rounded-2xl p-6 text-center text-sm text-zinc-500">
            Barcha {sections.length} bo&apos;limni topshiring — umumiy natija shu yerda chiqadi.{" "}
            <span className={`${theme.text} font-semibold`}>
              ({doneCount}/{sections.length} bajarildi)
            </span>
          </div>
        )}

        {eligibleForCertificate && (
          <div className={`mt-6 bg-white dark:bg-zinc-900/60 border ${theme.border} rounded-2xl p-6 text-center`}>
            <div className="text-3xl mb-2">🎓</div>
            <h2 className="font-bold mb-1">Tabriklaymiz! Sertifikat olishga haqlisiz</h2>
            <p className="text-xs text-zinc-500 mb-4">
              Natijangiz {track.title} uchun belgilangan chegaradan yuqori. Bu — kmb.education
              ichki sertifikati, rasmiy imtihon hujjati emas.
            </p>
            {!user ? (
              <Link
                href="/login"
                className={`inline-block ${theme.solid} ${theme.solidText} font-bold px-6 py-2.5 rounded-full text-sm`}
              >
                Saqlash uchun kiring →
              </Link>
            ) : (
              <div className="flex flex-col items-center gap-3 max-w-sm mx-auto">
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Sertifikatdagi to'liq ismingiz"
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-center focus:outline-none focus:border-amber-500/50"
                />
                {issueError && <p className="text-xs text-red-400">{issueError}</p>}
                <button
                  onClick={handleClaim}
                  disabled={issuing}
                  className={`${theme.solid} ${theme.solidText} disabled:opacity-60 font-bold px-6 py-2.5 rounded-full text-sm`}
                >
                  {issuing ? "Yaratilmoqda…" : "🎓 Sertifikat yaratish"}
                </button>
              </div>
            )}
          </div>
        )}

        {issuedCert && <Certificate cert={issuedCert} onClose={() => setIssuedCert(null)} />}
      </main>
    </div>
  );
}
