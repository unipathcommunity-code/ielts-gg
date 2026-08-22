"use client";

import { useState } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ArrowLeft, Play, BookmarkPlus, Check, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const MOCK_DICT: Record<string, { trans: string, ex: string }> = { ecosystem: { trans: "Ekotizim", ex: "The global ecosystem is changing." }, improve: { trans: "Yaxshilamoq", ex: "Read books to improve your English." }, simultaneously: { trans: "Bir vaqtning o'zida", ex: "He laughed and cried simultaneously." }, encounter: { trans: "Duch kelmoq", ex: "We encountered a problem." }, unfamiliar: { trans: "Notanish", ex: "I saw an unfamiliar face." }, automatically: { trans: "Avtomatik tarzda", ex: "The door opens automatically." }, personal: { trans: "Shaxsiy", ex: "This is my personal computer." }, dictionary: { trans: "Lug'at", ex: "I use a dictionary to learn words." } };

const SAMPLE_SUBTITLES = [
  { id: 1, text: "Welcome to the global ecosystem of language learning.", time: "0:01 - 0:04" },
  { id: 2, text: "Here you can watch movies and improve your vocabulary simultaneously.", time: "0:04 - 0:09" },
  { id: 3, text: "If you encounter an unfamiliar word, simply click on it.", time: "0:09 - 0:13" },
  { id: 4, text: "It will be automatically saved to your personal dictionary.", time: "0:13 - 0:17" }
];

export default function MoviePlayerPage() {
  const [activeSubId, setActiveSubId] = useState(2);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [savedWords, setSavedWords] = useState<string[]>([]);
  const [showUzbek, setShowUzbek] = useState(true);

  const handleWordClick = (word: string) => {
    const cleanWord = word.replace(/[^a-zA-Z]/g, "").toLowerCase();
    setSelectedWord(cleanWord);
  };

  const saveWord = () => {
    if (selectedWord && !savedWords.includes(selectedWord)) {
      setSavedWords([...savedWords, selectedWord]);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#050505] text-zinc-900 dark:text-white font-sans flex flex-col">
      <header className="p-4 flex items-center justify-between bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-900 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/movies" className="p-2 bg-zinc-100 dark:bg-zinc-900 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-bold text-lg leading-tight">Inception (Trailer)</h1>
            <p className="text-xs text-zinc-500">B2 Upper-Intermediate В· Sci-Fi</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowUzbek(!showUzbek)} className="text-xs font-bold px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            {showUzbek ? "рџ‡єрџ‡ї UZ / рџ‡¬рџ‡§ EN" : "рџ‡¬рџ‡§ EN Faqat"}
          </button>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full p-4 gap-6">
        {/* Video Player Area */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="w-full aspect-video bg-black rounded-3xl overflow-hidden relative shadow-2xl flex items-center justify-center border border-zinc-800 group">
            {/* Real YouTube Video (Trailer) */}
            <iframe 
              className="w-full h-full " 
              src="https://www.youtube.com/embed/8hP9D6kZseM?autoplay=1&mute=1&controls=1&vq=hd1080&modestbranding=1" 
              title="YouTube video player" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
            ></iframe>
            
            {/* On-video Subtitle */}
            <div className="absolute bottom-8 w-full text-center px-4">
              <div className="inline-block bg-black/60 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10">
                <p className="text-2xl font-bold text-white drop-shadow-md">
                  {SAMPLE_SUBTITLES[1].text.split(" ").map((word, i) => (
                    <span 
                      key={i} 
                      onClick={() => handleWordClick(word)}
                      className="cursor-pointer hover:text-amber-400 transition-colors mr-1.5 inline-block"
                    >
                      {word}
                    </span>
                  ))}
                </p>
                {showUzbek && <p className="text-amber-400 text-sm mt-1 font-medium">Bu yerda siz kinolar ko'rishingiz va lug'atingizni oshirishingiz mumkin.</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Transcript & Dictionary Sidebar */}
        <div className="w-full md:w-[400px] flex flex-col h-[calc(100vh-120px)] bg-white dark:bg-zinc-950 rounded-3xl border border-zinc-200 dark:border-zinc-900 shadow-xl overflow-hidden relative">
          
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-900 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50">
            <h2 className="font-bold flex items-center gap-2"><MessageSquare className="w-4 h-4 text-amber-500" /> Subtitrlar</h2>
            <div className="text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-500 px-3 py-1 rounded-full border border-amber-500/20">
              {savedWords.length} ta so'z saqlandi
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {SAMPLE_SUBTITLES.map((sub) => (
              <div 
                key={sub.id} 
                className={`p-4 rounded-2xl transition-all cursor-pointer border ${activeSubId === sub.id ? "bg-amber-500/5 border-amber-500/30" : "bg-transparent border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-900"}`}
                onClick={() => setActiveSubId(sub.id)}
              >
                <div className="text-[10px] text-zinc-500 font-mono mb-1">{sub.time}</div>
                <p className={`text-sm ${activeSubId === sub.id ? "text-black dark:text-white font-semibold" : "text-zinc-600 dark:text-zinc-400"}`}>
                  {sub.text.split(" ").map((word, i) => (
                    <span 
                      key={i} 
                      onClick={(e) => { e.stopPropagation(); handleWordClick(word); }}
                      className="hover:bg-amber-500/20 hover:text-amber-600 dark:hover:text-amber-400 rounded px-0.5 transition-colors"
                    >
                      {word}{" "}
                    </span>
                  ))}
                </p>
              </div>
            ))}
          </div>

          {/* Dictionary Popover (Appears when a word is clicked) */}
          <AnimatePresence>
            {selectedWord && (
              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="absolute bottom-0 left-0 w-full bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 shadow-[0_-20px_40px_rgba(0,0,0,0.1)] p-5 z-50 rounded-b-3xl"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-black capitalize text-amber-500">{selectedWord}</h3>
                    <p className="text-zinc-500 text-sm italic">[vЙ™КЉЛ€kГ¦bjКЉlЙ™rЙЄ] - noun</p>
                  </div>
                  <button onClick={() => setSelectedWord(null)} className="w-8 h-8 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-500 hover:text-black dark:hover:text-white transition-colors">вњ•</button>
                </div>
                <div className="mb-6">
                  <p className="font-medium text-lg">Lug'at boyligi, so'zlar zaxirasi</p>
                  <p className="text-sm text-zinc-500 mt-2">Misol: Reading books is a good way to expand your <span className="font-bold text-zinc-700 dark:text-zinc-300">vocabulary</span>.</p>
                </div>
                <button 
                  onClick={saveWord}
                  disabled={savedWords.includes(selectedWord)}
                  className="w-full bg-black dark:bg-white text-white dark:text-black font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {savedWords.includes(selectedWord) ? (
                    <><Check className="w-5 h-5" /> Saqlangan</>
                  ) : (
                    <><BookmarkPlus className="w-5 h-5" /> Lug'atga saqlash</>
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </main>
    </div>
  );
}



