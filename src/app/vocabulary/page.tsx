"use client";

import { useStoredJSON, writeJSON } from "@/lib/clientStore";
import { aiFetch } from "@/lib/apiClient";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePracticeLanguage } from "@/lib/usePracticeLanguage";
import { useClientNow } from "@/lib/useClientNow";
import { motion, AnimatePresence } from "framer-motion";

type Word = { word: string; ipa: string; def: string; uz: string; cefr: string; example: string };

const WORDS_EN: Word[] = [
  { word: "ubiquitous", ipa: "/juːˈbɪkwɪtəs/", def: "present, appearing, or found everywhere", uz: "hamma joyda mavjud", cefr: "C1", example: "Smartphones have become ubiquitous in modern life." },
  { word: "mitigate", ipa: "/ˈmɪtɪɡeɪt/", def: "make something less severe or serious", uz: "yumshatmoq, kamaytirmoq", cefr: "C1", example: "Planting trees can mitigate the effects of climate change." },
  { word: "deteriorate", ipa: "/dɪˈtɪəriəreɪt/", def: "become progressively worse", uz: "yomonlashmoq", cefr: "B2", example: "Her health began to deteriorate rapidly." },
  { word: "fluctuate", ipa: "/ˈflʌktʃueɪt/", def: "rise and fall irregularly", uz: "o'zgarib turmoq", cefr: "B2", example: "Prices fluctuate according to demand." },
  { word: "exacerbate", ipa: "/ɪɡˈzæsərbeɪt/", def: "make a problem worse", uz: "kuchaytirmoq (yomon tomonga)", cefr: "C1", example: "The new policy may exacerbate unemployment." },
  { word: "paramount", ipa: "/ˈpærəmaʊnt/", def: "more important than anything else", uz: "eng muhim", cefr: "C1", example: "Safety is of paramount importance." },
  { word: "albeit", ipa: "/ɔːlˈbiːɪt/", def: "although", uz: "garchi, bo'lsa-da", cefr: "C1", example: "He accepted the job, albeit reluctantly." },
  { word: "scrutinise", ipa: "/ˈskruːtɪnaɪz/", def: "examine closely and thoroughly", uz: "sinchiklab tekshirmoq", cefr: "C1", example: "Investors scrutinise the company's accounts." },
  { word: "unprecedented", ipa: "/ʌnˈpresɪdentɪd/", def: "never done or known before", uz: "misli ko'rilmagan", cefr: "B2", example: "The pandemic caused unprecedented disruption." },
  { word: "comprehensive", ipa: "/ˌkɒmprɪˈhensɪv/", def: "complete and including everything", uz: "keng qamrovli", cefr: "B2", example: "The report offers a comprehensive analysis." },
  { word: "inevitable", ipa: "/ɪnˈevɪtəbl/", def: "certain to happen; unavoidable", uz: "muqarrar", cefr: "B2", example: "Change is inevitable in any society." },
  { word: "substantial", ipa: "/səbˈstænʃl/", def: "large in amount, value, or importance", uz: "salmoqli, katta", cefr: "B2", example: "There has been a substantial increase in sales." },
  { word: "prevalent", ipa: "/ˈprevələnt/", def: "widespread in a particular area or time", uz: "keng tarqalgan", cefr: "C1", example: "Obesity is increasingly prevalent among children." },
  { word: "detrimental", ipa: "/ˌdetrɪˈmentl/", def: "tending to cause harm", uz: "zararli", cefr: "C1", example: "Smoking is detrimental to your health." },
  { word: "alleviate", ipa: "/əˈliːvieɪt/", def: "make suffering or a problem less severe", uz: "yengillashtirmoq", cefr: "C1", example: "The medicine helped to alleviate the pain." },
  { word: "diverse", ipa: "/daɪˈvɜːs/", def: "showing a great deal of variety", uz: "xilma-xil", cefr: "B2", example: "The city has a diverse population." },
  { word: "sustainable", ipa: "/səˈsteɪnəbl/", def: "able to be maintained over time", uz: "barqaror", cefr: "B2", example: "We need a sustainable approach to energy." },
  { word: "profound", ipa: "/prəˈfaʊnd/", def: "very great or intense; deep", uz: "chuqur, teran", cefr: "C1", example: "The book had a profound effect on me." },
  { word: "compelling", ipa: "/kəmˈpelɪŋ/", def: "evoking interest or conviction", uz: "ishonarli, jalb qiluvchi", cefr: "C1", example: "She made a compelling argument." },
  { word: "notion", ipa: "/ˈnəʊʃn/", def: "a concept or belief about something", uz: "tushuncha, fikr", cefr: "B2", example: "He rejected the notion that money brings happiness." },
  { word: "enhance", ipa: "/ɪnˈhɑːns/", def: "intensify or improve the quality of", uz: "yaxshilamoq, oshirmoq", cefr: "B2", example: "Good lighting can enhance a photograph." },
  { word: "advocate", ipa: "/ˈædvəkeɪt/", def: "publicly recommend or support", uz: "yoqlamoq, targ'ib qilmoq", cefr: "C1", example: "Many experts advocate a balanced diet." },
  { word: "dilemma", ipa: "/dɪˈlemə/", def: "a difficult choice between alternatives", uz: "qiyin tanlov, dilemma", cefr: "B2", example: "She faced the dilemma of work versus family." },
  { word: "inherent", ipa: "/ɪnˈhɪərənt/", def: "existing as a natural, permanent part", uz: "tabiiy, azaliy", cefr: "C1", example: "There are risks inherent in any investment." },
  { word: "plausible", ipa: "/ˈplɔːzəbl/", def: "seeming reasonable or probable", uz: "ishonarli, maqbul", cefr: "C1", example: "That sounds like a plausible explanation." },
  { word: "discrepancy", ipa: "/dɪsˈkrepənsi/", def: "a lack of compatibility; a difference", uz: "nomutanosiblik, farq", cefr: "C1", example: "There is a discrepancy between the two reports." },
  { word: "resilient", ipa: "/rɪˈzɪliənt/", def: "able to recover quickly from difficulties", uz: "bardoshli, chidamli", cefr: "C1", example: "Children are often remarkably resilient." },
  { word: "ambiguous", ipa: "/æmˈbɪɡjuəs/", def: "open to more than one interpretation", uz: "noaniq, ikki ma'noli", cefr: "C1", example: "The question was ambiguous and confusing." },
  { word: "consensus", ipa: "/kənˈsensəs/", def: "general agreement", uz: "umumiy kelishuv", cefr: "B2", example: "There is a growing consensus on this issue." },
  { word: "tentative", ipa: "/ˈtentətɪv/", def: "not certain or fixed; provisional", uz: "taxminiy, ehtiyotkor", cefr: "C1", example: "We made a tentative plan to meet next week." },
];

