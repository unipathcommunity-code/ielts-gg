/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useTargetLevel } from "@/lib/usePrepPlan";
import { useHydrated } from "@/lib/clientStore";
import { aiFetch } from "@/lib/apiClient";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useDisplaySettings, DisplaySettings } from "@/components/DisplaySettings";
import { usePracticeLanguage } from "@/lib/usePracticeLanguage";
import { useTrack } from "@/lib/useTrack";
import { trackScore } from "@/lib/tracks";
import { appendTestHistory } from "@/lib/useTestHistory";
import { getExamFormat } from "@/lib/examFormats";
import { Difficulty, DIFFICULTY_LABELS, DIFFICULTIES } from "@/lib/difficulty";
import { AudioVisualizer } from "@/components/AudioVisualizer";

// ─── Data ───────────────────────────────────────────────────────────────────

const PART1_TOPICS = [
  { name: "Hometown & Home", questions: [
    "Where are you from, and what do you like most about your hometown?",
    "What kind of home do you live in? Do you prefer houses or apartments?",
    "How long have you lived in your current home?",
    "What would you change about your neighbourhood if you could?",
  ]},
  { name: "Work & Study", questions: [
    "Are you currently working or studying?",
    "What subject are you studying, or what is your job?",
    "Why did you choose this field?",
    "What do you find most challenging about your work or studies?",
  ]},
  { name: "Hobbies & Free Time", questions: [
    "What do you like to do in your free time?",
    "Have your hobbies changed since you were a child?",
    "How much time do you spend on your hobbies each week?",
    "Do you prefer indoor or outdoor activities? Why?",
  ]},
  { name: "Food & Cooking", questions: [
    "What is your favourite food?",
    "Do you enjoy cooking? Why or why not?",
    "How often do you eat out at restaurants?",
    "Has your diet changed much in recent years?",
  ]},
  { name: "Travel & Transport", questions: [
    "How do you usually travel to work or school?",
    "Do you enjoy travelling? Where have you been?",
    "What is your favourite means of transport?",
    "Would you like to live in another country? Why?",
  ]},
  { name: "Technology & Internet", questions: [
    "How often do you use the internet?",
    "What do you mainly use your smartphone for?",
    "Do you think technology has made life better or worse?",
    "Are you good at using new technology?",
  ]},
  { name: "Sports & Exercise", questions: [
    "Do you enjoy playing any sports?",
    "How often do you exercise?",
    "Did you play sports when you were a child?",
    "Do you prefer watching sport or playing it?",
  ]},
  { name: "Music & Entertainment", questions: [
    "What kind of music do you enjoy listening to?",
    "Do you play any musical instruments?",
    "How often do you go to concerts or live events?",
    "Has your taste in music changed over the years?",
  ]},
  { name: "Shopping", questions: [
    "Do you enjoy shopping?",
    "Do you prefer shopping online or in stores? Why?",
    "What was the last thing you bought for yourself?",
    "Are you careful about how much money you spend?",
  ]},
  { name: "Health & Lifestyle", questions: [
    "How do you try to stay healthy?",
    "Do you think people in your country are generally healthy?",
    "Have you changed any of your habits to be healthier?",
    "Is health something you think about regularly?",
  ]},
];

const PART2_CUES = [
  { topic: "A memorable journey or trip you have taken", part3Topic: "Travel and Tourism",
    points: ["Where you went", "Who you travelled with", "What you did there", "Why it was memorable"] },
  { topic: "A person who has had a great influence on your life", part3Topic: "Role Models and Influence",
    points: ["Who this person is", "How long you have known them", "What they have done for you", "Why they have influenced you"] },
  { topic: "A skill you would like to learn", part3Topic: "Education and Skills",
    points: ["What the skill is", "Why you want to learn it", "How you would learn it", "How useful it would be"] },
  { topic: "A book you have recently read and enjoyed", part3Topic: "Reading and Literature",
    points: ["What the book was about", "Why you chose to read it", "What you liked about it", "Whether you would recommend it"] },
  { topic: "A time when you helped someone", part3Topic: "Helping Others and Community",
    points: ["Who you helped", "What you did to help", "Why you decided to help", "How you felt afterwards"] },
  { topic: "A place you would like to visit in the future", part3Topic: "Tourism and Travel",
    points: ["Where you would like to go", "Why you want to visit", "What you would do there", "Who you would go with"] },
  { topic: "An important event in your life", part3Topic: "Life Events and Milestones",
    points: ["What the event was", "When it happened", "Who was involved", "Why it was important to you"] },
  { topic: "A piece of technology you find very useful", part3Topic: "Technology and Society",
    points: ["What it is", "How long you have used it", "How you use it", "Why you find it useful"] },
  { topic: "A film or TV show you enjoyed recently", part3Topic: "Media and Entertainment",
    points: ["What it was about", "Where and when you watched it", "What you liked about it", "Whether you would recommend it"] },
  { topic: "A time when you had to make a difficult decision", part3Topic: "Decision Making and Choices",
    points: ["What the decision was", "Why it was difficult", "How you made the decision", "What the outcome was"] },
  { topic: "A sport or physical activity you enjoy", part3Topic: "Sports and Physical Activity",
    points: ["What the sport or activity is", "How often you do it", "Who you do it with", "Why you enjoy it"] },
  { topic: "A traditional food from your country", part3Topic: "Food Culture and Traditions",
    points: ["What the food is", "How it is made", "When people usually eat it", "Why it is significant"] },
  { topic: "A historic building or place in your country", part3Topic: "History and Cultural Heritage",
    points: ["What it is", "Where it is located", "What you know about its history", "Why it is significant"] },
  { topic: "A subject you enjoyed studying at school", part3Topic: "Education and Learning",
    points: ["What subject it was", "Who taught you", "What you found interesting about it", "How it has been useful"] },
  { topic: "A time you received a gift you really liked", part3Topic: "Gifts and Celebrations",
    points: ["What the gift was", "Who gave it to you", "Why you liked it", "How you use or think about it now"] },
];

// Tagged by topic familiarity/abstractness (Part 1 stays personal/concrete in real IELTS,
// so it only spans easy-medium; Part 2/3 topics can get genuinely abstract).
const PART1_DIFFICULTY: Record<string, Difficulty> = {
  "Hometown & Home": "easy", "Work & Study": "easy", "Hobbies & Free Time": "easy",
  "Food & Cooking": "easy", "Travel & Transport": "medium", "Technology & Internet": "medium",
  "Sports & Exercise": "easy", "Music & Entertainment": "medium", "Shopping": "easy",
  "Health & Lifestyle": "medium",
};

const PART2_DIFFICULTY: Record<string, Difficulty> = {
  "Travel and Tourism": "easy", "Role Models and Influence": "medium", "Education and Skills": "medium",
  "Reading and Literature": "easy", "Helping Others and Community": "medium", "Tourism and Travel": "easy",
  "Life Events and Milestones": "medium", "Technology and Society": "hard", "Media and Entertainment": "easy",
  "Decision Making and Choices": "hard", "Sports and Physical Activity": "easy", "Food Culture and Traditions": "medium",
  "History and Cultural Heritage": "hard", "Education and Learning": "medium", "Gifts and Celebrations": "easy",
};

function pickTopicByDifficulty<T>(arr: T[], diffMap: Record<string, Difficulty>, key: (item: T) => string, difficulty: Difficulty): T {
  const pool = arr.filter((item) => (diffMap[key(item)] || "medium") === difficulty);
  const from = pool.length ? pool : arr;
  return from[Math.floor(Math.random() * from.length)];
}

// ─── Component ──────────────────────────────────────────────────────────────

type Part = 1 | 2 | 3;
type Stage =
  | "intro"
  | "ai_speaking"
  | "user_speaking"
  | "part2_prep"
  | "part2_speaking"
  | "evaluating"
  | "feedback"
  | "thinking";

