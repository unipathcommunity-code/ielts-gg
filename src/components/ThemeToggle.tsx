"use client";

import { useHydrated } from "@/lib/clientStore";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const mounted = useHydrated();
  const { theme, setTheme } = useTheme();


  if (!mounted) {
    return <div className="w-10 h-10 border border-black/10 dark:border-white/10 rounded-full" />;
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="w-10 h-10 rounded-full flex items-center justify-center transition-all bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white shadow-sm hover:scale-105"
      aria-label="Toggle Dark Mode"
    >
      {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}
