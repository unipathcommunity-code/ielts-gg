"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ArrowLeft, Play, Search, TrendingUp, Clock, Star } from "lucide-react";

const MOVIES = [
  {
    id: "inception",
    title: "Inception (Trailer)",
    level: "B2 Upper-Intermediate",
    category: "Sci-Fi · Triller",
    image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2025&auto=format&fit=crop",
    duration: "2:28"
  },
  {
    id: "interstellar",
    title: "Interstellar",
    level: "C1 Advanced",
    category: "Sci-Fi · Drama",
    image: "https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?q=80&w=2070&auto=format&fit=crop",
    duration: "2:15"
  },
  {
    id: "jobs",
    title: "Steve Jobs Speech",
    level: "B1 Intermediate",
    category: "Motivation · Speech",
    image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=2070&auto=format&fit=crop",
    duration: "14:30"
  },
  {
    id: "friends",
    title: "Friends (Kulgili sahna)",
    level: "A2 Pre-Intermediate",
    category: "Sitcom · Comedy",
    image: "https://images.unsplash.com/photo-1529156069898-49953eb1f5bc?q=80&w=2070&auto=format&fit=crop",
    duration: "3:45"
  }
];

export default function MoviesCatalogPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#050505] text-zinc-900 dark:text-white font-sans flex flex-col">
      <header className="p-4 md:p-6 flex items-center justify-between bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-900 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2 bg-zinc-100 dark:bg-zinc-900 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-black text-xl md:text-2xl leading-tight">Kinolar Ekotizimi</h1>
            <p className="text-xs text-zinc-500">Kino ko'ring va so'z boyligingizni oshiring</p>
          </div>
        </div>
        <ThemeToggle />
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6">
        
        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-10">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Kino yoki video qidirish..." 
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full py-4 pl-12 pr-6 text-sm outline-none focus:border-amber-500 transition-colors shadow-sm"
            />
          </div>
          <div className="flex gap-2">
            <button className="px-6 py-4 rounded-full text-sm font-bold bg-amber-500 text-black shadow-lg shadow-amber-500/20">Barchasi</button>
            <button className="px-6 py-4 rounded-full text-sm font-bold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800">A1-A2</button>
            <button className="px-6 py-4 rounded-full text-sm font-bold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800">B1-B2</button>
          </div>
        </div>

        <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-amber-500" /> Tavsiya etiladi</h2>

        {/* Movies Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {MOVIES.map(movie => (
            <Link href={`/movies/${movie.id}`} key={movie.id} className="group flex flex-col bg-white dark:bg-zinc-950 rounded-3xl border border-zinc-200 dark:border-zinc-900 overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="relative aspect-video overflow-hidden bg-zinc-800">
                <img src={movie.image} alt={movie.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center shadow-lg transform scale-50 group-hover:scale-100 transition-transform">
                    <Play className="w-5 h-5 text-black ml-1" fill="black" />
                  </div>
                </div>
                <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-md px-2 py-1 rounded-md text-[10px] font-mono text-white flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {movie.duration}
                </div>
              </div>
              <div className="p-5 flex flex-col flex-1">
                <h3 className="font-bold text-lg mb-1 group-hover:text-amber-500 transition-colors line-clamp-1">{movie.title}</h3>
                <p className="text-xs text-zinc-500 mb-4">{movie.category}</p>
                
                <div className="mt-auto pt-4 border-t border-zinc-100 dark:border-zinc-900 flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-900 px-3 py-1.5 rounded-full text-zinc-600 dark:text-zinc-400">
                    {movie.level}
                  </span>
                  <Star className="w-4 h-4 text-amber-500" fill="currentColor" />
                </div>
              </div>
            </Link>
          ))}
        </div>

      </main>
    </div>
  );
}
