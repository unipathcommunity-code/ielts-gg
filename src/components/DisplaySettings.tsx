"use client";

import { useEffect, useState } from "react";

// Shared display settings used across all test pages: text zoom + reading colour scheme.
// Mirrors the real IELTS CBT screen "Text size" and "Colour" accessibility tools.

export const COLOR_SCHEMES: Record<string, { label: string; bg: string; text: string }> = {
  default:  { label: "Standart",        bg: "",        text: "" },
  sepia:    { label: "Sepia (qog'oz)",  bg: "#f4ecd8", text: "#4b3a26" },
  contrast: { label: "Oq-qora",         bg: "#000000", text: "#ffffff" },
  yellow:   { label: "Tungi sariq",     bg: "#0b0b0b", text: "#ffd400" },
  green:    { label: "Yumshoq yashil",  bg: "#e6f1e6", text: "#22372b" },
};

export const MIN_SCALE = 0.8;
export const MAX_SCALE = 1.8;

export type DisplaySettingsState = ReturnType<typeof useDisplaySettings>;

export function useDisplaySettings() {
  const [fontScale, setFontScale] = useState(1);
  const [colorScheme, setColorScheme] = useState<string>("default");

  useEffect(() => {
    const timer = setTimeout(() => {
      const savedScale = parseFloat(localStorage.getItem("ielts_font_scale") || "");
      if (!isNaN(savedScale)) {
        setFontScale(Math.min(MAX_SCALE, Math.max(MIN_SCALE, savedScale)));
      }
      const savedScheme = localStorage.getItem("ielts_color_scheme");
      if (savedScheme && savedScheme in COLOR_SCHEMES) {
        setColorScheme(savedScheme);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const changeFontScale = (delta: number) => {
    setFontScale((prev) => {
      const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, Math.round((prev + delta) * 100) / 100));
      localStorage.setItem("ielts_font_scale", String(next));
      return next;
    });
  };

  const resetFontScale = () => {
    setFontScale(1);
    localStorage.setItem("ielts_font_scale", "1");
  };

  const applyColorScheme = (key: string) => {
    setColorScheme(key);
    localStorage.setItem("ielts_color_scheme", key);
  };

  const scheme = COLOR_SCHEMES[colorScheme] || COLOR_SCHEMES.default;
  const readerActive = colorScheme !== "default";

  return { fontScale, colorScheme, changeFontScale, resetFontScale, applyColorScheme, scheme, readerActive };
}

export function DisplaySettings({
  theme,
  settings,
}: {
  theme: "dark" | "light";
  settings: DisplaySettingsState;
}) {
  const [open, setOpen] = useState(false);
  const { fontScale, colorScheme, changeFontScale, resetFontScale, applyColorScheme } = settings;
  const dark = theme === "dark";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((s) => !s)}
        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
          open
            ? "bg-amber-500 border-amber-500 text-black"
            : dark
              ? "bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white"
              : "bg-zinc-100 border-zinc-200 text-zinc-700 hover:text-black"
        }`}
        title="Matn o'lchami va rangi (Aa)"
      >
        <span className="text-sm leading-none">Aa</span>
        <span className="font-mono">{Math.round(fontScale * 100)}%</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className={`absolute right-0 mt-2 w-72 z-50 rounded-2xl border shadow-2xl p-5 animate-in fade-in slide-in-from-top-2 duration-150 ${
              dark ? "bg-zinc-950 border-zinc-800 text-zinc-100" : "bg-white border-zinc-200 text-zinc-900"
            }`}
          >
            {/* Font size / Zoom */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Matn o'lchami (Zoom)</span>
                <button onClick={resetFontScale} className="text-[10px] font-bold text-amber-500 hover:text-amber-400 uppercase">
                  Reset
                </button>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => changeFontScale(-0.1)}
                  disabled={fontScale <= MIN_SCALE}
                  className={`flex-1 h-10 rounded-xl border font-bold text-base transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                    dark ? "bg-zinc-900 border-zinc-800 hover:bg-zinc-800" : "bg-zinc-50 border-zinc-200 hover:bg-zinc-100"
                  }`}
                >
                  A−
                </button>
                <span className="w-16 text-center font-mono font-bold text-sm text-amber-500">{Math.round(fontScale * 100)}%</span>
                <button
                  onClick={() => changeFontScale(0.1)}
                  disabled={fontScale >= MAX_SCALE}
                  className={`flex-1 h-10 rounded-xl border font-bold text-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                    dark ? "bg-zinc-900 border-zinc-800 hover:bg-zinc-800" : "bg-zinc-50 border-zinc-200 hover:bg-zinc-100"
                  }`}
                >
                  A+
                </button>
              </div>
            </div>

            {/* Reading colour scheme */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 block mb-3">Matn rangi (Color)</span>
              <div className="grid grid-cols-5 gap-2">
                {Object.entries(COLOR_SCHEMES).map(([key, sch]) => (
                  <button
                    key={key}
                    onClick={() => applyColorScheme(key)}
                    title={sch.label}
                    className={`h-10 rounded-xl border-2 flex items-center justify-center transition-all ${
                      colorScheme === key ? "border-amber-500 scale-105" : "border-transparent hover:border-zinc-600"
                    }`}
                    style={{
                      backgroundColor: key === "default" ? (dark ? "#18181b" : "#f4f4f5") : sch.bg,
                      color: key === "default" ? (dark ? "#f4f4f5" : "#18181b") : sch.text,
                    }}
                  >
                    <span className="text-sm font-bold">A</span>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-zinc-500 mt-3 leading-relaxed">
                Rang sxemasi o'qish matniga qo'llanadi. Umumiy tema uchun ☀️/🌙 tugmasidan foydalaning.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
