"use client";

import { useTargetLevel } from "@/lib/usePrepPlan";
import { useHydrated } from "@/lib/clientStore";
import { aiFetch } from "@/lib/apiClient";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useDisplaySettings, DisplaySettings } from "@/components/DisplaySettings";
import { usePracticeLanguage } from "@/lib/usePracticeLanguage";
import { useTrack } from "@/lib/useTrack";
import { trackScore } from "@/lib/tracks";
import { appendTestHistory } from "@/lib/useTestHistory";
import { getExamFormat, nativeScoreLabel, availableSkillsFor } from "@/lib/examFormats";
import { Difficulty, DIFFICULTY_LABELS, DIFFICULTIES } from "@/lib/difficulty";

// ─── Task 1 Prompts ───────────────────────────────────────────────────────────
const TASK1_PROMPTS = [
  {
    id: "t1_1",
    title: "Internet Usage by Age Group",
    type: "Bar Chart",
    description:
      "The bar chart below shows the percentage of people in different age groups who use the internet daily in four countries in 2023.",
    chartData:
      "📊 [18-25]: UK 94%, USA 92%, Australia 89%, Canada 91% | [26-40]: UK 88%, USA 85%, Australia 83%, Canada 86% | [41-60]: UK 72%, USA 68%, Australia 65%, Canada 70% | [61+]: UK 45%, USA 42%, Australia 38%, Canada 44%",
    instruction:
      "Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.",
  },
  {
    id: "t1_2",
    title: "Renewable Energy Production",
    type: "Line Graph",
    description:
      "The line graph below shows the production of renewable energy (in gigawatts) from four different sources between 2000 and 2020.",
    chartData:
      "📈 Solar: 2000→5GW, 2005→12GW, 2010→45GW, 2015→180GW, 2020→600GW | Wind: 2000→18GW, 2005→59GW, 2010→198GW, 2015→432GW, 2020→733GW | Hydro: 2000→700GW, 2005→760GW, 2010→850GW, 2015→1000GW, 2020→1170GW | Biomass: 2000→40GW, 2005→55GW, 2010→75GW, 2015→105GW, 2020→140GW",
    instruction:
      "Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.",
  },
  {
    id: "t1_3",
    title: "Water Usage by Sector",
    type: "Pie Chart",
    description:
      "The pie charts below show how water was used in three different regions (Asia, Europe, North America) in 2020.",
    chartData:
      "🥧 Asia: Agriculture 80%, Industry 12%, Domestic 8% | Europe: Agriculture 33%, Industry 44%, Domestic 23% | North America: Agriculture 40%, Industry 38%, Domestic 22%",
    instruction:
      "Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.",
  },
  {
    id: "t1_4",
    title: "Process of Making Paper",
    type: "Process Diagram",
    description:
      "The diagram below shows the process of manufacturing paper from trees.",
    chartData:
      "🔄 Step 1: Trees are cut down in forests → Step 2: Logs are transported to mill → Step 3: Bark is removed from logs → Step 4: Wood is chipped into small pieces → Step 5: Chips are mixed with water & chemicals → Step 6: Pulp is cleaned & bleached → Step 7: Pulp is spread on wire mesh → Step 8: Water drains away, paper forms → Step 9: Paper is dried by heated rollers → Step 10: Paper is rolled and cut",
    instruction:
      "Summarise the information by selecting and reporting the main stages in the process. Write at least 150 words.",
  },
  {
    id: "t1_5",
    title: "Museum Visitor Numbers",
    type: "Table",
    description:
      "The table below shows the number of visitors (in thousands) to five museums in London between 2018 and 2022.",
    chartData:
      "📋 British Museum: 2018=5,910, 2019=6,239, 2020=1,756, 2021=2,830, 2022=4,097 | Natural History: 2018=5,226, 2019=5,424, 2020=1,300, 2021=2,100, 2022=3,800 | Science Museum: 2018=3,259, 2019=3,341, 2020=890, 2021=1,450, 2022=2,600 | V&A: 2018=3,889, 2019=3,977, 2020=980, 2021=1,600, 2022=2,900 | Tate Modern: 2018=5,867, 2019=6,020, 2020=1,450, 2021=2,300, 2022=4,500",
    instruction:
      "Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.",
  },
  {
    id: "t1_6",
    title: "Transportation Methods to Work",
    type: "Bar Chart",
    description:
      "The bar chart shows the percentage of workers using different transportation methods to commute to work in three cities in 2022.",
    chartData:
      "📊 Car: Tokyo 15%, London 28%, New York 30% | Public Transport: Tokyo 71%, London 55%, New York 52% | Cycling: Tokyo 4%, London 7%, New York 3% | Walking: Tokyo 8%, London 9%, New York 13% | Other: Tokyo 2%, London 1%, New York 2%",
    instruction:
      "Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.",
  },
  {
    id: "t1_7",
    title: "Global CO2 Emissions",
    type: "Line Graph",
    description:
      "The graph below shows CO2 emissions (in billion tonnes) from five regions of the world between 1990 and 2020.",
    chartData:
      "📈 China: 1990→2.5, 2000→3.5, 2010→8.0, 2020→10.1 | USA: 1990→5.0, 2000→5.8, 2010→5.5, 2020→4.7 | EU: 1990→4.2, 2000→3.8, 2010→3.5, 2020→2.8 | India: 1990→0.7, 2000→1.0, 2010→1.8, 2020→2.6 | Rest of World: 1990→5.8, 2000→6.0, 2010→7.5, 2020→8.2",
    instruction:
      "Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.",
  },
  {
    id: "t1_8",
    title: "University Enrollment by Subject",
    type: "Pie Chart",
    description:
      "The pie charts show the proportion of university students enrolled in different subjects in 2000 and 2020.",
    chartData:
      "🥧 2000: Business 22%, Engineering 18%, Sciences 15%, Arts 20%, Law 10%, Medicine 8%, Other 7% | 2020: Business 19%, Engineering 25%, Sciences 18%, Arts 12%, Law 9%, Medicine 10%, Computer Science 7%",
    instruction:
      "Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.",
  },
  {
    id: "t1_9",
    title: "Household Spending Categories",
    type: "Table",
    description:
      "The table shows average annual household expenditure (in USD) in four countries across five categories in 2021.",
    chartData:
      "📋 Housing: UK=12,400, USA=18,200, Germany=10,800, Japan=11,500 | Food: UK=6,200, USA=8,100, Germany=5,900, Japan=7,200 | Transport: UK=4,800, USA=9,700, Germany=5,100, Japan=4,300 | Healthcare: UK=2,100, USA=11,200, Germany=3,400, Japan=3,800 | Education: UK=1,800, USA=3,200, Germany=1,200, Japan=2,100",
    instruction:
      "Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.",
  },
  {
    id: "t1_10",
    title: "How a Solar Panel Works",
    type: "Process Diagram",
    description:
      "The diagram illustrates how a solar panel system generates and distributes electricity for a home.",
    chartData:
      "🔄 Step 1: Sunlight hits solar panels on roof → Step 2: Photovoltaic cells convert light to DC electricity → Step 3: Inverter converts DC to AC electricity → Step 4: AC electricity powers household appliances → Step 5: Excess electricity sent to grid → Step 6: Smart meter records energy in/out → Step 7: Battery storage saves surplus for night use → Step 8: Grid provides power when panels insufficient",
    instruction:
      "Summarise the information by selecting and reporting the main stages in the process. Write at least 150 words.",
  },
];

