"use client";

import { aiFetch } from "@/lib/apiClient";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePracticeLanguage } from "@/lib/usePracticeLanguage";
import { useTrack } from "@/lib/useTrack";
import { trackScore } from "@/lib/tracks";
import { AudioVisualizer } from "@/components/AudioVisualizer";

interface BreakdownItem {
  char: string;
  read: string;
  meaning: string;
  type: "character" | "alphabet" | "word";
}

interface SentenceItem {
  text: string;
  roman?: string;
  translation: string;
  breakdowns: BreakdownItem[];
}

const LANGUAGE_SENTENCES: Record<string, SentenceItem[]> = {
  english: [
    {
      text: "Education plays a fundamental role in reducing poverty worldwide.",
      translation: "Ta'lim butun dunyoda kambag'allikni qisqartirishda muhim rol o'ynaydi.",
      breakdowns: [
        { char: "Education", read: "[ˌedʒuˈkeɪʃn]", meaning: "Ta'lim (Ot)", type: "word" },
        { char: "fundamental", read: "[ˌfʌndəˈmentl]", meaning: "Asosiy / Muhim", type: "word" },
        { char: "poverty", read: "[ˈpɒvəti]", meaning: "Kambag'allik", type: "word" }
      ]
    },
    {
      text: "Although it was raining, we thoroughly enjoyed our journey.",
      translation: "Yomg'ir yog'ayotgan bo'lsa-da, biz sayohatimizdan juda zavqlandik.",
      breakdowns: [
        { char: "Although", read: "[ɔːlˈðəʊ]", meaning: "Garchi ... bo'lsa-da", type: "word" },
        { char: "thoroughly", read: "[ˈθʌrəli]", meaning: "To'liq / Juda ham", type: "word" },
        { char: "journey", read: "[ˈdʒɜːni]", meaning: "Sayohat", type: "word" }
      ]
    }
  ],
  russian: [
    {
      text: "Здравствуйте приятно познакомиться",
      translation: "Salom, tanishganimdan xursandman.",
      breakdowns: [
        { char: "Здравствуйте", read: "[Zdrav-stvuy-te]", meaning: "Assalomu alaykum / Salom", type: "word" },
        { char: "приятно", read: "[pri-yat-no]", meaning: "Yoqimli (sifat)", type: "word" },
        { char: "познакомиться", read: "[poz-na-ko-mit'-sya]", meaning: "Tanishish (fe'l)", type: "word" }
      ]
    },
    {
      text: "Какая сегодня прекрасная погода на улице",
      translation: "Bugun ko'chada ob-havo qanday ajoyib.",
      breakdowns: [
        { char: "Какая", read: "[Ka-ka-ya]", meaning: "Qanday / Qanaqa", type: "word" },
        { char: "прекрасная", read: "[pre-kras-na-ya]", meaning: "Ajoyib / Go'zal", type: "word" },
        { char: "погода", read: "[po-go-da]", meaning: "Ob-havo (Ot)", type: "word" }
      ]
    }
  ],
  korean: [
    {
      text: "안 녕 하 세 요 반 갑 습 니 다",
      roman: "An-nyeong-ha-se-yo ban-gap-seum-ni-da",
      translation: "Salom, tanishganimdan xursandman.",
      breakdowns: [
        { char: "안 (An)", read: "ㅇ + ㅏ + ㄴ", meaning: "Tinchlik / Omonlik (Consonant ㅇ + Vowel ㅏ + Batchim ㄴ)", type: "alphabet" },
        { char: "녕 (Nyeong)", read: "ㄴ + ㅕ + ㅇ", meaning: "Sog'lik (Consonant ㄴ + Vowel ㅕ + Batchim ㅇ)", type: "alphabet" },
        { char: "안녕하세요", read: "Annyeonghaseyo", meaning: "Salom (Hurmat/Rasmiy shakl)", type: "word" },
        { char: "반갑습니다", read: "Bangapseumnida", meaning: "Sizni ko'rganimdan xursandman", type: "word" }
      ]
    },
    {
      text: "오 늘 은 날 씨 가 참 좋 네 요",
      roman: "O-neul-eun nal-ssi-ga cham joh-ne-yo",
      translation: "Bugun ob-havo juda ajoyib-da.",
      breakdowns: [
        { char: "오늘 (Oneul)", read: "오 + 늘", meaning: "Bugun", type: "word" },
        { char: "날씨 (Nalssi)", read: "ㄴ + ㅏ + ㄹ + ㅆ + ㅣ", meaning: "Ob-havo", type: "word" },
        { char: "참 (Cham)", read: "ㅊ + ㅏ + ㅁ", meaning: "Juda / Haqiqatdan ham", type: "word" },
        { char: "좋네요 (Johne-yo)", read: "좋 (joh) + 네요 (neyo)", meaning: "Yaxshi-ya (Suhbatdosh tasdig'i)", type: "word" }
      ]
    }
  ],
  japanese: [
    {
      text: "こ ん に ち は は じ め ま し て",
      roman: "Konnichiwa hajimemashite",
      translation: "Salom, tanishganimdan xursandman (birinchi marta ko'rishishimiz).",
      breakdowns: [
        { char: "こ (Ko)", read: "Hiragana 'ko'", meaning: "Ikki parallel gorizontal chiziqli bo'g'in", type: "alphabet" },
        { char: "ん (N)", read: "Hiragana 'n'", meaning: "Yagona undosh, keyingi bo'g'inga bog'lanadi", type: "alphabet" },
        { char: "こんにちは", read: "Konnichiwa", meaning: "Salom (Kunduzgi salomlashish)", type: "word" },
        { char: "はじめまして", read: "Hajimemashite", meaning: "Tanishganimdan mamnunman", type: "word" }
      ]
    },
    {
      text: "き ょ う は と て も い い て ん き で す ね",
      roman: "Kyou wa totemo ii tenki desu ne",
      translation: "Bugun ob-havo juda yaxshi, shunday emasmi?",
      breakdowns: [
        { char: "今日 (Kyou)", read: "きょう", meaning: "Bugun (Kanji: hozirgi kun iyeroglifi)", type: "character" },
        { char: "とても (Totemo)", read: "Totemo", meaning: "Juda ham (ravish)", type: "word" },
        { char: "いい (Ii)", read: "Ii", meaning: "Yaxshi (sifat)", type: "word" },
        { char: "天気 (Tenki)", read: "てんき", meaning: "Ob-havo (Kanji: osmon 天 + energiya 気)", type: "character" }
      ]
    }
  ],
  chinese: [
    {
      text: "你 好 很 高 兴 认 识 你",
      roman: "Nǐ hǎo hěn gāoxìng rènshi nǐ",
      translation: "Salom, seni ko'rganimdan juda xursandman.",
      breakdowns: [
        { char: "你 (Nǐ)", read: "Uchinchi ohang (3rd tone)", meaning: "Sen (Iyeroglif: chapda odam '亻' va o'ngda muvozanat '尔')", type: "character" },
        { char: "好 (Hǎo)", read: "Uchinchi ohang (3rd tone)", meaning: "Yaxshi (Iyeroglif: chapda ayol '女' va o'ngda bola '子' birlashmasi)", type: "character" },
        { char: "很高兴", read: "Hěn gāoxìng", meaning: "Juda xursand (Hěn: juda + Gāoxìng: xursand)", type: "word" },
        { char: "认识", read: "Rènshi", meaning: "Tanishmoq / Bilmoq (Rèn: tanimoq + Shi: bilmoq)", type: "word" }
      ]
    },
    {
      text: "今 天 的 天 气 非 常 好",
      roman: "Jīntiān de tiānqì fēicháng hǎo",
      translation: "Bugun ob-havo favqulodda yaxshi.",
      breakdowns: [
        { char: "今天 (Jīntiān)", read: "Jintian", meaning: "Bugun (Ho'zirgi kun iyeroglifi)", type: "character" },
        { char: "天气 (Tiānqì)", read: "Tianqi", meaning: "Ob-havo (Osmon 天 va havo/energiya 气 iyeroglifi)", type: "character" },
        { char: "非常 (Fēicháng)", read: "Feichang", meaning: "Favqulodda / Favqulodda darajada", type: "word" }
      ]
    }
  ],
  german: [
    {
      text: "Guten Tag, schön Sie kennenzulernen.",
      translation: "Xayrli kun, siz bilan tanishganimdan xursandman.",
      breakdowns: [
        { char: "Guten Tag", read: "[ˈɡuːtn̩ taːk]", meaning: "Xayrli kun / Salom", type: "word" },
        { char: "schön", read: "[ʃøːn]", meaning: "Chiroyli / Yaxshi", type: "word" },
        { char: "kennenzulernen", read: "[ˈkɛnənˌtsuːlɛʁnən]", meaning: "Tanishmoq", type: "word" }
      ]
    },
    {
      text: "Das Wetter ist heute sehr schön.",
      translation: "Bugun ob-havo juda yaxshi.",
      breakdowns: [
        { char: "Wetter", read: "[ˈvɛtɐ]", meaning: "Ob-havo", type: "word" },
        { char: "heute", read: "[ˈhɔɪ̯tə]", meaning: "Bugun", type: "word" },
        { char: "sehr", read: "[zeːɐ̯]", meaning: "Juda", type: "word" }
      ]
    }
  ]
};

