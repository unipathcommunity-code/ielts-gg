"use client";

// PRO SAHIFASI — obuna holati, tariflar va promo kod.
//
// Ilgari "premium" localStorage'dagi `ielts_premium_unlocked` bayrog'i edi va uni
// har kim DevTools'dan yoqib olardi. Endi obuna Supabase'dagi `entitlements`
// jadvalida, qaror serverda qabul qilinadi — bu sahifa faqat holatni ko'rsatadi
// va promo kodni serverga yuboradi.

import Link from "next/link";
import { useState } from "react";
import { Check, Crown, X } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/lib/useAuth";
import { usePlan } from "@/lib/usePlan";
import { authHeaders } from "@/lib/apiClient";
import { PLANS, formatUzs } from "@/lib/pricing";

export default function ProPage() {
  const { user } = useAuth();
  const { plan, isPro, expiresAt, loading } = usePlan();

  const [code, setCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const redeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || redeeming) return;
    setRedeeming(true);
    setResult(null);
    try {
      const res = await fetch("/api/promo/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeaders()) },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      setResult({ ok: res.ok, message: data.message || "Noma'lum javob." });
      if (res.ok) setCode("");
    } catch {
      setResult({ ok: false, message: "Tarmoq xatosi. Internetni tekshirib, qayta urinib ko'ring." });
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#050505] text-zinc-900 dark:text-zinc-100">
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#050505]/80 backdrop-blur-xl border-b border-zinc-200 dark:border-white/5 py-4 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/tracks" className="flex items-center gap-2">
            <img src="/logo.jpg" alt="logo" className="w-8 h-8 rounded-full border border-amber-500/20" />
            <span className="text-xl font-black">kmb<span className="text-amber-500">.education</span></span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Joriy holat */}
        <div className="mb-12 p-6 rounded-3xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1">
              Joriy rejangiz
            </p>
            <p className="text-2xl font-black flex items-center gap-2">
              {loading ? (
                "…"
              ) : isPro ? (
                <>
                  <Crown className="w-5 h-5 text-amber-500" />
                  {plan === "org" ? "O'quv markazi" : "Pro"}
                </>
              ) : user ? (
                "Bepul"
              ) : (
                "Mehmon"
              )}
            </p>
            {expiresAt && (
              <p className="text-xs text-zinc-500 mt-1">
                Amal qilish muddati: {new Date(expiresAt).toLocaleDateString("uz-UZ")}
              </p>
            )}
          </div>
          {!user && (
            <Link
              href="/login"
              className="bg-zinc-900 dark:bg-white text-white dark:text-black px-6 py-3 rounded-xl font-bold"
            >
              Hisobga kirish
            </Link>
          )}
        </div>

        <div className="mb-10">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-3">Tariflar</h1>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-2xl">
            Bepul reja bilan ham to&apos;liq tayyorlanish mumkin. Pro — AI baholash va jonli
            suhbat cheklovlarini olib tashlaydi.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
          {PLANS.map((p) => (
            <div
              key={p.id}
              className={`rounded-3xl p-7 flex flex-col border ${
                p.highlight
                  ? "bg-zinc-900 dark:bg-white text-white dark:text-black border-zinc-800 dark:border-zinc-200 shadow-2xl lg:-translate-y-2"
                  : "bg-white dark:bg-zinc-900/60 border-zinc-200 dark:border-white/5"
              }`}
            >
              <div className="flex items-start justify-between mb-1">
                <h3 className="text-xl font-black">{p.name}</h3>
                {p.badge && (
                  <span className="px-2.5 py-1 bg-amber-500/20 text-amber-500 text-[10px] font-black uppercase tracking-widest rounded-full">
                    {p.badge}
                  </span>
                )}
              </div>
              <p className={`text-sm mb-6 ${p.highlight ? "text-zinc-400 dark:text-zinc-600" : "text-zinc-500 dark:text-zinc-400"}`}>
                {p.tagline}
              </p>

              <div className="mb-7">
                {p.priceUzs === null ? (
                  <span className="text-3xl font-black">Kelishuv</span>
                ) : p.priceUzs === 0 ? (
                  <span className="text-4xl font-black">Bepul</span>
                ) : (
                  <>
                    <span className="text-3xl font-black">{formatUzs(p.priceUzs)}</span>
                    <span className="text-sm text-zinc-500 ml-1">{p.period}</span>
                  </>
                )}
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
                {p.missing?.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm opacity-50">
                    <X className="w-4 h-4 mt-0.5 shrink-0" />
                    <span className="line-through">{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={p.cta.href}
                className={`w-full py-3.5 rounded-2xl font-bold text-center transition-colors ${
                  p.highlight
                    ? "bg-amber-500 hover:bg-amber-400 text-black"
                    : "bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }`}
              >
                {p.cta.label}
              </Link>
            </div>
          ))}
        </div>

        {/* Promo kod */}
        <section className="max-w-xl mx-auto p-8 rounded-3xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/5">
          <h2 className="text-xl font-black mb-2">Promo kod</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
            O&apos;quv markazingiz yoki aksiyadan kod olgan bo&apos;lsangiz, shu yerga kiriting.
          </p>

          <form onSubmit={redeem} className="flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="KMB-XXXXX"
              className="flex-1 px-4 py-3.5 rounded-xl bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 font-mono tracking-widest outline-none focus:border-amber-500/50"
            />
            <button
              type="submit"
              disabled={redeeming || !code.trim()}
              className="px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold disabled:opacity-40 transition-opacity"
            >
              {redeeming ? "…" : "Faollashtirish"}
            </button>
          </form>

          {result && (
            <p
              className={`mt-4 text-sm font-medium ${
                result.ok ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"
              }`}
            >
              {result.message}
            </p>
          )}

          <p className="mt-6 text-xs text-zinc-400 leading-relaxed">
            To&apos;lov tizimi (Payme / Click) ulanish jarayonida. Hozircha Pro obunani promo kod
            orqali yoki biz bilan bog&apos;lanib olishingiz mumkin:{" "}
            <a href="mailto:contact@kmb.education" className="text-amber-500 font-semibold">
              contact@kmb.education
            </a>
          </p>
        </section>
      </main>
    </div>
  );
}
