"use client";

import { useHydrated } from "@/lib/clientStore";
import { usePracticeLanguage } from "@/lib/usePracticeLanguage";
import { motion } from "framer-motion";

export function AmbientBackground() {
  const [currentLang] = usePracticeLanguage();
  // Til bo'yicha rang faqat klientda ma'lum — SSR'da default'ni chizamiz.
  const mounted = useHydrated();

  // Determine colors based on language
  const colors: Record<string, { top: string, bottom: string }> = {
    english: { top: "bg-amber-500/10", bottom: "bg-cyan-500/10" },
    korean: { top: "bg-pink-500/10", bottom: "bg-blue-500/10" },
    chinese: { top: "bg-red-500/10", bottom: "bg-yellow-500/10" },
    japanese: { top: "bg-red-600/10", bottom: "bg-zinc-500/10" },
    russian: { top: "bg-blue-600/10", bottom: "bg-red-600/10" },
    german: { top: "bg-red-500/10", bottom: "bg-amber-500/10" },
  };

  const theme = mounted ? (colors[currentLang] || colors.english) : colors.english;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
      <motion.div
        className={`absolute top-0 left-1/4 w-[40vw] h-[40vw] rounded-full blur-[100px] animate-pulse ${theme.top}`}
        layout
        transition={{ duration: 1.5 }}
      />
      <motion.div
        className={`absolute bottom-0 right-1/4 w-[40vw] h-[40vw] rounded-full blur-[100px] animate-pulse ${theme.bottom}`}
        layout
        transition={{ duration: 1.5 }}
      />
    </div>
  );
}
