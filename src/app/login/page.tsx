"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth, isAdminEmail } from "@/lib/useAuth";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Login() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Already signed in → send to the right place by role.
  useEffect(() => {
    if (!authLoading && user) {
      const hasOnboarding = typeof window !== 'undefined' && !!localStorage.getItem("ielts_prep_data");
      router.replace(isAdminEmail(user.email) ? "/admin" : hasOnboarding ? "/dashboard" : "/start");
    }
  }, [authLoading, user, router]);


  const isDisposableEmail = (emailStr: string) => {
    const domains = ['mailinator.com', 'tempmail.com', 'yopmail.com', 'getnada.com', 'dispostable.com', 'sharklasers.com', 'guerrillamail.com', 'temp-mail.org', '10minutemail.com'];
    const domain = emailStr.toLowerCase().trim().split('@')[1];
    return domains.includes(domain);
  };

  const getPasswordStrength = () => {
    if (password.length === 0) return { label: "", color: "bg-zinc-800", width: "w-0" };
    if (password.length < 6) return { label: "Juda qisqa", color: "bg-red-500", width: "w-1/4" };
    const hasLetters = /[a-zA-Z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSymbols = /[^a-zA-Z0-9]/.test(password);
    
    if (hasLetters && hasNumbers && hasSymbols) return { label: "Mukammal", color: "bg-emerald-500", width: "w-full" };
    if (hasLetters && hasNumbers) return { label: "Yaxshi", color: "bg-amber-500", width: "w-3/4" };
    return { label: "Bo'sh", color: "bg-orange-500", width: "w-1/2" };
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null); setInfo(null);
    try {
      if (mode === "signup") {
        if (isDisposableEmail(email)) {
          throw new Error("Vaqtinchalik (disposable) email manzillaridan foydalanish taqiqlanadi.");
        }
        
        // Create an already-confirmed user server-side, then sign in immediately (no email confirmation).
        const res = await fetch("/api/auth/signup", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const d = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(d.error || "Ro'yxatdan o'tishda xatolik");
        const { error: signUpError } = await supabase.auth.signInWithPassword({ email, password });
        if (signUpError) throw signUpError;
        router.replace("/start");
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        const hasOnboarding = typeof window !== 'undefined' && !!localStorage.getItem("ielts_prep_data");
        router.replace(isAdminEmail(email) ? "/admin" : hasOnboarding ? "/dashboard" : "/start");
      }
    } catch (err: any) {
      const m = err?.message || "Xatolik";
      if (/invalid login/i.test(m)) setError("Email yoki parol noto'g'ri.");
      else if (/not confirmed/i.test(m)) setError("Email hali tasdiqlanmagan. Pochtangizni tekshiring.");
      else if (/already registered/i.test(m)) setError("Bu email allaqachon ro'yxatdan o'tgan. Kiring.");
      else setError(m);
    } finally { setLoading(false); }
  };

  // Prevent flash of login screen during active session check
  if (authLoading || (user && !authLoading)) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#050505] flex flex-col items-center justify-center relative overflow-hidden transition-colors">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-amber-500/10 dark:bg-amber-500/5 rounded-full blur-[140px] pointer-events-none -z-10"></div>
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-zinc-500 text-xs font-mono tracking-widest uppercase">Kirish tekshirilmoqda...</p>
      </div>
    );
  }

  const inputCls = "w-full rounded-xl px-4 py-3 text-sm bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all shadow-sm dark:shadow-none";
  const strength = getPasswordStrength();

  return (
    <div className="min-h-screen flex flex-col justify-between bg-zinc-50 dark:bg-[#050505] text-zinc-900 dark:text-[#f4f4f5] font-sans relative overflow-hidden selection:bg-amber-500/20 selection:text-amber-600 dark:selection:text-amber-500 transition-colors">
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-amber-500/10 dark:bg-amber-500/5 rounded-full blur-[140px] -z-10 pointer-events-none"></div>

      <header className="p-6 flex items-center justify-between">
        <Link href="/" className="text-xl font-black tracking-tight flex items-center gap-2">
          <img src="/logo.jpg" alt="kmb.education logo" className="w-8 h-8 rounded-xl object-cover shadow-lg shadow-amber-500/20" />
          kmb<span className="text-amber-500">.education</span>
        </Link>
        <ThemeToggle />
      </header>

      <main className="flex-1 flex items-center justify-center p-6 z-10">
        <div className="w-full max-w-md rounded-3xl p-8 md:p-10 shadow-2xl backdrop-blur-xl border bg-white/70 dark:bg-zinc-950/60 border-white dark:border-zinc-900/80 animate-in fade-in slide-in-from-bottom-8 duration-500 relative">
          
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4 border border-amber-500/25">
              {mode === "login" ? "🔑" : "✨"}
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2">
              {mode === "login" ? "Xush kelibsiz" : "Ro'yxatdan o'tish"}
            </h1>
            <p className="text-xs text-zinc-500 leading-normal">
              {mode === "login"
                ? "Hisobingizga kiring va IELTS tayyorgarligini davom ettiring."
                : "Bepul shaxsiy hisob yarating — barcha test natijalaringiz saqlanadi."}
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email manzilingiz"
                className={inputCls}
              />
            </div>
            
            <div className="space-y-1.5 relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Parol (kamida 6 belgi)"
                className={inputCls}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-zinc-400 hover:text-black dark:text-zinc-500 dark:hover:text-white text-xs font-mono transition-colors"
              >
                {showPassword ? "Hide" : "Show"}
              </button>

              {/* Password Strength Gauge (Signup Mode) */}
              {mode === "signup" && password.length > 0 && (
                <div className="space-y-1 px-1 pt-1.5 animate-in fade-in duration-200">
                  <div className="flex justify-between items-center text-[9px] font-bold font-mono tracking-wide">
                    <span className="text-zinc-500 uppercase">Parol kuchi:</span>
                    <span className={strength.color.replace('bg-', 'text-')}>{strength.label}</span>
                  </div>
                  <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                    <div className={`h-full ${strength.color} ${strength.width} transition-all duration-300`}></div>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/25 p-3 rounded-xl text-red-400 text-xs flex gap-2 animate-in fade-in duration-200">
                <span className="font-extrabold select-none">✕</span>
                <span>{error}</span>
              </div>
            )}
            {info && (
              <div className="bg-emerald-500/10 border border-emerald-500/25 p-3 rounded-xl text-emerald-400 text-xs flex gap-2 animate-in fade-in duration-200">
                <span className="font-extrabold select-none">✓</span>
                <span>{info}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-widest py-3.5 rounded-xl transition-all disabled:opacity-40 shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 hover:-translate-y-0.5"
            >
              {loading ? "Yuklanmoqda..." : mode === "login" ? "Tizimga kirish" : "Hisob yaratish"}
            </button>
          </form>

          <div className="text-center mt-6 text-xs text-zinc-500">
            {mode === "login" ? (
              <>
                Hisobingiz yo'qmi?{" "}
                <button
                  onClick={() => { setMode("signup"); setError(null); }}
                  className="text-amber-500 font-bold hover:underline"
                >
                  Ro'yxatdan o'ting
                </button>
              </>
            ) : (
              <>
                Hisobingiz bormi?{" "}
                <button
                  onClick={() => { setMode("login"); setError(null); }}
                  className="text-amber-500 font-bold hover:underline"
                >
                  Kiring
                </button>
              </>
            )}
          </div>
        </div>
      </main>

      <footer className="p-6 text-center text-[10px] font-mono tracking-wider text-zinc-650">
        © {new Date().getFullYear()} kmb.education · Barcha huquqlar himoyalangan.
      </footer>
    </div>
  );
}
