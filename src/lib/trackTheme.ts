import type { Track } from "./tracks";

// Tailwind JIT dinamik sinf nomlarini ko'rmaydi (`bg-${accent}-500` ishlamaydi),
// shuning uchun har rang uchun to'liq sinflar shu yerda yozilgan.
export interface TrackTheme {
  text: string;
  bg: string;
  border: string;
  ring: string;
  gradient: string;
  solid: string;
  solidText: string;
}

const THEMES: Record<Track["accent"], TrackTheme> = {
  amber: {
    text: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    ring: "ring-amber-500/30",
    gradient: "from-amber-500 to-orange-500",
    solid: "bg-amber-500 hover:bg-amber-400",
    solidText: "text-black",
  },
  emerald: {
    text: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    ring: "ring-emerald-500/30",
    gradient: "from-emerald-500 to-teal-500",
    solid: "bg-emerald-500 hover:bg-emerald-400",
    solidText: "text-black",
  },
  cyan: {
    text: "text-cyan-500",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/30",
    ring: "ring-cyan-500/30",
    gradient: "from-cyan-500 to-blue-500",
    solid: "bg-cyan-500 hover:bg-cyan-400",
    solidText: "text-black",
  },
  violet: {
    text: "text-violet-500",
    bg: "bg-violet-500/10",
    border: "border-violet-500/30",
    ring: "ring-violet-500/30",
    gradient: "from-violet-500 to-purple-500",
    solid: "bg-violet-500 hover:bg-violet-400",
    solidText: "text-white",
  },
  rose: {
    text: "text-rose-500",
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
    ring: "ring-rose-500/30",
    gradient: "from-rose-500 to-pink-500",
    solid: "bg-rose-500 hover:bg-rose-400",
    solidText: "text-white",
  },
  sky: {
    text: "text-sky-500",
    bg: "bg-sky-500/10",
    border: "border-sky-500/30",
    ring: "ring-sky-500/30",
    gradient: "from-sky-500 to-indigo-500",
    solid: "bg-sky-500 hover:bg-sky-400",
    solidText: "text-white",
  },
  orange: {
    text: "text-orange-500",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    ring: "ring-orange-500/30",
    gradient: "from-orange-500 to-red-500",
    solid: "bg-orange-500 hover:bg-orange-400",
    solidText: "text-black",
  },
};

export function trackTheme(track: Track): TrackTheme {
  return THEMES[track.accent] || THEMES.amber;
}
