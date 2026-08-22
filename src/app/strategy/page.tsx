"use client";

import { useState } from "react";
import Link from "next/link";

interface StrategyCard {
  title: string;
  tag: string;
  lang: string;
  summary: string;
  tips: string[];
  templates?: { label: string; structure: string; example: string }[];
}

const STRATEGIES: Record<string, StrategyCard[]> = {
  writing: [
    {
      title: "Writing Task 1 Overview Masterclass",
      tag: "Task 1",
      lang: "Academic",
      summary: "IELTS Task 1 bo'limida 7.0+ ball olishning eng asosiy kaliti — to'g'ri yozilgan 'Overview' (umumiy tahlil) hisoblanadi. Unda hech qanday alohida raqamlar keltirilmaydi, faqatgina umumiy tendensiya ko'rsatiladi.",
      tips: [
        "Hech qachon overview qismida aniq raqam yoki foizlarni yozmang.",
        "Eng yuqori va eng past ko'rsatkichlarni birinchi bo'lib taqqoslang.",
        "Trend o'sish yoki pasayishini 'overall trend' orqali ifodalang."
      ],
      templates: [
        {
          label: "Umumiy Boshlanish (Trendlar uchun)",
          structure: "Overall, it is clear that [ko'rsatkich 1] saw an upward trend, whereas [ko'rsatkich 2] experienced a downward trend over the period.",
          example: "Overall, it is clear that car usage saw an upward trend, whereas public transport usage experienced a downward trend over the period."
        },
        {
          label: "Taqqoslash (Comparison) and Peak",
          structure: "Overall, while [ko'rsatkich 1] remained the most popular choice throughout the timeframe, [ko'rsatkich 2] accounted for the lowest share.",
          example: "Overall, while online shopping remained the most popular choice throughout the timeframe, instore purchases accounted for the lowest share."
        }
      ]
    },
    {
      title: "Writing Task 2 Agree/Disagree Essay structure",
      tag: "Task 2",
      lang: "Opinion",
      summary: "Agree/Disagree savollarida siz o'z pozitsiyangizni aniq ko'rsatishingiz shart. 4 paragrafdan iborat toza akademik struktura eng maqbul yechimdir.",
      tips: [
        "Introduction: Savolni paraphrase qiling va o'z fikringizni (thesis statement) bering.",
        "Body 1: Nega birinchi tomonga qo'shilishingizni tushuntiring (Fakt + misol).",
        "Body 2: Ikkinchi kuchli sababni bering (Fakt + misol).",
        "Conclusion: Fikringizni qayta ta'kidlab xulosa qiling."
      ],
      templates: [
        {
          label: "Introduction (Thesis Statement)",
          structure: "While some argue that [A fikr], I completely agree/disagree with this notion because [Sabab 1] and [Sabab 2].",
          example: "While some argue that homework should be banned, I completely disagree with this notion because it reinforces learning and builds self-discipline."
        },
        {
          label: "Body Paragraf Boshlanishi (Topic Sentence)",
          structure: "The primary reason why I hold this view is that [kuchli sabab]...",
          example: "The primary reason why I hold this view is that excessive academic pressure can lead to severe stress among students."
        }
      ]
    }
  ],
  speaking: [
    {
      title: "Part 3 Abstract Discussion Formula",
      tag: "Part 3",
      lang: "Abstract",
      summary: "Speaking Part 3 savollari shaxsiy tajribaga emas, balki jamiyat, umumiy qonuniyatlar va kelajakka oid bo'ladi. 'O.R.E.O' (Opinion -> Reason -> Example -> Outcome) formulasi orqali javob bering.",
      tips: [
        "Hech qachon 'I think' deb takrorlamang. 'I reckon', 'From my perspective', 'It seems to me' iboralarini ishlating.",
        "Savolga javob berayotganda kengroq nuqtai nazarni oling (yoshlar vs keksalar, shahar vs qishloq).",
        "Grammatika uchun passiv va shartli gaplardan (Conditional sentences) foydalaning."
      ],
      templates: [
        {
          label: "Fikr Bildirish (Opinion)",
          structure: "As far as I am concerned, it is highly likely that [fikringiz]...",
          example: "As far as I am concerned, it is highly likely that traditional textbooks will be entirely replaced by digital tablets in the near future."
        },
        {
          label: "Munosabatni Kengaytirish (Elaboration)",
          structure: "This is mainly due to the fact that [sabab]. For instance, [misol]...",
          example: "This is mainly due to the fact that online resources are far more accessible. For instance, children can carry thousands of books in a single lightweight device."
        }
      ]
    }
  ],
  reading: [
    {
      title: "Matching Headings Skimming Technique",
      tag: "Matching Headings",
      lang: "Strategy",
      summary: "Paragraph sarlavhasini topishda butun matnni so'zma-so'z o'qish xatodir. Paragraphning birinchi va oxirgi 2 ta gapiga e'tibor qarating, chunki asosiy g'oya odatda shu yerda bo'ladi.",
      tips: [
        "Headings ro'yxatini matndan oldin o'qib, kalit so'zlarni belgilang.",
        "Paragraph boshidagi 'However', 'Yet', 'But' so'zlariga qarang, oyatni o'zgartiradi.",
        "O'xshash so'zlarga (distractors) aldanmang, ma'noni sinonimlar orqali qidiring."
      ]
    }
  ]
};

import { BrainCircuit } from "lucide-react";

