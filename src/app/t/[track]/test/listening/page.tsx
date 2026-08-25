"use client";

import { useStoredRawState } from "@/lib/clientStore";
import { useTargetLevel } from "@/lib/usePrepPlan";
import { aiFetch } from "@/lib/apiClient";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useDisplaySettings, DisplaySettings } from "@/components/DisplaySettings";
import { supabase } from "@/lib/supabase";
import { usePracticeLanguage } from "@/lib/usePracticeLanguage";
import { useTrack } from "@/lib/useTrack";
import { trackScore, trackSection } from "@/lib/tracks";
import { appendTestHistory, loadTestHistory } from "@/lib/useTestHistory";
import { getExamFormat, nativeScoreLabel } from "@/lib/examFormats";
import { Difficulty, DIFFICULTY_LABELS, DIFFICULTIES } from "@/lib/difficulty";
import { NATIVE_LISTENING_TESTS } from "@/lib/nativeListeningData";

// Keyed by test id so it applies whether the test came from the inline fallback or
// Supabase (Supabase rows have no difficulty column). Approximate, by topic complexity.
const LISTENING_DIFFICULTY: Record<string, Difficulty> = {
  campus: "easy", travel: "medium", career: "hard",
  clinic: "easy", restaurant: "easy", college: "medium",
};

function parseExplanation(explanationText: string) {
  const result = {
    correctReason: "",
    proof: "",
    userReason: "",
    tip: ""
  };
  
  if (!explanationText) return result;
  
  const parts = explanationText.split(/(✅|📌|❌|💡)/);
  
  let currentKey: keyof typeof result | null = null;
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (p === "✅") {
      currentKey = "correctReason";
    } else if (p === "📌") {
      currentKey = "proof";
    } else if (p === "❌") {
      currentKey = "userReason";
    } else if (p === "💡") {
      currentKey = "tip";
    } else if (currentKey && p.trim()) {
      const cleaned = p.replace(/^[\s:-]+/, "").trim();
      result[currentKey] = cleaned;
    }
  }
  
  if (!result.correctReason && !result.proof && !result.userReason && !result.tip) {
    result.correctReason = explanationText;
  }
  
  return result;
}
import { LISTENING_TESTS, type ListeningTest, type ListeningQuestion } from "@/lib/listeningData";

interface TestRecord {
  id: string;
  type: string;
  date: string;
  band: number;
  correct?: number;
  total?: number;
  passageId?: string;
  language?: string;
}

const qNum = (qid: string) => qid.replace(/[^0-9]/g, "");

