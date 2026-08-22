"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { formatUzbekDate } from "@/lib/bandUtils";

interface PublicCertificate {
  full_name: string;
  exam_name: string;
  score_label: string;
  native_score: string;
  issued_at: string;
  verify_code: string;
}

export default function CertificateVerifyPage() {
  const params = useParams();
  const code = String(params?.code || "");
  const [cert, setCert] = useState<PublicCertificate | null>(null);
  const [status, setStatus] = useState<"loading" | "found" | "not_found">("loading");

  useEffect(() => {
    if (!code) return;
    fetch(`/api/certificates/verify?code=${encodeURIComponent(code)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => { setCert(data); setStatus("found"); })
      .catch(() => setStatus("not_found"));
  }, [code]);

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] font-sans relative overflow-hidden">
      {/* Ambient glow, consistent with the rest of the app */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[500px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

      <header className="relative z-10 border-b border-zinc-900/80 backdrop-blur-sm">
        <div className="mx-auto max-w-4xl flex h-16 items-center justify-between px-6">
          <Link href="/" className="text-xs text-zinc-500 hover:text-white transition-colors uppercase tracking-widest font-bold">
            ← kmb.education
          </Link>
          <span className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold">Sertifikat tekshiruvi</span>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-4xl px-6 py-16 flex flex-col items-center">
        {status === "loading" && (
          <div className="flex flex-col items-center gap-3 py-24 animate-in fade-in">
            <div className="w-10 h-10 rounded-full border-2 border-zinc-800 border-t-amber-500 animate-spin" />
            <p className="text-zinc-500 text-sm">Tekshirilmoqda…</p>
          </div>
        )}

        {status === "not_found" && (
          <div className="text-center py-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <span className="text-4xl">❓</span>
            </div>
            <h1 className="text-2xl font-extrabold mb-2">Sertifikat topilmadi</h1>
            <p className="text-zinc-500 text-sm max-w-sm mx-auto mb-8">
              Bu kod bo'yicha hech qanday sertifikat mavjud emas. Havolani qayta tekshiring yoki kodni to'g'ri kiritganingizga ishonch hosil qiling.
            </p>
            <Link
              href="/"
              className="inline-block bg-amber-500 hover:bg-amber-400 text-black font-bold px-6 py-2.5 rounded-full text-sm transition-colors"
            >
              kmb.education bosh sahifasiga o'tish
            </Link>
          </div>
        )}

        {status === "found" && cert && (
          <div className="w-full flex flex-col items-center animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* Verified badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-8">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Tasdiqlangan haqiqiy sertifikat
            </div>

            {/* Diploma card — mirrors the visual language of the issued certificate itself */}
            <div
              className="relative w-full max-w-2xl aspect-[1.5/1] bg-gradient-to-br from-[#fdfaf3] to-[#f7ecd9] text-[#3b2f1e] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] rounded-sm overflow-hidden"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              <div className="absolute inset-3 border-4 border-double border-amber-700/70 rounded-sm" />
              <div className="absolute inset-6 border border-amber-600/40 rounded-sm" />

              <div className="relative h-full flex flex-col items-center justify-center px-6 sm:px-12 py-8 text-center">
                <div className="text-[10px] tracking-[0.35em] uppercase text-amber-800/80 font-sans font-bold mb-1">kmb.education</div>
                <div className="text-xl sm:text-3xl font-bold tracking-wide mb-1">MUVAFFAQIYAT SERTIFIKATI</div>
                <div className="text-[10px] sm:text-xs uppercase tracking-widest text-amber-800/70 font-sans mb-5 sm:mb-6">Certificate of Achievement</div>

                <div className="text-[11px] text-amber-900/70 font-sans mb-1">ushbu sertifikat beriladi</div>
                <div className="text-2xl sm:text-4xl font-bold mb-5 sm:mb-6 px-4 border-b-2 border-amber-700/50 pb-2 max-w-[85%] truncate">
                  {cert.full_name}
                </div>

                <div className="text-xs sm:text-base leading-relaxed max-w-lg mb-5 sm:mb-6 font-sans">
                  <span className="font-bold">{cert.exam_name}</span> formatidagi mashq-imtihonini muvaffaqiyatli yakunlagani
                  va <span className="font-bold">{cert.score_label}: {cert.native_score}</span> natijasiga erishgani uchun.
                </div>

                <div className="flex items-end justify-between w-full max-w-lg mt-2 font-sans">
                  <div className="text-left">
                    <div className="text-[9px] sm:text-[10px] uppercase tracking-widest text-amber-800/60">Sana</div>
                    <div className="text-xs sm:text-sm font-semibold">{formatUzbekDate(cert.issued_at)}</div>
                  </div>
                  <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-emerald-600/10 border-2 border-emerald-700/40 flex items-center justify-center">
                    <span className="text-emerald-700 text-lg sm:text-2xl">✓</span>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] sm:text-[10px] uppercase tracking-widest text-amber-800/60">Kod</div>
                    <div className="text-[10px] sm:text-xs font-mono font-semibold">{cert.verify_code}</div>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-zinc-500 text-xs mt-8 text-center max-w-sm">
              Bu sertifikat <span className="text-zinc-300 font-semibold">kmb.education</span> tomonidan tasdiqlangan va bazada saqlangan.
              O'zingiz ham mashq-imtihonlarni topshirib sertifikat olishingiz mumkin.
            </p>
            <Link
              href="/test/mock"
              className="inline-block mt-4 bg-zinc-900 border border-zinc-800 hover:border-amber-500/40 text-zinc-200 font-bold px-6 py-2.5 rounded-full text-sm transition-colors"
            >
              Mock imtihonni sinab ko'rish →
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