const WORDS_RU: Word[] = [
  { word: "здравствуйте", ipa: "[zdrav-stvuy-te]", def: "Hello (formal/polite)", uz: "salom (rasmiy)", cefr: "A1", example: "Здравствуйте, учитель! - Salom, o'qituvchi!" },
  { word: "спасибо", ipa: "[spa-si-ba]", def: "Thank you", uz: "rahmat", cefr: "A1", example: "Большое спасибо за помощь. - Yordam uchun katta rahmat." },
  { word: "пожалуйста", ipa: "[pa-zhal-uy-sta]", def: "Please; you are welcome", uz: "iltimos; arziydi", cefr: "A1", example: "Пожалуйста, передайте мне книгу. - Iltimos, kitobni uzatib yuboring." },
  { word: "улучшить", ipa: "[u-luch-shit']", def: "To improve or make better", uz: "yaxshilamoq", cefr: "B1", example: "Я хочу улучшить свой русский язык. - Men rus tilimni yaxshilamoqchiman." },
  { word: "общение", ipa: "[ob-shche-ni-ye]", def: "Communication or conversation", uz: "muloqot, suhbat", cefr: "B2", example: "Общение с носителями языка помогает. - Til egalari bilan muloqot yordam beradi." },
  { word: "результат", ipa: "[re-zul'-tat]", def: "Result or outcome", uz: "natija", cefr: "B1", example: "Отличный результат экзамена. - Imtihonning ajoyib natijasi." },
  { word: "внимание", ipa: "[vni-ma-ni-ye]", def: "Attention or care", uz: "e'tibor", cefr: "B1", example: "Обратите внимание на это правило. - Bu qoidaga e'tibor bering." },
  { word: "достижение", ipa: "[do-sti-zhe-ni-ye]", def: "Achievement or accomplishment", uz: "yutuq, muvaffaqiyat", cefr: "B2", example: "Это большое достижение для нас. - Bu biz uchun katta yutuq." },
  { word: "понимание", ipa: "[po-ni-ma-ni-ye]", def: "Understanding or comprehension", uz: "tushunish", cefr: "B2", example: "Взаимное понимание очень важно. - O'zaro tushunish juda muhim." },
  { word: "стараться", ipa: "[sta-rat'-sya]", def: "To try hard or endeavor", uz: "harakat qilmoq", cefr: "B1", example: "Я буду стараться говорить правильно. - Men to'g'ri gapirishga harakat qilaman." },
];