export default function StrategyPage() {
  const [activeTab, setActiveTab] = useState<"writing" | "speaking" | "reading">("writing");

  const cards = STRATEGIES[activeTab] || [];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#050505] text-zinc-900 dark:text-[#f4f4f5] font-sans selection:bg-amber-500/20 selection:text-amber-500 relative overflow-hidden">
      {/* Background Radial Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse"></div>
      </div>

      <header className="sticky top-0 z-40 border-b border-zinc-200 dark:border-zinc-900 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link href="/dashboard" className="text-zinc-500 hover:text-black dark:hover:text-white transition-colors font-semibold text-sm">
            ← Dashboard
          </Link>
          <span className="text-xs font-black uppercase tracking-widest text-amber-500">💡 IELTS Lessons & Templates</span>
          <span className="w-10"></span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-10 perspective-1000">
        {/* Intro */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-500 text-xs font-black uppercase tracking-widest mb-2 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <BrainCircuit className="w-4 h-4" /> Smart Strategy
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight">IELTS Strategy Portal</h1>
          <p className="text-sm md:text-base text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
            IELTSliz va rasmiy Cambridge examinerlari tomonidan tasdiqlangan eng mukammal insho shablonlari, gapirish formulalari va o'qish strategiyalari to'plami.
          </p>
        </div>

        {/* Dynamic AI Analysis Banner */}
        <div className="glass-card hover-3d-lift rounded-[2rem] p-8 shadow-xl border border-amber-500/30 bg-amber-50 dark:bg-amber-500/5 relative overflow-hidden group">
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-amber-500/20 rounded-full blur-[80px] group-hover:bg-amber-500/30 transition-colors duration-500"></div>
          <div className="relative z-10">
            <h2 className="text-amber-600 dark:text-amber-500 font-black text-lg flex items-center gap-2 mb-2">
              <BrainCircuit className="w-5 h-5" /> AI Tutor Tavsiyasi (Sizning oxirgi natijangiz asosida)
            </h2>
            <p className="text-zinc-700 dark:text-zinc-300 text-sm font-medium leading-relaxed">
              Biz sizning oxirgi natijalaringizni tahlil qildik. Hozirda siz asosan <strong>Speaking Part 3</strong> da qiyinchilikka uchrayapsiz (Abstract savollar). Quyidagi formulalar orqali O.R.E.O texnikasini mashq qilishingizni qat'iy tavsiya qilamiz. Reading qismida esa vaqt yetishmovchiligi sezilmoqda, "Matching Headings Skimming" texnikasiga e'tibor qarating.
            </p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex justify-center">
          <div className="flex gap-2 p-1.5 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl shadow-inner">
            {[
              { key: "writing", label: "✍️ Writing Templates" },
              { key: "speaking", label: "🗣️ Speaking Formulas" },
              { key: "reading", label: "📖 Reading & Listening Skills" }
            ].map((tabOpt) => (
              <button
                key={tabOpt.key}
                onClick={() => setActiveTab(tabOpt.key as any)}
                className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
                  activeTab === tabOpt.key
                    ? "bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)] scale-105"
                    : "text-zinc-500 hover:text-black dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-900"
                }`}
              >
                {tabOpt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Cards list */}
        <div className="space-y-8">
          {cards.map((c, i) => (
            <div key={i} className="glass-card hover-3d-lift rounded-[2rem] p-8 space-y-6 relative overflow-hidden transition-all shadow-lg border border-zinc-200 dark:border-zinc-800/80">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full shadow-sm">
                  {c.tag}
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                  {c.lang}
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-black text-black dark:text-zinc-100 mb-3">{c.title}</h3>
                <p className="text-sm md:text-base text-zinc-600 dark:text-zinc-300 font-medium leading-relaxed">{c.summary}</p>
              </div>

              {/* Tips checklist */}
              <div className="space-y-3 border-t border-zinc-200 dark:border-zinc-900 pt-5">
                <h4 className="text-xs font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest mb-3 flex items-center gap-2">Examiner Tips & Tricks:</h4>
                <ul className="space-y-3">
                  {c.tips.map((tip, idx) => (
                    <li key={idx} className="flex gap-3 text-sm text-zinc-700 dark:text-zinc-400 font-medium leading-relaxed">
                      <span className="text-amber-500 font-black select-none mt-0.5">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Templates */}
              {c.templates && c.templates.length > 0 && (
                <div className="space-y-5 border-t border-zinc-200 dark:border-zinc-900 pt-5">
                  <h4 className="text-xs font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest mb-3">Gaps va Shablonlar:</h4>
                  <div className="grid gap-5 sm:grid-cols-2">
                    {c.templates.map((tpl, tIdx) => (
                      <div key={tIdx} className="bg-white/50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 p-5 rounded-2xl space-y-4 hover:border-amber-500/30 transition-colors shadow-sm">
                        <div className="text-[11px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-wider bg-amber-500/10 inline-block px-2 py-0.5 rounded">{tpl.label}</div>
                        <div className="space-y-1.5">
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-widest block">Tuzilish (Formula)</span>
                          <p className="text-sm text-zinc-800 dark:text-zinc-300 font-mono italic leading-relaxed">"{tpl.structure}"</p>
                        </div>
                        <div className="space-y-1.5 border-t border-zinc-200 dark:border-zinc-900 pt-3">
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-widest block">Misol (Insho)</span>
                          <p className="text-sm text-zinc-700 dark:text-zinc-400 font-medium leading-relaxed">"{tpl.example}"</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
