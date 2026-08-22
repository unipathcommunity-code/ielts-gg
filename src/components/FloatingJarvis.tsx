"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export function FloatingJarvis() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const isHidden = 
    pathname === "/start" || 
    pathname === "/login" || 
    pathname === "/jarvis" ||
    pathname === "/movies" ||
    pathname === "/";

  if (isHidden) return null;

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
        
        {/* Chat window */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="mb-4 w-[320px] bg-zinc-950/90 backdrop-blur-xl border border-amber-500/30 rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(245,158,11,0.15)] pointer-events-auto"
            >
              <div className="bg-amber-500/10 border-b border-amber-500/20 p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-black uppercase tracking-widest text-amber-500">Jarvis AI</span>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white">✕</button>
              </div>
              <div className="p-5">
                <p className="text-sm text-zinc-300 font-medium mb-4">Salom! Men sizning AI yordamchingizman. To'liq suhbat va mashg'ulotlar uchun Jarvis xonasiga kiring.</p>
                <Link href="/jarvis" onClick={() => setIsOpen(false)} className="w-full block text-center bg-amber-500 hover:bg-amber-400 text-black font-black py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                  To'liq Rejimni Ochish
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Orb Button */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-16 h-16 rounded-full group cursor-pointer pointer-events-auto flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
        >
          <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-md group-hover:bg-amber-500/30 transition-colors" />
          <div className="absolute inset-2 border-2 border-amber-500/50 rounded-full animate-[spin_4s_linear_infinite]" />
          <div className="absolute inset-3 border border-amber-400/30 rounded-full animate-[spin_3s_linear_infinite_reverse]" />
          <div className="relative w-8 h-8 bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.8)] rounded-full animate-pulse" />
        </button>

      </div>
    </>
  );
}