const WORDS_JP: Word[] = [
  { word: "食べる (taberu)", ipa: "[ta-be-ru]", def: "To eat food", uz: "yemoq", cefr: "N5", example: "りんごを食べる (Ringo o taberu) - Olma yemoq." },
  { word: "読む (yomu)", ipa: "[yo-mu]", def: "To read a book or text", uz: "o'qimoq", cefr: "N5", example: "本を読む (Hon o yomu) - Kitob o'qimoq." },
  { word: "話す (hanasu)", ipa: "[ha-na-su]", def: "To speak or talk", uz: "gapirmoq", cefr: "N5", example: "日本語を話す (Nihongo o hanasu) - Yaponcha gapirmoq." },
  { word: "先生 (sensei)", ipa: "[sen-sei]", def: "Teacher or instructor", uz: "o'qituvchi", cefr: "N5", example: "日本語の先生 (Nihongo no sensei) - Yapon tili o'qituvchisi." },
  { word: "友達 (tomodachi)", ipa: "[to-mo-da-chi]", def: "Friend or companion", uz: "do'st", cefr: "N5", example: "良い友達 (Yoi tomodachi) - Yaxshi do'st." },
  { word: "時間 (jikan)", ipa: "[ji-kan]", def: "Time or hour", uz: "vaqt", cefr: "N5", example: "時間がありますか (Jikan ga arimasu ka) - Vaqtingiz bormi?" },
  { word: "感謝 (kansha)", ipa: "[kan-sha]", def: "Gratitude or appreciation", uz: "minnatdorchilik", cefr: "N3", example: "先生への感謝 (Sensei e no kansha) - O'qituvchiga minnatdorchilik." },
  { word: "改善 (kaizen)", ipa: "[kai-zen]", def: "Continuous improvement", uz: "yaxshilash, islohot", cefr: "N3", example: "業務の改善 (Gyoumu no kaizen) - Ish faoliyatini yaxshilash." },
  { word: "一生懸命 (isshoukenmei)", ipa: "[is-shou-ken-mei]", def: "With utmost effort; as hard as one can", uz: "bor kuch bilan, astoydil", cefr: "N3", example: "一生懸命勉強する (Isshoukenmei benkyou suru) - Astoydil o'qimoq." },
  { word: "興味 (kyoumi)", ipa: "[kyou-mi]", def: "Interest in something", uz: "qiziqish", cefr: "N4", example: "日本文化に興味がある (Nihon bunka ni kyoumi ga aru) - Yapon madaniyatiga qiziqish bor." },
];