export default function ListeningTest() {
  const [tests, setTests] = useState<Record<string, ListeningTest>>(LISTENING_TESTS);
  const [testId, setTestId] = useState<string>("campus");
  const { track } = useTrack();
  const lSec = trackSection(track, "listening");
  const trackMinutes = lSec?.minutes || 40;
  const trackQuestions = lSec?.questions || 40;
  
  const [timeLeft, setTimeLeft] = useState(trackMinutes * 60);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [showVocab, setShowVocab] = useState(false);
  const [testHistory, setTestHistory] = useState<Record<string, TestRecord>>({});
  // Tema localStorage'dan to'g'ridan-to'g'ri o'qiladi — ilgari effekt ichida
  // setState qilinardi va birinchi kadr har doim qorong'i chiqib, keyin sakrardi.
  const [theme, setTheme] = useStoredRawState("ielts_theme", "dark") as ["dark" | "light", (v: string) => void];
  const display = useDisplaySettings();

  // New CBT states
  const [isTimerHidden, setIsTimerHidden] = useState(false);
  const [flags, setFlags] = useState<Record<string, boolean>>({});

  // Competitor upgrade states
  const [scoreTab, setScoreTab] = useState<"analysis" | "vocab_quiz">("analysis");
  const [listeningQuizQuestions, setListeningQuizQuestions] = useState<{ word: string; choices: string[]; correct: string; userAns: string }[]>([]);
  const [listeningQuizDone, setListeningQuizDone] = useState(false);
  const [listeningQuizScore, setListeningQuizScore] = useState(0);
  const [interactiveTranscript, setInteractiveTranscript] = useState(true);
  const [activeHoverVocab, setActiveHoverVocab] = useState<{ word: string; definition: string; translation: string } | null>(null);

  const toggleFlag = (id: string) => {
    setFlags(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const renderSentenceWithVocab = (sentence: string, vocabList: { word: string; definition: string; translation: string }[]) => {
    if (!vocabList || vocabList.length === 0) return sentence;
    const escapeRegex = (s: string) => s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const sortedVocabs = [...vocabList].sort((a, b) => b.word.length - a.word.length);
    const vocabWords = sortedVocabs.map(v => escapeRegex(v.word));
    const pattern = new RegExp(`\\b(${vocabWords.join('|')})\\b`, 'gi');

    const parts = sentence.split(pattern);
    return parts.map((part, i) => {
      const matchedVocab = vocabList.find(v => v.word.toLowerCase() === part.toLowerCase());
      if (matchedVocab) {
        return (
          <span
            key={i}
            onClick={(e) => {
              e.stopPropagation();
              setActiveHoverVocab(matchedVocab);
            }}
            className="text-amber-500 font-extrabold underline decoration-dotted cursor-help hover:text-amber-400"
            title={`${matchedVocab.word}: ${matchedVocab.translation}`}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };


  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  // `isPlaying` state'i onend closure'ida eskirib qoladi, shuning uchun jonli qiymat ref'da.
  const isPlayingRef = useRef(false);
  
  const [currentLang] = usePracticeLanguage();
  const targetLevel = useTargetLevel();
  // Faqat AI tarjimasi state'da saqlanadi; asl va qo'lda yozilgan milliy testlar —
  // hosila qiymat (effekt ichida setState qilish ortiqcha kadr chizardi).
  const [translatedTest, setTranslatedTest] = useState<any>(null);
  const [translating, setTranslating] = useState(false);

  const baseTest = tests[testId] || tests.campus;
  const nativeTestForLang =
    currentLang === "english" ? baseTest : (NATIVE_LISTENING_TESTS[currentLang] ?? null);
  const displayedTest = nativeTestForLang ?? translatedTest;


  useEffect(() => {
    if (!baseTest || nativeTestForLang) return;

    let cancelled = false;
    const loadTranslated = async () => {
      setTranslating(true);
      try {
        const res = await aiFetch("/api/tutor/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            passage: baseTest,
            language: currentLang,
            trackId: track.id,
            targetLevel: targetLevel
          })
        });
        const data = await res.json();
        if (!cancelled && data.translated) {
          setTranslatedTest(data.translated);
        }
      } catch (e) {
        console.error("Failed to translate listening test:", e);
        if (!cancelled) setTranslatedTest(baseTest);
      } finally {
        if (!cancelled) setTranslating(false);
      }
    };

    loadTranslated();
    return () => { cancelled = true; };
  }, [baseTest, currentLang, targetLevel]);

  const currentTest = displayedTest || baseTest;
  const fillQs = currentTest.questions.filter((q: any): q is Extract<ListeningQuestion, { kind: "fill" }> => q.kind === "fill");
  const mcqQs = currentTest.questions.filter((q: any): q is Extract<ListeningQuestion, { kind: "mcq" }> => q.kind === "mcq");
  const keysMap: Record<string, string> = Object.fromEntries(currentTest.questions.map((q: any) => [q.qid, q.answer_key]));
  const promptMap: Record<string, string> = Object.fromEntries(currentTest.questions.map((q: any) => [q.qid, q.prompt]));

  // Load history from localStorage
  const loadHistory = () => {
    try {
      const history: TestRecord[] = loadTestHistory();
      const map: Record<string, TestRecord> = {};
      history.forEach((record) => {
        if (record.type === "listening" && record.passageId) {
          if (!map[record.passageId] || new Date(record.date) > new Date(map[record.passageId].date)) {
            map[record.passageId] = record;
          }
        }
      });
      setTestHistory(map);
    } catch (e) {
      console.warn("Failed to load test history:", e);
    }
  };

  useEffect(() => {
    // Tarixni serverdan/keshdan qayta o'qish — tashqi manba bilan sinxronlash,
    // effektning aynan mo'ljallangan vazifasi.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadHistory();
  }, [isSubmitted, testId]);

  // Load listening content from Supabase (falls back to inline constants on any error)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [{ data: ts }, { data: qs }, { data: vs }] = await Promise.all([
          supabase.from("listening_tests").select("*").order("order_index"),
          supabase.from("listening_questions").select("*").order("order_index"),
          supabase.from("listening_vocab").select("*").order("order_index"),
        ]);
        if (cancelled || !ts || ts.length === 0) return;

        const next: Record<string, ListeningTest> = {};
        for (const t of ts) {
          const tQs: ListeningQuestion[] = (qs || []).filter((q: any) => q.test_id === t.id).map((q: any) => {
            const opt = q.options || {};
            if (opt.kind === "mcq") return { qid: q.qid, kind: "mcq", prompt: q.prompt, options: opt.choices || [], answer_key: q.answer_key };
            return { qid: q.qid, kind: "fill", prompt: q.prompt, prefix: opt.prefix || "", suffix: opt.suffix || "", answer_key: q.answer_key };
          });
          next[t.id] = {
            id: t.id, title: t.title, sentences: t.sentences || [], transcriptHtml: t.transcript_html || "",
            vocab: (vs || []).filter((v: any) => v.test_id === t.id).map((v: any) => ({ word: v.word, definition: v.definition, translation: v.translation })),
            questions: tQs,
          };
        }
        setTests(next);
      } catch (e) {
        console.warn("Supabase listening content unavailable, using built-in tests.", e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Test almashganda holatni tozalash — render vaqtida (yuqoridagi Reading
  // sahifasidagi bilan bir xil sabab).
  const [prevTestId, setPrevTestId] = useState(testId);
  if (testId !== prevTestId) {
    setPrevTestId(testId);
    setAnswers({});
    setIsSubmitted(false);
    setScore(null);
    setProgress(0);
    setCurrentSentenceIndex(0);
  }

  // Ovozni to'xtatish — bu haqiqiy nojo'ya ta'sir, shuning uchun effektda qoladi.
  useEffect(() => {
    // Test almashganda ijro etilayotgan ovozni to'xtatish — tashqi tizim, ichida ref o'zgaradi.
    // eslint-disable-next-line react-hooks/immutability
    stopAudio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId]);

  // Timer logic
  useEffect(() => {
    if (timeLeft > 0 && !isSubmitted) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    }
  }, [timeLeft, isSubmitted]);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleInputChange = (id: string, value: string) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  // Sentences Audio Player Engine
  const playSentences = (sentences: string[], startIndex: number) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    if (startIndex >= sentences.length) {
      isPlayingRef.current = false;
      setIsPlaying(false);
      setProgress(100);
      setCurrentSentenceIndex(0);
      return;
    }

    isPlayingRef.current = true;
    setIsPlaying(true);
    setCurrentSentenceIndex(startIndex);
    setProgress((startIndex / sentences.length) * 100);

    const utterance = new SpeechSynthesisUtterance(sentences[startIndex]);
    activeUtteranceRef.current = utterance;
    utterance.rate = playbackSpeed;
    utterance.lang = currentLang === "russian" ? "ru-RU" :
                     currentLang === "japanese" ? "ja-JP" :
                     currentLang === "korean" ? "ko-KR" :
                     currentLang === "chinese" ? "zh-CN" :
                     "en-US";

    utterance.onend = () => {
      setTimeout(() => {
        // Ref o'qiladi, state emas: bu callback yaratilgan renderdagi `isPlaying`
        // hali `false` bo'lgan, shuning uchun audio 1-gapdan keyin to'xtab qolardi.
        if (isPlayingRef.current) {
          playSentences(sentences, startIndex + 1);
        }
      }, 800);
    };

    utterance.onerror = (e) => {
      console.warn("Speech Synthesis error:", e);
      isPlayingRef.current = false;
      setIsPlaying(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopAudio = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    isPlayingRef.current = false;
    setIsPlaying(false);
  };

  const toggleAudio = () => {
    if (isPlaying) {
      stopAudio();
    } else {
      playSentences(currentTest.sentences, currentSentenceIndex);
    }
  };

  // Tezlik o'zgarganda joriy gapni yangi tezlikda qayta o'qish.
  // deps ATAYLAB faqat [playbackSpeed]: currentSentenceIndex har gapda o'zgaradi,
  // uni deps'ga qo'shsak audio har gapda qaytadan boshlanib, cheksiz tsikl bo'lardi.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (isPlayingRef.current) {
      playSentences(currentTest.sentences, currentSentenceIndex);
    }
  }, [playbackSpeed]);

  const submitTest = async () => {
    stopAudio();
    setIsSubmitted(true);
    setScore(null);
    try {
      const response = await aiFetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'listening',
          answers: answers,
          passageId: testId,
          language: currentLang,
          trackId: track.id,
          targetLevel: targetLevel,
          customKeys: currentLang !== "english" ? keysMap : null
        })
      });

      if (!response.ok) {
        throw new Error('Baholash jarayonida xatolik yuz berdi');
      }

      const result = await response.json();
      setScore(result);

      // Save to test history
      try {
        appendTestHistory({
          id: `listening_${Date.now()}`,
          type: "listening",
          date: new Date().toISOString(),
          band: parseFloat(result.band) || 4.0,
          correct: result.correct || 0,
          total: result.total || 7,
          passageId: testId,
          language: currentLang
        });
      } catch (e) {
        console.warn("Error saving history to localStorage:", e);
      }
    } catch (error: any) {
      alert("Xatolik: " + error.message);
      setIsSubmitted(false);
    }
  };

  const handleCopy = (word: string) => {
    navigator.clipboard.writeText(word);
    alert(`"${word}" nusxalandi!`);
  };

  const saveToMyVocab = (item: { word: string; definition: string; translation: string }) => {
    try {
      const cur = JSON.parse(localStorage.getItem("ielts_vocab_custom") || "[]");
      if (cur.some((w: any) => (w.word || "").toLowerCase() === item.word.toLowerCase())) {
        alert(`"${item.word}" allaqachon lug'atingizda bor.`);
        return;
      }
      cur.unshift({ word: item.word, ipa: "", def: item.definition, uz: item.translation, cefr: "Mine", example: "" });
      localStorage.setItem("ielts_vocab_custom", JSON.stringify(cur));
      alert(`"${item.word}" shaxsiy lug'atingizga qo'shildi!`);
    } catch {}
  };

  const selectCls = `h-10 border rounded-xl px-3 focus:ring-1 focus:ring-amber-500 outline-none text-sm cursor-pointer ${
    theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
  }`;

  return (
    <div className={`min-h-screen flex flex-col font-sans selection:bg-amber-500/20 selection:text-amber-500 relative overflow-hidden transition-colors duration-300 ${
      theme === 'dark' ? 'bg-[#09090b] text-[#f4f4f5]' : 'bg-[#f8f9fa] text-[#18181b]'
    }`}>
      {/* Background Radial Glow */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none -z-10"></div>

      <header className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors duration-300 ${
        theme === 'dark' ? 'bg-zinc-950/80 border-zinc-900' : 'bg-white/80 border-zinc-200'
      }`}>
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Link href={`/t/${track.id}`} className="text-zinc-500 hover:text-[#f4f4f5] transition-colors font-semibold text-sm">
              ← Exit Test
            </Link>
          </div>

          {/* Test Selector */}
          <div className="flex items-center gap-2">
            {NATIVE_LISTENING_TESTS[currentLang] ? (
              <span className={`text-xs font-bold rounded-xl px-3 py-2 border ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-amber-400' : 'bg-white border-zinc-200 text-amber-600'}`}>
                {track.shortTitle} andoza testi
              </span>
            ) : (
              <>
                <select
                  value={testId}
                  onChange={(e: any) => setTestId(e.target.value)}
                  disabled={isSubmitted}
                  className={`border text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer ${
                    theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'
                  }`}
                >
                  {Object.values(tests).map((t) => (
                    <option key={t.id} value={t.id}>
                      {DIFFICULTY_LABELS[LISTENING_DIFFICULTY[t.id] || "medium"]} — {t.title} {testHistory[t.id] ? `(${track.scoreLabel} ${trackScore(track, testHistory[t.id].band)})` : ""}
                    </option>
                  ))}
                </select>

                {!isSubmitted && (
                  <div className="hidden md:flex items-center gap-1">
                    {DIFFICULTIES.map((d) => {
                      const tierTests = Object.values(tests).filter((t) => (LISTENING_DIFFICULTY[t.id] || "medium") === d);
                      if (tierTests.length === 0) return null;
                      const activeIndex = tierTests.findIndex((t) => t.id === testId);
                      const isActive = activeIndex !== -1;
                      return (
                        <button
                          key={d}
                          onClick={() => {
                            const nextIndex = isActive ? (activeIndex + 1) % tierTests.length : 0;
                            setTestId(tierTests[nextIndex].id);
                          }}
                          title={tierTests.map((t) => t.title).join(", ")}
                          className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-colors ${
                            isActive
                              ? "bg-amber-500 border-amber-500 text-black"
                              : theme === 'dark' ? "border-zinc-800 text-zinc-400 hover:text-white" : "border-zinc-200 text-zinc-500 hover:text-black"
                          }`}
                        >
                          {DIFFICULTY_LABELS[d]}{tierTests.length > 1 ? ` (${(isActive ? activeIndex : 0) + 1}/${tierTests.length})` : ""}
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-4">
            <DisplaySettings theme={theme} settings={display} />
            <button
              onClick={toggleTheme}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                theme === 'dark'
                  ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white'
                  : 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:text-black'
              }`}
            >
              {theme === 'dark' ? "☀️ Light" : "🌙 Dark"}
            </button>
            <button
              onClick={() => setShowVocab(true)}
              className={`text-xs font-semibold px-3 py-2 rounded-xl transition-all border ${
                theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white' : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50'
              }`}
            >
              📖 Lug'atlar (Vocab)
            </button>
            <div 
              onClick={() => {
                if (timeLeft > 600) {
                  setIsTimerHidden(!isTimerHidden);
                }
              }}
              className={`text-lg font-mono font-bold cursor-pointer transition-all select-none px-3 py-1.5 rounded-xl border ${
                timeLeft <= 300
                  ? "bg-red-500/10 border-red-500 text-red-500 animate-pulse"
                  : timeLeft <= 600
                    ? "bg-amber-500/10 border-amber-500 text-amber-500 animate-pulse"
                    : theme === "dark" 
                      ? "bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white"
                      : "bg-zinc-100 border-zinc-200 text-zinc-700 hover:text-black"
              }`}
              title={timeLeft > 600 ? "Vaqtni yashirish/ko'rsatish" : "Vaqt tugamoqda!"}
            >
              {isTimerHidden && timeLeft > 600 ? "⏰ Vaqt" : formatTime(timeLeft)}
            </div>
            {!isSubmitted && (
              <button
                onClick={submitTest}
                className="bg-[#f4f4f5] text-[#09090b] px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity"
              >
                Submit
              </button>
            )}
          </div>
        </div>

        {/* Dynamic CBT Audio Player with Playback Speed Control */}
        <div className={`w-full border-b px-6 py-4 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 shadow-inner backdrop-blur-md transition-colors duration-300 ${
          theme === 'dark' ? 'bg-zinc-950/60 border-zinc-900' : 'bg-white border-zinc-200 shadow-sm'
        }`}>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleAudio}
              disabled={isSubmitted}
              className="w-12 h-12 bg-amber-500 hover:bg-amber-600 text-black font-extrabold rounded-full flex items-center justify-center transition-colors disabled:opacity-50 shadow-md"
            >
              {isPlaying ? "⏸" : "▶"}
            </button>

            {/* Playback speed selector */}
            <select
              value={playbackSpeed}
              onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
              disabled={isSubmitted}
              className={`border text-xs font-bold rounded-xl px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer ${
                theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'
              }`}
            >
              <option value="0.8">0.8x Speed</option>
              <option value="1.0">1.0x Speed</option>
              <option value="1.25">1.25x Speed</option>
              <option value="1.5">1.5x Speed</option>
            </select>
          </div>

          <div className={`w-full max-w-xl h-2 rounded-full overflow-hidden border ${
            theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-150 border-zinc-200'
          }`}>
            <div
              className="h-full bg-amber-500 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="text-[10px] font-mono text-zinc-500 w-24 text-right">
            Sentences: {currentSentenceIndex + 1}/{currentTest.sentences.length}
          </div>
        </div>
      </header>

      <main style={{ zoom: display.fontScale }} className="flex-1 max-w-3xl w-full mx-auto p-6 md:p-10 z-10">

        {translating ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-zinc-400 text-sm font-semibold animate-pulse">AI Ustoz imtihon savollarini tanlangan tilga moslashtirmoqda...</p>
          </div>
        ) : !isSubmitted ? (
          <div className="space-y-10 animate-in fade-in duration-300">
            {/* Section 1 — Notes / Form completion (fill-in questions) */}
            {fillQs.length > 0 && (
              <div className="glass-card hover-3d-lift p-8 rounded-[2rem] shadow-xl transition-all duration-300">
                {(track.id === 'ielts' || track.id === 'multilevel') && (
                  <>
                    <h2 className="text-xl font-bold mb-2">Section 1</h2>
                    <p className="text-xs text-zinc-500 mb-6 italic">
                      Questions 1-{fillQs.length}. Complete the notes below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.
                    </p>
                  </>
                )}

                <div className={`p-6 rounded-xl border space-y-4 ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-900' : 'bg-zinc-50 border-zinc-200 text-zinc-900'}`}>
                  <h3 className="font-bold text-center underline mb-6 text-zinc-400">{currentTest.title}</h3>
                  {fillQs.map((q: any) => (
                    <div key={q.qid} id={`q_wrapper_${q.qid}`} className="grid grid-cols-1 sm:grid-cols-[160px_1fr] items-center gap-2 sm:gap-4 group">
                      <div className="flex items-center gap-2">
                        <button 
                          type="button" 
                          onClick={() => toggleFlag(q.qid)} 
                          className={`text-xs p-1 rounded hover:bg-zinc-850 transition-colors ${flags[q.qid] ? "text-blue-500" : "text-zinc-500 opacity-30 group-hover:opacity-100"}`}
                          title="Review later"
                        >
                          🚩
                        </button>
                        <span className="font-medium text-sm sm:text-right text-zinc-400">{q.prompt}:</span>
                      </div>
                      <span className="text-sm">
                        {q.prefix ? `${q.prefix} ` : ""}
                        <input
                          type="text"
                          value={answers[q.qid] || ""}
                          onChange={(e) => handleInputChange(q.qid, e.target.value)}
                          className={`w-48 border-b bg-transparent px-2 outline-none focus:border-amber-500 font-semibold ${theme === 'dark' ? 'border-zinc-700 text-white' : 'border-zinc-300 text-zinc-900'}`}
                          placeholder={`${qNum(q.qid)} ________`}
                        />
                        {q.suffix ? ` ${q.suffix}` : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section 2 — Multiple choice */}
            {mcqQs.length > 0 && (
              <div className="glass-card hover-3d-lift p-8 rounded-[2rem] shadow-xl transition-all duration-300">
                {(track.id === 'ielts' || track.id === 'multilevel') && (
                  <>
                    <h2 className="text-xl font-bold mb-2">Section 2</h2>
                    <p className="text-xs text-zinc-500 mb-6 italic">
                      Questions {qNum(mcqQs[0].qid)}-{qNum(mcqQs[mcqQs.length - 1].qid)}. Choose the correct letter, A, B, or C.
                    </p>
                  </>
                )}

                <div className="space-y-6">
                  {mcqQs.map((q: any) => (
                    <div key={q.qid} id={`q_wrapper_${q.qid}`} className="flex flex-col gap-2 group">
                      <div className="flex gap-2 items-center">
                        <button 
                          type="button" 
                          onClick={() => toggleFlag(q.qid)} 
                          className={`text-xs p-1 rounded hover:bg-zinc-850 transition-colors ${flags[q.qid] ? "text-blue-500" : "text-zinc-500 opacity-30 group-hover:opacity-100"}`}
                          title="Review later"
                        >
                          🚩
                        </button>
                        <span className="font-semibold text-sm">{qNum(q.qid)}.</span>
                        <span className={`text-sm font-medium ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>{q.prompt}</span>
                      </div>
                      <select
                        value={answers[q.qid] || ""}
                        onChange={(e) => handleInputChange(q.qid, e.target.value)}
                        className={`w-full sm:w-80 ${selectCls}`}
                      >
                        <option value=""></option>
                        {q.options.map((o: any) => (
                          <option key={o.value} value={o.value}>{o.value}. {o.label}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        ) : (
          <div className="flex flex-col items-center justify-start py-6 h-full">
            {!score ? (
              <div className="flex flex-col items-center text-center animate-pulse mt-20">
                <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                <h3 className="font-bold text-lg mb-2 text-[#f4f4f5]">Analyzing Answers...</h3>
                <p className="text-sm text-zinc-500">Checking against audio transcript and generating AI explanations in Uzbek.</p>
              </div>
            ) : (
              <div className="glass-card hover-3d-lift p-6 md:p-8 rounded-[2rem] shadow-xl w-full max-w-2xl animate-in slide-in-from-bottom-8">
                <h3 className="text-center uppercase tracking-widest text-xs font-bold text-zinc-500 mb-6">
                  {`${track.shortTitle} natija varag'i`}
                </h3>

                <div className={`flex justify-between items-center mb-8 pb-8 border-b ${theme === 'dark' ? 'border-zinc-900' : 'border-zinc-200'}`}>
                  <div className="text-center">
                    <div className="text-xs text-zinc-500 font-medium mb-1">To'g'ri javoblar</div>
                    <div className="text-4xl font-bold">{score.correct}<span className="text-xl text-zinc-500">/{score.total}</span></div>
                  </div>
                  <div className="h-12 w-px bg-zinc-900"></div>
                  <div className="text-center">
                    <div className="text-xs text-zinc-500 font-medium mb-1">{track.scoreLabel}</div>
                    <div className="text-4.5xl font-bold text-amber-500 font-mono">{trackScore(track, parseFloat(score.band) || 0)}</div>
                    {track.scoring !== "band-9" && <div className="text-[10px] text-zinc-600 font-mono mt-1">(ichki ball: {score.band}/9.0)</div>}
                  </div>
                </div>

                <div className="flex gap-2 mb-6 border-b border-zinc-900/60 pb-3">
                  <button
                    type="button"
                    onClick={() => setScoreTab("analysis")}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                      scoreTab === "analysis"
                        ? "bg-amber-500 text-black border-transparent"
                        : "bg-transparent border-zinc-800 text-zinc-400 hover:text-white"
                    }`}
                  >
                    📑 Savollar Tahlili (Answers)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setScoreTab("vocab_quiz");
                      if (currentTest.vocab.length > 0) {
                        const qs = currentTest.vocab.map((item: any) => {
                          const others = currentTest.vocab.filter((v: any) => v.word !== item.word);
                          const shuffledOthers = [...others].sort(() => 0.5 - Math.random());
                          const distractors = shuffledOthers.slice(0, 2).map((v: any) => v.translation);
                          const choices = [...distractors, item.translation].sort(() => 0.5 - Math.random());
                          return { word: item.word, choices, correct: item.translation, userAns: "" };
                        });
                        setListeningQuizQuestions(qs);
                        setListeningQuizDone(false);
                        setListeningQuizScore(0);
                      }
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                      scoreTab === "vocab_quiz"
                        ? "bg-amber-500 text-black border-transparent"
                        : "bg-transparent border-zinc-800 text-zinc-400 hover:text-white"
                    }`}
                  >
                    🎮 So'zlar Quizi (Vocab Quiz)
                  </button>
                </div>

                {scoreTab === "analysis" && score.explanations && Object.keys(score.explanations).length > 0 && (
                  <div className="space-y-6 mb-8 text-left">
                    <h4 className="font-bold text-xs uppercase tracking-widest text-zinc-500 mb-4">Barcha savollar tahlili (AI Explanation)</h4>
                    {Object.entries(score.explanations).map(([qId, explanation]: any) => {
                      const userAns = (answers[qId] || '(Javob berilmagan)').trim().toUpperCase();
                      const correctAns = keysMap[qId];
                      const isCorrect = userAns === correctAns;
                      return (
                        <div key={qId} className={`border p-5 rounded-xl space-y-2 transition-all ${
                          isCorrect ? 'border-emerald-500/20 hover:border-emerald-500/40' : 'border-red-500/20 hover:border-red-500/40'
                        } ${theme === 'dark' ? 'bg-[#09090b]' : 'bg-zinc-50'}`}>
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-xs text-amber-500 uppercase font-mono">Savol {qId.replace('q', '')}</span>
                            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                              isCorrect ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                            }`}>
                              {isCorrect ? 'Correct' : 'Incorrect'}
                            </span>
                          </div>
                          <div className="text-[11px] text-zinc-500 mb-1">{promptMap[qId]}</div>
                          <div className="grid grid-cols-2 gap-4 text-xs py-2 border-y border-zinc-900/50 font-mono">
                            <div>
                              <span className="text-zinc-500 block">Sizning javobingiz:</span>
                              <span className={`font-bold ${isCorrect ? 'text-emerald-500' : 'text-red-500'}`}>{userAns}</span>
                            </div>
                            <div>
                              <span className="text-zinc-500 block">To'g'ri javob:</span>
                              <span className="font-bold text-emerald-500">{correctAns}</span>
                            </div>
                          </div>
                          {(() => {
                            const parsed = parseExplanation(explanation);
                            return (
                              <div className="space-y-3 mt-3 text-xs md:text-sm">
                                {parsed.correctReason && (
                                  <div className={`p-3.5 rounded-xl border flex gap-3 items-start transition-all ${
                                    theme === 'dark' ? 'bg-emerald-950/15 border-emerald-900/40 text-emerald-300' : 'bg-emerald-50/50 border-emerald-200 text-emerald-800'
                                  }`}>
                                    <span className="text-base shrink-0 mt-0.5 select-none">✅</span>
                                    <div className="space-y-1">
                                      <strong className="text-[9px] uppercase font-bold tracking-wider opacity-60 block">Tahlil va Sababi (Analysis)</strong>
                                      <p className="leading-relaxed text-zinc-300 dark:text-zinc-250 font-medium">{parsed.correctReason}</p>
                                    </div>
                                  </div>
                                )}
                                
                                {parsed.proof && (
                                  <div className={`p-3.5 rounded-xl border flex gap-3 items-start transition-all ${
                                    theme === 'dark' ? 'bg-cyan-950/15 border-cyan-900/40 text-cyan-300' : 'bg-cyan-50/50 border-cyan-200 text-cyan-800'
                                  }`}>
                                    <span className="text-base shrink-0 mt-0.5 select-none">📌</span>
                                    <div className="space-y-1 w-full">
                                      <strong className="text-[9px] uppercase font-bold tracking-wider opacity-60 block">Matndan Isbot (Evidence Quote)</strong>
                                      <p className="leading-relaxed font-serif italic text-zinc-100 dark:text-zinc-200 bg-zinc-950/30 dark:bg-black/20 p-2 rounded-lg border border-zinc-900/10 mt-1">
                                        "{parsed.proof}"
                                      </p>
                                    </div>
                                  </div>
                                )}
                                
                                {parsed.userReason && !isCorrect && (
                                  <div className={`p-3.5 rounded-xl border flex gap-3 items-start transition-all ${
                                    theme === 'dark' ? 'bg-amber-950/15 border-amber-900/40 text-amber-300' : 'bg-amber-50/50 border-amber-200 text-amber-800'
                                  }`}>
                                    <span className="text-base shrink-0 mt-0.5 select-none">❌</span>
                                    <div className="space-y-1">
                                      <strong className="text-[9px] uppercase font-bold tracking-wider opacity-60 block">Xatolik Izohi (Distractor Check)</strong>
                                      <p className="leading-relaxed text-zinc-300 dark:text-zinc-250">{parsed.userReason}</p>
                                    </div>
                                  </div>
                                )}
                                
                                {parsed.tip && (
                                  <div className={`p-3.5 rounded-xl border flex gap-3 items-start transition-all ${
                                    theme === 'dark' ? 'bg-purple-950/15 border-purple-900/40 text-purple-300' : 'bg-purple-50/50 border-purple-200 text-purple-800'
                                  }`}>
                                    <span className="text-base shrink-0 mt-0.5 select-none">💡</span>
                                    <div className="space-y-1">
                                      <strong className="text-[9px] uppercase font-bold tracking-wider opacity-60 block">Tutor Strategiyasi (Tips)</strong>
                                      <p className="leading-relaxed text-zinc-300 dark:text-zinc-250 font-medium">{parsed.tip}</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })}
                  </div>
                )}

                {scoreTab === "vocab_quiz" && (
                  <div className="space-y-6 mb-8 text-left">
                    <h4 className="font-bold text-xs uppercase tracking-widest text-zinc-500 mb-4">Vocabulary Matching Quiz (Elllo style)</h4>
                    {listeningQuizQuestions.length === 0 ? (
                      <p className="text-xs text-zinc-500">Ushbu testda lug'at so'zlari topilmadi.</p>
                    ) : !listeningQuizDone ? (
                      <div className="space-y-4">
                        {listeningQuizQuestions.map((q, idx) => (
                          <div key={idx} className="bg-zinc-950/60 border border-zinc-900/60 p-4 rounded-xl space-y-2">
                            <div className="font-extrabold text-sm text-zinc-200">
                              {idx + 1}. <span className="text-amber-500">"{q.word}"</span> so'zining tarjimasini toping:
                            </div>
                            <div className="flex flex-wrap gap-2 pt-1">
                              {q.choices.map((choice) => (
                                <button
                                  key={choice}
                                  type="button"
                                  onClick={() => {
                                    setListeningQuizQuestions(prev => prev.map((item, i) => i === idx ? { ...item, userAns: choice } : item));
                                  }}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                    q.userAns === choice
                                      ? "bg-amber-500 text-black border-transparent shadow-sm"
                                      : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                                  }`}
                                >
                                  {choice}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            let pts = 0;
                            listeningQuizQuestions.forEach(q => {
                              if (q.userAns === q.correct) pts++;
                            });
                            setListeningQuizScore(pts);
                            setListeningQuizDone(true);
                            const currentXp = parseInt(localStorage.getItem("ielts_vocab_xp") || "0");
                            localStorage.setItem("ielts_vocab_xp", (currentXp + pts * 5).toString());
                          }}
                          className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-widest rounded-xl transition-all"
                        >
                          Natijani tekshirish
                        </button>
                      </div>
                    ) : (
                      <div className="bg-zinc-950 border border-zinc-900 p-6 rounded-2xl text-center space-y-4">
                        <div className="text-3xl">🎯</div>
                        <h5 className="font-bold text-base">Quiz yakunlandi!</h5>
                        <p className="text-xs text-zinc-400">
                          Siz {listeningQuizQuestions.length} ta so'zdan <span className="text-emerald-400 font-extrabold">{listeningQuizScore}</span> tasini to'g'ri topdingiz.
                        </p>
                        <p className="text-xs text-emerald-400 font-semibold">
                          +{listeningQuizScore * 5} XP ballari hisobingizga qo'shildi!
                        </p>
                        <div className="grid gap-2 text-left pt-4 border-t border-zinc-900/60 max-h-[220px] overflow-y-auto pr-1">
                          {listeningQuizQuestions.map((q, idx) => {
                            const correct = q.userAns === q.correct;
                            return (
                              <div key={idx} className="flex justify-between items-center text-xs py-1.5 border-b border-zinc-900/40">
                                <div>
                                  <span className="font-bold text-zinc-300">"{q.word}"</span> → <span className="text-zinc-500">{q.correct}</span>
                                </div>
                                <span className={correct ? "text-emerald-400" : "text-red-400 font-bold"}>
                                  {correct ? "To'g'ri" : `Siz: "${q.userAns || 'bo\'sh'}"`}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setListeningQuizDone(false);
                            setListeningQuizQuestions(prev => prev.map(q => ({ ...q, userAns: "" })));
                          }}
                          className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-xs text-zinc-350 font-bold transition-all"
                        >
                          Qayta urinish
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Synced Audio Transcript with highlights */}
                <div className="border-t border-zinc-900 pt-6 mb-8 text-left space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h4 className="font-bold text-xs uppercase tracking-widest text-zinc-500">Listening Audio Transcript (Ovozli Matn Tahlili)</h4>
                    <div className="flex gap-1.5 bg-zinc-950 p-1 border border-zinc-900 rounded-xl w-fit">
                      <button
                        type="button"
                        onClick={() => setInteractiveTranscript(true)}
                        className={`px-3 py-1 rounded-lg text-[9px] font-bold transition-all ${
                          interactiveTranscript ? 'bg-amber-500 text-black' : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        ⚡ Interactive
                      </button>
                      <button
                        type="button"
                        onClick={() => setInteractiveTranscript(false)}
                        className={`px-3 py-1 rounded-lg text-[9px] font-bold transition-all ${
                          !interactiveTranscript ? 'bg-amber-500 text-black' : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        📖 Paragraphs
                      </button>
                    </div>
                  </div>

                  {interactiveTranscript ? (
                    <div className={`border p-5 rounded-xl text-sm leading-loose space-y-3 font-serif ${
                      theme === 'dark' ? 'bg-[#09090b] border-zinc-900 text-zinc-400' : 'bg-zinc-50 border-zinc-200 text-zinc-700'
                    }`}>
                      {activeHoverVocab && (
                        <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl mb-4 flex justify-between items-start animate-in fade-in duration-200">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-sm text-amber-400">{activeHoverVocab.word}</span>
                              <span className="text-xs text-zinc-400">({activeHoverVocab.translation})</span>
                            </div>
                            <p className="text-xs text-zinc-300 leading-normal">{activeHoverVocab.definition}</p>
                          </div>
                          <button onClick={() => setActiveHoverVocab(null)} className="text-xs text-zinc-500 hover:text-white font-bold ml-4">✕</button>
                        </div>
                      )}

                      <div className="space-y-3">
                        {currentTest.sentences.map((sent: any, idx: number) => {
                          const isActive = currentSentenceIndex === idx && isPlaying;
                          return (
                            <div
                              key={idx}
                              onClick={() => playSentences(currentTest.sentences, idx)}
                              className={`group flex gap-3 p-3 rounded-2xl cursor-pointer transition-all border ${
                                isActive 
                                  ? 'bg-amber-500/20 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]' 
                                  : 'bg-white/50 dark:bg-black/20 border-transparent hover:bg-white/80 dark:hover:bg-white/5 hover:border-zinc-200 dark:hover:border-white/10'
                              }`}
                              title="Boshidan eshitish uchun bosing"
                            >
                              <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                                isActive ? 'bg-amber-500 text-black' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 group-hover:text-amber-500'
                              }`}>
                                {isActive ? '⏸' : '▶'}
                              </div>
                              <span className={`text-base leading-relaxed pt-1 ${isActive ? 'text-black dark:text-amber-400 font-medium' : 'text-zinc-700 dark:text-zinc-300'}`}>
                                {renderSentenceWithVocab(sent, currentTest.vocab)}{" "}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`border p-5 rounded-xl text-sm leading-loose space-y-4 font-serif ${
                        theme === 'dark' ? 'bg-[#09090b] border-zinc-900 text-zinc-400' : 'bg-zinc-50 border-zinc-200 text-zinc-700'
                      }`}
                      dangerouslySetInnerHTML={{ __html: currentTest.transcriptHtml }}
                    />
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsSubmitted(false)}
                  className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors"
                >
                  Qayta topshirish / Retake Test
                </button>
              </div>
            )}
          </div>
        )}

      </main>

      {/* Bottom CBT Navigation Bar */}
      <footer className={`sticky bottom-0 z-20 border-t p-4 flex flex-wrap items-center justify-between transition-colors duration-300 ${
        theme === 'dark' ? 'bg-zinc-950 border-zinc-900' : 'bg-white border-zinc-200'
      }`}>
        <div className="flex items-center gap-3">
          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 font-mono">Questions:</span>
          <div className="flex flex-wrap gap-1.5">
            {currentTest.questions.map((q: any, idx: number) => {
              const id = q.qid;
              const answered = !!answers[id];
              const flagged = !!flags[id];
              return (
                <button
                  key={id}
                  onClick={() => {
                    const element = document.getElementById(`q_wrapper_${id}`);
                    if (element) {
                      element.scrollIntoView({ behavior: "smooth", block: "center" });
                    }
                  }}
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg font-mono text-xs font-bold transition-all relative flex items-center justify-center border-2 ${
                    flagged 
                      ? "border-blue-500 text-blue-500 bg-blue-500/10 shadow-[0_0_8px_rgba(59,130,246,0.2)] animate-pulse" 
                      : answered 
                        ? theme === 'dark' 
                          ? "bg-zinc-800 border-zinc-700 text-white" 
                          : "bg-zinc-150 border-zinc-300 text-zinc-900 font-extrabold"
                        : theme === 'dark' 
                          ? "bg-zinc-950 border-zinc-900 text-zinc-650" 
                          : "bg-zinc-50 border-zinc-200 text-zinc-400"
                  }`}
                  title={flagged ? "Flagged for review" : answered ? "Answered" : "Unanswered"}
                >
                  {qNum(id)}
                  {flagged && (
                    <span className="absolute -top-1.5 -right-1.5 text-[8px] w-3 h-3 flex items-center justify-center">
                      🚩
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-4 text-[11px] text-zinc-555 font-semibold font-mono">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-blue-500/20 border border-blue-500"></span> Review</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-zinc-800 border border-zinc-700"></span> Answered</span>
        </div>
      </footer>

      {/* Vocabulary Modal */}
      {showVocab && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-950 border border-zinc-900 max-w-2xl w-full rounded-2xl p-6 md:p-8 max-h-[85vh] overflow-y-auto shadow-2xl relative">
            <button
              onClick={() => setShowVocab(false)}
              className="absolute top-6 right-6 text-zinc-500 hover:text-white font-mono text-xs uppercase tracking-widest font-bold"
            >
              [ Close ]
            </button>
            <h3 className="text-xl font-black mb-2 text-zinc-100 flex items-center gap-2">
              <span>📖</span> Vocabulary List / Lug'at boyligi
            </h3>
            <p className="text-xs text-zinc-500 mb-6">Ushbu listening testda ishlatilgan eng muhim akademik va foydali so'zlar ro'yxati.</p>

            <div className="space-y-4">
              {currentTest.vocab.map((item: any, i: number) => (
                <div key={i} className="bg-zinc-900/40 border border-zinc-900 p-4 rounded-xl flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-amber-500">{item.word}</span>
                      <span className="text-xs text-zinc-500 font-medium">({item.translation})</span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">{item.definition}</p>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      onClick={() => saveToMyVocab(item)}
                      className="text-[10px] font-bold text-amber-500 hover:text-amber-400 uppercase tracking-wider font-mono bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20"
                      title="Shaxsiy lug'atga qo'shish"
                    >
                      + Saqlash
                    </button>
                    <button
                      onClick={() => handleCopy(item.word)}
                      className="text-[10px] font-bold text-zinc-500 hover:text-white uppercase tracking-wider font-mono bg-zinc-950 px-2 py-1 rounded border border-zinc-900/60"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
