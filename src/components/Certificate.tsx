"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import type { CertificateRecord } from "@/lib/certificates";
import { formatUzbekDate } from "@/lib/bandUtils";

// Updated domain for the app
const SITE_URL = "https://kmb.education";

function verifyUrl(code: string): string {
  return `${SITE_URL}/certificate/${code}`;
}

const formatDate = formatUzbekDate;

export function Certificate({ cert, onClose }: { cert: CertificateRecord; onClose?: () => void }) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [downloading, setDownloading] = useState(false);
  const nodeRef = useRef<HTMLDivElement>(null);

  // Parse optional breakdown JSON stored in score_label
  let scoreLabel = cert.score_label;
  let breakdown: Record<string, string> | null = null;
  try {
    if (cert.score_label.startsWith("{")) {
      const parsed = JSON.parse(cert.score_label);
      scoreLabel = parsed.label || "Score";
      breakdown = parsed.breakdown || null;
    }
  } catch (e) {}

  useEffect(() => {
    QRCode.toDataURL(verifyUrl(cert.verify_code), {
      margin: 1,
      width: 140,
      color: { dark: "#1e293b", light: "#ffffff" },
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(""));
  }, [cert.verify_code]);

  const download = async () => {
    if (!nodeRef.current) return;
    setDownloading(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(nodeRef.current, { pixelRatio: 3, cacheBust: true });
      const link = document.createElement("a");
      link.download = `Certificate_${cert.exam_format.toUpperCase()}_${cert.full_name.replace(/\s+/g, "_")}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.warn("Certificate download failed:", e);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 md:p-8 overflow-y-auto backdrop-blur-sm">
      <div className="flex flex-col items-center gap-6 max-w-full my-auto">
        {/* Certificate Container */}
        <div
          ref={nodeRef}
          className="relative w-[1000px] max-w-[95vw] aspect-[1.414/1] bg-white text-slate-900 shadow-2xl overflow-hidden print:shadow-none"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {/* Subtle background pattern */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\\'60\\' height=\\'60\\' viewBox=\\'0 0 60 60\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Cg fill=\\'none\\' fill-rule=\\'evenodd\\'%3E%3Cg fill=\\'%230f172a\\' fill-opacity=\\'1\\'%3E%3Cpath d=\\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')" }}
          ></div>
          {/* Premium borders */}
          <div className="absolute inset-6 border-[3px] border-slate-800/10" />
          <div className="absolute inset-8 border border-slate-800/20" />
          {/* Corner accents */}
          <div className="absolute top-6 left-6 w-8 h-8 border-t-[3px] border-l-[3px] border-amber-500" />
          <div className="absolute top-6 right-6 w-8 h-8 border-t-[3px] border-r-[3px] border-amber-500" />
          <div className="absolute bottom-6 left-6 w-8 h-8 border-b-[3px] border-l-[3px] border-amber-500" />
          <div className="absolute bottom-6 right-6 w-8 h-8 border-b-[3px] border-r-[3px] border-amber-500" />
          {/* Content */}
          <div className="relative h-full flex flex-col items-center justify-center px-16 py-12 text-center">
            {/* Header */}
            <div className="flex flex-col items-center mb-8">
              <img src="/logo.svg" alt="kmb.education logo" className="w-16 h-16 rounded-xl mb-4 shadow-lg object-cover" />
              <div className="text-[10px] tracking-[0.4em] uppercase text-slate-500 font-bold mb-2">kmb.education</div>
              <div className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 mb-2 uppercase" style={{ fontFamily: "Georgia, serif" }}>Certificate of Achievement</div>
              <div className="text-sm uppercase tracking-widest text-amber-600 font-bold">{cert.exam_name} Simulator</div>
            </div>
            {/* Recipient */}
            <div className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-3">This certifies that</div>
            <div className="text-4xl sm:text-5xl font-black mb-6 text-slate-800 capitalize" style={{ fontFamily: "Georgia, serif" }}>{cert.full_name}</div>
            {/* Score */}
            <div className="flex flex-col items-center mb-10 w-full max-w-2xl bg-slate-50/80 p-6 rounded-2xl border border-slate-200">
              <div className="flex flex-col items-center mb-4">
                <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Overall {scoreLabel}</div>
                <div className="text-4xl font-black text-amber-600 font-mono">{cert.native_score}</div>
              </div>
              {breakdown && (
                <div className="flex gap-8 justify-center border-t border-slate-200 pt-4 w-full">
                  {Object.entries(breakdown).map(([key, val]) => (
                    <div key={key} className="flex flex-col items-center">
                      <div className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">{key}</div>
                      <div className="text-lg font-bold text-slate-800 font-mono">{val}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Footer */}
            <div className="absolute bottom-12 left-16 right-16 flex items-end justify-between">
              <div className="text-left flex flex-col items-start w-48">
                <div className="w-full border-b border-slate-300 pb-2 mb-2">
                  <div className="font-[Signature] text-3xl text-slate-800 -rotate-3 select-none" style={{ fontFamily: "cursive" }}>Kumush Abdumalikova</div>
                </div>
                <div className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Founder & CEO, kmb.education</div>
              </div>
              <div className="flex flex-col items-center justify-center">
                {qrDataUrl ? (
                  <div className="p-1 bg-white shadow-sm border border-slate-100 rounded-lg">
                    <img src={qrDataUrl} alt="Verification QR" className="w-20 h-20 mix-blend-multiply" />
                  </div>
                ) : (
                  <div className="w-20 h-20 bg-slate-100 rounded-lg" />
                )}
                <div className="text-[8px] uppercase tracking-widest text-slate-400 font-bold mt-2">Scan to Verify</div>
                <div className="text-[10px] font-mono font-bold text-slate-600">{cert.verify_code}</div>
              </div>
              <div className="text-right flex flex-col items-end w-48">
                <div className="w-full border-b border-slate-300 pb-2 mb-2">
                  <div className="text-lg font-mono font-bold text-slate-800 h-8 flex items-end justify-end">{formatDate(cert.issued_at)}</div>
                </div>
                <div className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Date of Issue</div>
              </div>
            </div>
            {/* Gold seal */}
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-24 h-24">
              <div className="relative w-full h-full flex items-center justify-center">
                <div className="absolute inset-0 bg-amber-500 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/30 overflow-hidden">
                  <div className="absolute inset-0 border-4 border-amber-400 rounded-full"></div>
                  <div className="absolute inset-2 border border-dashed border-amber-200/50 rounded-full"></div>
                  <div className="text-amber-100 text-xs font-black uppercase text-center leading-tight z-10">Official <br/> Result</div>
                </div>
                <div className="absolute -bottom-6 left-2 w-6 h-10 bg-amber-600 -z-10 skew-y-12"></div>
                <div className="absolute -bottom-6 right-2 w-6 h-10 bg-amber-600 -z-10 -skew-y-12"></div>
              </div>
            </div>
          </div>
        </div>
        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={download}
            disabled={downloading}
            className="bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-900 font-bold px-8 py-3 rounded-full text-sm shadow-xl transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            {downloading ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                Yuklab olish…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                Yuklab olish (HD PNG)
              </>
            )}
          </button>
          <a
            href={verifyUrl(cert.verify_code)}
            target="_blank"
            rel="noreferrer"
            className="bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white font-bold px-8 py-3 rounded-full text-sm shadow-xl transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
            Ommaviy havola
          </a>
          {onClose && (
            <button
              onClick={onClose}
              className="bg-transparent border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white font-bold px-8 py-3 rounded-full text-sm transition-all"
            >
              Yopish
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