const renderCyberFace = (stage: string) => {
  const isSpeaking = stage === "speaking";
  const isListening = stage === "listening";
  const isThinking = stage === "thinking";
  
  return (
    <svg className="w-36 h-36 cyber-face-container text-cyan-400 mx-auto" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M25 35 C25 20, 75 20, 75 35 C75 55, 65 80, 50 85 C35 80, 25 55, 25 35 Z" stroke="currentColor" strokeWidth="2.5" className="neon-glow-cyan" />
      <ellipse cx="40" cy="42" rx="3.5" ry="3.5" fill="currentColor" className="avatar-blink text-cyan-400" />
      <ellipse cx="60" cy="42" rx="3.5" ry="3.5" fill="currentColor" className="avatar-blink text-cyan-400" />
      <path d="M50 45 L50 53 L47 56" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path 
        d="M40 65 Q50 65 60 65" 
        stroke="currentColor" 
        strokeWidth="3.5" 
        strokeLinecap="round"
        className={
          isSpeaking 
            ? "avatar-mouth-speaking" 
            : isListening 
              ? "avatar-mouth-listening" 
              : isThinking 
                ? "avatar-mouth-thinking" 
                : "avatar-mouth-idle"
        }
      />
      <path d="M30 30 C35 25, 45 25, 48 28" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
      <path d="M70 30 C65 25, 55 25, 52 28" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
};

const renderRoboTutor = (stage: string) => {
  const isSpeaking = stage === "speaking";
  const isListening = stage === "listening";
  const isThinking = stage === "thinking";
  
  return (
    <svg className="w-36 h-36 text-purple-400 mx-auto" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="25" y="25" width="50" height="42" rx="10" stroke="currentColor" strokeWidth="2.5" className="neon-glow-purple" />
      <rect x="18" y="38" width="7" height="16" rx="3" fill="currentColor" />
      <rect x="75" y="38" width="7" height="16" rx="3" fill="currentColor" />
      <line x1="50" y1="25" x2="50" y2="15" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="50" cy="12" r="4" fill="currentColor" className={isThinking ? "animate-ping" : ""} />
      
      <g className={isThinking ? "robot-eye-thinking-left" : ""}>
        <circle cx="40" cy="45" r="7" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="40" cy="45" r="2.5" fill="currentColor" />
        {isThinking && <line x1="40" y1="38" x2="40" y2="52" stroke="currentColor" strokeWidth="1" />}
      </g>
      <g className={isThinking ? "robot-eye-thinking-right" : ""}>
        <circle cx="60" cy="45" r="7" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="60" cy="45" r="2.5" fill="currentColor" />
        {isThinking && <line x1="60" y1="38" x2="60" y2="52" stroke="currentColor" strokeWidth="1" />}
      </g>
      
      {isSpeaking ? (
        <g className="avatar-mouth-speaking">
          <line x1="38" y1="58" x2="62" y2="58" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <line x1="44" y1="55" x2="56" y2="55" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="44" y1="61" x2="56" y2="61" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </g>
      ) : isListening ? (
        <line x1="38" y1="58" x2="62" y2="58" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="avatar-mouth-listening" />
      ) : isThinking ? (
        <line x1="46" y1="58" x2="54" y2="58" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="avatar-mouth-thinking" />
      ) : (
        <line x1="42" y1="58" x2="58" y2="58" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="avatar-mouth-idle" />
      )}
    </svg>
  );
};

const renderPandaMascot = (stage: string) => {
  const isSpeaking = stage === "speaking";
  const isListening = stage === "listening";
  
  return (
    <svg className="w-36 h-36 text-emerald-455 mx-auto" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="28" cy="28" r="10" fill="currentColor" className={`panda-ear-l ${isSpeaking || isListening ? "panda-ear-l-wiggle" : ""}`} />
      <circle cx="72" cy="28" r="10" fill="currentColor" className={`panda-ear-r ${isSpeaking || isListening ? "panda-ear-r-wiggle" : ""}`} />
      <circle cx="50" cy="52" r="30" stroke="currentColor" strokeWidth="2.5" fill="#0c101d" className="neon-glow-emerald" />
      
      <ellipse cx="40" cy="48" rx="6" ry="8" transform="rotate(-15 40 48)" fill="currentColor" opacity="0.3" />
      <ellipse cx="60" cy="48" rx="6" ry="8" transform="rotate(15 60 48)" fill="currentColor" opacity="0.3" />
      
      <circle cx="40" cy="48" r="3.5" fill="currentColor" className="avatar-blink" />
      <circle cx="60" cy="48" r="3.5" fill="currentColor" className="avatar-blink" />
      <circle cx="39.5" cy="46.5" r="1" fill="#fff" />
      <circle cx="59.5" cy="46.5" r="1" fill="#fff" />
      
      <polygon points="48,56 52,56 50,58" fill="currentColor" />
      
      <path 
        d="M44 63 Q50 63 56 63" 
        stroke="currentColor" 
        strokeWidth="3" 
        strokeLinecap="round"
        className={
          isSpeaking 
            ? "avatar-mouth-speaking" 
            : isListening 
              ? "avatar-mouth-listening" 
              : "avatar-mouth-idle"
        }
      />
    </svg>
  );
};

const renderExaminer = (status: "speaking" | "listening" | "idle" | "thinking") => {
  return (
    <div className="w-48 sm:w-56 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 text-left shadow-2xl flex flex-col items-center p-3 sm:p-4">
      <div className={`relative w-36 h-36 sm:w-40 sm:h-40 rounded-xl overflow-hidden mb-3 border-2 transition-all duration-300 ${
        status === "speaking" ? "border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.35)]" :
        status === "listening" ? "border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.35)] animate-pulse" :
        status === "thinking" ? "border-sky-500 shadow-[0_0_15px_rgba(14,165,233,0.35)]" :
        "border-zinc-800"
      }`}>
        <img
          src="/examiner.jpg"
          alt="IELTS Examiner"
          className="w-full h-full object-cover filter contrast-105"
        />
        <div className="absolute bottom-2 left-2 right-2 flex justify-center">
          <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider text-black flex items-center gap-1 ${
            status === "speaking" ? "bg-amber-500" :
            status === "listening" ? "bg-rose-500 text-white animate-pulse" :
            status === "thinking" ? "bg-sky-500 text-white" :
            "bg-zinc-800 text-zinc-300"
          }`}>
            {status === "speaking" && "🎙️ Speaking"}
            {status === "listening" && "🎧 Listening"}
            {status === "thinking" && "🌀 Analyzing"}
            {status === "idle" && "⏳ Ready"}
          </span>
        </div>
      </div>
      <div className="text-center w-full">
        <h4 className="font-bold text-xs sm:text-sm text-zinc-200">Mr. Arthur Pendelton</h4>
        <p className="text-[9px] sm:text-[10px] text-zinc-500 font-medium">Senior IELTS Examiner (UK)</p>
        <p className="text-[8px] sm:text-[9px] font-mono text-amber-500 font-bold mt-1 uppercase tracking-widest">ID: 849-GB-74</p>
      </div>
    </div>
  );
};

export default function SpeakingTest() {
  const [currentLang] = usePracticeLanguage();
  const { track } = useTrack();
  // SSR-xavfsiz hydration bayrog'i. Ilgari useState(false) + useEffect(setTrue) edi:
  // React 19 da bu effekt ichidagi setState hisoblanadi va birinchi kadr noto'g'ri chiziladi.
  const isClient = useHydrated();
  const targetLevel = useTargetLevel();
  const [unofficialAcknowledged, setUnofficialAcknowledged] = useState(false);


  const [avatarStyle, setAvatarStyle] = useState<"orb" | "face" | "robot" | "animal" | "examiner">("orb");
  const [verbosity, setVerbosity] = useState<"concise" | "normal" | "detailed">("normal");
  const [azureWords, setAzureWords] = useState<{ word: string; score: number; error: string }[]>([]);

  // ── Theme & display settings ──
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const display = useDisplaySettings();
  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("ielts_theme", next);
  };

  // ── Core state ──
  const [stage, setStage] = useState<Stage>("intro");
  const stageRef = useRef<Stage>("intro");
  useEffect(() => { stageRef.current = stage; }, [stage]);

  const [currentPart, setCurrentPart] = useState<Part>(1);
  const [questionIndex, setQuestionIndex] = useState(0); // for parts 1 & 3
  const [part3Questions, setPart3Questions] = useState<string[]>([]);
  const [examinerMode, setExaminerMode] = useState<"fast" | "conversational">("fast");
  const [customVoiceId, setCustomVoiceId] = useState("");
  const [customAzureKey, setCustomAzureKey] = useState("");
  const [customAzureRegion, setCustomAzureRegion] = useState("");

  const loadAzureToken = async () => {
    const savedKey = localStorage.getItem("ielts_custom_azure_key") || "";
    const savedRegion = localStorage.getItem("ielts_custom_azure_region") || "";
    try {
      const res = await fetch("/api/speaking/azure-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: savedKey || undefined, region: savedRegion || undefined })
      });
      if (res.ok) {
        const data = await res.json();
        setAzureConfig(data);
        const savedUseAzure = localStorage.getItem("ielts_use_azure_speech");
        if (savedUseAzure !== "false") setUseAzure(true);
      } else {
        setAzureConfig(null);
        setUseAzure(false);
      }
    } catch (err) {
      setAzureConfig(null);
      setUseAzure(false);
    }
  };

  const [difficulty, setDifficultyState] = useState<Difficulty>("medium");
  const [selectedTopic, setSelectedTopic] = useState(() => pickTopicByDifficulty(PART1_TOPICS, PART1_DIFFICULTY, (t) => t.name, "medium"));
  const [selectedCue, setSelectedCue] = useState(() => pickTopicByDifficulty(PART2_CUES, PART2_DIFFICULTY, (c) => c.part3Topic, "medium"));

  const setDifficulty = (d: Difficulty) => {
    setDifficultyState(d);
    setSelectedTopic(pickTopicByDifficulty(PART1_TOPICS, PART1_DIFFICULTY, (t) => t.name, d));
    setSelectedCue(pickTopicByDifficulty(PART2_CUES, PART2_DIFFICULTY, (c) => c.part3Topic, d));
  };

  // ── Transcripts ──
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [part1Transcripts, setPart1Transcripts] = useState<string[]>([]);
  const [part2Transcript, setPart2Transcript] = useState("");
  const [part3Transcripts, setPart3Transcripts] = useState<string[]>([]);
  const [conversation, setConversation] = useState<{ role: "ai" | "user"; text: string }[]>([]);

  // ── AI text ──
  const [aiText, setAiText] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  // ── Feedback ──
  const [feedback, setFeedback] = useState<any>(null);

  // ── Part 2 timer ──
  const [prepTimeLeft, setPrepTimeLeft] = useState(120); // 2 minutes
  const [speakTimeLeft, setSpeakTimeLeft] = useState(120);
  const prepTimerRef = useRef<any>(null);
  const speakTimerRef = useRef<any>(null);

  // ── Voice settings ──
  const [showSettings, setShowSettings] = useState(false);
  const [useElevenLabs, setUseElevenLabs] = useState(true);
  const [gender, setGender] = useState<"male" | "female">("male");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState("");
  const [rate, setRate] = useState(0.95);
  const [pitch, setPitch] = useState(1.0);
  const [silenceThreshold, setSilenceThreshold] = useState(2.5);
  const silenceThresholdRef = useRef(2.5);
  useEffect(() => { silenceThresholdRef.current = silenceThreshold; }, [silenceThreshold]);

  const silenceTimerRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const submitRef = useRef<any>(null);

  // ── Audio prefetch cache ──
  const audioCacheRef = useRef<Map<string, string>>(new Map());
  const prefetchingRef = useRef<Set<string>>(new Set());
  const part3LoadingPromiseRef = useRef<Promise<string[]> | null>(null);

  // ── Azure Speech States & Refs ──
  const [speechSDK, setSpeechSDK] = useState<any>(null);
  const [azureConfig, setAzureConfig] = useState<{ token: string; region: string } | null>(null);
  const [useAzure, setUseAzure] = useState(false);
  const [azureScores, setAzureScores] = useState<{ pronunciation: number; accuracy: number; fluency: number; completeness: number; prosody: number }[]>([]);
  const azureRecognizerRef = useRef<any>(null);
  const useAzureRef = useRef(false);

  useEffect(() => {
    useAzureRef.current = useAzure && !!speechSDK && !!azureConfig;
  }, [useAzure, speechSDK, azureConfig]);

  // Cleanup active audio/synthesizers on unmount
  useEffect(() => {
    return () => {
      // Nutq sintezi / tanish tizimini to'xtatish. Bu yordamchilar ichida ref o'zgaradi —
      // ataylab: ular React state'i emas, brauzer API'sining jonli holatini boshqaradi.
      // eslint-disable-next-line react-hooks/immutability
      stopAllSpeech();
      if (azureRecognizerRef.current) {
        try { azureRecognizerRef.current.close(); } catch (_) {}
      }
      if (prepTimerRef.current) clearInterval(prepTimerRef.current);
      if (speakTimerRef.current) clearInterval(speakTimerRef.current);
    };
  }, []);

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 4000);
  };

  // ── Load saved settings & Fetch Azure Token ──
  useEffect(() => {
    const saved = localStorage.getItem("ielts_theme");
    // Mount'da saqlangan sozlamalarni localStorage'dan o'qish — tashqi manba bilan
    // sinxronlash. useSyncExternalStore'ga o'tkazish butun ovoz sozlamalari qatlamini
    // qayta yozishni talab qiladi (PROJECT_RULES: jarvis/speaking'ni buzmang).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved === "light" || saved === "dark") setTheme(saved as any);
    const savedSilence = localStorage.getItem("ielts_silence_threshold");
    if (savedSilence) { const v = parseFloat(savedSilence); setSilenceThreshold(v); silenceThresholdRef.current = v; }
    const savedGender = localStorage.getItem("ielts_voice_gender");
    if (savedGender === "male" || savedGender === "female") setGender(savedGender as any);
    const savedRate = localStorage.getItem("ielts_voice_rate");
    if (savedRate) setRate(parseFloat(savedRate));
    const savedPitch = localStorage.getItem("ielts_voice_pitch");
    if (savedPitch) setPitch(parseFloat(savedPitch));
    const savedVoiceName = localStorage.getItem("ielts_voice_name");
    if (savedVoiceName) setSelectedVoiceName(savedVoiceName);
    const savedElevenLabs = localStorage.getItem("ielts_use_eleven_labs");
    if (savedElevenLabs !== null) setUseElevenLabs(savedElevenLabs === "true");
    const savedExaminer = localStorage.getItem("ielts_examiner_mode");
    if (savedExaminer === "fast" || savedExaminer === "conversational") {
      setExaminerMode(savedExaminer as any);
    }
    const savedCustomVoice = localStorage.getItem("ielts_custom_voice_id");
    if (savedCustomVoice) {
      setCustomVoiceId(savedCustomVoice);
    }
    const savedAzureKey = localStorage.getItem("ielts_custom_azure_key");
    const savedAzureRegion = localStorage.getItem("ielts_custom_azure_region");
    if (savedAzureKey) setCustomAzureKey(savedAzureKey);
    if (savedAzureRegion) setCustomAzureRegion(savedAzureRegion);

    const savedAvatar = localStorage.getItem("ielts_avatar_style");
    if (savedAvatar === "orb" || savedAvatar === "face" || savedAvatar === "robot" || savedAvatar === "animal") {
      setAvatarStyle(savedAvatar);
    }
    const savedVerbosity = localStorage.getItem("ielts_verbosity");
    if (savedVerbosity === "concise" || savedVerbosity === "normal" || savedVerbosity === "detailed") {
      setVerbosity(savedVerbosity);
    }

    loadAzureToken();

    // Fetch Azure token
    fetch("/api/speaking/azure-token")
      .then(res => {
        if (res.ok) return res.json();
        throw new Error("Azure Speech not configured");
      })
      .then(data => {
        setAzureConfig(data);
        const savedUseAzure = localStorage.getItem("ielts_use_azure_speech");
        if (savedUseAzure !== "false") {
          setUseAzure(true);
        }
      })
      .catch(() => {
        setUseAzure(false);
      });

    // Dynamically load Azure Speech SDK
    import("microsoft-cognitiveservices-speech-sdk")
      .then(SDK => {
        setSpeechSDK(SDK);
      })
      .catch(err => {
        console.warn("Failed to load Azure Speech SDK:", err);
      });
  }, []);

  // ── Prefetch voice audio helper ──
  const prefetchAudio = async (text: string) => {
    if (!text || !useElevenLabs) return;
    const cleanText = text.trim();
    if (audioCacheRef.current.has(cleanText) || prefetchingRef.current.has(cleanText)) return;
    prefetchingRef.current.add(cleanText);

    try {
      const res = await aiFetch("/api/speaking/synth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          text: cleanText, 
          gender,
          voiceId: customVoiceId || undefined
        }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        audioCacheRef.current.set(cleanText, url);
      }
    } catch (e) {
      console.warn("Background audio prefetch failed for:", cleanText, e);
    } finally {
      prefetchingRef.current.delete(cleanText);
    }
  };

  // Prefetch static test audios
  useEffect(() => {
    if (selectedTopic) {
      const introText = `Good morning. My name is Alex, and I'll be your IELTS examiner today. First, could you tell me your full name please? ... Thank you. Now, I'd like to ask you some questions about ${selectedTopic.name}.`;
      prefetchAudio(introText);
      selectedTopic.questions.forEach(q => {
        prefetchAudio(q);
      });
    }
    prefetchAudio("Thank you. Now, I'm going to give you a topic and I'd like you to talk about it for one to two minutes. Before you talk, you'll have two minutes to think about what you're going to say. You can make notes if you wish. Here is your topic card.");
    prefetchAudio("All right? Remember you have about two minutes for this. Please begin speaking now.");
    prefetchAudio("Thank you. Can I ask you a few more questions related to this topic?");
    prefetchAudio("That's the end of the speaking test. Thank you very much.");
  }, [selectedTopic, gender, useElevenLabs]);

  // ── Init speech recognition & synthesis ──
  useEffect(() => {
    if (typeof window === "undefined") return;
    synthRef.current = window.speechSynthesis;
    const loadVoices = () => {
      if (!synthRef.current) return;
      const v = synthRef.current.getVoices();
      setVoices(v);
      if (!localStorage.getItem("ielts_voice_name")) {
        const dv = v.find(x => x.lang.includes("en-GB") && x.name.toLowerCase().includes("female"))
          || v.find(x => x.lang.includes("en-US") && x.name.toLowerCase().includes("female"))
          || v.find(x => x.lang.includes("en"));
        if (dv) setSelectedVoiceName(dv.name);
      }
    };
    loadVoices();
    if (synthRef.current) synthRef.current.onvoiceschanged = loadVoices;

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SR) {
      recognitionRef.current = new SR();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "en-US";
      recognitionRef.current.onresult = (event: any) => {
        let final = "", interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const t = event.results[i][0].transcript;
          if (event.results[i].isFinal) final += t + " ";
          else interim += t;
        }
        if (final) { setTranscript(prev => prev + final); setInterimTranscript(""); }
        else setInterimTranscript(interim);
        if ((final + interim).trim() && silenceThresholdRef.current > 0 && stageRef.current === "user_speaking") {
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(() => submitRef.current?.(), silenceThresholdRef.current * 1000);
        }
      };
      recognitionRef.current.onend = () => {
        if (stageRef.current === "user_speaking" && !useAzureRef.current) {
          try { recognitionRef.current.start(); } catch (_) {}
        }
      };
      recognitionRef.current.onerror = (e: any) => {
        if (e.error === "not-allowed") {
          showNotice("Mikrofonga ruxsat berilmagan. Brauzer sozlamalarini tekshiring.");
          setStage("intro");
        }
      };
    }
  }, []);

  // ── Keep submitRef up to date ──
  // "Eng so'nggi callback" naqshi — taymer va nutq hodisalari eskirgan
  // handleAnswerSubmit'ni chaqirmasligi uchun.
  useEffect(() => {
    // "Eng so'nggi callback" naqshi: brauzer hodisa ishlovchilari eskirgan closure'ni
    // ushlab qolmasligi uchun jonli funksiya ref'da saqlanadi.
    // eslint-disable-next-line react-hooks/immutability
    submitRef.current = handleAnswerSubmit;
  });

  // ── TTS helpers ──
  const speakBrowser = (text: string, onEnd?: () => void, isTest = false) => {
    if (!synthRef.current) { if (!isTest && onEnd) onEnd(); return; }
    synthRef.current.resume();
    synthRef.current.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    activeUtteranceRef.current = utt;
    const targetLangCode = currentLang === "russian" ? "ru" : "en";
    const v = voices.find(x => x.name === selectedVoiceName)
      || synthRef.current.getVoices().find(x => x.lang.toLowerCase().includes(targetLangCode + "-"))
      || synthRef.current.getVoices().find(x => x.lang.toLowerCase().startsWith(targetLangCode));
    if (v) { utt.voice = v; utt.lang = v.lang; } else utt.lang = currentLang === "russian" ? "ru-RU" : "en-US";
    utt.rate = rate; utt.pitch = pitch;
    if (!isTest) {
      setStage("ai_speaking");
      utt.onend = () => { if (onEnd) onEnd(); };
      utt.onerror = () => { if (onEnd) onEnd(); };
    } else {
      utt.onend = () => { if (onEnd) onEnd(); };
    }
    synthRef.current.speak(utt);
  };

  const stopAllSpeech = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    if (activeAudioRef.current) {
      try {
        activeAudioRef.current.pause();
        activeAudioRef.current.currentTime = 0;
      } catch (_) {}
      activeAudioRef.current = null;
    }
  };

  const speak = async (text: string, onEnd?: () => void, isTest = false) => {
    stopAllSpeech();
    const cleanText = text.trim();

    if (!isTest) setStage("ai_speaking");

    // Check prefetch cache first
    if (useElevenLabs && audioCacheRef.current.has(cleanText)) {
      const cachedUrl = audioCacheRef.current.get(cleanText)!;
      try {
        const audio = new Audio(cachedUrl);
        activeAudioRef.current = audio;
        audio.preservesPitch = false;
        audio.playbackRate = pitch !== 1.0 ? rate * pitch : rate;

        audio.onended = () => {
          activeAudioRef.current = null;
          if (onEnd) onEnd();
        };
        audio.onerror = () => {
          activeAudioRef.current = null;
          speakBrowser(text, onEnd, isTest);
        };
        await audio.play();
        return;
      } catch (e) {
        console.warn("Cached audio playback failed, falling back to fetch:", e);
      }
    }

    if (useElevenLabs) {
      try {
        const res = await aiFetch("/api/speaking/synth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            text: cleanText, 
            gender,
            voiceId: customVoiceId || undefined
          }),
        });
        if (!res.ok) throw new Error("ElevenLabs failed");
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);

        // Save URL in cache
        audioCacheRef.current.set(cleanText, url);

        const audio = new Audio(url);
        activeAudioRef.current = audio;
        audio.preservesPitch = false;
        audio.playbackRate = pitch !== 1.0 ? rate * pitch : rate;

        audio.onended = () => {
          activeAudioRef.current = null;
          if (onEnd) onEnd();
        };
        audio.onerror = () => {
          activeAudioRef.current = null;
          speakBrowser(text, onEnd, isTest);
        };
        await audio.play();
      } catch {
        activeAudioRef.current = null;
        speakBrowser(text, onEnd, isTest);
      }
    } else {
      speakBrowser(text, onEnd, isTest);
    }
  };

  // ── Start mic ──
  const startListening = async () => {
    setTranscript("");
    setInterimTranscript("");
    setStage("user_speaking");

    if (useAzure && speechSDK && azureConfig) {
      try {
        if (azureRecognizerRef.current) {
          try { azureRecognizerRef.current.stopContinuousRecognitionAsync(); } catch (_) {}
        }
        const { token, region } = azureConfig;
        const speechConfig = speechSDK.SpeechConfig.fromAuthorizationToken(token, region);
        speechConfig.speechRecognitionLanguage = "en-US";

        const pronConfig = new speechSDK.PronunciationAssessmentConfig(
          "", // unscripted
          speechSDK.PronunciationAssessmentGradingSystem.HundredPoint,
          speechSDK.PronunciationAssessmentGranularity.Phoneme,
          true
        );

        const audioConfig = speechSDK.AudioConfig.fromDefaultMicrophoneInput();
        const recognizer = new speechSDK.SpeechRecognizer(speechConfig, audioConfig);
        pronConfig.applyTo(recognizer);

        recognizer.recognizing = (s: any, e: any) => {
          setInterimTranscript(e.result.text);
          if (e.result.text.trim() && silenceThresholdRef.current > 0) {
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = setTimeout(() => submitRef.current?.(), silenceThresholdRef.current * 1000);
          }
        };

        recognizer.recognized = (s: any, e: any) => {
          if (e.result.reason === speechSDK.ResultReason.RecognizedSpeech) {
            const text = e.result.text;
            if (text) {
              setTranscript(prev => (prev + " " + text).trim());
              setInterimTranscript("");
              if (silenceThresholdRef.current > 0) {
                if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
                silenceTimerRef.current = setTimeout(() => submitRef.current?.(), silenceThresholdRef.current * 1000);
              }

              const pResult = speechSDK.PronunciationAssessmentResult.fromResult(e.result);
              if (pResult) {
                setAzureScores(prev => [...prev, {
                  pronunciation: pResult.pronunciationScore,
                  accuracy: pResult.accuracyScore,
                  fluency: pResult.fluencyScore,
                  completeness: pResult.completenessScore,
                  prosody: pResult.prosodyScore
                }]);
                if (pResult.words) {
                  const mapped = pResult.words.map((w: any) => ({
                    word: w.word,
                    score: w.accuracyScore,
                    error: w.errorType
                  }));
                  setAzureWords(prev => [...prev, ...mapped]);
                }
              }
            }
          }
        };

        azureRecognizerRef.current = recognizer;
        recognizer.startContinuousRecognitionAsync();
      } catch (err) {
        console.error("Failed to start Azure recognizer:", err);
        try { recognitionRef.current?.start(); } catch (_) {}
      }
    } else {
      try { recognitionRef.current?.start(); } catch (_) {}
    }
  };

  const stopListening = () => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    try { recognitionRef.current?.stop(); } catch (_) {}
    if (azureRecognizerRef.current) {
      try { azureRecognizerRef.current.stopContinuousRecognitionAsync(); } catch (_) {}
      azureRecognizerRef.current = null;
    }
  };

  // ── Part 1: ask question by index ──
  const askPart1Question = (idx: number) => {
    const q = selectedTopic.questions[idx];
    setConversation([{ role: "ai", text: q }]);
    setAiText(q);
    speak(q, () => startListening());

    // Prefetch the next question
    if (idx + 1 < selectedTopic.questions.length) {
      prefetchAudio(selectedTopic.questions[idx + 1]);
    }
  };

  // ── Handle user answer submission ──
  const handleAnswerSubmit = async () => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    stopListening();
    const answer = (transcript + " " + interimTranscript).trim();
    setInterimTranscript("");

    if (!answer) {
      showNotice("Iltimos, biror narsa gapiring.");
      startListening();
      return;
    }

    if (currentPart === 1) {
      const newTranscripts = [...part1Transcripts, answer];
      setPart1Transcripts(newTranscripts);
      const convAfterUser = [...conversation, { role: "user" as const, text: answer }];
      setConversation(convAfterUser);
      setQuestionIndex(newTranscripts.length);

      if (newTranscripts.length < 4) {
        if (examinerMode === "conversational") {
          setStage("thinking");
          setAiText("...");
          try {
            const res = await aiFetch("/api/speaking/chat", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                part: 1,
                conversation: convAfterUser,
                cueTopicName: selectedTopic.name,
                discussion: false,
                examinerMode: "conversational",
                verbosity: verbosity
              }),
            });
            if (!res.ok) throw new Error("API error");
            const data = await res.json();
            const nextQ = data.nextResponse;
            setConversation([...convAfterUser, { role: "ai", text: nextQ }]);
            setAiText(nextQ);
            speak(nextQ, () => startListening());
          } catch (err) {
            console.warn("Failed to get dynamic question, falling back to static:", err);
            const nextQ = selectedTopic.questions[newTranscripts.length];
            setConversation([...convAfterUser, { role: "ai", text: nextQ }]);
            setAiText(nextQ);
            speak(nextQ, () => startListening());
          }
        } else {
          // Play the next pre-cached Part 1 question instantly!
          const nextQ = selectedTopic.questions[newTranscripts.length];
          setConversation([...convAfterUser, { role: "ai", text: nextQ }]);
          setAiText(nextQ);
          speak(nextQ, () => startListening());
        }
      } else {
        // Transition to Part 2
        setCurrentPart(2);
        const bridgeText =
          "Thank you. Now, I'm going to give you a topic and I'd like you to talk about it for one to two minutes. Before you talk, you'll have two minutes to think about what you're going to say. You can make notes if you wish. Here is your topic card.";
        setAiText(bridgeText);
        speak(bridgeText, () => startPart2Prep());
      }
    } else if (currentPart === 3) {
      const newTranscripts = [...part3Transcripts, answer];
      setPart3Transcripts(newTranscripts);
      const convAfterUser = [...conversation, { role: "user" as const, text: answer }];
      setConversation(convAfterUser);
      setQuestionIndex(newTranscripts.length);

      if (newTranscripts.length < 4) {
        if (examinerMode === "conversational") {
          setStage("thinking");
          setAiText("...");
          try {
            const res = await aiFetch("/api/speaking/chat", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                part: 1, // route.ts handles dynamic followups if part === 1
                conversation: convAfterUser,
                cueTopicName: selectedCue.part3Topic,
                discussion: true,
                examinerMode: "conversational",
                verbosity: verbosity
              }),
            });
            if (!res.ok) throw new Error("API error");
            const data = await res.json();
            const nextQ = data.nextResponse;
            setConversation([...convAfterUser, { role: "ai", text: nextQ }]);
            setAiText(nextQ);
            speak(nextQ, () => startListening());
          } catch (err) {
            console.warn("Failed to get dynamic question, falling back to cached:", err);
            const nextQ = part3Questions[newTranscripts.length];
            setConversation([...convAfterUser, { role: "ai", text: nextQ }]);
            setAiText(nextQ);
            speak(nextQ, () => startListening());
          }
        } else {
          // Play the next pre-cached Part 3 question instantly!
          const nextQ = part3Questions[newTranscripts.length];
          setConversation([...convAfterUser, { role: "ai", text: nextQ }]);
          setAiText(nextQ);
          speak(nextQ, () => startListening());
        }
      } else {
        // End of test
        await finishTest([...part1Transcripts], part2Transcript, newTranscripts);
      }
    }
  };

  const generateAndPrefetchPart3 = (p2Topic: string, p3TopicName: string) => {
    part3LoadingPromiseRef.current = new Promise<string[]>(async (resolve) => {
      try {
        const res = await aiFetch("/api/speaking/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ part: 3, cueTopicName: p3TopicName, cueTopic: p2Topic }),
        });
        const data = await res.json();
        const qs: string[] = data.questions || [
          `Do you think ${p3TopicName.toLowerCase()} plays an important role in modern society?`,
          `How has technology changed our approach to ${p3TopicName.toLowerCase()}?`,
          `What do you think governments should do to promote ${p3TopicName.toLowerCase()}?`,
          `Do you believe young people today have different views about ${p3TopicName.toLowerCase()} compared to previous generations?`,
        ];
        
        // Prefetch audio for all 4 questions in the background!
        for (const q of qs) {
          await prefetchAudio(q);
        }
        
        resolve(qs);
      } catch (e) {
        console.warn("Error generating Part 3 questions in background:", e);
        const fallback = [
          `Do you think ${p3TopicName.toLowerCase()} plays an important role in modern society?`,
          `How has technology changed our approach to ${p3TopicName.toLowerCase()}?`,
          `What do governments need to do about ${p3TopicName.toLowerCase()}?`,
          `Do younger generations think differently about ${p3TopicName.toLowerCase()}?`,
        ];
        for (const q of fallback) {
          await prefetchAudio(q);
        }
        resolve(fallback);
      }
    });
  };

  // ── Part 2 prep timer ──
  const startPart2Prep = () => {
    setStage("part2_prep");
    setPrepTimeLeft(120);
    let t = 120;

    // Generate and prefetch Part 3 questions in the background right now!
    generateAndPrefetchPart3(selectedCue.topic, selectedCue.part3Topic);
    
    // Prefetch Begin and End texts during the 2-minute prep time
    prefetchAudio("All right? Remember you have about two minutes for this. Please begin speaking now.");
    prefetchAudio("Thank you. Can I ask you a few more questions related to this topic?");

    prepTimerRef.current = setInterval(() => {
      t--;
      setPrepTimeLeft(t);
      if (t <= 0) {
        clearInterval(prepTimerRef.current);
        startPart2Speaking();
      }
    }, 1000);
  };

  const startPart2Speaking = () => {
    const beginText = "All right? Remember you have about two minutes for this. Please begin speaking now.";
    setAiText(beginText);
    speak(beginText, () => {
      setStage("part2_speaking");
      setSpeakTimeLeft(120);
      setTranscript("");
      setInterimTranscript("");
      try { recognitionRef.current?.start(); } catch (_) {}
      let t = 120;
      speakTimerRef.current = setInterval(() => {
        t--;
        setSpeakTimeLeft(t);
        if (t <= 0) {
          clearInterval(speakTimerRef.current);
          finishPart2Speaking();
        }
      }, 1000);
    });
  };

  const finishPart2Speaking = async () => {
    if (speakTimerRef.current) clearInterval(speakTimerRef.current);
    stopListening();
    const p2 = (transcript + " " + interimTranscript).trim();
    setPart2Transcript(p2);
    const thankText = "Thank you. Can I ask you a few more questions related to this topic?";
    setAiText(thankText);
    setCurrentPart(3);
    setQuestionIndex(0);

    speak(thankText, async () => {
      let qs = part3Questions;
      if (part3LoadingPromiseRef.current) {
        qs = await part3LoadingPromiseRef.current;
      }
      setPart3Questions(qs);
      setConversation([{ role: "ai", text: qs[0] }]);
      setAiText(qs[0]);
      speak(qs[0], () => startListening());
    });
  };

  // ── Final evaluation ──
  const finishTest = async (p1: string[], p2: string, p3: string[]) => {
    stopListening();
    setStage("evaluating");
    const fullTranscript = [
      "PART 1 - Topic: " + selectedTopic.name,
      ...selectedTopic.questions.map((q, i) => `Q: ${q}\nA: ${p1[i] || "(no answer)"}`),
      "\nPART 2 - Cue Card: " + selectedCue.topic,
      p2 || "(no answer)",
      "\nPART 3 - Topic: " + selectedCue.part3Topic,
      ...part3Questions.map((q, i) => `Q: ${q}\nA: ${p3[i] || "(no answer)"}`),
    ].join("\n");

    let azureAverages = null;
    if (azureScores.length > 0) {
      const sum = azureScores.reduce((acc, curr) => ({
        pronunciation: acc.pronunciation + curr.pronunciation,
        accuracy: acc.accuracy + curr.accuracy,
        fluency: acc.fluency + curr.fluency,
        completeness: acc.completeness + curr.completeness,
        prosody: acc.prosody + curr.prosody,
      }), { pronunciation: 0, accuracy: 0, fluency: 0, completeness: 0, prosody: 0 });

      azureAverages = {
        pronunciation: Math.round(sum.pronunciation / azureScores.length),
        accuracy: Math.round(sum.accuracy / azureScores.length),
        fluency: Math.round(sum.fluency / azureScores.length),
        completeness: Math.round(sum.completeness / azureScores.length),
        prosody: Math.round(sum.prosody / azureScores.length),
      };
    }

    try {
      const finalText = "That's the end of the speaking test. Thank you very much.";
      setAiText(finalText);
      speak(finalText);

      const res = await aiFetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "speaking",
          content: fullTranscript,
          prompt: `Full IELTS Speaking Test. Part 1: ${selectedTopic.name}. Part 2 Cue Card: ${selectedCue.topic}. Part 3 Discussion: ${selectedCue.part3Topic}.`,
          azurePronunciationMetrics: azureAverages,
          language: currentLang,
          trackId: track.id,
          targetLevel: targetLevel
        }),
      });
      const result = await res.json();
      setFeedback(result);
      setStage("feedback");

      appendTestHistory({
        id: `speaking_${Date.now()}`,
        type: "speaking",
        date: new Date().toISOString(),
        band: parseFloat(result.overall) || 6.0,
        criteria: result.criteria || {},
        improvements: (result.improvements || []).slice(0, 5),
        language: currentLang,
        trackId: track.id,
      });
    } catch (e: any) {
      showNotice("Xatolik: " + e.message);
    }
  };

  // ── Start test ──
  const startTest = () => {
    if (synthRef.current) { synthRef.current.resume(); synthRef.current.speak(new SpeechSynthesisUtterance("")); }
    setCurrentPart(1);
    setQuestionIndex(0);
    setPart1Transcripts([]);
    setPart2Transcript("");
    setPart3Transcripts([]);
    setConversation([]);
    setFeedback(null);

    const intro = `Good morning. My name is Alex, and I'll be your IELTS examiner today. First, could you tell me your full name please? ... Thank you. Now, I'd like to ask you some questions about ${selectedTopic.name}.`;
    setAiText(intro);
    speak(intro, () => askPart1Question(0));
  };

  // ── Format timer ──
  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  // ── Progress step ──
  const step = currentPart === 1 ? 1 : currentPart === 2 ? 2 : 3;
  const c = theme === "dark";
  const bg = c ? "bg-[#05050d]" : "bg-[#f4f5f8]";
  const text = c ? "text-[#f4f4f5]" : "text-[#18181b]";
  const border = c ? "border-zinc-900" : "border-zinc-200";
  const card = c ? "bg-zinc-950/60 border-zinc-900" : "bg-white border-zinc-200 shadow-sm";
  const muted = c ? "text-zinc-500" : "text-zinc-400";
  const subCard = c ? "bg-zinc-900 border-zinc-950" : "bg-zinc-50 border-zinc-200";

  // Ba'zi imtihonlarda (JLPT, TOPIK, HSK) rasmiy Speaking bo'limi yo'q. Ilgari bu
  // holatda sahifa butunlay bloklanardi — endi ogohlantiramiz, lekin mashq qilishga
  // ruxsat beramiz: og'zaki amaliyot baribir foydali (Writing sahifasidagi bilan bir xil).
  const speakingSection = track.sections.find((sec) => sec.skill === "speaking");
  if (isClient && speakingSection && !speakingSection.official && !unofficialAcknowledged) {
    return (
      <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] flex flex-col items-center justify-center p-6 text-center">
        <div className="text-6xl mb-4">🗣️</div>
        <h1 className="text-2xl font-black mb-2">{track.title} imtihonida rasmiy Speaking bo'limi yo'q</h1>
        <p className="text-zinc-400 max-w-md mb-8 text-sm leading-relaxed">{speakingSection.note}</p>
        <div className="flex gap-3">
          <Link href={`/t/${track.id}`} className="px-6 py-2.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 font-extrabold rounded-xl transition-all text-xs uppercase tracking-wider">
            Yo'nalishga qaytish
          </Link>
          <button onClick={() => setUnofficialAcknowledged(true)} className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded-xl transition-all text-xs uppercase tracking-wider">
            Baribir mashq qilish
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans selection:bg-amber-500/20 selection:text-amber-400 relative transition-colors duration-500 ${bg} ${text}`}>
      
      {/* Notice alert */}
      {notice && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className={`px-4 py-3 rounded-xl border backdrop-blur-md shadow-2xl text-xs font-semibold flex items-center gap-2 ${c ? "bg-zinc-950/80 border-amber-500/30 text-amber-400" : "bg-white/90 border-amber-500/20 text-amber-700"}`}>
            <span className="animate-pulse">🔔</span>{notice}
          </div>
        </div>
      )}

      {/* Cyber Grid Overlay for Examiner screen */}
      {stage !== "intro" && stage !== "feedback" && (
        <div className={`absolute inset-0 bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-[0.08] pointer-events-none -z-10 ${
          c ? "bg-[linear-gradient(to_right,#f59e0b_1px,transparent_1px),linear-gradient(to_bottom,#f59e0b_1px,transparent_1px)]" : "bg-[linear-gradient(to_right,#94a3b8_1px,transparent_1px),linear-gradient(to_bottom,#94a3b8_1px,transparent_1px)]"
        }`} />
      )}

      {/* Header */}
      <header className={`border-b sticky top-0 z-30 backdrop-blur-md transition-colors duration-300 ${c ? "border-zinc-900 bg-[#05050d]/80" : "border-zinc-200 bg-white/80 shadow-sm"}`}>
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link href={`/t/${track.id}`} className={`text-xs font-bold uppercase tracking-widest transition-colors ${c ? "text-zinc-500 hover:text-white" : "text-zinc-400 hover:text-black"}`}>
            ← Exit Test
          </Link>
          <div className="flex items-center gap-4">
            {/* Part progress bubbles */}
            {stage !== "intro" && stage !== "feedback" && (
              <div className="flex items-center gap-2 mr-2">
                {[1,2,3].map(p => (
                  <div key={p} className="flex items-center gap-1">
                    <div className={`w-5 h-5 rounded-full text-[9px] font-black flex items-center justify-center transition-all ${
                      step === p ? "bg-amber-500 text-black shadow-md shadow-amber-500/20 scale-105" :
                      step > p ? "bg-emerald-500 text-white" :
                      c ? "bg-zinc-800 text-zinc-500" : "bg-zinc-200 text-zinc-400"
                    }`}>{step > p ? "✓" : p}</div>
                    {p < 3 && <div className={`w-4 h-0.5 ${step > p ? "bg-emerald-500" : c ? "bg-zinc-850" : "bg-zinc-200"}`} />}
                  </div>
                ))}
              </div>
            )}
            
            <button onClick={toggleTheme} className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${c ? "bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white" : "bg-zinc-150 border-zinc-200 text-zinc-700 hover:text-black shadow-sm"}`}>
              {c ? "☀️ Light" : "🌙 Dark"}
            </button>
            <button onClick={() => {
              if (showSettings) {
                loadAzureToken();
              }
              setShowSettings(s => !s);
            }} className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${c ? "bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white" : "bg-zinc-150 border-zinc-200 text-zinc-700 hover:text-black shadow-sm"}`}>
              ⚙️ Ovoz Sozlash
            </button>
            <DisplaySettings theme={theme} settings={display} />
          </div>
        </div>
      </header>

      {/* Settings Panel */}
      {showSettings && (
        <div className={`border-b px-6 py-5 transition-all duration-300 ${c ? "bg-zinc-950 border-zinc-900 text-white" : "bg-zinc-50 border-zinc-250"}`}>
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-6 gap-6 text-xs">
            <div className="flex flex-col gap-2">
              <label className="font-bold uppercase tracking-wider text-zinc-500">Ovoz turi (Gender)</label>
              <div className="flex gap-1.5">
                {(["male","female"] as const).map(g => (
                  <button key={g} onClick={() => { setGender(g); localStorage.setItem("ielts_voice_gender", g); }}
                    className={`flex-1 py-2 rounded-lg font-bold transition-all border ${gender === g ? "bg-amber-500 text-black border-transparent shadow-sm" : c ? "bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white" : "bg-white border-zinc-200 text-zinc-700 hover:text-black"}`}>
                    {g === "male" ? "👨 Erkak (George)" : "👩 Ayol (Sarah)"}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-bold uppercase tracking-wider text-zinc-500">TTS Engine</label>
              <button onClick={() => { const v = !useElevenLabs; setUseElevenLabs(v); localStorage.setItem("ielts_use_eleven_labs", v.toString()); }}
                className={`w-full py-2 rounded-lg font-bold transition-all border ${useElevenLabs ? "bg-amber-500 text-black border-transparent shadow-sm" : c ? "bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white" : "bg-white border-zinc-200 text-zinc-700 hover:text-black"}`}>
                {useElevenLabs ? "✓ ElevenLabs Premium" : "Browser Default TTS"}
              </button>
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-bold uppercase tracking-wider text-zinc-500">Imtihonchi (Mode)</label>
              <div className="flex gap-1.5">
                {(["fast", "conversational"] as const).map(m => (
                  <button key={m} onClick={() => { setExaminerMode(m); localStorage.setItem("ielts_examiner_mode", m); }}
                    className={`flex-1 py-2 rounded-lg font-bold transition-all border ${examinerMode === m ? "bg-amber-500 text-black border-transparent shadow-sm" : c ? "bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white" : "bg-white border-zinc-200 text-zinc-700 hover:text-black"}`}>
                    {m === "fast" ? "⚡ Ultra-Tez" : "💬 Dinamik"}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-bold uppercase tracking-wider text-zinc-500">Azure Speech (Grading)</label>
              {azureConfig ? (
                <button onClick={() => { const v = !useAzure; setUseAzure(v); localStorage.setItem("ielts_use_azure_speech", v.toString()); }}
                  className={`w-full py-2 rounded-lg font-bold transition-all border ${useAzure ? "bg-amber-500 text-black border-transparent shadow-sm" : c ? "bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white" : "bg-white border-zinc-200 text-zinc-700 hover:text-black"}`}>
                  {useAzure ? "✓ Azure Pronunciation: ON" : "Azure Pronunciation: OFF"}
                </button>
              ) : (
                <div className="p-2.5 bg-zinc-900/10 dark:bg-zinc-900 border border-zinc-800/40 dark:border-zinc-850 text-zinc-500 rounded-lg italic text-[9px] text-center leading-normal">
                  Kalit va regionni quyida kiriting va Ovoz Sozlash tugmasini qayta bosing.
                </div>
              )}
            </div>
            <div className="flex flex-col justify-center gap-1.5">
              <div className="flex justify-between font-bold uppercase tracking-wider text-zinc-500">
                <span>Tezlik (Speed)</span>
                <span className="font-mono text-amber-500">{rate.toFixed(2)}x</span>
              </div>
              <input type="range" min={0.5} max={1.5} step={0.05} value={rate}
                onChange={e => { const v = parseFloat(e.target.value); setRate(v); localStorage.setItem("ielts_voice_rate", v.toString()); }}
                className="w-full accent-amber-500 cursor-pointer" />
            </div>
            <div className="flex flex-col justify-center gap-1.5">
              <div className="flex justify-between font-bold uppercase tracking-wider text-zinc-500">
                <span>VAD Jimlik (Silence)</span>
                <span className="font-mono text-amber-500">{silenceThreshold.toFixed(1)}s</span>
              </div>
              <input type="range" min={1} max={5} step={0.5} value={silenceThreshold}
                onChange={e => { const v = parseFloat(e.target.value); setSilenceThreshold(v); silenceThresholdRef.current = v; localStorage.setItem("ielts_silence_threshold", v.toString()); }}
                className="w-full accent-amber-500 cursor-pointer" />
            </div>
          </div>

          <div className="max-w-5xl mx-auto mt-5 pt-4 border-t border-zinc-900/10 dark:border-zinc-800/40 grid grid-cols-1 md:grid-cols-5 gap-6 text-xs">
            {/* Column 1: ElevenLabs Voice ID */}
            <div className="flex flex-col gap-2">
              <label className="font-bold uppercase tracking-wider text-zinc-500">ElevenLabs Maxsus Ovoz ID</label>
              <input
                type="text"
                placeholder="Standart imtihonchi ovozi"
                value={customVoiceId}
                onChange={e => {
                  setCustomVoiceId(e.target.value);
                  localStorage.setItem("ielts_custom_voice_id", e.target.value);
                }}
                className={`border rounded-lg p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                  c ? "bg-zinc-900 border-zinc-800 text-white placeholder-zinc-650" : "bg-white border-zinc-200 text-zinc-900 placeholder-zinc-400 shadow-sm"
                }`}
              />
            </div>

            {/* Column 2: Azure API Key */}
            <div className="flex flex-col gap-2">
              <label className="font-bold uppercase tracking-wider text-zinc-500">Azure Speech API Key</label>
              <input
                type="password"
                placeholder="Masalan: d0c1b7..."
                value={customAzureKey}
                onChange={e => {
                  setCustomAzureKey(e.target.value);
                  localStorage.setItem("ielts_custom_azure_key", e.target.value);
                }}
                className={`border rounded-lg p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                  c ? "bg-zinc-900 border-zinc-800 text-white placeholder-zinc-650" : "bg-white border-zinc-200 text-zinc-900 placeholder-zinc-400 shadow-sm"
                }`}
              />
            </div>

            {/* Column 3: Azure Region */}
            <div className="flex flex-col gap-2">
              <label className="font-bold uppercase tracking-wider text-zinc-500">Azure Speech Region</label>
              <input
                type="text"
                placeholder="Masalan: eastus"
                value={customAzureRegion}
                onChange={e => {
                  setCustomAzureRegion(e.target.value);
                  localStorage.setItem("ielts_custom_azure_region", e.target.value);
                }}
                className={`border rounded-lg p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                  c ? "bg-zinc-900 border-zinc-800 text-white placeholder-zinc-650" : "bg-white border-zinc-200 text-zinc-900 placeholder-zinc-400 shadow-sm"
                }`}
              />
            </div>

            {/* Column 4: AI Avatar Style */}
            <div className="flex flex-col gap-2">
              <label className="font-bold uppercase tracking-wider text-zinc-500">Muloqot Avatari</label>
              <select
                value={avatarStyle}
                onChange={e => {
                  setAvatarStyle(e.target.value as any);
                  localStorage.setItem("ielts_avatar_style", e.target.value);
                }}
                className={`border rounded-lg p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                  c ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-zinc-200 text-zinc-900 shadow-sm"
                }`}
              >
                <option value="orb">🔮 Liquid Orb</option>
                <option value="face">👤 Cyber Face</option>
                <option value="robot">🤖 RoboTutor</option>
                <option value="animal">🐼 Mascot</option>
                <option value="examiner">👔 British Examiner (Real)</option>
              </select>
            </div>

            {/* Column 5: AI Verbosity */}
            <div className="flex flex-col gap-2">
              <label className="font-bold uppercase tracking-wider text-zinc-500">Gapirish Hajmi</label>
              <select
                value={verbosity}
                onChange={e => {
                  setVerbosity(e.target.value as any);
                  localStorage.setItem("ielts_verbosity", e.target.value);
                }}
                className={`border rounded-lg p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                  c ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-zinc-200 text-zinc-900 shadow-sm"
                }`}
              >
                <option value="concise">Qisqa (Concise)</option>
                <option value="normal">O'rtacha (Normal)</option>
                <option value="detailed">Batafsil (Detailed)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main style={{ zoom: display.fontScale }} className="flex-1 flex flex-col items-center justify-center p-6 max-w-4xl mx-auto w-full">

        {/* ── INTRO STAGE ── */}
        {stage === "intro" && (
          <div className="w-full text-center max-w-2xl animate-in fade-in duration-300">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-xs font-bold uppercase tracking-widest mb-3 border border-amber-500/20">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              {`${track.shortTitle} Speaking`}
            </div>

            {!(track.sections.find((sec) => sec.skill === "speaking")?.official ?? true) && (
              <p className="text-[11px] text-zinc-500 mb-4 max-w-md mx-auto leading-relaxed">
                ℹ️ {track.sections.find((sec) => sec.skill === "speaking")?.note}
              </p>
            )}

            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 leading-tight">AI Speaking Test Examiner</h1>
            
            <p className={`text-base mb-8 max-w-lg mx-auto leading-relaxed ${c ? "text-zinc-400" : "text-zinc-650"}`}>
              Haqiqiy IELTS formati bo'yicha tayyorlaning: Part 1 → Part 2 → Part 3. Sun'iy intellekt imtihonchisi sizning ravonlik, lug'at boyligi, grammatika va talaffuzingizni baholaydi.
            </p>
            
            <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 text-left rounded-2xl p-6 border ${card}`}>
              <div className="flex flex-col justify-between">
                <div>
                  <div className="text-amber-500 font-black text-xs uppercase tracking-wider mb-1">PART 1: Interview</div>
                  <div className={`text-xs ${c ? "text-zinc-400" : "text-zinc-500"} leading-relaxed`}>
                    General questions about: <br/>
                    <span className="font-bold text-foreground">{selectedTopic.name}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col justify-between border-t md:border-t-0 md:border-x border-zinc-900/10 dark:border-zinc-800/60 pt-4 md:pt-0 md:px-4">
                <div>
                  <div className="text-amber-500 font-black text-xs uppercase tracking-wider mb-1">PART 2: Cue Card</div>
                  <div className={`text-xs ${c ? "text-zinc-400" : "text-zinc-500"} leading-relaxed line-clamp-3`}>
                    Speak for 1-2 minutes: <br/>
                    <span className="font-bold text-foreground">"{selectedCue.topic}"</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col justify-between border-t md:border-t-0 pt-4 md:pt-0 md:pl-2">
                <div>
                  <div className="text-amber-500 font-black text-xs uppercase tracking-wider mb-1">PART 3: Discussion</div>
                  <div className={`text-xs ${c ? "text-zinc-400" : "text-zinc-500"} leading-relaxed`}>
                    Deeper discussion about: <br/>
                    <span className="font-bold text-foreground">{selectedCue.part3Topic}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="text-[10px] uppercase tracking-widest text-zinc-500 mr-1">Qiyinlik:</span>
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-colors ${
                    difficulty === d ? "bg-amber-500 border-amber-500 text-black" : "border-zinc-700 text-zinc-400 hover:text-white"
                  }`}
                >
                  {DIFFICULTY_LABELS[d]}
                </button>
              ))}
            </div>

            <button onClick={startTest}
              className="bg-amber-500 hover:bg-amber-400 text-black font-black px-10 py-4 rounded-full text-lg shadow-2xl shadow-amber-500/20 hover:shadow-amber-500/40 transition-all hover:-translate-y-0.5 duration-200">
              🎙️ Imtihonni Boshlash
            </button>
            <p className={`mt-4 text-xs ${c ? "text-zinc-650" : "text-zinc-450"}`}>Mikrofonga ruxsat bering. Test darhol boshlanadi.</p>

            {/* Free Talk option */}
            <div className={`mt-10 pt-8 border-t max-w-lg mx-auto ${c ? "border-zinc-900" : "border-zinc-200"}`}>
              <p className={`text-sm mb-3 ${c ? "text-zinc-400" : "text-zinc-600"}`}>
                Imtihon emas — oddiy suhbatlashmoqchimisiz?
              </p>
              <Link
                href="/jarvis"
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm border transition-all ${
                  c ? "border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10" : "border-cyan-500/50 text-cyan-600 hover:bg-cyan-500/10"
                }`}
              >
                💬 AI Ustoz bilan erkin gaplashish (Free Talk)
              </Link>
            </div>
          </div>
        )}

        {/* ── AI SPEAKING STAGE (EXAMINER TALKING) ── */}
        {stage === "ai_speaking" && (
          <div className="w-full text-center max-w-2xl animate-in fade-in duration-300 flex flex-col items-center">
            
            {/* Glowing 3D Orb (Examiner Mode) */}
            {avatarStyle === "orb" ? (
              <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-full flex items-center justify-center z-10 orb-3d orb-morph-anim orb-3d-glow-amber text-amber-500 border border-amber-500/20 mb-10">
                <div className="absolute inset-4 border border-zinc-500/5 rounded-full animate-[spin_12s_linear_infinite] pointer-events-none" />
                <div className="text-center z-20">
                  <span className="text-4xl drop-shadow-md">👨‍🏫</span>
                  <span className="font-mono text-[9px] uppercase tracking-widest font-black block mt-2 text-amber-400">
                    Examiner
                  </span>
                </div>
              </div>
            ) : avatarStyle === "examiner" ? (
              <div className="mb-10">
                {renderExaminer("speaking")}
              </div>
            ) : (
              <div className="mb-10 w-48 h-48 sm:w-56 sm:h-56 rounded-full flex items-center justify-center border border-amber-500/20 bg-zinc-950/60 shadow-lg relative">
                {avatarStyle === "face" && renderCyberFace("speaking")}
                {avatarStyle === "robot" && renderRoboTutor("speaking")}
                {avatarStyle === "animal" && renderPandaMascot("speaking")}
              </div>
            )}

            <p className="text-[10px] uppercase tracking-widest font-mono font-black mb-4 text-amber-500 animate-pulse">
              🎓 Examiner is speaking...
            </p>
            
            <div className={`rounded-2xl border p-6 text-lg sm:text-xl font-medium leading-relaxed max-w-xl transition-all shadow-md ${card}`}>
              "{aiText}"
            </div>

            {/* Active speaking waves */}
            <div className="flex justify-center gap-1.5 mt-8 h-8 items-center">
              {[...Array(12)].map((_, i) => {
                const heights = ["h-3", "h-6", "h-4", "h-7", "h-2", "h-5", "h-8", "h-3", "h-6", "h-4", "h-7", "h-2"];
                return (
                  <div
                    key={i}
                    className={`w-1 rounded transition-all duration-300 bg-amber-500 ${heights[i]} animate-pulse`}
                    style={{ animationDelay: `${i * 0.05}s`, animationDuration: "0.6s" }}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* ── USER SPEAKING STAGE (CANDIDATE TALKING) ── */}
        {stage === "user_speaking" && (
          <div className="w-full text-center max-w-2xl animate-in fade-in duration-300 flex flex-col items-center">
            
            {/* Glowing 3D Orb (User Recording Mode) */}
            {avatarStyle === "orb" ? (
              <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-full flex items-center justify-center z-10 orb-3d orb-listening-anim orb-3d-glow-rose text-rose-500 border border-rose-500/20 mb-10">
                {/* Dynamic 3D Ripple Rings on recording */}
                <div className="ripple-ring ripple-ring-1 text-rose-500/30"></div>
                <div className="ripple-ring ripple-ring-2 text-rose-500/20"></div>
                <div className="ripple-ring ripple-ring-3 text-rose-500/10"></div>
                
                <div className="text-center z-20 flex flex-col items-center">
                  <AudioVisualizer isRecording={true} />
                  <span className="font-mono text-[9px] uppercase tracking-widest font-black block mt-2 text-rose-400">
                    Recording
                  </span>
                </div>
              </div>
            ) : avatarStyle === "examiner" ? (
              <div className="mb-10 relative">
                {/* Dynamic 3D Ripple Rings on recording */}
                <div className="ripple-ring ripple-ring-1 text-rose-500/30"></div>
                <div className="ripple-ring ripple-ring-2 text-rose-500/20"></div>
                <div className="ripple-ring ripple-ring-3 text-rose-500/10"></div>
                {renderExaminer("listening")}
              </div>
            ) : (
              <div className="mb-10 w-48 h-48 sm:w-56 sm:h-56 rounded-full flex items-center justify-center border border-rose-500/20 bg-zinc-950/60 shadow-lg relative">
                {/* Dynamic 3D Ripple Rings on recording */}
                <div className="ripple-ring ripple-ring-1 text-rose-500/30"></div>
                <div className="ripple-ring ripple-ring-2 text-rose-500/20"></div>
                <div className="ripple-ring ripple-ring-3 text-rose-500/10"></div>
                
                {avatarStyle === "face" && renderCyberFace("listening")}
                {avatarStyle === "robot" && renderRoboTutor("listening")}
                {avatarStyle === "animal" && renderPandaMascot("listening")}
              </div>
            )}

            {currentPart === 1 && (
              <div className="text-[10px] uppercase font-mono font-black tracking-widest mb-2 text-amber-500">
                Part 1 — Question {questionIndex + 1} / 5
              </div>
            )}
            {currentPart === 3 && (
              <div className="text-[10px] uppercase font-mono font-black tracking-widest mb-2 text-amber-500">
                Part 3 — Question {questionIndex + 1} / {part3Questions.length || 4}
              </div>
            )}

            <div className={`rounded-2xl border p-5 text-base font-medium leading-relaxed max-w-xl mb-6 ${card}`}>
              "{aiText}"
            </div>

            {/* Live speech bubble */}
            {(transcript || interimTranscript) && (
              <div className={`rounded-2xl border p-5 text-sm text-left max-w-lg w-full leading-relaxed mb-6 animate-in slide-in-from-bottom-2 duration-300 shadow-lg ${subCard}`}>
                <span className="font-black text-[9px] uppercase tracking-widest text-rose-500 font-mono block mb-2">
                  🎙️ Live Transcript
                </span>
                <p className="font-medium font-mono leading-relaxed text-zinc-800 dark:text-zinc-200">
                  {transcript}
                  <span className={c ? "text-zinc-600" : "text-zinc-400 font-bold"}>{interimTranscript}</span>
                </p>
              </div>
            )}

            <div className="flex gap-4">
              <button onClick={handleAnswerSubmit}
                className="bg-amber-500 hover:bg-amber-400 text-black font-black px-10 py-3.5 rounded-full shadow-lg hover:shadow-amber-500/30 transition-all hover:-translate-y-0.5 duration-200">
                Next / Submit →
              </button>
            </div>
            
            <p className={`mt-4 text-[10px] uppercase tracking-wider font-mono font-black text-rose-500 animate-pulse`}>
              ⏱️ Jimlik sezilsa avtomatik yuboriladi ({silenceThreshold}s)
            </p>
          </div>
        )}

        {/* ── PART 2 PREPARATION STAGE ── */}
        {stage === "part2_prep" && (
          <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-12 gap-8 items-center animate-in fade-in duration-300">
            
            {/* Left side: Cue card details */}
            <div className="md:col-span-7 flex flex-col gap-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 self-start rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold uppercase tracking-widest border border-blue-500/20">
                📋 PART 2 — CUE CARD
              </div>
              
              <div className={`rounded-2xl border p-8 text-left shadow-md ${card}`}>
                <h2 className="font-extrabold text-xl mb-4 text-amber-500">Describe: {selectedCue.topic}</h2>
                <p className={`text-xs uppercase font-bold tracking-wider mb-3 ${c ? "text-zinc-500" : "text-zinc-400"}`}>You should say:</p>
                <ul className="space-y-3">
                  {selectedCue.points.map((pt, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm font-medium">
                      <span className="text-amber-500 font-extrabold mt-0.5">▸</span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-5 text-xs italic text-zinc-550 leading-relaxed">
                  and explain why this experience or entity was important/significant to you.
                </p>
              </div>
            </div>

            {/* Right side: Pulse Core & Prep Timer */}
            <div className="md:col-span-5 flex flex-col items-center justify-center">
              {avatarStyle === "orb" ? (
                <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-full flex flex-col items-center justify-center z-10 orb-3d orb-morph-anim orb-3d-glow-sky border border-sky-500/20 mb-6">
                  <span className="text-[10px] uppercase font-mono font-black text-sky-400 mb-1">Prep Time</span>
                  <span className={`text-4xl font-black font-mono tracking-wider ${prepTimeLeft <= 15 ? "text-red-500 animate-pulse" : "text-sky-400"}`}>
                    {formatTime(prepTimeLeft)}
                  </span>
                </div>
              ) : avatarStyle === "examiner" ? (
                <div className="mb-6 flex flex-col items-center justify-center relative">
                  {renderExaminer("idle")}
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/80 rounded-2xl p-4">
                    <span className="text-[10px] uppercase font-mono font-black text-sky-400 mb-1">Prep Time</span>
                    <span className={`text-3xl font-black font-mono tracking-wider ${prepTimeLeft <= 15 ? "text-red-500 animate-pulse" : "text-sky-400"}`}>
                      {formatTime(prepTimeLeft)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mb-6 w-48 h-48 sm:w-56 sm:h-56 rounded-full flex flex-col items-center justify-center border border-sky-500/20 bg-zinc-950/60 shadow-lg relative">
                  <div className="absolute inset-0 flex items-center justify-center opacity-30">
                    {avatarStyle === "face" && renderCyberFace("idle")}
                    {avatarStyle === "robot" && renderRoboTutor("idle")}
                    {avatarStyle === "animal" && renderPandaMascot("idle")}
                  </div>
                  <div className="text-center z-20 flex flex-col items-center justify-center">
                    <span className="text-[10px] uppercase font-mono font-black text-sky-400 mb-1">Prep Time</span>
                    <span className={`text-4xl font-black font-mono tracking-wider ${prepTimeLeft <= 15 ? "text-red-500 animate-pulse" : "text-sky-400"}`}>
                      {formatTime(prepTimeLeft)}
                    </span>
                  </div>
                </div>
              )}
              
              <p className={`text-xs ${c ? "text-zinc-500" : "text-zinc-400"} text-center mb-4`}>
                Tayyorlanish uchun 2 daqiqa beriladi. Notes yozib olishingiz mumkin.
              </p>
              
              <button onClick={() => { if (prepTimerRef.current) clearInterval(prepTimerRef.current); startPart2Speaking(); }}
                className={`px-6 py-2.5 rounded-full text-xs font-black border transition-all uppercase tracking-wider ${c ? "border-zinc-800 text-zinc-300 hover:border-amber-500 hover:text-amber-500" : "border-zinc-300 text-zinc-600 hover:border-amber-500 hover:text-amber-500"}`}>
                Ready — Start Speaking Early
              </button>
            </div>
          </div>
        )}

        {/* ── PART 2 SPEAKING STAGE ── */}
        {stage === "part2_speaking" && (
          <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-12 gap-8 items-center animate-in fade-in duration-300">
            
            {/* Left side: Cue card points */}
            <div className="md:col-span-7 flex flex-col gap-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 self-start rounded-full bg-red-500/10 text-red-400 text-xs font-bold uppercase tracking-widest border border-red-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                SPEAKING — PART 2
              </div>
              
              <div className={`rounded-2xl border p-6 text-left shadow-sm ${card}`}>
                <h2 className="font-extrabold text-base mb-3 text-amber-500">{selectedCue.topic}</h2>
                <div className="flex flex-col gap-2">
                  {selectedCue.points.map((pt, i) => (
                    <div key={i} className={`text-xs p-3 rounded-lg border leading-relaxed font-semibold ${subCard}`}>
                      <span className="text-amber-500 font-extrabold mr-2">✓</span>{pt}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right side: Recording Core & Speaking Timer */}
            <div className="md:col-span-5 flex flex-col items-center justify-center">
              {avatarStyle === "orb" ? (
                <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-full flex flex-col items-center justify-center z-10 orb-3d orb-listening-anim orb-3d-glow-rose border border-rose-500/20 mb-6">
                  <span className="text-[10px] uppercase font-mono font-black text-rose-400 mb-1">Time Left</span>
                  <span className={`text-4xl font-black font-mono tracking-wider ${speakTimeLeft <= 15 ? "text-red-500 animate-pulse" : "text-rose-400"}`}>
                    {formatTime(speakTimeLeft)}
                  </span>
                </div>
              ) : avatarStyle === "examiner" ? (
                <div className="mb-6 flex flex-col items-center justify-center relative">
                  {/* Dynamic 3D Ripple Rings on recording */}
                  <div className="ripple-ring ripple-ring-1 text-rose-500/30"></div>
                  <div className="ripple-ring ripple-ring-2 text-rose-500/20"></div>
                  <div className="ripple-ring ripple-ring-3 text-rose-500/10"></div>
                  {renderExaminer("listening")}
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/80 rounded-2xl p-4">
                    <span className="text-[10px] uppercase font-mono font-black text-rose-400 mb-1">Time Left</span>
                    <span className={`text-3xl font-black font-mono tracking-wider ${speakTimeLeft <= 15 ? "text-red-500 animate-pulse" : "text-rose-400"}`}>
                      {formatTime(speakTimeLeft)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mb-6 w-48 h-48 sm:w-56 sm:h-56 rounded-full flex flex-col items-center justify-center border border-rose-500/20 bg-zinc-950/60 shadow-lg relative">
                  <div className="absolute inset-0 flex items-center justify-center opacity-30">
                    {avatarStyle === "face" && renderCyberFace("listening")}
                    {avatarStyle === "robot" && renderRoboTutor("listening")}
                    {avatarStyle === "animal" && renderPandaMascot("listening")}
                  </div>
                  <div className="text-center z-20 flex flex-col items-center justify-center">
                    <span className="text-[10px] uppercase font-mono font-black text-rose-400 mb-1">Time Left</span>
                    <span className={`text-4xl font-black font-mono tracking-wider ${speakTimeLeft <= 15 ? "text-red-500 animate-pulse" : "text-rose-400"}`}>
                      {formatTime(speakTimeLeft)}
                    </span>
                  </div>
                </div>
              )}
              
              {(transcript || interimTranscript) && (
                <div className={`rounded-2xl border p-4 text-xs text-left max-w-sm w-full leading-relaxed mb-4 max-h-[120px] overflow-y-auto ${subCard}`}>
                  <span className={`font-bold text-[9px] uppercase tracking-wider ${muted} block mb-1`}>Your speech transcript:</span>
                  <p className="font-mono">{transcript} <span className={c ? "text-zinc-650" : "text-zinc-400 font-bold"}>{interimTranscript}</span></p>
                </div>
              )}

              <button onClick={finishPart2Speaking}
                className="bg-amber-500 hover:bg-amber-400 text-black font-black px-8 py-3 rounded-full shadow-lg transition-all hover:-translate-y-0.5 duration-200">
                Finish Speaking →
              </button>
            </div>
          </div>
        )}

        {/* ── AI EVALUATING STAGE ── */}
        {stage === "evaluating" && (
          <div className="w-full text-center max-w-2xl animate-in fade-in duration-300 flex flex-col items-center">
            
            {/* Glowing 3D Orb (Evaluating Mode) */}
            {avatarStyle === "orb" ? (
              <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-full flex items-center justify-center z-10 orb-3d orb-thinking-anim orb-3d-glow-sky text-sky-500 border border-sky-500/20 mb-10">
                <div className="text-center z-20">
                  <span className="text-4xl animate-spin block">🌀</span>
                  <span className="font-mono text-[9px] uppercase tracking-widest font-black block mt-2 text-sky-400">
                    Grading
                  </span>
                </div>
              </div>
            ) : avatarStyle === "examiner" ? (
              <div className="mb-10">
                {renderExaminer("thinking")}
              </div>
            ) : (
              <div className="mb-10 w-48 h-48 sm:w-56 sm:h-56 rounded-full flex items-center justify-center border border-sky-500/20 bg-zinc-950/60 shadow-lg relative">
                {avatarStyle === "face" && renderCyberFace("thinking")}
                {avatarStyle === "robot" && renderRoboTutor("thinking")}
                {avatarStyle === "animal" && renderPandaMascot("thinking")}
              </div>
            )}

            <h2 className="text-xl font-bold mb-2">Analyzing your performance...</h2>
            <p className={`text-sm max-w-md mx-auto leading-relaxed ${c ? "text-zinc-400" : "text-zinc-600"}`}>
              AI imtihonchisi barcha 3 ta qism bo'yicha javoblarni va talaffuzingizni IELTS mezonlariga muvofiq tekshirmoqda. Bu 15-30 soniya vaqt olishi mumkin.
            </p>
          </div>
        )}

        {/* ── AI THINKING STAGE ── */}
        {stage === "thinking" && (
          <div className="w-full text-center max-w-2xl animate-in fade-in duration-300 flex flex-col items-center">
            {/* Glowing 3D Orb (Thinking Mode) */}
            {avatarStyle === "orb" ? (
              <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-full flex items-center justify-center z-10 orb-3d orb-thinking-anim orb-3d-glow-sky text-sky-500 border border-sky-500/20 mb-10">
                <div className="text-center z-20">
                  <span className="text-4xl animate-spin block">🌀</span>
                  <span className="font-mono text-[9px] uppercase tracking-widest font-black block mt-2 text-sky-400">
                    Thinking
                  </span>
                </div>
              </div>
            ) : avatarStyle === "examiner" ? (
              <div className="mb-10">
                {renderExaminer("thinking")}
              </div>
            ) : (
              <div className="mb-10 w-48 h-48 sm:w-56 sm:h-56 rounded-full flex items-center justify-center border border-sky-500/20 bg-zinc-950/60 shadow-lg relative">
                {avatarStyle === "face" && renderCyberFace("thinking")}
                {avatarStyle === "robot" && renderRoboTutor("thinking")}
                {avatarStyle === "animal" && renderPandaMascot("thinking")}
              </div>
            )}
            <h2 className="text-lg font-bold mb-2">Imtihonchi o'ylamoqda...</h2>
            <p className={`text-xs max-w-md mx-auto leading-relaxed ${c ? "text-zinc-550" : "text-zinc-400"}`}>
              Suhbatdosh javobingizni tahlil qilib, keyingi savolni tayyorlamoqda.
            </p>
          </div>
        )}

        {/* ── FEEDBACK STAGE ── */}
        {stage === "feedback" && feedback && (
          <div className="w-full animate-in fade-in duration-500 max-w-3xl">
            <div className="text-center mb-8 border-b border-zinc-900/10 dark:border-zinc-800/40 pb-6">
              <div className={`text-xs uppercase tracking-widest font-black mb-3 ${c ? "text-zinc-550" : "text-zinc-400"}`}>
                Estimated IELTS Band Score
              </div>
              <div className="text-7xl font-black text-amber-500 mb-2">{feedback.overall}</div>
              <div className={`text-sm ${c ? "text-zinc-400" : "text-zinc-600"} font-medium`}>Parts 1, 2 & 3 baholash natijasi</div>
            </div>

            {/* Criteria bands */}
            {feedback.criteria && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { key: "fluency", label: "Fluency & Coherence" },
                  { key: "vocabulary", label: "Lexical Resource" },
                  { key: "grammar", label: "Grammar Accuracy" },
                  { key: "pronunciation", label: "Pronunciation" },
                ].map(({ key, label }) => (
                  <div key={key} className={`rounded-2xl border p-5 text-center ${card}`}>
                    <div className="text-3xl font-black text-amber-500">{feedback.criteria[key] || "—"}</div>
                    <div className={`text-[9px] uppercase font-bold tracking-wider mt-1.5 leading-tight ${c ? "text-zinc-500" : "text-zinc-400"}`}>{label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Azure Speech Pronunciation Metrics (Scale 0-100) */}
            {azureScores.length > 0 && (
              <div className={`rounded-2xl border p-6 mb-6 ${card}`}>
                <h3 className="text-xs font-black uppercase tracking-widest mb-4 text-amber-500 flex items-center gap-1.5">
                  <span>🎯</span> AZURE SPEECH PRONUNCIATION METRICS (SCALE 0-100)
                </h3>
                <div className="grid grid-cols-5 gap-2 text-center">
                  {[
                    { label: "Overall Pron", key: "pronunciation" },
                    { label: "Accuracy", key: "accuracy" },
                    { label: "Fluency", key: "fluency" },
                    { label: "Completeness", key: "completeness" },
                    { label: "Prosody", key: "prosody" },
                  ].map(({ label, key }) => {
                    const avg = Math.round(
                      azureScores.reduce((sum, curr: any) => sum + curr[key], 0) / azureScores.length
                    );
                    let color = "text-emerald-500";
                    if (avg < 50) color = "text-red-500";
                    else if (avg < 70) color = "text-amber-500";

                    return (
                      <div key={key} className={`rounded-xl p-3 border ${subCard}`}>
                        <div className={`text-2xl font-mono font-black ${color}`}>{avg}</div>
                        <div className={`text-[8px] uppercase font-bold tracking-wider mt-1 ${c ? "text-zinc-500" : "text-zinc-400"}`}>{label}</div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[10px] text-zinc-550 mt-3 leading-relaxed">
                  Ushbu ko'rsatkichlar ovozingizdagi urg'u, intonatsiya va ravonlikni Azure Cognitive Speech API yordamida baholash natijasidir.
                </p>

                {/* Word-level Pronunciation Highlights */}
                {azureWords.length > 0 && (
                  <div className="mt-6 pt-5 border-t border-zinc-900/10 dark:border-zinc-800/40 text-left">
                    <span className="font-bold text-[10px] uppercase tracking-wider text-zinc-500 block mb-3">
                      ✍️ Word-Level Pronunciation Highlights
                    </span>
                    <div className="flex flex-wrap gap-2 leading-relaxed text-sm font-medium p-4 rounded-xl bg-zinc-900/5 dark:bg-zinc-950 border border-zinc-800/20">
                      {azureWords.map((item, idx) => {
                        let colorClass = "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
                        if (item.score < 60 || item.error === "Omission" || item.error === "Insertion") {
                          colorClass = "text-rose-500 bg-rose-500/10 border-rose-500/20";
                        } else if (item.score < 80 || item.error === "Mispronunciation") {
                          colorClass = "text-amber-500 bg-amber-500/10 border-amber-500/20";
                        }
                        
                        return (
                          <span 
                            key={idx} 
                            className={`px-2 py-0.5 rounded border text-xs cursor-help transition-all ${colorClass}`}
                            title={`Accuracy: ${item.score}% | Error: ${item.error}`}
                          >
                            {item.word}
                          </span>
                        );
                      })}
                    </div>
                    <div className="flex gap-4 mt-3 text-[10px] font-semibold text-zinc-550">
                      <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-500/20 border border-emerald-500/40 block"></span> Excellent (80-100)</div>
                      <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-amber-500/20 border border-amber-500/40 block"></span> Needs Practice (60-79)</div>
                      <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-rose-500/20 border border-rose-500/40 block"></span> Incorrect (0-59)</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Detailed Corrections (IELTS.gg style side-by-side) */}
            {feedback.detailedCorrections && feedback.detailedCorrections.length > 0 && (
              <div className={`rounded-2xl border p-6 mb-6 ${card}`}>
                <h3 className="text-xs font-black uppercase tracking-widest mb-4 text-amber-500 flex items-center gap-1.5">
                  <span>✍️</span> GRAMMATIKA VA IBARALAR TUZATIShI (CORRECTIONS)
                </h3>
                <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                  Nutqingizdagi noto'g'ri grammatik shakllar va g'aliz iboralarni examiner versiyasi bilan taqqoslang:
                </p>
                <div className="space-y-4">
                  {feedback.detailedCorrections.map((corr: any, idx: number) => (
                    <div key={idx} className={`p-4 border rounded-xl space-y-3 ${subCard}`}>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className="bg-red-500/5 border border-red-500/10 p-3 rounded-lg text-xs">
                          <span className="text-red-400 font-extrabold uppercase text-[8px] font-mono tracking-widest block mb-1">Siz aytgan variant (Original)</span>
                          <span className="text-zinc-300 font-medium italic">"{corr.original}"</span>
                        </div>
                        <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-lg text-xs">
                          <span className="text-emerald-400 font-extrabold uppercase text-[8px] font-mono tracking-widest block mb-1">Examiner taklifi (Corrected)</span>
                          <span className="text-emerald-300 font-bold italic">"{corr.corrected}"</span>
                        </div>
                      </div>
                      <div className="text-xs text-zinc-400 bg-zinc-950 p-3 rounded-lg border border-zinc-900 leading-relaxed">
                        <span className="text-[9px] uppercase font-mono font-black text-amber-400 block mb-1">Qoida va izoh:</span>
                        {corr.explanation}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comments */}
            {feedback.comments && (
              <div className={`rounded-2xl border p-6 mb-4 ${card}`}>
                <h3 className={`text-xs font-black uppercase tracking-widest mb-3 ${c ? "text-zinc-500" : "text-zinc-450"}`}>
                  Examiner Review & Comments
                </h3>
                <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">{feedback.comments}</p>
              </div>
            )}

            {/* Improvements */}
            {feedback.improvements && feedback.improvements.length > 0 && (
              <div className={`rounded-2xl border p-6 mb-8 ${card}`}>
                <h3 className={`text-xs font-black uppercase tracking-widest mb-3 ${c ? "text-zinc-500" : "text-zinc-450"}`}>
                  Areas of Improvement
                </h3>
                <ul className="space-y-2">
                  {feedback.improvements.map((imp: string, i: number) => (
                    <li key={i} className="text-sm flex gap-3.5 leading-relaxed font-semibold">
                      <span className="text-amber-500 font-extrabold shrink-0">→</span>
                      <span>{imp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-4 justify-center">
              <button onClick={() => window.location.reload()}
                className="bg-amber-500 hover:bg-amber-400 text-black font-black px-10 py-3.5 rounded-full shadow-lg hover:shadow-amber-500/30 transition-all hover:-translate-y-0.5 duration-200">
                🔄 New Test
              </button>
              <Link href={`/t/${track.id}`}
                className={`px-10 py-3.5 rounded-full font-black text-xs uppercase tracking-widest border transition-all flex items-center justify-center ${c ? "border-zinc-800 text-zinc-300 hover:border-amber-500 hover:text-amber-400" : "border-zinc-300 text-zinc-600 hover:border-amber-500 hover:text-amber-600"}`}>
                Dashboard
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