const WORDS_KR: Word[] = [
  { word: "안녕하세요 (annyeonghaseyo)", ipa: "[an-nyeong-ha-se-yo]", def: "Hello (polite)", uz: "assalomu alaykum / salom", cefr: "Level 1", example: "선생님, 안녕하세요! - O'qituvchi, assalomu alaykum!" },
  { word: "감사합니다 (gamsahabnida)", ipa: "[gam-sa-hab-ni-da]", def: "Thank you", uz: "rahmat", cefr: "Level 1", example: "도와주셔서 감사합니다. - Yordamingiz uchun rahmat." },
  { word: "친구 (chingu)", ipa: "[chin-gu]", def: "Friend", uz: "do'st", cefr: "Level 1", example: "좋은 친구를 만났어요. - Yaxshi do'stni uchratdim." },
  { word: "공부하다 (gongbuhada)", ipa: "[gong-bu-ha-da]", def: "To study", uz: "o'qimoq, tahsil olmoq", cefr: "Level 1", example: "한국어를 열심히 공부해요. - Koreys tilini astoydil 공부해요." },
  { word: "말하기 (malhagi)", ipa: "[mal-ha-gi]", def: "Speaking or talking", uz: "gapirish", cefr: "Level 2", example: "한국어 말하기 연습. - Koreyscha gapirish mashqi." },
  { word: "노력하다 (noryeokhada)", ipa: "[no-ryeok-ha-da]", def: "To make an effort; try hard", uz: "harakat qilmoq, tirishmoq", cefr: "Level 3", example: "성공하기 위해 노력합니다. - Muvaffaqiyat qozonish uchun harakat qilaman." },
  { word: "성공 (seonggong)", ipa: "[seong-gong]", def: "Success", uz: "muvaffaqiyat, g'alaba", cefr: "Level 3", example: "결국 성공을 이루었습니다. - Yakunda muvaffaqiyatga erishdim." },
  { word: "어렵다 (eoryeopda)", ipa: "[eo-ryeop-da]", def: "To be difficult", uz: "qiyin bo'lmoq", cefr: "Level 2", example: "시험이 조금 어려웠어요. - Imtihon biroz qiyin bo'ldi." },
  { word: "쉽다 (swipda)", ipa: "[swip-da]", def: "To be easy", uz: "oson bo'lmoq", cefr: "Level 2", example: "이 문제는 아주 쉬워요. - Bu savol juda oson." },
  { word: "이해하다 (ihaehada)", ipa: "[i-hae-ha-da]", def: "To understand", uz: "tushunmoq", cefr: "Level 2", example: "선생님 말씀을 다 이해해요. - O'qituvchining gaplarini to'liq tushunaman." },
];

const WORDS_CN: Word[] = [
  { word: "你好 (nǐ hǎo)", ipa: "[ni hao]", def: "Hello", uz: "salom", cefr: "HSK 1", example: "老师，您好！ - O'qituvchi, salom!" },
  { word: "谢谢 (xièxie)", ipa: "[shye shye]", def: "Thank you", uz: "rahmat", cefr: "HSK 1", example: "非常谢谢你的帮助。 - Yordamingiz uchun juda katta rahmat." },
  { word: "学习 (xuéxí)", ipa: "[shwe xi]", def: "To study; to learn", uz: "o'qimoq, o'rganmoq", cefr: "HSK 1", example: "我喜欢学习中文。 - Men xitoy tilini o'rganishni yaxshi ko'raman." },
  { word: "老师 (lǎoshī)", ipa: "[lao shi]", def: "Teacher", uz: "o'qituvchi", cefr: "HSK 1", example: "中文老师很热情。 - Xitoy tili o'qituvchisi juda g'ayratli." },
  { word: "朋友 (péngyou)", ipa: "[peng yo]", def: "Friend", uz: "do'st", cefr: "HSK 1", example: "他是我的好朋友。 - U mening yaxshi do'stim." },
  { word: "努力 (nǔlì)", ipa: "[nu li]", def: "Hardworking; put effort", uz: "tirishqoq, astoydil harakat qilmoq", cefr: "HSK 2", example: "努力学习，天天向上。 - Astoydil o'qing, har kuni yuksalib boring." },
  { word: "成功 (chénggōng)", ipa: "[cheng gong]", def: "To succeed; success", uz: "muvaffaqiyat, muvaffaqiyat qozonmoq", cefr: "HSK 3", example: "祝你考试成功！ - Imtihonda muvaffaqiyat tilayman!" },
  { word: "水平 (shuǐpíng)", ipa: "[shwei ping]", def: "Level; proficiency standard", uz: "daraja, saviya", cefr: "HSK 3", example: "提高汉语水平。 - Xitoy tili darajasini oshirish." },
  { word: "简单 (jiǎndān)", ipa: "[jyan dan]", def: "Simple; easy", uz: "oddiy, oson", cefr: "HSK 3", example: "这道题非常简单。 - Bu savol juda oddiy." },
  { word: "重要 (zhòngyào)", ipa: "[zhong yao]", def: "Important; significant", uz: "muhim", cefr: "HSK 2", example: "健康是最重要的。 - Sog'lik eng muhimidir." },
];