// Tagged by topic/data complexity (not a scoring rubric — just picks which prompt to show).
const TASK1_DIFFICULTY: Record<string, Difficulty> = {
  t1_1: "medium", t1_2: "hard", t1_3: "easy", t1_4: "hard", t1_5: "hard",
  t1_6: "medium", t1_7: "hard", t1_8: "medium", t1_9: "medium", t1_10: "medium",
};

// ─── Task 2 Prompts ───────────────────────────────────────────────────────────
const TASK2_PROMPTS = [
  {
    id: "t2_1",
    type: "Discussion",
    prompt:
      "Some people believe that the best way to improve public health is to increase the number of sports facilities. Others, however, believe that this would have little effect and that other measures are required.\n\nDiscuss both these views and give your own opinion.",
  },
  {
    id: "t2_2",
    type: "Opinion",
    prompt:
      "In many countries, the gap between the rich and the poor is growing. What problems could this cause? What can be done to reduce this gap?",
  },
  {
    id: "t2_3",
    type: "Advantages/Disadvantages",
    prompt:
      "Many young people today leave their home countries to work abroad. What are the advantages and disadvantages of working in a foreign country?",
  },
  {
    id: "t2_4",
    type: "Problem/Solution",
    prompt:
      "Traffic congestion is a serious problem in many cities around the world. What are the main causes of this problem and what measures could be taken to solve it?",
  },
  {
    id: "t2_5",
    type: "Opinion",
    prompt:
      "Some people think that schools should teach children how to be good citizens, while others feel this is the responsibility of the family.\n\nTo what extent do you agree or disagree?",
  },
  {
    id: "t2_6",
    type: "Discussion",
    prompt:
      "Some people think that technology is making us more isolated from other people, while others believe that it is actually helping us to communicate better.\n\nDiscuss both views and give your own opinion.",
  },
  {
    id: "t2_7",
    type: "Problem/Solution",
    prompt:
      "In many cities, a large number of young people are unable to find work after graduating from university. What problems does youth unemployment cause? What can be done about it?",
  },
  {
    id: "t2_8",
    type: "Opinion",
    prompt:
      "It is often argued that museums should be free of charge for all visitors. To what extent do you agree or disagree with this statement?",
  },
  {
    id: "t2_9",
    type: "Discussion",
    prompt:
      "Some people believe that it is important to preserve traditional skills and ways of life, while others think that it is more important to focus on scientific and technological progress.\n\nDiscuss both views and give your opinion.",
  },
  {
    id: "t2_10",
    type: "Advantages/Disadvantages",
    prompt:
      "Online shopping is becoming increasingly popular in many parts of the world. What are the advantages and disadvantages of this trend for consumers and for local high street shops?",
  },
  {
    id: "t2_11",
    type: "Opinion",
    prompt:
      "Some people argue that it is better for children to grow up in the city, while others feel that the countryside provides a better environment.\n\nTo what extent do you agree or disagree?",
  },
  {
    id: "t2_12",
    type: "Problem/Solution",
    prompt:
      "Many people are choosing to live alone in modern society. What are the reasons for this trend and is it a positive or negative development?",
  },
  {
    id: "t2_13",
    type: "Discussion",
    prompt:
      "Some people feel that entertainers such as film stars and pop musicians are paid too much, while others feel their high salaries are justified.\n\nDiscuss both views and give your own opinion.",
  },
  {
    id: "t2_14",
    type: "Opinion",
    prompt:
      "In some countries, people are choosing to have fewer children or no children at all. What are the reasons for this trend? Do you think this is a positive or negative development?",
  },
  {
    id: "t2_15",
    type: "Advantages/Disadvantages",
    prompt:
      "The growth of multinational corporations has both positive and negative effects on local economies and cultures. Discuss the advantages and disadvantages of multinational companies.",
  },
  {
    id: "t2_16",
    type: "Problem/Solution",
    prompt:
      "Air pollution is a major problem in many cities. What are the main causes of air pollution? What can governments and individuals do to reduce it?",
  },
  {
    id: "t2_17",
    type: "Opinion",
    prompt:
      "Some people think that all university students should study abroad for part of their degree. To what extent do you agree or disagree with this opinion?",
  },
  {
    id: "t2_18",
    type: "Discussion",
    prompt:
      "Some people believe that the main purpose of television is to entertain, while others think it should primarily be used to educate and inform people.\n\nDiscuss both views and give your own opinion.",
  },
  {
    id: "t2_19",
    type: "Problem/Solution",
    prompt:
      "Despite advances in medicine, some diseases remain major health problems in developing countries. What are the main reasons for this? What can be done to address these issues?",
  },
  {
    id: "t2_20",
    type: "Opinion",
    prompt:
      "Some people believe that it is more important to teach children to be competitive. Others believe that children should be taught to be co-operative.\n\nTo what extent do you agree or disagree?",
  },
];