function getLanguageWords(text: string, lang: string) {
  const cleaned = text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?？！。，、；：]/g, "").trim();
  if (lang === "japanese" || lang === "chinese" || lang === "korean") {
    return cleaned.replace(/\s+/g, "").split("").filter(Boolean);
  }
  return cleaned.split(/\s+/).filter(Boolean);
}

function similar(a: string, b: string): number {
  if (a === b) return 1;
  const m = a.length, n = b.length;
  if (m === 0 || n === 0) return 0;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return 1 - dp[m][n] / Math.max(m, n);
}

function scoreWords(target: string, heard: string, lang: string) {
  const tWords = getLanguageWords(target, lang);
  const hWords = getLanguageWords(heard, lang);
  const used = new Array(hWords.length).fill(false);
  const THRESHOLD = 0.7;
  const result = tWords.map((w) => {
    let bestIdx = -1, bestSim = 0;
    for (let i = 0; i < hWords.length; i++) {
      if (used[i]) continue;
      const sim = similar(w, hWords[i]);
      if (sim > bestSim) { bestSim = sim; bestIdx = i; }
    }
    const need = w.length <= 3 ? 0.85 : THRESHOLD;
    const ok = bestSim >= need;
    if (ok && bestIdx >= 0) used[bestIdx] = true;
    return { word: w, ok };
  });
  return {
    correct: result.filter((r) => r.ok).length,
    total: result.length,
    result
  };
}