const WORDS_DE: Word[] = [
  { word: "Hallo", ipa: "[ha-lo]", def: "Hello", uz: "Salom", cefr: "A1", example: "Hallo, wie geht es dir? - Salom, qalaysan?" },
  { word: "Danke", ipa: "[dan-ke]", def: "Thank you", uz: "Rahmat", cefr: "A1", example: "Vielen Dank für Ihre Hilfe. - Yordamingiz uchun katta rahmat." },
  { word: "Bitte", ipa: "[bi-te]", def: "Please; you're welcome", uz: "Iltimos; arziydi", cefr: "A1", example: "Eine Tasse Kaffee, bitte. - Bir finjon qahva, iltimos." },
  { word: "verbessern", ipa: "[fer-bes-sern]", def: "To improve", uz: "yaxshilamoq", cefr: "B1", example: "Ich möchte mein Deutsch verbessern. - Men nemis tilimni yaxshilamoqchiman." },
  { word: "Kommunikation", ipa: "[ko-mu-ni-ka-tsi-on]", def: "Communication", uz: "muloqot", cefr: "B2", example: "Gute Kommunikation ist wichtig. - Yaxshi muloqot muhimdir." },
  { word: "Ergebnis", ipa: "[er-geb-nis]", def: "Result", uz: "natija", cefr: "B1", example: "Das Ergebnis der Prüfung ist gut. - Imtihon natijasi yaxshi." },
  { word: "Erfolg", ipa: "[er-folg]", def: "Success", uz: "muvaffaqiyat", cefr: "B1", example: "Ich wünsche dir viel Erfolg. - Senga katta muvaffaqiyat tilayman." },
  { word: "Wissen", ipa: "[vis-sen]", def: "Knowledge", uz: "bilim", cefr: "B1", example: "Wissen ist Macht. - Bilim bu kuchdir." },
];

type SRS = { ease: number; interval: number; due: number; reps: number };

// useStoredJSON uchun barqaror fallback identifikatorlari.
const EMPTY_SRS: Record<string, SRS> = {};
const EMPTY_WORDS: Word[] = [];
const DAY = 86400000;