const TASK2_DIFFICULTY: Record<string, Difficulty> = {
  t2_1: "medium", t2_2: "hard", t2_3: "easy", t2_4: "medium", t2_5: "medium",
  t2_6: "hard", t2_7: "medium", t2_8: "easy", t2_9: "hard", t2_10: "easy",
  t2_11: "easy", t2_12: "medium", t2_13: "easy", t2_14: "hard", t2_15: "hard",
  t2_16: "medium", t2_17: "easy", t2_18: "medium", t2_19: "hard", t2_20: "medium",
};

function pickRandomByDifficulty<T extends { id: string }>(arr: T[], diffMap: Record<string, Difficulty>, difficulty: Difficulty): T {
  const pool = arr.filter((item) => (diffMap[item.id] || "medium") === difficulty);
  return pickRandom(pool.length ? pool : arr);
}

// ─── Types ────────────────────────────────────────────────────────────────────
type Stage = "task1" | "task2" | "feedback";

interface TaskFeedback {
  score: string;
  taskResponse: string;
  coherence: string;
  lexical: string;
  grammar: string;
  comments: string;
  improvements: string[];
  detailedCorrections: { original: string; corrected: string; explanation: string }[];
  band9Sample: string;
}

// ─── Utility ──────────────────────────────────────────────────────────────────
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter((w) => w.length > 0).length;
}

function bandColor(band: string): string {
  const n = parseFloat(band);
  if (n >= 8) return "text-emerald-400";
  if (n >= 7) return "text-green-400";
  if (n >= 6) return "text-amber-400";
  if (n >= 5) return "text-orange-400";
  return "text-red-400";
}