export default function PronunciationPractice() {
  const [currentLang] = usePracticeLanguage();
  const { track } = useTrack();
  // Tilga bog'liq hosila qiymat — state saqlashning hojati yo'q edi.
  const sentences = LANGUAGE_SENTENCES[currentLang] || LANGUAGE_SENTENCES.english;
  const [idx, setIdx] = useState(0);
  const [status, setStatus] = useState<"idle" | "listening" | "done">("idle");
  const [heard, setHeard] = useState("");
  const [scored, setScored] = useState<{ result: { word: string; ok: boolean }[]; correct: number; total: number } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);

  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const activeItem = sentences[idx] || sentences[0] || LANGUAGE_SENTENCES.english[0];
  const isMultilingual = currentLang !== "english";
  const modelId = isMultilingual ? "eleven_multilingual_v2" : "eleven_turbo_v2_5";

  const flash = (m: string) => { setNotice(m); setTimeout(() => setNotice(null), 3500); };


  useEffect(() => {
    if (typeof window === "undefined") return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.continuous = false;
    r.interimResults = true;
    r.lang = currentLang === "russian" ? "ru-RU" :
             currentLang === "japanese" ? "ja-JP" :
             currentLang === "korean" ? "ko-KR" :
             currentLang === "chinese" ? "zh-CN" :
             "en-US";

    r.onresult = (e: any) => {
      let txt = "";
      for (let i = 0; i < e.results.length; i++) txt += e.results[i][0].transcript + " ";
      setHeard(txt.trim());
    };
    r.onend = () => {
      setStatus((s) => {
        if (s === "listening") {
          setHeard((h) => {
            if (h.trim()) setScored(scoreWords(activeItem.text, h, currentLang));
            else flash("Hech narsa eshitilmadi — qaytadan urinib ko'ring.");
            return h;
          });
          return "done";
        }
        return s;
      });
    };
    r.onerror = (e: any) => { if (e.error === "not-allowed") flash("Mikrofonga ruxsat bering."); };
    recognitionRef.current = r;
    return () => { try { r.abort(); } catch {} };
  }, [activeItem, currentLang]);

  const start = () => {
    setHeard(""); setScored(null); setStatus("listening");
    try { recognitionRef.current?.start(); } catch {}
  };
  const stop = () => { try { recognitionRef.current?.stop(); } catch {} };

  const listenModel = async () => {
    if (playing) { audioRef.current?.pause(); setPlaying(false); return; }
    try {
      setPlaying(true);
      const res = await aiFetch("/api/speaking/synth", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: activeItem.text, gender: "female", model_id: modelId }),
      });
      if (!res.ok) throw new Error("audio");
      const blob = await res.blob();
      const audio = new Audio(URL.createObjectURL(blob));
      audioRef.current = audio;
      audio.onended = () => setPlaying(false);
      await audio.play();
    } catch { setPlaying(false); flash("Ovozni yuklab bo'lmadi."); }
  };

  const playWord = async (w: string) => {
    try {
      const res = await aiFetch("/api/speaking/synth", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ text: w, gender: "female", model_id: modelId }) 
      });
      if (!res.ok) return;
      const audio = new Audio(URL.createObjectURL(await res.blob()));
      await audio.play();
    } catch {}
  };

  const next = () => { stop(); setIdx((i) => (i + 1) % sentences.length); setStatus("idle"); setHeard(""); setScored(null); };

  const pct = scored ? Math.round((scored.correct / scored.total) * 100) : 0;
  const scoreColor = pct >= 85 ? "text-emerald-400" : pct >= 60 ? "text-amber-400" : "text-red-400";

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-[#f4f4f5] flex flex-col font-sans">
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-950/80 backdrop-blur border-b border-zinc-200 dark:border-zinc-900">
        <div className="mx-auto max-w-3xl flex h-16 items-center justify-between px-6">
          <Link href={`/t/${track.id}`} className="text-zinc-500 hover:text-black dark:hover:text-white text-sm font-semibold">← {track.shortTitle}</Link>
          <span className="text-xs font-bold uppercase tracking-widest text-amber-500">
            {currentLang === "english" ? "Talaffuz Mashqi" :
             currentLang === "russian" ? "Русское произношение" :
             currentLang === "japanese" ? "発音練習 / Pronunciation" :
             currentLang === "korean" ? "발음 연습 / Pronunciation" :
             "发音练习 / Pronunciation"}
          </span>
          <span className="text-xs text-zinc-500 font-mono">{idx + 1}/{sentences.length}</span>
        </div>
      </header>

      {notice && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-white dark:bg-zinc-950 border border-amber-500/30 text-amber-500 dark:text-amber-400 px-4 py-2 rounded-xl text-sm font-semibold shadow-2xl">{notice}</div>
      )}

      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-10 flex flex-col gap-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-xs font-bold uppercase tracking-widest border border-amber-500/20 self-start">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" /> Pronunciation Trainer
        </div>

        {/* Target sentence */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-8 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Bu jumlani o'qing (Read this sentence)</span>
            <button onClick={listenModel} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/30 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-100 dark:hover:bg-cyan-500/20 transition-all">
              {playing ? "⏸ To'xtatish" : "🔊 Ovozli eshitish"}
            </button>
          </div>

          {/* Sentence — coloured after scoring */}
          <div className="space-y-4">
            <p className="text-3xl md:text-4xl font-serif leading-relaxed text-black dark:text-zinc-100 tracking-wide">
              {scored ? scored.result.map((r, i) => (
                <span key={i} onClick={() => playWord(r.word)} title="Bosib to'g'ri talaffuzni eshiting" className={`cursor-pointer hover:opacity-70 transition-opacity ${r.ok ? "text-emerald-500 dark:text-emerald-400" : "text-red-500 dark:text-red-400 underline decoration-wavy decoration-red-500/60"}`}>{r.word}{" "}</span>
              )) : activeItem.text}
            </p>

            {/* Romaji/Pinyin transcription */}
            {activeItem.roman && (
              <p className="text-sm font-semibold tracking-wider text-amber-500/80 font-mono">
                {activeItem.roman}
              </p>
            )}

            {/* Uzbek translation */}
            <p className="text-xs text-zinc-500 font-medium italic border-t border-zinc-900/50 pt-3">
              Tarjimasi: {activeItem.translation}
            </p>
          </div>
        </div>

        {/* Characters & Alphabet breakdowns list - simplifies learning Asian languages */}
        {activeItem.breakdowns && activeItem.breakdowns.length > 0 && (
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 shadow-xl">
            <h3 className="text-xs uppercase font-extrabold tracking-widest text-zinc-500 dark:text-zinc-400 mb-4 flex items-center gap-2">
              📚 {isMultilingual ? "Iyeroglif va Harflar tahlili (Composition breakdowns)" : "So'zlar tahlili (Word breakdowns)"}
            </h3>
            <div className="grid gap-3.5 sm:grid-cols-2">
              {activeItem.breakdowns.map((item, i) => (
                <div key={i} className="p-3 border border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-950/40 rounded-xl flex gap-3.5 items-start">
                  <span className="min-w-[40px] w-auto px-2 h-10 shrink-0 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-500 rounded-lg flex items-center justify-center text-lg font-bold font-serif shadow-sm">
                    {item.char.split(" ")[0]}
                  </span>
                  <div className="text-left leading-normal">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-xs text-black dark:text-zinc-200 font-mono">{item.char}</span>
                      <span className="text-[8px] px-1.5 py-0.25 font-bold uppercase rounded bg-zinc-200 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-500">
                        {item.type}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-600 dark:text-zinc-500 font-mono">O'qilishi: {item.read}</p>
                    <p className="text-xs text-zinc-700 dark:text-zinc-400 mt-1 font-medium">{item.meaning}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action */}
        {status !== "done" ? (
          <button
            onClick={status === "listening" ? stop : start}
            className={`mx-auto w-44 h-44 rounded-full flex flex-col items-center justify-center font-black text-lg transition-all shadow-2xl ${
              status === "listening" ? "bg-red-500/20 border-2 border-red-500 text-red-400" : "bg-amber-500 text-black hover:bg-amber-400 hover:-translate-y-1"
            }`}
          >
            {status === "listening" ? (
              <>
                <AudioVisualizer isRecording={true} />
                <span className="text-xs uppercase tracking-widest mt-2">Tugatish</span>
              </>
            ) : (
              <>
                <span className="text-4xl mb-2">🎙️</span>
                <span>Gapirish</span>
              </>
            )}
          </button>
        ) : (
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-8 animate-in slide-in-from-bottom-4 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="text-left">
                <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1">Talaffuz ballingiz</div>
                <div className={`text-5xl font-black ${scoreColor}`}>{pct}%</div>
                <div className="text-xs text-zinc-500 mt-1">{scored!.correct}/{scored!.total} bo'g'in aniq talaffuz qilindi</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1">Eshitilgan</div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 italic max-w-[200px]">"{heard}"</p>
              </div>
            </div>

            {scored!.result.some((r) => !r.ok) && (
              <div className="border-t border-zinc-200 dark:border-zinc-900 pt-4 mb-4 text-left">
                <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-2">Mashq qiling (qizil bo'g'inlar)</div>
                <div className="flex flex-wrap gap-2">
                  {scored!.result.filter((r) => !r.ok).map((r, i) => (
                    <button key={i} onClick={() => playWord(r.word)} title="Bosib eshiting" className="text-sm font-bold bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 px-3 py-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors">🔊 {r.word}</button>
                  ))}
                </div>
                <p className="text-xs text-zinc-500 mt-3">💡 Har bir qizil bo'g'inni bosib, to'g'ri talaffuzini eshiting va qayta mashq qiling.</p>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={start} className="flex-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white py-3 rounded-xl font-bold text-sm hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all">🔁 Qayta urinish</button>
              <button onClick={next} className="flex-1 bg-amber-500 text-black py-3 rounded-xl font-bold text-sm hover:bg-amber-400 transition-all">Keyingi jumla →</button>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-zinc-650 mt-8 leading-relaxed">
          Tizim sizning ovozingizni tanib, qaysi so'zlar <span className="text-emerald-400 font-bold">aniq</span> va qaysilari <span className="text-red-400 font-bold">noaniq</span> talaffuz qilinganini ko'rsatadi.
          Chrome brauzerida eng yaxshi ishlaydi.
        </p>
      </main>
    </div>
  );
}
