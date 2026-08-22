"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function OnboardingModal() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const hasSeen = localStorage.getItem("ielts_gg_onboarded_v2");
    if (!hasSeen) {
      setTimeout(() => setShow(true), 1000);
    }
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem("ielts_gg_onboarded_v2", "true");
    setShow(false);
  };

  const steps = [
    {
      title: "SYSTEM INITIALIZED.",
      desc: "Xush kelibsiz. Siz oddiy test platformasiga emas, balki sun'iy intellekt boshqaruvidagi to'liq 'Kiber-Akademiya'ga kirdingiz."
    },
    {
      title: "O'Z-O'ZINI BOSHQARISH.",
      desc: "Barcha xatolaringiz analiz qilinadi. Barcha natijalaringiz yozib boriladi. Biz sizni 9.0 gacha yetaklaymiz."
    },
    {
      title: "TAYYORMISIZ?",
      desc: "Hozircha missiyangizni boshlang. Jarvis har doim yoningizda."
    }
  ];

  return (
    <AnimatePresence>
      {show && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-6"
        >
          <div className="absolute inset-0 pointer-events-none">
            {/* Cyberpunk grid background effect */}
            <div className="w-full h-full opacity-10 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:30px_30px]" />
          </div>

          <motion.div 
            key={step}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative z-10 max-w-lg w-full"
          >
            <div className="text-amber-500 font-mono text-sm tracking-[0.2em] font-black mb-4">
              [ MESSAGE_PROTOCOL_ACTIVE ]
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight leading-none uppercase">
              {steps[step].title}
            </h1>
            
            <p className="text-zinc-400 text-lg md:text-xl font-medium leading-relaxed mb-10 border-l-2 border-amber-500/50 pl-4">
              {steps[step].desc}
            </p>

            <div className="flex items-center gap-4">
              {step < steps.length - 1 ? (
                <button 
                  onClick={() => setStep(step + 1)}
                  className="bg-white hover:bg-zinc-200 text-black px-8 py-3 rounded-none font-black uppercase tracking-widest text-sm transition-all"
                >
                  DAVOM ETISH
                </button>
              ) : (
                <button 
                  onClick={completeOnboarding}
                  className="bg-amber-500 hover:bg-amber-400 text-black px-8 py-3 rounded-none font-black uppercase tracking-widest text-sm transition-all shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:shadow-[0_0_30px_rgba(245,158,11,0.6)]"
                >
                  TIZIMGA KIRISH
                </button>
              )}
              
              <div className="flex gap-2 ml-auto">
                {steps.map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-1.5 transition-all duration-300 ${i === step ? "w-8 bg-amber-500" : "w-2 bg-zinc-700"}`}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