// ─── ChartDataBox ─────────────────────────────────────────────────────────────
function ChartDataBox({ chartData, type }: { chartData: string; type: string }) {
  const isProcess = type === "Process Diagram";
  const isTable = type === "Table";
  const isPie = type === "Pie Chart";
  const entries = chartData.split("|").map((s) => s.trim());

  if (isProcess) {
    const allSteps: string[] = [];
    entries.forEach((entry) => {
      const cleaned = entry.replace(/^🔄\s?/u, "");
      cleaned.split("→").forEach((step) => {
        const s = step.trim();
        if (s) allSteps.push(s);
      });
    });
    return (
      <div className="bg-zinc-800/60 border border-zinc-700/40 rounded-xl p-4 mt-3">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Data Representation</span>
          <span className="text-xs bg-zinc-700/60 text-zinc-300 px-2 py-0.5 rounded-full">{type}</span>
        </div>
        <div className="space-y-1.5">
          {allSteps.map((step, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              <span className="text-zinc-200 text-xs leading-relaxed">{step}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-800/60 border border-zinc-700/40 rounded-xl p-4 mt-3">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Data Representation</span>
        <span className="text-xs bg-zinc-700/60 text-zinc-300 px-2 py-0.5 rounded-full">{type}</span>
      </div>
      <div className="space-y-1.5">
        {entries.map((entry, i) => {
          const cleaned = entry.replace(/^[📊📈🥧📋]\s?/u, "");
          return (
            <div
              key={i}
              className={`text-xs text-zinc-300 ${
                isTable || isPie
                  ? "bg-zinc-700/30 rounded-lg px-3 py-1.5"
                  : "border-l-2 border-amber-500/40 pl-3 py-0.5"
              }`}
            >
              {cleaned}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── ScoreBadge ───────────────────────────────────────────────────────────────
function ScoreBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center bg-zinc-800/60 border border-zinc-700/50 rounded-xl p-3 min-w-[72px]">
      <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">{label}</span>
      <span className={`text-xl font-bold ${bandColor(value)}`}>{value}</span>
    </div>
  );
}

// ─── CorrectionCard ───────────────────────────────────────────────────────────
function CorrectionCard({ corr, index }: { corr: { original: string; corrected: string; explanation: string }; index: number }) {
  return (
    <div className="bg-zinc-800/50 border border-zinc-700/40 rounded-xl p-4 text-sm space-y-2">
      <div className="flex items-start gap-2">
        <span className="text-zinc-500 font-mono text-xs mt-0.5">#{index + 1}</span>
        <div className="flex-1 space-y-2">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2">
            <span className="text-red-400 text-[10px] font-bold uppercase tracking-wider block mb-1">
              ⚠️ Original
            </span>
            <p className="italic text-zinc-300">"{corr.original}"</p>
          </div>
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2">
            <span className="text-green-400 text-[10px] font-bold uppercase tracking-wider block mb-1">
              ✅ Corrected
            </span>
            <p className="font-medium text-zinc-100">"{corr.corrected}"</p>
          </div>
          <div className="bg-zinc-700/30 rounded-lg p-2">
            <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider block mb-1">
              💡 Explanation
            </span>
            <p className="text-zinc-300">{corr.explanation}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── FeedbackCard ─────────────────────────────────────────────────────────────
function FeedbackCard({
  title,
  taskNum,
  feedback,
  expanded,
  onToggle,
}: {
  title: string;
  taskNum: 1 | 2;
  feedback: TaskFeedback;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-700/60 rounded-2xl overflow-hidden shadow-xl">
      <div
        className="flex items-center justify-between p-5 cursor-pointer hover:bg-zinc-800/40 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              taskNum === 1 ? "bg-blue-500/20 text-blue-400" : "bg-purple-500/20 text-purple-400"
            }`}
          >
            {taskNum}
          </div>
          <div>
            <div className="font-bold text-zinc-100">{title}</div>
            <div className="text-xs text-zinc-400 mt-0.5">
              Task {taskNum} — {taskNum === 1 ? "150 words min" : "250 words min"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`text-2xl font-bold ${bandColor(feedback.score)}`}>{feedback.score}</div>
          <span className="text-zinc-500 text-lg">{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-zinc-700/50 p-5 space-y-6">
          <div className="flex flex-wrap gap-3">
            <ScoreBadge label="Overall" value={feedback.score} />
            <ScoreBadge label={taskNum === 1 ? "TA" : "TR"} value={feedback.taskResponse} />
            <ScoreBadge label="CC" value={feedback.coherence} />
            <ScoreBadge label="LR" value={feedback.lexical} />
            <ScoreBadge label="GRA" value={feedback.grammar} />
          </div>

          <div>
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
              Examiner Comments
            </h4>
            <p className="text-zinc-300 leading-relaxed text-sm">{feedback.comments}</p>
          </div>

          <div>
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
              How to Improve
            </h4>
            <ul className="space-y-2">
              {feedback.improvements.map((imp, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                  <span className="text-amber-400 font-bold mt-0.5">→</span>
                  <span>{imp}</span>
                </li>
              ))}
            </ul>
          </div>

          {feedback.detailedCorrections && feedback.detailedCorrections.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
                Detailed Corrections ({feedback.detailedCorrections.length})
              </h4>
              <div className="space-y-3">
                {feedback.detailedCorrections.map((corr, i) => (
                  <CorrectionCard key={i} corr={corr} index={i} />
                ))}
              </div>
            </div>
          )}

          {feedback.band9Sample && (
            <div>
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">
                ⭐ Band 9.0 Model Answer
              </h4>
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-5 text-sm leading-loose text-zinc-200 whitespace-pre-wrap font-serif">
                {feedback.band9Sample}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page Component ──────────────────────────────────────────────────────
export default function WritingTest() {
  const [currentLang] = usePracticeLanguage();
  const { track } = useTrack();
  // SSR-xavfsiz hydration bayrog'i. Ilgari useState(false) + useEffect(setTrue) edi:
  // React 19 da bu effekt ichidagi setState hisoblanadi va birinchi kadr noto'g'ri chiziladi.
  const isClient = useHydrated();
  const targetLevel = useTargetLevel();
  const [translating, setTranslating] = useState(false);

  const [difficulty, setDifficulty] = useState<Difficulty>("medium");

  // Initialize random English prompts on mount, re-rolled when difficulty changes (before writing starts).
  const [baseTask1Prompt, setBaseTask1Prompt] = useState(() => pickRandomByDifficulty(TASK1_PROMPTS, TASK1_DIFFICULTY, "medium"));
  const [baseTask2Prompt, setBaseTask2Prompt] = useState(() => pickRandomByDifficulty(TASK2_PROMPTS, TASK2_DIFFICULTY, "medium"));

  // Faqat AI tarjimasi state'da; ingliz tilidagi asl promptlar hosila qiymat.
  const [translatedTask1, setTranslatedTask1] = useState<any>(null);
  const [translatedTask2, setTranslatedTask2] = useState<any>(null);
  const task1Prompt = currentLang === "english" ? baseTask1Prompt : (translatedTask1 ?? baseTask1Prompt);
  const task2Prompt = currentLang === "english" ? baseTask2Prompt : (translatedTask2 ?? baseTask2Prompt);

  const rerollForDifficulty = (d: Difficulty) => {
    setDifficulty(d);
    setBaseTask1Prompt(pickRandomByDifficulty(TASK1_PROMPTS, TASK1_DIFFICULTY, d));
    setBaseTask2Prompt(pickRandomByDifficulty(TASK2_PROMPTS, TASK2_DIFFICULTY, d));
  };


  useEffect(() => {
    // Ingliz tilida tarjima kerak emas — bunda promptlar hosila qiymat sifatida
    // pastda hisoblanadi, effekt umuman ishga tushmaydi.
    if (currentLang === "english") return;

    let cancelled = false;
    const translatePrompts = async () => {
      setTranslating(true);
      try {
        const res = await aiFetch("/api/tutor/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            passage: { task1: baseTask1Prompt, task2: baseTask2Prompt },
            language: currentLang,
            trackId: track.id,
            targetLevel: targetLevel
          })
        });
        const data = await res.json();
        if (!cancelled && data.translated) {
          setTranslatedTask1(data.translated.task1);
          setTranslatedTask2(data.translated.task2);
        }
      } catch (e) {
        console.error("Failed to translate writing prompts:", e);
      } finally {
        if (!cancelled) setTranslating(false);
      }
    };

    translatePrompts();
    return () => { cancelled = true; };
  // targetLevel deps'da bo'lmasa, u localStorage'dan yuklanmasidan oldin effekt
  // ishga tushib, tarjimaga har doim bo'sh daraja yuborilardi.
  }, [baseTask1Prompt, baseTask2Prompt, currentLang, targetLevel]);

  const display = useDisplaySettings();

  const [stage, setStage] = useState<Stage>("task1");
  const [task1Text, setTask1Text] = useState("");
  const [task2Text, setTask2Text] = useState("");

  const [task1TimeLeft, setTask1TimeLeft] = useState(20 * 60);
  const [task2TimeLeft, setTask2TimeLeft] = useState(40 * 60);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [task1Feedback, setTask1Feedback] = useState<TaskFeedback | null>(null);
  const [task2Feedback, setTask2Feedback] = useState<TaskFeedback | null>(null);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);
  const [expandedCard, setExpandedCard] = useState<1 | 2 | null>(1);

  // New CBT States
  const [unofficialAcknowledged, setUnofficialAcknowledged] = useState(false);
  const [isTimerHidden, setIsTimerHidden] = useState(false);
  const [leftWidth, setLeftWidth] = useState(50);
  const [isResizing, setIsResizing] = useState(false);


  const activeTimeLeft = stage === "task1" ? task1TimeLeft : task2TimeLeft;


  const startResizing = (mouseDownEvent: React.MouseEvent) => {
    setIsResizing(true);
    mouseDownEvent.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const percentage = (e.clientX / window.innerWidth) * 100;
      if (percentage >= 25 && percentage <= 75) {
        setLeftWidth(percentage);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  // Task 1 timer
  useEffect(() => {
    if (stage !== "task1" || task1TimeLeft <= 0) return;
    const t = setTimeout(() => setTask1TimeLeft((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [stage, task1TimeLeft]);

  // Task 2 timer
  useEffect(() => {
    if (stage !== "task2" || task2TimeLeft <= 0) return;
    const t = setTimeout(() => setTask2TimeLeft((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [stage, task2TimeLeft]);

  const task1Words = countWords(task1Text);
  const task2Words = countWords(task2Text);

  const handleTask1Next = useCallback(() => {
    setStage("task2");
  }, []);

  const handleFinalSubmit = useCallback(async () => {
    setIsSubmitting(true);
    setEvaluationError(null);
    setStage("feedback");

    try {
      const [res1, res2] = await Promise.all([
        aiFetch("/api/evaluate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "writing_task1",
            content: task1Text,
            prompt: task1Prompt.description + "\n\nData: " + task1Prompt.chartData,
            language: currentLang,
            trackId: track.id,
            targetLevel: targetLevel
          }),
        }),
        aiFetch("/api/evaluate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "writing",
            content: task2Text,
            prompt: task2Prompt.prompt,
            language: currentLang,
            trackId: track.id,
            targetLevel: targetLevel
          }),
        }),
      ]);

      if (!res1.ok) {
        const err = await res1.json().catch(() => ({}));
        throw new Error("Task 1 evaluation failed: " + (err.error || res1.statusText));
      }
      if (!res2.ok) {
        const err = await res2.json().catch(() => ({}));
        throw new Error("Task 2 evaluation failed: " + (err.error || res2.statusText));
      }

      const [fb1, fb2] = await Promise.all([res1.json(), res2.json()]);
      setTask1Feedback(fb1);
      setTask2Feedback(fb2);

      try {
        const t1Band = parseFloat(fb1.score) || 0;
        const t2Band = parseFloat(fb2.score) || 0;
        const overallBand = Math.round(((t1Band + t2Band) / 2) * 2) / 2;
        appendTestHistory({
          id: `writing_${Date.now()}`,
          type: "writing",
          date: new Date().toISOString(),
          band: overallBand,
          criteria: {
            task1: fb1.score,
            task2: fb2.score,
            taskResponse: fb2.taskResponse,
            coherence: fb2.coherence,
            lexical: fb2.lexical,
            grammar: fb2.grammar,
          },
          improvements: (fb2.improvements || []).slice(0, 5),
          language: currentLang,
          trackId: track.id,
        });
      } catch (e) {
        console.warn("Error saving history:", e);
      }
    } catch (err: any) {
      setEvaluationError(err.message || "Evaluation failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  // currentLang va targetLevel ham shu callback ichida ishlatiladi. Ular deps'da
  // bo'lmasa, foydalanuvchi tilni yoki maqsad darajasini o'zgartirgach, baholash
  // eski qiymat bilan yuboriladi va tarix noto'g'ri tilga yoziladi.
  }, [task1Text, task2Text, task1Prompt, task2Prompt, currentLang, targetLevel]);

  const overallBand =
    task1Feedback && task2Feedback
      ? (
          Math.round(
            ((parseFloat(task1Feedback.score) + parseFloat(task2Feedback.score)) / 2) * 2
          ) / 2
        ).toFixed(1)
      : null;

  const timeLeft = stage === "task1" ? task1TimeLeft : task2TimeLeft;
  const timerWarning = timeLeft < 5 * 60;

  // Rasmiy Writing bo'limi shu YO'NALISHDA bormi (JLPT'da yo'q, IELTS'da bor).
  const writingSection = track.sections.find((sec) => sec.skill === "writing");
  const writingSkillInfo = { official: writingSection?.official ?? true, note: writingSection?.note };
  if (isClient && !writingSkillInfo.official && !unofficialAcknowledged) {
    return (
      <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] flex flex-col items-center justify-center p-6 text-center">
        <div className="text-6xl mb-4">✍️</div>
        <h1 className="text-2xl font-black mb-2">{track.title} imtihonida rasmiy Writing bo'limi yo'q</h1>
        <p className="text-zinc-400 max-w-md mb-8 text-sm leading-relaxed">{writingSkillInfo.note}</p>
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

  if (translating) {
    return (
      <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-zinc-400 text-sm font-semibold animate-pulse">AI Ustoz yozish imtihoni savollarini tanlangan tilga moslashtirmoqda...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col text-zinc-100">
      {/* Header */}
      <header className="bg-zinc-900/95 backdrop-blur border-b border-zinc-800 sticky top-0 z-30">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Left */}
          <div className="flex items-center gap-4 min-w-0">
            <Link
              href={`/t/${track.id}`}
              className="text-zinc-400 hover:text-zinc-100 transition-colors text-sm shrink-0"
            >
              ← Back
            </Link>
            <span className="hidden sm:block font-semibold text-sm text-zinc-300">
              {`${track.shortTitle} Writing`}
            </span>
            {stage === "task1" && !task1Text.trim() && !task2Text.trim() && (
              <div className="hidden md:flex items-center gap-1">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d}
                    onClick={() => rerollForDifficulty(d)}
                    className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-colors ${
                      difficulty === d ? "bg-amber-500 border-amber-500 text-black" : "border-zinc-700 text-zinc-400 hover:text-white"
                    }`}
                  >
                    {DIFFICULTY_LABELS[d]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Phase indicator */}
          <div className="flex items-center gap-1.5">
            <div
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                stage === "task1"
                  ? "bg-blue-500/20 text-blue-300 ring-1 ring-blue-500/40"
                  : "bg-zinc-800 text-zinc-500"
              }`}
            >
              {stage !== "task1" && <span>✓</span>}
              Task 1
            </div>
            <span className="text-zinc-700 text-xs">›</span>
            <div
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                stage === "task2"
                  ? "bg-purple-500/20 text-purple-300 ring-1 ring-purple-500/40"
                  : stage === "feedback"
                  ? "bg-zinc-800 text-zinc-500"
                  : "bg-zinc-800 text-zinc-600"
              }`}
            >
              {stage === "feedback" && <span>✓</span>}
              Task 2
            </div>
            <span className="text-zinc-700 text-xs">›</span>
            <div
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                stage === "feedback"
                  ? "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40"
                  : "bg-zinc-800 text-zinc-600"
              }`}
            >
              Feedback
            </div>
          </div>

          {/* Right: timer + action */}
          <div className="flex items-center gap-3">
            <DisplaySettings theme="dark" settings={display} />
            {stage !== "feedback" && (
              <div
                onClick={() => {
                  if (timeLeft > 600) {
                    setIsTimerHidden(!isTimerHidden);
                  }
                }}
                className={`font-mono font-bold text-lg px-3 py-1.5 rounded-lg border cursor-pointer select-none transition-all ${
                  timeLeft <= 300
                    ? "bg-red-500/15 border-red-500 text-red-400 animate-pulse animate-duration-1000"
                    : timeLeft <= 600
                      ? "bg-amber-500/15 border-amber-500 text-amber-400 animate-pulse animate-duration-1000"
                      : "bg-zinc-800 border-zinc-700 text-zinc-300"
                }`}
                title={timeLeft > 600 ? "Vaqtni yashirish/ko'rsatish" : "Vaqt tugamoqda!"}
              >
                {isTimerHidden && timeLeft > 600 ? "⏰ Vaqt" : formatTime(timeLeft)}
              </div>
            )}

            {stage === "task1" && (
              <button
                onClick={handleTask1Next}
                disabled={task1Words < 10}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                Task 2 →
              </button>
            )}

            {stage === "task2" && (
              <button
                onClick={handleFinalSubmit}
                disabled={isSubmitting || task2Words < 10}
                className="bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-900 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-zinc-900/30 border-t-zinc-900 rounded-full animate-spin inline-block" />
                    Evaluating…
                  </span>
                ) : (
                  "Submit & Grade ✓"
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main style={{ zoom: display.fontScale }} className={`flex-1 w-full mx-auto p-4 sm:p-6 ${
        isResizing ? "cursor-col-resize select-none" : ""
      }`}>

        {/* ── TASK 1 ───────────────────────────────────────────────────────────── */}
        {stage === "task1" && (
          <div className="flex flex-col lg:flex-row gap-0 items-stretch border border-zinc-800 rounded-2xl overflow-hidden min-h-[calc(100vh-140px)]">
            {/* Left panel */}
            <div 
              className="flex flex-col gap-4 p-6 overflow-y-auto h-[calc(100vh-140px)] bg-zinc-950/60"
              style={{ width: isClient && typeof window !== 'undefined' && window.innerWidth >= 1024 ? `${leftWidth}%` : '100%' }}
            >
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Task 1
                  </span>
                  <span className="text-xs font-medium text-zinc-500 bg-zinc-800 px-2.5 py-0.5 rounded-full">
                    {task1Prompt.type}
                  </span>
                  <span className="text-xs text-zinc-600 ml-auto">20 minutes</span>
                </div>
                <h2 className="text-xl font-bold text-zinc-100 mb-2">{task1Prompt.title}</h2>
                <p className="text-zinc-300 leading-relaxed text-sm">{task1Prompt.description}</p>
                <ChartDataBox chartData={task1Prompt.chartData} type={task1Prompt.type} />
                <div className="mt-4 bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
                  <p className="text-amber-200 text-sm leading-relaxed">{task1Prompt.instruction}</p>
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Task 1 Strategy</h3>
                <ul className="space-y-1 text-xs text-zinc-400">
                  <li className="flex gap-2"><span className="text-amber-500">•</span> Write an overview summarising the overall trends</li>
                  <li className="flex gap-2"><span className="text-amber-500">•</span> Select key data — don't describe every single figure</li>
                  <li className="flex gap-2"><span className="text-amber-500">•</span> Make clear comparisons with specific numbers</li>
                  <li className="flex gap-2"><span className="text-amber-500">•</span> Do NOT include personal opinions</li>
                  <li className="flex gap-2"><span className="text-amber-500">•</span> Target 160–190 words for a safe score</li>
                </ul>
              </div>
            </div>

            {/* Drag Handle */}
            <div 
              onMouseDown={startResizing}
              className="hidden lg:block w-1.5 hover:w-2 bg-zinc-900 hover:bg-amber-500 cursor-col-resize transition-all z-20 shrink-0 h-full border-x border-zinc-800/80"
            />

            {/* Right panel: editor */}
            <div 
              className="flex flex-col bg-zinc-900/40 overflow-hidden h-[calc(100vh-140px)]" 
              style={{ width: isClient && typeof window !== 'undefined' && window.innerWidth >= 1024 ? `${100 - leftWidth}%` : '100%' }}
            >
              <div className="bg-zinc-800/80 border-b border-zinc-700 px-5 py-3 flex items-center justify-between shrink-0">
                <span className="text-sm font-semibold text-zinc-300">Your Response — Task 1</span>
                <div className="flex items-center gap-2.5">
                  <span className={`text-sm font-bold tabular-nums ${task1Words >= 150 ? "text-green-400" : task1Words >= 100 ? "text-amber-400" : "text-zinc-400"}`}>
                    {task1Words} words
                  </span>
                  <span className="text-xs text-zinc-650">/ 150 min</span>
                  {task1Words >= 150 && (
                    <span className="text-green-400 text-xs font-bold bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">
                      ✓ Ready
                    </span>
                  )}
                </div>
              </div>

              <textarea
                value={task1Text}
                onChange={(e) => setTask1Text(e.target.value)}
                placeholder="Begin your Task 1 response here. Start with an overview of the main trends, then describe and compare the key data…"
                className="flex-1 w-full p-5 bg-transparent resize-none focus:outline-none text-zinc-100 text-base leading-relaxed placeholder:text-zinc-600"
                spellCheck={false}
                autoFocus
              />

              {/* Word count progress bar */}
              <div className="shrink-0">
                <div className="h-1 bg-zinc-800">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-300 ease-out"
                    style={{ width: `${Math.min((task1Words / 150) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TASK 2 ───────────────────────────────────────────────────────────── */}
        {stage === "task2" && (
          <div className="flex flex-col lg:flex-row gap-0 items-stretch border border-zinc-800 rounded-2xl overflow-hidden min-h-[calc(100vh-140px)]">
            {/* Left panel */}
            <div 
              className="flex flex-col gap-4 p-6 overflow-y-auto h-[calc(100vh-140px)] bg-zinc-950/60"
              style={{ width: isClient && typeof window !== 'undefined' && window.innerWidth >= 1024 ? `${leftWidth}%` : '100%' }}
            >
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Task 2
                  </span>
                  <span className="text-xs font-medium text-zinc-500 bg-zinc-800 px-2.5 py-0.5 rounded-full">
                    {task2Prompt.type}
                  </span>
                  <span className="text-xs text-zinc-600 ml-auto">40 minutes</span>
                </div>
                <p className="text-zinc-100 leading-relaxed text-base whitespace-pre-wrap">{task2Prompt.prompt}</p>
                <div className="mt-5 bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
                  <p className="text-amber-200 text-sm leading-relaxed">
                    Give reasons for your answer and include any relevant examples from your own knowledge or experience.{" "}
                    <strong>Write at least 250 words.</strong>
                  </p>
                </div>
              </div>

              {/* Task 1 completed pill */}
              <div className="bg-zinc-900 border border-green-500/20 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500/15 flex items-center justify-center text-green-400 font-bold shrink-0">
                  ✓
                </div>
                <div>
                  <div className="text-sm font-semibold text-zinc-300">Task 1 Submitted</div>
                  <div className="text-xs text-zinc-500">
                    {task1Words} words · {task1Prompt.title} ({task1Prompt.type})
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Task 2 Strategy</h3>
                <ul className="space-y-1 text-xs text-zinc-400">
                  <li className="flex gap-2"><span className="text-amber-500">•</span> 4-paragraph structure: Intro → Body 1 → Body 2 → Conclusion</li>
                  <li className="flex gap-2"><span className="text-amber-500">•</span> Paraphrase the question in your introduction</li>
                  <li className="flex gap-2"><span className="text-amber-500">•</span> State and support your position clearly</li>
                  <li className="flex gap-2"><span className="text-amber-500">•</span> Use discourse markers (Furthermore, However, In conclusion…)</li>
                  <li className="flex gap-2"><span className="text-amber-500">•</span> Target 270–300 words for a safe score</li>
                </ul>
              </div>
            </div>

            {/* Drag Handle */}
            <div 
              onMouseDown={startResizing}
              className="hidden lg:block w-1.5 hover:w-2 bg-zinc-900 hover:bg-amber-500 cursor-col-resize transition-all z-20 shrink-0 h-full border-x border-zinc-800/80"
            />

            {/* Right panel: editor */}
            <div 
              className="flex flex-col bg-zinc-900/40 overflow-hidden h-[calc(100vh-140px)]" 
              style={{ width: isClient && typeof window !== 'undefined' && window.innerWidth >= 1024 ? `${100 - leftWidth}%` : '100%' }}
            >
              <div className="bg-zinc-800/80 border-b border-zinc-700 px-5 py-3 flex items-center justify-between shrink-0">
                <span className="text-sm font-semibold text-zinc-300">Your Essay — Task 2</span>
                <div className="flex items-center gap-2.5">
                  <span className={`text-sm font-bold tabular-nums ${task2Words >= 250 ? "text-green-400" : task2Words >= 180 ? "text-amber-400" : "text-zinc-400"}`}>
                    {task2Words} words
                  </span>
                  <span className="text-xs text-zinc-650">/ 250 min</span>
                  {task2Words >= 250 && (
                    <span className="text-green-400 text-xs font-bold bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">
                      ✓ Ready
                    </span>
                  )}
                </div>
              </div>

              <textarea
                value={task2Text}
                onChange={(e) => setTask2Text(e.target.value)}
                placeholder="Write your essay here. Begin with a clear introduction that paraphrases the topic and states your position…"
                className="flex-1 w-full p-5 bg-transparent resize-none focus:outline-none text-zinc-100 text-base leading-relaxed placeholder:text-zinc-600"
                spellCheck={false}
                autoFocus
              />

              <div className="shrink-0">
                <div className="h-1 bg-zinc-800">
                  <div
                    className="h-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all duration-300 ease-out"
                    style={{ width: `${Math.min((task2Words / 250) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── FEEDBACK ─────────────────────────────────────────────────────────── */}
        {stage === "feedback" && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Loading spinner */}
            {isSubmitting && (
              <div className="flex flex-col items-center justify-center py-24 gap-6">
                <div className="relative w-20 h-20">
                  <div className="absolute inset-0 rounded-full border-4 border-zinc-800" />
                  <div className="absolute inset-0 rounded-full border-4 border-t-amber-400 animate-spin" />
                </div>
                <div className="text-center">
                  <p className="text-zinc-200 font-semibold text-lg">Evaluating your writing…</p>
                  <p className="text-zinc-500 text-sm mt-1">
                    Scoring Task 1 and Task 2 simultaneously. This may take 15–30 seconds.
                  </p>
                </div>
              </div>
            )}

            {/* Error */}
            {evaluationError && !isSubmitting && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center space-y-4">
                <div className="text-4xl">⚠️</div>
                <p className="text-red-400 font-bold text-lg">Evaluation Failed</p>
                <p className="text-zinc-400 text-sm max-w-md mx-auto">{evaluationError}</p>
                <button
                  onClick={() => {
                    setStage("task2");
                    setEvaluationError(null);
                  }}
                  className="mt-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-100 px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                >
                  ← Go Back and Retry
                </button>
              </div>
            )}

            {/* Results */}
            {!isSubmitting && task1Feedback && task2Feedback && (
              <>
                {/* Overall band banner */}
                  <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 border border-zinc-850 rounded-3xl p-8 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-around gap-8">
                    {/* Background glows */}
                    <div className="absolute top-0 left-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

                    {/* Left: Circular gauge */}
                    <div className="flex flex-col items-center">
                      <div className="relative w-44 h-44 flex items-center justify-center animate-in zoom-in-95 duration-500">
                        <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 120 120">
                          <circle
                            cx="60"
                            cy="60"
                            r="50"
                            fill="transparent"
                            stroke="rgba(24, 24, 27, 0.5)"
                            strokeWidth="10"
                          />
                          <circle
                            cx="60"
                            cy="60"
                            r="50"
                            fill="transparent"
                            stroke="url(#writingGrad)"
                            strokeWidth="10"
                            strokeDasharray={314.16}
                            strokeDashoffset={314.16 - (314.16 * (parseFloat(overallBand!) || 4)) / 9}
                            strokeLinecap="round"
                            className="transition-all duration-1000 ease-out"
                          />
                          <defs>
                            <linearGradient id="writingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#f59e0b" />
                              <stop offset="100%" stopColor="#d97706" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="text-center z-10">
                          <span className="text-xs uppercase font-extrabold tracking-widest text-zinc-500 block mb-0.5 font-mono">Overall</span>
                          <span className="text-5xl font-black text-amber-500 font-mono tracking-tighter">
                            {trackScore(track, parseFloat(overallBand!) || 0)}
                          </span>
                          <span className="text-xs text-zinc-500 block mt-0.5 font-mono">
                            {track.scoring === "band-9" ? "out of 9.0" : `ichki ball: ${overallBand}/9.0`}
                          </span>
                        </div>
                      </div>
                      <div className="text-center mt-3">
                        <span className="text-[10px] font-mono tracking-widest uppercase text-zinc-500">
                          {`${track.title} Writing`}
                        </span>
                      </div>
                    </div>

                    {/* Right: Detailed Criterion Grid */}
                    <div className="flex-1 w-full max-w-sm space-y-4">
                      {[
                        { label: "Task Achievement / Response", desc: "How well you answered the prompt", v1: task1Feedback.taskResponse, v2: task2Feedback.taskResponse },
                        { label: "Coherence & Cohesion", desc: "Clarity, logical structure, paragraphs", v1: task1Feedback.coherence, v2: task2Feedback.coherence },
                        { label: "Lexical Resource", desc: "Vocabulary range and spelling", v1: task1Feedback.lexical, v2: task2Feedback.lexical },
                        { label: "Grammatical Range & Accuracy", desc: "Tenses, complex structures, errors", v1: task1Feedback.grammar, v2: task2Feedback.grammar },
                      ].map((c) => {
                        const score1 = parseFloat(c.v1) || 4;
                        const score2 = parseFloat(c.v2) || 4;
                        const avg = Math.round(((score1 + score2) / 2) * 2) / 2;
                        return (
                          <div key={c.label} className="space-y-1">
                            <div className="flex justify-between items-end">
                              <div>
                                <h4 className="text-xs font-bold text-zinc-200">{c.label}</h4>
                                <span className="text-[10px] text-zinc-500 block">{c.desc}</span>
                              </div>
                              <span className="text-xs font-black text-amber-500 font-mono bg-amber-500/10 px-1.5 py-0.5 rounded">{avg.toFixed(1)}</span>
                            </div>
                            <div className="h-2 w-full bg-zinc-800/80 rounded-full overflow-hidden border border-zinc-900">
                              <div 
                                className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-1000"
                                style={{ width: `${(avg / 9) * 100}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                {/* Summary cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-900 border border-blue-500/20 rounded-2xl p-5 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Task 1
                      </span>
                      <span className="text-xs text-zinc-600">{task1Prompt.type}</span>
                    </div>
                    <div className={`text-4xl font-black ${bandColor(task1Feedback.score)}`}>
                      {task1Feedback.score}
                    </div>
                    <div className="text-xs text-zinc-400">{task1Prompt.title}</div>
                    <div className="text-xs text-zinc-600">{task1Words} words written</div>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {[
                        { l: "TA", v: task1Feedback.taskResponse },
                        { l: "CC", v: task1Feedback.coherence },
                        { l: "LR", v: task1Feedback.lexical },
                        { l: "GRA", v: task1Feedback.grammar },
                      ].map((item) => (
                        <div key={item.l} className="bg-zinc-800 rounded-lg px-2 py-1 text-center">
                          <div className="text-[9px] text-zinc-500 uppercase">{item.l}</div>
                          <div className={`text-xs font-bold ${bandColor(item.v)}`}>{item.v}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-zinc-900 border border-purple-500/20 rounded-2xl p-5 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Task 2
                      </span>
                      <span className="text-xs text-zinc-600">{task2Prompt.type}</span>
                    </div>
                    <div className={`text-4xl font-black ${bandColor(task2Feedback.score)}`}>
                      {task2Feedback.score}
                    </div>
                    <div className="text-xs text-zinc-400 line-clamp-1">{task2Prompt.prompt.slice(0, 60)}…</div>
                    <div className="text-xs text-zinc-600">{task2Words} words written</div>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {[
                        { l: "TR", v: task2Feedback.taskResponse },
                        { l: "CC", v: task2Feedback.coherence },
                        { l: "LR", v: task2Feedback.lexical },
                        { l: "GRA", v: task2Feedback.grammar },
                      ].map((item) => (
                        <div key={item.l} className="bg-zinc-800 rounded-lg px-2 py-1 text-center">
                          <div className="text-[9px] text-zinc-500 uppercase">{item.l}</div>
                          <div className={`text-xs font-bold ${bandColor(item.v)}`}>{item.v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Detailed feedback */}
                <FeedbackCard
                  title={`Task 1 — ${task1Prompt.title}`}
                  taskNum={1}
                  feedback={task1Feedback}
                  expanded={expandedCard === 1}
                  onToggle={() => setExpandedCard(expandedCard === 1 ? null : 1)}
                />
                <FeedbackCard
                  title={`Task 2 — ${task2Prompt.type}`}
                  taskNum={2}
                  feedback={task2Feedback}
                  expanded={expandedCard === 2}
                  onToggle={() => setExpandedCard(expandedCard === 2 ? null : 2)}
                />

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2 pb-10">
                  <Link
                    href={`/t/${track.id}`}
                    className="flex-1 text-center bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-5 py-3 rounded-xl text-sm font-semibold transition-colors"
                  >
                    ← Back to Dashboard
                  </Link>
                  <button
                    onClick={() => window.location.reload()}
                    className="flex-1 bg-amber-500 hover:bg-amber-400 text-zinc-900 px-5 py-3 rounded-xl text-sm font-bold transition-colors"
                  >
                    🔄 New Writing Test
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
