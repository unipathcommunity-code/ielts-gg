"use client";

import { useAuth } from "@/lib/useAuth";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Sparkles, BookOpen, Headphones, PenTool, Mic, Globe2, Activity, Award, CheckCircle2, Star, Zap, Shield, ChevronRight, Play } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PLANS, formatUzs } from "@/lib/pricing";

export default function Home() {
  const { user, loading } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, 300]);
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const containerVariants: any = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants: any = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 80, damping: 20 } }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#fafafa] dark:bg-[#000000] text-zinc-900 dark:text-zinc-100 font-sans selection:bg-amber-500/30 selection:text-amber-500 overflow-x-hidden">
      
      {/* Dynamic Cinematic Background */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/20 via-zinc-950/0 to-zinc-950/0 dark:from-amber-500/10 dark:via-[#000000] dark:to-[#000000]">
        <motion.div 
          animate={{ x: [0, 50, 0], y: [0, -50, 0], scale: [1, 1.2, 1] }} 
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-cyan-500/5 blur-[150px]" 
        />
        <motion.div 
          animate={{ x: [0, -50, 0], y: [0, 50, 0], scale: [1, 1.3, 1] }} 
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-[20%] -right-[10%] w-[40vw] h-[40vw] rounded-full bg-amber-500/5 blur-[150px]" 
        />
      </div>

      {/* Modern Premium Header */}
      <header className={`fixed top-0 z-50 w-full transition-all duration-500 ${scrolled ? "bg-white/70 dark:bg-black/70 backdrop-blur-2xl border-b border-zinc-200 dark:border-white/5 py-3 shadow-[0_4px_30px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_30px_rgba(0,0,0,0.5)]" : "bg-transparent py-6"}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 lg:px-12">
          <Link href="/" className="group flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-500 blur-lg opacity-0 group-hover:opacity-40 transition-opacity duration-500"></div>
              <img src="/logo.jpg" alt="kmb.education logo" className="relative w-10 h-10 rounded-[12px] object-cover shadow-sm border border-zinc-200/50 dark:border-white/10" />
            </div>
            <span className="text-xl font-black tracking-tight text-black dark:text-white">
              kmb<span className="text-amber-500">.education</span>
            </span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-1 bg-zinc-100/50 dark:bg-white/5 rounded-full p-1.5 backdrop-blur-lg border border-zinc-200/50 dark:border-white/10">
            {['Platforma', 'Imkoniyatlar', 'Narxlar'].map((item) => (
              <Link key={item} href={`#${item.toLowerCase()}`} className="px-5 py-2 text-sm font-semibold text-zinc-600 dark:text-zinc-300 hover:text-black dark:hover:text-white rounded-full hover:bg-white dark:hover:bg-white/10 transition-all">
                {item}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            {loading ? (
              <div className="w-8 h-8 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : user ? (
              <Link href="/dashboard">
                <button className="relative group overflow-hidden rounded-full p-[1px]">
                  <span className="absolute inset-0 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 rounded-full opacity-70 group-hover:opacity-100 blur-[2px] transition-opacity duration-500"></span>
                  <div className="relative bg-white dark:bg-black px-6 py-2.5 rounded-full flex items-center gap-2 transition-all">
                    <span className="text-sm font-bold bg-gradient-to-r from-amber-600 to-yellow-500 dark:from-amber-400 dark:to-yellow-300 bg-clip-text text-transparent">Dashboard</span>
                    <ArrowRight className="w-4 h-4 text-amber-500 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              </Link>
            ) : (
              <div className="flex items-center gap-1 sm:gap-2">
                <Link href="/login" className="text-sm font-bold px-3 sm:px-4 py-2.5 text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white transition-colors">
                  Kirish
                </Link>
                <Link href="/start">
                  <button className="bg-black dark:bg-white text-white dark:text-black text-sm font-bold px-4 sm:px-6 py-2.5 rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg hover:shadow-xl">
                    Boshlash
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 relative">
        {/* HERO SECTION */}
        <section className="relative min-h-[95vh] flex flex-col items-center justify-center px-6 text-center pt-32 pb-20">
          <motion.div style={{ y, opacity }} className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center">
            {/* Grid Pattern */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20 dark:opacity-10" />
          </motion.div>

          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="relative z-10 flex flex-col items-center max-w-5xl mx-auto">
            <motion.div variants={itemVariants} className="group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/50 dark:bg-white/5 border border-zinc-200/50 dark:border-white/10 text-xs font-bold uppercase tracking-[0.2em] mb-12 backdrop-blur-xl shadow-sm overflow-hidden cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <Globe2 className="w-4 h-4 text-amber-500" />
              <span className="bg-gradient-to-r from-zinc-800 to-zinc-500 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">GLOBAL TIL O'RGANISH EKOTIZIMI</span>
            </motion.div>
            
            <motion.h1 variants={itemVariants} className="text-[3.5rem] sm:text-6xl md:text-[6rem] lg:text-[7rem] font-black tracking-tighter mb-8 leading-[0.95]">
              <span className="text-zinc-900 dark:text-white block">Mutlaqo 0 dan</span>
              <span className="relative inline-block mt-2">
                <span className="absolute -inset-4 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-cyan-500/20 blur-3xl rounded-full"></span>
                <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-yellow-400 to-orange-500 drop-shadow-sm">Mukammallikkacha.</span>
              </span>
            </motion.h1>
            
            <motion.p variants={itemVariants} className="max-w-2xl text-lg md:text-2xl text-zinc-500 dark:text-zinc-400 mb-14 leading-relaxed font-medium">
              Grammatika, IELTS, Kinolar va AI bilan yuzma-yuz suhbat. <span className="text-zinc-900 dark:text-zinc-200">Sun'iy Intellekt</span> avval darajangizni aniqlaydi va sizni yetaklaydi.
            </motion.p>
            
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto">
              <Link href={user ? "/dashboard" : "/start"} className="w-full sm:w-auto">
                <button className="w-full relative group bg-black dark:bg-white text-white dark:text-black px-8 py-4 rounded-full text-lg font-bold flex items-center justify-center gap-3 hover:scale-105 transition-all shadow-[0_0_40px_rgba(0,0,0,0.1)] dark:shadow-[0_0_40px_rgba(255,255,255,0.15)]">
                  Darajani aniqlash <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  <div className="absolute inset-0 rounded-full border border-white/20 dark:border-black/20 pointer-events-none"></div>
                </button>
              </Link>
              <Link href="#pricing" className="w-full sm:w-auto">
                <button className="w-full px-8 py-4 rounded-full text-lg font-bold flex items-center justify-center gap-2 bg-white/50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 backdrop-blur-md transition-all text-zinc-700 dark:text-zinc-300 hover:shadow-lg">
                  Imkoniyatlar <ChevronRight className="w-5 h-5" />
                </button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Dashboard Preview mockup */}
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 50 }}
            className="mt-32 relative w-full max-w-6xl rounded-t-[40px] border-t border-l border-r border-zinc-200/50 dark:border-white/10 bg-white/40 dark:bg-zinc-950/40 backdrop-blur-3xl shadow-2xl p-4 overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>
            <div className="rounded-[28px] border border-zinc-200/50 dark:border-white/10 overflow-hidden bg-zinc-100 dark:bg-[#0a0a0a] aspect-video relative flex items-center justify-center">
               <div className="absolute inset-0 bg-gradient-to-b from-transparent to-zinc-50 dark:to-black/80 z-10"></div>
               {/* Decorative App UI inside */}
               <div className="w-full h-full p-8 grid grid-cols-3 gap-6 opacity-80">
                  <div className="col-span-2 space-y-6">
                    <div className="h-48 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-white/5 shadow-sm"></div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="h-32 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-white/5 shadow-sm"></div>
                      <div className="h-32 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-white/5 shadow-sm"></div>
                    </div>
                  </div>
                  <div className="col-span-1 space-y-6">
                    <div className="h-full rounded-2xl bg-gradient-to-br from-amber-500/20 to-cyan-500/20 border border-amber-500/20 shadow-sm"></div>
                  </div>
               </div>
               
               <div className="absolute z-20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                  <div className="w-20 h-20 mx-auto rounded-3xl bg-white dark:bg-black border border-zinc-200 dark:border-white/10 shadow-2xl flex items-center justify-center mb-6 relative group cursor-pointer">
                    <div className="absolute inset-0 bg-amber-500 blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                    <Play className="w-8 h-8 text-amber-500 ml-1 relative z-10" />
                  </div>
                  <p className="text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-widest text-sm">Platformani ko'rish</p>
               </div>
            </div>
          </motion.div>
        </section>

        {/* BENTO GRID FEATURES SECTION */}
        <section id="imkoniyatlar" className="py-32 px-6 lg:px-12 bg-white dark:bg-black relative">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-6">Kelajak ta'limi. <br className="hidden md:block"/><span className="text-zinc-400 dark:text-zinc-600">Sizning xonangizda.</span></h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[320px]">
              {/* Feature 1 */}
              <div className="md:col-span-2 rounded-[32px] bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-white/5 p-10 flex flex-col justify-between group hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] -mr-20 -mt-20 transition-all duration-700 group-hover:bg-amber-500/20"></div>
                <div className="relative z-10">
                  <Mic className="w-10 h-10 text-amber-500 mb-6" />
                  <h3 className="text-2xl font-black mb-3">Jonli AI Ustoz (Jarvis)</h3>
                  <p className="text-zinc-500 dark:text-zinc-400 max-w-sm">Haqiqiy inson ovozidagi AI bilan suhbatlashing. U sizning xatolaringizni to'g'rilaydi va speaking ballingizni oshiradi.</p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="md:col-span-1 rounded-[32px] bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-white/5 p-10 flex flex-col justify-between group hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors relative overflow-hidden">
                <div className="absolute bottom-0 right-0 w-40 h-40 bg-purple-500/10 rounded-full blur-[60px] transition-all duration-700 group-hover:bg-purple-500/20"></div>
                <div className="relative z-10">
                  <PenTool className="w-10 h-10 text-purple-500 mb-6" />
                  <h3 className="text-2xl font-black mb-3">Writing AI tahlil</h3>
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm">Insholaringizni Cambridge mezonlari (TR, CC, LR, GRA) bo'yicha baholash.</p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="md:col-span-1 rounded-[32px] bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-white/5 p-10 flex flex-col justify-between group hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-cyan-500/10 rounded-full blur-[60px] transition-all duration-700 group-hover:bg-cyan-500/20"></div>
                <div className="relative z-10">
                  <Activity className="w-10 h-10 text-cyan-500 mb-6" />
                  <h3 className="text-2xl font-black mb-3">Chuqur Analitika</h3>
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm">O'sish grafigi va qaysi qismda oqsashingizni aniq ko'rsatib beradi.</p>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="md:col-span-2 rounded-[32px] bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-white/5 p-10 flex flex-col justify-between group hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors relative overflow-hidden">
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] -ml-20 -mb-20 transition-all duration-700 group-hover:bg-emerald-500/20"></div>
                <div className="relative z-10">
                  <Shield className="w-10 h-10 text-emerald-500 mb-6" />
                  <h3 className="text-2xl font-black mb-3">Kafolatlangan Sertifikat</h3>
                  <p className="text-zinc-500 dark:text-zinc-400 max-w-sm">To'liq Mock testni tugating va IELTS GG rasmiy QR-kodli sertifikatini yuklab oling.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING SECTION (Monetization) */}
        <section id="narxlar" className="py-32 px-6 lg:px-12 bg-zinc-50 dark:bg-[#050505] relative">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-6">Investitsiya. Xarajat emas.</h2>
              <p className="text-zinc-500 dark:text-zinc-400 text-lg max-w-2xl mx-auto">
                Repetitor bir oyda 1-2 million so&apos;m. Mock test sotuvchi platformalar oyiga
                250 000 so&apos;m olib, atigi 15 ta test beradi. Bizda cheksiz AI tahlil bor.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {PLANS.map((plan) => (
                <div
                  key={plan.id}
                  className={`rounded-[32px] p-8 flex flex-col relative overflow-hidden border ${
                    plan.highlight
                      ? "bg-black dark:bg-white text-white dark:text-black border-zinc-800 dark:border-zinc-200 shadow-2xl lg:-translate-y-4"
                      : "bg-white dark:bg-zinc-900/40 border-zinc-200 dark:border-white/5"
                  }`}
                >
                  {plan.highlight && (
                    <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500" />
                  )}

                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-black">{plan.name}</h3>
                    {plan.badge && (
                      <span className="px-3 py-1 bg-amber-500/20 text-amber-500 text-[10px] font-bold uppercase tracking-wider rounded-full">
                        {plan.badge}
                      </span>
                    )}
                  </div>
                  <p className={`text-sm mb-6 ${plan.highlight ? "text-zinc-400 dark:text-zinc-500" : "text-zinc-500 dark:text-zinc-400"}`}>
                    {plan.tagline}
                  </p>

                  <div className="mb-8">
                    {plan.priceUzs === 0 ? (
                      <span className="text-4xl font-black">Bepul</span>
                    ) : plan.priceUzs === null ? (
                      <span className="text-4xl font-black">Kelishuv</span>
                    ) : (
                      <>
                        <span className="text-3xl font-black">{formatUzs(plan.priceUzs)}</span>
                        <span className="text-sm text-zinc-500 ml-1">{plan.period}</span>
                      </>
                    )}
                  </div>

                  <ul className="space-y-3 mb-10 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                    {plan.missing?.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm opacity-40">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                        <span className="line-through">{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Link href={plan.cta.href}>
                    <button
                      className={`w-full py-4 rounded-2xl font-bold transition-colors ${
                        plan.highlight
                          ? "bg-gradient-to-r from-amber-500 to-yellow-400 text-black"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700"
                      }`}
                    >
                      {plan.cta.label}
                    </button>
                  </Link>
                </div>
              ))}
            </div>

            <p className="text-center text-xs text-zinc-400 mt-10 max-w-2xl mx-auto">
              To&apos;lov tizimi (Payme / Click) ulanish jarayonida. Hozircha Pro obuna promo kod
              orqali beriladi &mdash; <Link href="/pro" className="text-amber-500 font-semibold">/pro</Link> sahifasiga qarang.
            </p>
          </div>
        </section>
      </main>

      <footer className="bg-white dark:bg-[#000000] border-t border-zinc-200 dark:border-white/5 pt-20 pb-10 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <img src="/logo.jpg" alt="logo" className="w-6 h-6 rounded-md grayscale" />
            <span className="text-lg font-black text-zinc-400">kmb.education</span>
          </div>
          <div className="text-sm font-semibold text-zinc-500">
            &copy; {new Date().getFullYear()} Billion Dollar Startup. Barcha huquqlar himoyalangan.
          </div>
        </div>
      </footer>

    </div>
  );
}

