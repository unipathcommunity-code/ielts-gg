"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BarChart2, Layers, User } from "lucide-react";
import { motion } from "framer-motion";

export function BottomNav() {
  const pathname = usePathname();

  // Hide the nav on test/exam pages where focus is needed, or start/login
  const isHidden = 
    pathname.startsWith("/test/") ||
    pathname.includes("/test/") ||
    pathname === "/start" || 
    pathname === "/login" || 
    pathname === "/jarvis" ||
    pathname === "/";

  if (isHidden) return null;

  const navItems = [
    { href: "/dashboard", icon: <Home className="w-6 h-6" />, label: "Asosiy" },
    { href: "/tracks", icon: <Layers className="w-6 h-6" />, label: "Yo'nalish" },
    { href: "/stats", icon: <BarChart2 className="w-6 h-6" />, label: "Statistika" },
    { href: "/profile", icon: <User className="w-6 h-6" />, label: "Profil" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden pb-safe">
      <div className="bg-white/90 dark:bg-[#09090b]/90 backdrop-blur-xl border-t border-zinc-200 dark:border-zinc-800 px-6 py-3 flex justify-between items-center shadow-[0_-10px_40px_rgba(0,0,0,0.05)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href === "/dashboard" && pathname.startsWith("/t/"));
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`relative flex flex-col items-center justify-center w-16 h-12 transition-all active:scale-90 ${
                isActive ? "text-amber-500" : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-indicator"
                  className="absolute -top-3 w-10 h-1 bg-amber-500 rounded-b-full shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <div className={`transition-transform duration-300 ${isActive ? "-translate-y-1" : ""}`}>
                {item.icon}
              </div>
              <span className={`text-[10px] font-bold mt-1 transition-opacity duration-300 ${isActive ? "opacity-100" : "opacity-0 absolute"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