export default function VocabularyPage() {
  // SRS va o'z so'zlari to'g'ridan-to'g'ri localStorage'dan o'qiladi: jonli,
  // tablar aro sinxron va birinchi kadrdayoq to'g'ri (ilgari mount effektida
  // yuklanardi va bir zum bo'sh ro'yxat ko'rinardi).
  const srs = useStoredJSON<Record<string, SRS>>("ielts_vocab_srs", EMPTY_SRS);
  const [currentLang] = usePracticeLanguage();
  const [tab, setTab] = useState<"browse" | "review" | "quiz">("browse");
  const [deck, setDeck] = useState<"all" | "Common" | "Easy" | "Medium" | "Hard">("all");
  const [playing, setPlaying] = useState<string | null>(null);
  const customWords = useStoredJSON<Word[]>("ielts_vocab_custom", EMPTY_WORDS);
  const [showAdd, setShowAdd] = useState(false);
  const [newWord, setNewWord] = useState({ word: "", def: "", uz: "" });

  // Flashcards Review state
  const [queue, setQueue] = useState<Word[]>([]);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);

  // Quiz state
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizQuestions, setQuizQuestions] = useState<{ word: Word; options: string[]; correctIdx: number }[]>([]);
  const [selectedAns, setSelectedAns] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);


  const save = (next: Record<string, SRS>) => writeJSON("ielts_vocab_srs", next);

  const addCustomWord = () => {
    const w = newWord.word.trim();
    if (!w) return;
    const entry: Word = { word: w, ipa: "", def: newWord.def.trim() || "(o'z izohingiz)", uz: newWord.uz.trim(), cefr: "Hard", example: "" };
    const next = [entry, ...customWords.filter((x) => x.word.toLowerCase() !== w.toLowerCase())];
    writeJSON("ielts_vocab_custom", next);
    setNewWord({ word: "", def: "", uz: "" });
    setShowAdd(false);
  };

  const removeCustomWord = (word: string) => {
    const next = customWords.filter((x) => x.word !== word);
    writeJSON("ielts_vocab_custom", next);
  };

  const getActiveWords = () => {
    if (currentLang === "japanese") return WORDS_JP;
    if (currentLang === "korean") return WORDS_KR;
    if (currentLang === "russian") return WORDS_RU;
    if (currentLang === "chinese") return WORDS_CN;
    if (currentLang === "german") return WORDS_DE;
    return WORDS_EN;
  };
  const activeWordList = getActiveWords();

  const allWords = [...customWords, ...activeWordList].map(w => {
    // CEFR mapping to Magoosh Decks
    let computedCefr = w.cefr;
    if (w.cefr === "B1") computedCefr = "Common";
    else if (w.cefr === "B2") computedCefr = "Easy";
    else if (w.cefr === "C1") computedCefr = "Medium";
    else computedCefr = "Hard";
    return { ...w, cefr: computedCefr };
  });

  // Vaqt faqat klientda o'qiladi (hydration mismatch'ning oldini oladi).
  // Mount bo'lgunga qadar hech qaysi so'z "due" hisoblanmaydi.
  const now = useClientNow();
  const dueWords = now === null ? [] : allWords.filter((w) => !srs[w.word] || srs[w.word].due <= now);
  const learnedCount = Object.values(srs).filter((s) => s.interval >= 1).length;

  const speak = async (text: string) => {
    if (playing) return;
    try {
      setPlaying(text);
      const res = await aiFetch("/api/speaking/synth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, gender: "female" }) });
      if (!res.ok) throw new Error();
      const audio = new Audio(URL.createObjectURL(await res.blob()));
      audio.onended = () => setPlaying(null);
      await audio.play();
    } catch { setPlaying(null); }
  };

  const startReview = () => {
    const pool = deck === "all" ? dueWords : dueWords.filter(w => w.cefr === deck);
    setQueue(pool.length ? pool : allWords.slice(0, 10));
    setIdx(0); setRevealed(false); setTab("review");
  };

  const rate = (q: 0 | 1 | 2 | 3) => {
    const w = queue[idx];
    // Handler ichida haqiqiy joriy vaqt ishlatiladi (render snapshot emas).
    // Bu render paytida emas, faqat tugma bosilganda chaqiriladi.
    // eslint-disable-next-line react-hooks/purity
    const ts = Date.now();
    const prev = srs[w.word] || { ease: 2.5, interval: 0, due: ts, reps: 0 };
    let { ease, interval, reps } = prev;
    if (q === 0) { interval = 0; ease = Math.max(1.3, ease - 0.2); reps = 0; }
    else if (q === 1) { interval = Math.max(1, interval * 1.2); ease = Math.max(1.3, ease - 0.15); reps++; }
    else if (q === 2) { interval = reps === 0 ? 1 : interval * ease; reps++; }
    else { interval = (reps === 0 ? 1 : interval * ease) * 1.3; ease = ease + 0.1; reps++; }
    const due = ts + (interval === 0 ? 60000 : interval * DAY);
    save({ ...srs, [w.word]: { ease, interval, due, reps } });

    if (idx + 1 < queue.length) { setIdx(idx + 1); setRevealed(false); }
    else { setTab("browse"); }
  };

  // Start Interactive Magoosh Quiz
  const startQuiz = () => {
    const activeDeckWords = deck === "all" ? allWords : allWords.filter(w => w.cefr === deck);
    if (activeDeckWords.length < 4) {
      alert("Savollar yaratish uchun eng kamida 4 ta so'z bo'lishi kerak.");
      return;
    }
    const questions = activeDeckWords.slice(0, 10).map((word) => {
      const otherWords = allWords.filter(w => w.word !== word.word);
      // Pick 3 random distractors
      const shuffledOthers = [...otherWords].sort(() => 0.5 - Math.random());
      const distractors = shuffledOthers.slice(0, 3).map(w => w.uz);
      const options = [...distractors, word.uz].sort(() => 0.5 - Math.random());
      const correctIdx = options.indexOf(word.uz);
      return { word, options, correctIdx };
    });

    setQuizQuestions(questions);
    setQuizIndex(0);
    setSelectedAns(null);
    setQuizScore(0);
    setQuizFinished(false);
    setTab("quiz");
  };

  const handleAnswerClick = (optIdx: number) => {
    if (selectedAns !== null) return;
    setSelectedAns(optIdx);
    if (optIdx === quizQuestions[quizIndex].correctIdx) {
      setQuizScore(prev => prev + 1);
    }
  };

  const handleNextQuizQuestion = () => {
    setSelectedAns(null);
    if (quizIndex + 1 < quizQuestions.length) {
      setQuizIndex(prev => prev + 1);
    } else {
      setQuizFinished(true);
      const score = quizScore * 10;
      const currentXp = parseInt(localStorage.getItem("ielts_vocab_xp") || "0");
      localStorage.setItem("ielts_vocab_xp", (currentXp + score).toString());
    }
  };

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#050505] text-zinc-900 dark:text-zinc-100 font-sans selection:bg-amber-500/30">
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <motion.div animate={{ x: [0, 30, 0], y: [0, -30, 0] }} transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }} className="absolute top-0 right-0 w-[40vw] h-[40vw] bg-amber-500/5 rounded-full blur-[100px]" />
        <motion.div animate={{ x: [0, -30, 0], y: [0, 30, 0] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-cyan-500/5 rounded-full blur-[100px]" />
      </div>

      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#050505]/80 backdrop-blur-xl border-b border-zinc-200 dark:border-white/5 py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-xl font-black text-black dark:text-white">kmb<span className="text-amber-500">.education</span></span>
          </Link>
          <div className="font-bold text-sm tracking-widest uppercase text-amber-500">Vocabulary Pro</div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 py-8">
        {tab === "browse" ? (
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
             <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-3xl p-6 shadow-sm">
                <div className="text-3xl font-black text-black dark:text-white">{allWords.length}</div>
                <div className="text-xs uppercase tracking-wider text-zinc-500 mt-1">Jami so'z</div>
              </div>
              <div className="bg-amber-500/10 backdrop-blur-xl border border-amber-500/20 rounded-3xl p-6 shadow-sm">
                <div className="text-3xl font-black text-amber-500">{dueWords.length}</div>
                <div className="text-xs uppercase tracking-wider text-zinc-500 mt-1">Takror (SRS)</div>
              </div>
              <div className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-3xl p-6 shadow-sm">
                <div className="text-3xl font-black text-emerald-500">{learnedCount}</div>
                <div className="text-xs uppercase tracking-wider text-zinc-500 mt-1">O'rganildi</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {["all", "Common", "Easy", "Medium", "Hard"].map((d) => (
                <button key={d} onClick={() => setDeck(d as any)} className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${deck === d ? "bg-amber-500 text-white border-amber-500" : "bg-white/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10"}`}>{d}</button>
              ))}
              <div className="flex-1" />
              <button onClick={() => setShowAdd(!showAdd)} className="bg-zinc-900 text-white px-4 py-2 rounded-xl text-xs font-bold">+ So'z</button>
              <button onClick={startQuiz} className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-4 py-2 rounded-xl text-xs font-bold">🎮 Quiz</button>
              <button onClick={startReview} className="bg-amber-500 text-white px-4 py-2 rounded-xl text-xs font-bold">🎴 Flashcards</button>
              <Link href="/test/pronunciation" className="bg-pink-500/10 text-pink-500 border border-pink-500/20 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">🎙️ Talaffuz</Link>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {allWords.filter(w => deck === "all" || w.cefr === deck).map((w) => (
                <motion.div variants={itemVariants} key={w.word} className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl border border-zinc-200 dark:border-white/5 p-6 rounded-3xl">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-lg">{w.word}</h3>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-black/5 dark:bg-white/5 rounded-lg">{w.cefr}</span>
                  </div>
                  <p className="text-sm text-zinc-500 mt-2">{w.def}</p>
                  <p className="text-sm font-bold text-amber-500 mt-1">{w.uz}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : tab === "review" ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-xl mx-auto h-[600px] flex flex-col">
            <button onClick={() => setTab("browse")} className="mb-6 text-sm font-bold">← Orqaga</button>
            <div className="relative flex-1 perspective-1000" style={{ perspective: "1000px" }}>
              <motion.div className="w-full h-full preserve-3d" animate={{ rotateY: revealed ? 180 : 0 }} transition={{ type: "spring", stiffness: 200, damping: 20 }} onClick={() => setRevealed(!revealed)}>
                <div className="absolute w-full h-full backface-hidden glass-card p-12 flex flex-col items-center justify-center rounded-[2rem] border border-white/10">
                  <span className="text-5xl font-black">{queue[idx].word}</span>
                </div>
                <div className="absolute w-full h-full backface-hidden glass-card p-12 flex flex-col justify-center rounded-[2rem] rotate-180 border border-white/10">
                  <p className="text-2xl font-bold mb-4">{queue[idx].def}</p>
                  <p className="text-xl text-amber-500 font-black">{queue[idx].uz}</p>
                </div>
              </motion.div>
            </div>
            <div className="grid grid-cols-4 gap-3 mt-8">
              {[0, 1, 2, 3].map(q => <button key={q} onClick={(e) => { e.stopPropagation(); rate(q as any); }} className="py-4 bg-white/10 hover:bg-white/20 rounded-2xl font-bold text-xs">Rate {q}</button>)}
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto mt-4">
            <div className="flex items-center justify-between mb-8 px-2">
              <button onClick={() => setTab("browse")} className="text-zinc-500 hover:text-black dark:hover:text-white text-sm font-bold transition-colors">← Orqaga</button>
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold text-amber-500">Magoosh Quiz</span>
                <span className="text-xs text-zinc-500 font-mono bg-zinc-200 dark:bg-zinc-900 px-3 py-1 rounded-full">Savol: {quizIndex + 1} / {quizQuestions.length}</span>
              </div>
            </div>

            {!quizFinished ? (
              quizQuestions[quizIndex] && (
                <div className="glass-card hover-3d-lift rounded-[2rem] p-8 md:p-12 space-y-8 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-zinc-100 dark:bg-zinc-900">
                    <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${((quizIndex + 1) / quizQuestions.length) * 100}%` }}></div>
                  </div>

                  <div className="text-center space-y-4 pt-4">
                    <span className="text-xs font-black tracking-widest text-zinc-400 dark:text-zinc-500 uppercase font-mono">To'g'ri tarjimani toping:</span>
                    <div className="flex items-center justify-center gap-4">
                      <h2 className="text-4xl md:text-5xl font-black text-black dark:text-white">{quizQuestions[quizIndex].word.word}</h2>
                      <button onClick={() => speak(quizQuestions[quizIndex].word.word)} className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 flex items-center justify-center text-xl transition-colors">🔊</button>
                    </div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 italic">"{quizQuestions[quizIndex].word.def}"</p>
                  </div>

                  <div className="grid gap-3">
                    {quizQuestions[quizIndex].options.map((opt, oIdx) => {
                      const isSelected = selectedAns === oIdx;
                      const isCorrect = oIdx === quizQuestions[quizIndex].correctIdx;
                      let btnStyle = "bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-white/5 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-amber-500/30";
                      if (selectedAns !== null) {
                        if (isCorrect) btnStyle = "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold shadow-[0_0_15px_rgba(16,185,129,0.2)]";
                        else if (isSelected) btnStyle = "bg-red-50 dark:bg-red-500/10 border-red-500 text-red-600 dark:text-red-400 font-bold";
                        else btnStyle = "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-600 opacity-50";
                      }

                      return (
                        <button
                          key={oIdx}
                          disabled={selectedAns !== null}
                          onClick={() => handleAnswerClick(oIdx)}
                          className={`w-full p-4 rounded-xl text-left border text-xs transition-all flex items-center justify-between ${btnStyle}`}
                        >
                          <span>{opt}</span>
                          {selectedAns !== null && isCorrect && <span className="text-emerald-400">✓</span>}
                          {selectedAns !== null && isSelected && !isCorrect && <span className="text-red-400">✕</span>}
                        </button>
                      );
                    })}
                  </div>

                  {selectedAns !== null && (
                    <button
                      onClick={handleNextQuizQuestion}
                      className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-widest rounded-xl transition-all"
                    >
                      {quizIndex + 1 < quizQuestions.length ? "Keyingi savol →" : "Natijani ko'rish 📊"}
                    </button>
                  )}
                </div>
              )
            ) : (
              <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-8 text-center space-y-6 shadow-xl">
                <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center text-3xl mx-auto">🏆</div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Magoosh Quiz Tamomlandi!</h3>
                  <p className="text-sm text-zinc-400">
                    Siz 10 ta savoldan <span className="text-amber-500 font-black">{quizScore}</span> tasiga to'g'ri javob berdingiz.
                  </p>
                  <p className="text-xs text-emerald-400 font-semibold">
                    +{quizScore * 10} XP ballari hisobingizga qo'shildi!
                  </p>
                </div>
                <button onClick={() => setTab("browse")} className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-bold text-xs rounded-xl transition-all">
                  Yopish (Orqaga qaytish)
                </button>
              </div>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
}
