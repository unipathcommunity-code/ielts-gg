/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { usePlan } from "@/lib/usePlan";
import { aiFetch } from "@/lib/apiClient";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { FlagIcon } from "@/components/FlagIcon";

interface ChatMessage {
  role: "ai" | "user";
  text: string;
}

const GREETINGS = {
  kind: "Salom! Men sizning mehribon ustozingizman. Bugun qaysi mavzuda suhbatlashamiz? Xatolardan qo'rqmang, bemalol gapiring!",
  sarcastic: "Salom! Men sizning qattiqqo'l ustozingizman. IELTS dan 9.0 olishingizga ishonasizmi? Hozir gapirganingizda xatolaringizni ayab o'tirmayman. Qani, boshlang!",
  formal: "Xayrli kun. Teacher tayyorgarlik protokoli faollashtirildi. Sizning gapirish ko'nikmalaringizni tahlil qilish uchun tayyorman. Boshlash uchun gapiring.",
  toxic: "Voybo'o'y, yana sizmi? Darsga kelishga arang vaqt topdingizmi, dangasa? Qani gapiring-chi, bugun qanday grammatik xatolar bilan qulog'imni og'ritmoqchisiz?",
  romantic: "Salom jonim! O'zingiz kabi go'zal ovozingizni eshitishni intizorlik bilan kutayotgan edim. Qani, asalim, gapiring, bugun nimalar haqida suhbatlashamiz?"
};

const VOCAB_BOOSTER_DATABASE = [
  { simple: "very important", band9: "paramount", xp: 50 },
  { simple: "important", band9: "crucial", xp: 30 },
  { simple: "help", band9: "foster", xp: 30 },
  { simple: "solve", band9: "mitigate", xp: 40 },
  { simple: "bad", band9: "detrimental", xp: 40 },
  { simple: "good", band9: "advantageous", xp: 30 },
  { simple: "many", band9: "a myriad of", xp: 50 },
  { simple: "think", band9: "reckon", xp: 30 },
  { simple: "use", band9: "utilize", xp: 30 },
  { simple: "change", band9: "revolutionize", xp: 50 },
  { simple: "agree", band9: "concur", xp: 40 },
  { simple: "show", band9: "illustrate", xp: 30 }
];

const renderCyberFace = (stage: string) => {
  const isSpeaking = stage === "speaking";
  const isListening = stage === "listening";
  const isThinking = stage === "thinking";
  
  return (
    <svg className="w-full h-full cyber-face-container text-cyan-400 mx-auto" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
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
    <svg className="w-full h-full text-purple-400 mx-auto" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
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
    <svg className="w-full h-full text-emerald-455 mx-auto" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
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

const renderAlienTutor = (stage: string) => {
  const isSpeaking = stage === "speaking";
  const isListening = stage === "listening";
  const isThinking = stage === "thinking";

  return (
    <svg className="w-full h-full text-lime-400 mx-auto" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Alien Head */}
      <path d="M50 15 C20 15, 15 45, 20 60 C25 75, 40 85, 50 85 C60 85, 75 75, 80 60 C85 45, 80 15, 50 15 Z" stroke="currentColor" strokeWidth="2.5" fill="#0b0f19" className="neon-glow-lime" />
      {/* Antenna */}
      <line x1="50" y1="15" x2="50" y2="5" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="50" cy="5" r="3" fill="currentColor" className={isThinking || isSpeaking ? "animate-pulse" : ""} />

      {/* Large Alien Eyes */}
      <g>
        <ellipse cx="36" cy="40" rx="9" ry="13" transform="rotate(-25 36 40)" fill="currentColor" />
        <ellipse cx="64" cy="40" rx="9" ry="13" transform="rotate(25 64 40)" fill="currentColor" />
        {/* Glow pupils */}
        <ellipse cx="38" cy="38" rx="3" ry="5" transform="rotate(-25 38 38)" fill="#fff" className={isListening ? "animate-pulse" : ""} />
        <ellipse cx="62" cy="38" rx="3" ry="5" transform="rotate(25 62 38)" fill="#fff" className={isListening ? "animate-pulse" : ""} />
      </g>

      {/* Cute Little Mouth */}
      {isSpeaking ? (
        <path d="M45 68 Q50 78 55 68" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="animate-bounce" />
      ) : isListening ? (
        <circle cx="50" cy="70" r="3" fill="currentColor" className="animate-pulse" />
      ) : (
        <path d="M46 70 Q50 72 54 70" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      )}
    </svg>
  );
};

const renderNinjaTutor = (stage: string) => {
  const isSpeaking = stage === "speaking";
  const isListening = stage === "listening";

  return (
    <svg className="w-full h-full text-red-500 mx-auto" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Head Outline / Headband */}
      <circle cx="50" cy="50" r="32" stroke="currentColor" strokeWidth="2.5" fill="#18181b" className="neon-glow-red" />
      <rect x="18" y="32" width="64" height="12" fill="currentColor" />
      
      {/* Headband Tails */}
      <path d="M82 38 Q92 34 88 48" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className={isSpeaking ? "animate-bounce" : ""} />
      <path d="M82 41 Q95 44 91 52" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={isSpeaking ? "animate-bounce" : ""} />

      {/* Mask Face Cutout */}
      <ellipse cx="50" cy="48" rx="20" ry="8" fill="#f4f4f5" />

      {/* Eyes inside cutout */}
      <g className={isListening ? "scale-y-75 origin-center transition-all" : ""}>
        {/* Left eye */}
        <path d="M38 48 C41 46, 45 47, 46 49" stroke="#000" strokeWidth="2" strokeLinecap="round" />
        <circle cx="42" cy="49" r="1.5" fill="#000" />
        
        {/* Right eye */}
        <path d="M62 48 C59 46, 55 47, 54 49" stroke="#000" strokeWidth="2" strokeLinecap="round" />
        <circle cx="58" cy="49" r="1.5" fill="#000" />
      </g>

      {/* Mouth (represented by mask breathing slots or movement) */}
      {isSpeaking ? (
        <g opacity="0.8">
          <line x1="45" y1="68" x2="55" y2="68" stroke="currentColor" strokeWidth="2" className="animate-pulse" />
          <line x1="47" y1="72" x2="53" y2="72" stroke="currentColor" strokeWidth="1.5" className="animate-pulse" />
        </g>
      ) : (
        <g opacity="0.4">
          <line x1="48" y1="68" x2="52" y2="68" stroke="currentColor" strokeWidth="1.5" />
        </g>
      )}
    </svg>
  );
};

const renderEvaTutor = (stage: string, mousePos?: { x: number; y: number }) => {
  const isSpeaking = stage === "speaking";
  const isListening = stage === "listening";
  const pupilDx = (mousePos?.x || 0) * 1.5;
  const pupilDy = (mousePos?.y || 0) * 1.5;
  
  return (
    <svg className="w-full h-full mx-auto drop-shadow-[0_0_25px_rgba(236,72,153,0.25)] avatar-breath avatar-sway" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="evaSkin" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fdf2f8" />
          <stop offset="35%" stopColor="#fbcfe8" />
          <stop offset="70%" stopColor="#f472b6" />
          <stop offset="100%" stopColor="#db2777" />
        </linearGradient>
        <linearGradient id="evaHair" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="50%" stopColor="#1e1b4b" />
          <stop offset="100%" stopColor="#311042" />
        </linearGradient>
        <linearGradient id="evaLips" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f43f5e" />
          <stop offset="100%" stopColor="#be123c" />
        </linearGradient>
        <radialGradient id="evaEye" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="75%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#0f172a" />
        </radialGradient>
      </defs>
      
      {/* Hair Back */}
      <path d="M16 65 C12 25, 24 12, 50 12 C76 12, 88 25, 84 65 C84 80, 74 88, 74 88 L26 88 C26 88, 16 80, 16 65 Z" fill="url(#evaHair)" />

      {/* Neck */}
      <path d="M41 73 L41 87 C41 90, 59 90, 59 87 L59 73 Z" fill="#f472b6" opacity="0.7" />
      <path d="M41 78 Q50 82, 59 78" stroke="#db2777" strokeWidth="1" opacity="0.3" fill="none" />

      {/* Face Base */}
      <path d="M30 45 C30 30, 36 22, 50 22 C64 22, 70 30, 70 45 C70 60, 63 76, 50 76 C37 76, 30 60, 30 45 Z" fill="url(#evaSkin)" />

      {/* Hair Bangs */}
      <path d="M30 25 C36 17, 47 18, 50 25 C53 18, 64 17, 70 25 C72 27, 71 33, 68 36 C61 29, 52 30, 50 36 C48 30, 39 29, 32 36 C29 33, 28 27, 30 25 Z" fill="url(#evaHair)" />

      {/* Eyes */}
      <g>
        <ellipse cx="38" cy="44" rx="6.5" ry="3.8" fill="#fff" stroke="#9d174d" strokeWidth="0.4" />
        <ellipse cx="62" cy="44" rx="6.5" ry="3.8" fill="#fff" stroke="#9d174d" strokeWidth="0.4" />
        
        {isListening ? (
          <>
            <path d="M32 44 Q38 42, 44 44" stroke="#1e1b4b" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M56 44 Q62 42, 68 44" stroke="#1e1b4b" strokeWidth="2" strokeLinecap="round" fill="none" />
          </>
        ) : (
          <g className="avatar-blink-animation">
            <circle cx={38 + pupilDx} cy={44 + pupilDy} r="3.2" fill="url(#evaEye)" />
            <circle cx={62 + pupilDx} cy={44 + pupilDy} r="3.2" fill="url(#evaEye)" />
            <circle cx={39.2 + pupilDx} cy={42.8 + pupilDy} r="0.9" fill="#fff" />
            <circle cx={63.2 + pupilDx} cy={42.8 + pupilDy} r="0.9" fill="#fff" />
            
            {/* Eyelashes outline */}
            <path d="M32 43 Q38 39, 44 43" stroke="#1e1b4b" strokeWidth="1.2" fill="none" />
            <path d="M56 43 Q62 39, 68 43" stroke="#1e1b4b" strokeWidth="1.2" fill="none" />
          </g>
        )}
      </g>

      {/* Eyebrows */}
      <path d="M31 38 Q38 35, 44 38.5" stroke="#1e1b4b" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M56 38.5 Q62 35, 69 38" stroke="#1e1b4b" strokeWidth="1.5" fill="none" strokeLinecap="round" />

      {/* Nose */}
      <path d="M50 42 L50 56 Q50 58, 48.5 58" stroke="#be123c" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.75" />

      {/* Lips */}
      {isSpeaking ? (
        <ellipse cx="50" cy="65" rx="5.5" ry="3.5" fill="url(#evaLips)" className="mouth-speaking-eva" />
      ) : (
        <path d="M44 64 Q50 66.5, 56 64" stroke="url(#evaLips)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      )}

      {/* Cheek blush */}
      <circle cx="34" cy="54" r="3.5" fill="#f43f5e" opacity="0.2" />
      <circle cx="66" cy="54" r="3.5" fill="#f43f5e" opacity="0.2" />
    </svg>
  );
};

const renderAdamTutor = (stage: string, mousePos?: { x: number; y: number }) => {
  const isSpeaking = stage === "speaking";
  const isListening = stage === "listening";
  const pupilDx = (mousePos?.x || 0) * 1.5;
  const pupilDy = (mousePos?.y || 0) * 1.5;
  
  return (
    <svg className="w-full h-full mx-auto drop-shadow-[0_0_25px_rgba(14,165,233,0.25)] avatar-breath avatar-sway" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="adamSkin" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f0f9ff" />
          <stop offset="50%" stopColor="#bae6fd" />
          <stop offset="100%" stopColor="#7dd3fc" />
        </linearGradient>
        <linearGradient id="adamHair" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#020617" />
          <stop offset="50%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>
        <radialGradient id="adamEye" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="70%" stopColor="#059669" />
          <stop offset="100%" stopColor="#064e3b" />
        </radialGradient>
      </defs>
      
      {/* Short Hair Back */}
      <path d="M22 34 C18 20, 30 12, 50 12 C70 12, 82 20, 78 34 C78 44, 79 50, 79 50 L21 50 C21 50, 22 44, 22 34 Z" fill="url(#adamHair)" />

      {/* Neck */}
      <path d="M42 73 L42 87 C42 90, 58 90, 58 87 L58 73 Z" fill="#bae6fd" opacity="0.75" />
      <path d="M42 78 Q50 82, 58 78" stroke="#0284c7" strokeWidth="1" opacity="0.3" fill="none" />

      {/* Strong Jaw Face Base */}
      <polygon points="31,35 31,56 36,73 50,79 64,73 69,56 69,35" fill="url(#adamSkin)" />

      {/* Front Spiky Hair */}
      <path d="M30 35 C33 22, 43 24, 50 27 C57 24, 67 22, 70 35 C64 30, 55 31, 50 34 C45 31, 36 30, 30 35 Z" fill="url(#adamHair)" />
      <path d="M38 23 L42 16 L46 22 Z M50 23 L54 15 L58 22 Z" fill="url(#adamHair)" />

      {/* Eyes */}
      <g>
        <ellipse cx="40" cy="45" rx="6.2" ry="3.3" fill="#fff" stroke="#0284c7" strokeWidth="0.4" />
        <ellipse cx="60" cy="45" rx="6.2" ry="3.3" fill="#fff" stroke="#0284c7" strokeWidth="0.4" />
        
        {isListening ? (
          <>
            <path d="M35 45 Q40 43, 45 45" stroke="#0f172a" strokeWidth="2.2" strokeLinecap="round" fill="none" />
            <path d="M55 45 Q60 43, 65 45" stroke="#0f172a" strokeWidth="2.2" strokeLinecap="round" fill="none" />
          </>
        ) : (
          <g className="avatar-blink-animation">
            <circle cx={40 + pupilDx} cy={45 + pupilDy} r="2.8" fill="url(#adamEye)" />
            <circle cx={60 + pupilDx} cy={45 + pupilDy} r="2.8" fill="url(#adamEye)" />
            <circle cx={41.1 + pupilDx} cy={43.8 + pupilDy} r="0.8" fill="#fff" />
            <circle cx={61.1 + pupilDx} cy={43.8 + pupilDy} r="0.8" fill="#fff" />
          </g>
        )}
      </g>

      {/* Eyebrows */}
      <path d="M33 38.5 L46 39.8" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
      <path d="M54 39.8 L67 38.5" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />

      {/* Sharp Nose */}
      <path d="M50 43 L50 56 L47.5 56" stroke="#0284c7" strokeWidth="1.2" fill="none" strokeLinecap="round" />

      {/* Lips */}
      {isSpeaking ? (
        <ellipse cx="50" cy="67" rx="5" ry="2.2" fill="#bae6fd" stroke="#0284c7" strokeWidth="1.5" className="mouth-speaking-adam" />
      ) : (
        <line x1="44" y1="67" x2="56" y2="67" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
      )}
    </svg>
  );
};

const renderDynamicBackground = (style: string, isDark: boolean) => {
  if (style === "orb") {
    return (
      <div className={`absolute inset-0 opacity-30 pointer-events-none -z-10 transition-all duration-700 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.08)_0%,transparent_60%)]`}>
        <div className={`absolute inset-0 bg-[size:3rem_3rem] ${
          isDark
            ? 'bg-[radial-gradient(#1f2937_1px,transparent_1px)]'
            : 'bg-[radial-gradient(#e5e7eb_1px,transparent_1px)]'
        }`} />
      </div>
    );
  }
  if (style === "face") {
    return (
      <div className="absolute inset-0 pointer-events-none -z-10 transition-all duration-700 overflow-hidden">
        {/* Neon cyan digital matrix lines */}
        <div className={`absolute inset-0 bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 ${
          isDark
            ? 'bg-[linear-gradient(to_right,#0e7490_1px,transparent_1px),linear-gradient(to_bottom,#0e7490_1px,transparent_1px)]'
            : 'bg-[linear-gradient(to_right,#bae6fd_1px,transparent_1px),linear-gradient(to_bottom,#bae6fd_1px,transparent_1px)]'
        }`} />
        <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-cyan-500/5 blur-[120px]" />
        <div className="absolute bottom-10 right-10 w-72 h-72 rounded-full bg-blue-500/5 blur-[120px]" />
      </div>
    );
  }
  if (style === "robot") {
    return (
      <div className="absolute inset-0 pointer-events-none -z-10 transition-all duration-700 overflow-hidden">
        {/* Tech purple circuit board pattern */}
        <div className={`absolute inset-0 bg-[size:5rem_5rem] opacity-20 ${
          isDark
            ? 'bg-[radial-gradient(circle,rgba(147,51,234,0.15)_2px,transparent_2px)]'
            : 'bg-[radial-gradient(circle,rgba(216,180,254,0.4)_2px,transparent_2px)]'
        }`} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[150px]" />
      </div>
    );
  }
  if (style === "animal") {
    return (
      <div className="absolute inset-0 pointer-events-none -z-10 transition-all duration-700 overflow-hidden">
        {/* Organic green leaf or organic dot background */}
        <div className={`absolute inset-0 bg-[size:3.5rem_3.5rem] opacity-15 ${
          isDark
            ? 'bg-[radial-gradient(#065f46_1.5px,transparent_1.5px)]'
            : 'bg-[radial-gradient(#a7f3d0_2px,transparent_2px)]'
        }`} />
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-emerald-500/5 blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-green-500/5 blur-[120px]" />
      </div>
    );
  }
  if (style === "alien") {
    return (
      <div className="absolute inset-0 pointer-events-none -z-10 transition-all duration-700 overflow-hidden">
        {/* Galaxy cosmic space backdrop */}
        <div className="absolute inset-0 opacity-45 bg-[radial-gradient(circle_at_30%_30%,rgba(168,85,247,0.18)_0%,transparent_50%),radial-gradient(circle_at_70%_70%,rgba(132,204,22,0.12)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[size:6rem_6rem] opacity-35 bg-[radial-gradient(#fff_0.5px,transparent_0.5px)]" />
      </div>
    );
  }
  if (style === "ninja") {
    return (
      <div className="absolute inset-0 pointer-events-none -z-10 transition-all duration-700 overflow-hidden">
        {/* Crimson shadows and red glows */}
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.06)_0%,transparent_60%)]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 border border-zinc-900/60 rounded-full opacity-40" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] border border-zinc-900/40 rounded-full opacity-20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-zinc-900/20 rounded-full opacity-10" />
      </div>
    );
  }
  if (style === "eva") {
    return (
      <div className="absolute inset-0 pointer-events-none -z-10 transition-all duration-700 overflow-hidden">
        <div className={`absolute inset-0 bg-[size:5rem_5rem] opacity-20 ${
          isDark
            ? 'bg-[radial-gradient(#ec4899_1.2px,transparent_1.2px)]'
            : 'bg-[radial-gradient(#fbcfe8_1.2px,transparent_1.2px)]'
        }`} />
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-pink-500/10 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '8s' }} />
      </div>
    );
  }
  if (style === "adam") {
    return (
      <div className="absolute inset-0 pointer-events-none -z-10 transition-all duration-700 overflow-hidden">
        <div className={`absolute inset-0 bg-[size:5rem_5rem] opacity-20 ${
          isDark
            ? 'bg-[radial-gradient(#0ea5e9_1.2px,transparent_1.2px)]'
            : 'bg-[radial-gradient(#bae6fd_1.2px,transparent_1.2px)]'
        }`} />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '8s' }} />
      </div>
    );
  }
  return null;
};

// Detect the language of a short sentence (Uzbek vs English) for per-segment voice routing.
function detectSegLang(text: string): "english" | "uzbek" {
  if (/o['ʻʼ`]|g['ʻʼ`]/i.test(text)) return "uzbek";
  const t = " " + text.toLowerCase().replace(/[^a-z'ʻʼ`\s]/g, " ").replace(/\s+/g, " ") + " ";
  const uz = [" va ", " ham ", " uchun ", " bilan ", " men ", " sen ", " biz ", " bu ", " shu ", " nima ", " qanday ", " kerak ", " juda ", " yaxshi ", " rahmat ", " salom ", " bor ", " lekin ", " ammo ", " mumkin ", " qiziq ", " qaysi ", " nega ", " albatta ", " degan "];
  const en = [" the ", " is ", " are ", " you ", " your ", " do ", " does ", " what ", " how ", " and ", " for ", " with ", " this ", " that ", " good ", " very ", " can ", " will ", " would ", " to ", " of ", " a ", " i ", " it ", " have ", " my ", " about ", " really ", " think "];
  let u = 0, e = 0;
  for (const m of uz) if (t.includes(m)) u++;
  for (const m of en) if (t.includes(m)) e++;
  return u >= e ? "uzbek" : "english";
}

// Split text into language-grouped segments so each is spoken by its own native voice.
function buildSegments(text: string): { lang: "english" | "uzbek"; text: string }[] {
  const sentences = text.split(/(?<=[.!?…])\s+/).map((s) => s.trim()).filter(Boolean);
  const segs: { lang: "english" | "uzbek"; text: string }[] = [];
  for (const s of (sentences.length ? sentences : [text])) {
    const lang = detectSegLang(s);
    const last = segs[segs.length - 1];
    if (last && last.lang === lang) last.text += " " + s;
    else segs.push({ lang, text: s });
  }
  return segs;
}

// Detect the dominant language of a whole reply so AUTO mode can pick ONE consistent voice.
function detectVoiceLang(text: string): "english" | "uzbek" | "korean" | "chinese" | "japanese" | "russian" {
  if (/[가-힯]/.test(text)) return "korean";   // Hangul
  if (/[ぁ-んァ-ヶ]/.test(text)) return "japanese"; // Hiragana/Katakana
  if (/[一-鿿㐀-䶿]/.test(text)) return "chinese"; // CJK Han
  if (/[а-яА-ЯёЁ]/.test(text)) return "russian"; // Cyrillic
  return detectSegLang(text); // english | uzbek
}

export default function JarvisTutor() {
  const [stage, setStage] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [typedMsg, setTypedMsg] = useState("");
  const [personality, setPersonality] = useState<"kind" | "sarcastic" | "formal" | "toxic" | "romantic">("sarcastic");
  const [jarvisText, setJarvisText] = useState(GREETINGS.sarcastic);
  const [conversation, setConversation] = useState<ChatMessage[]>([{ role: "ai", text: GREETINGS.sarcastic }]);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [notice, setNotice] = useState<string | null>(null);
  const [conversationMode, setConversationMode] = useState<"tutor" | "casual">("tutor");
  const [wakeWordEnabled, setWakeWordEnabled] = useState(false);
  const wakeWordEnabledRef = useRef(false);
  const [customVoiceId, setCustomVoiceId] = useState("");
  const [customAzureKey, setCustomAzureKey] = useState("");
  const [customAzureRegion, setCustomAzureRegion] = useState("");

  const [avatarStyle, setAvatarStyle] = useState<"orb" | "face" | "robot" | "animal" | "alien" | "ninja" | "eva" | "adam">("orb");
  const [verbosity, setVerbosity] = useState<"concise" | "normal" | "detailed">("normal");
  const [uzbekVoice, setUzbekVoice] = useState<"sardor" | "madina">("sardor");
  const [xp, setXp] = useState<number>(0);
  const [xpAnimation, setXpAnimation] = useState<{ active: boolean; message: string } | null>(null);
  const [vocabTip, setVocabTip] = useState<{ simple: string; band9: string } | null>(null);
  const [grammarReport, setGrammarReport] = useState<{ mistakesFound: boolean; userSentence: string; correctedSentence: string; explanation: string } | null>(null);
  const [activeLangs, setActiveLangs] = useState<string[]>(["english", "russian", "japanese", "korean", "chinese"]);
  const [showUIHints, setShowUIHints] = useState<boolean>(true);
  // Premium holati endi soxta localStorage bayrog'idan emas, haqiqiy obunadan
  // (Supabase `entitlements`) keladi. Brauzerdan yoqib bo'lmaydi.
  const { isPro: premiumUnlocked } = usePlan();
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [selectedPremiumAvatar, setSelectedPremiumAvatar] = useState<"eva" | "adam" | null>(null);

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    wakeWordEnabledRef.current = wakeWordEnabled;
  }, [wakeWordEnabled]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      setMousePos({ x, y });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const toggleActiveLanguage = (langId: string) => {
    setActiveLangs(prev => {
      let next = prev.includes(langId) 
        ? prev.filter(l => l !== langId) 
        : [...prev, langId];
      if (next.length === 0) next = ["english"];
      localStorage.setItem("ielts_active_languages", JSON.stringify(next));
      return next;
    });
  };

  // Voice recorder states (for ElevenLabs cloning)
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<any>(null);
  const recordingChunksRef = useRef<BlobPart[]>([]);

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

  const [gender, setGender] = useState<"male" | "female">("male");
  const [rate, setRate] = useState(0.95);
  const [pitch, setPitch] = useState(1.0);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState("");
  const [noSpeechTimeout, setNoSpeechTimeout] = useState<number>(30);
  const noSpeechTimeoutRefVal = useRef(noSpeechTimeout);

  const [showHistory, setShowHistory] = useState(false);
  const [useElevenLabs, setUseElevenLabs] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [silenceThreshold, setSilenceThreshold] = useState<number>(2.0);
  const silenceThresholdRef = useRef(silenceThreshold);

  const [language, setLanguage] = useState<"english" | "korean" | "chinese" | "japanese" | "russian" | "uzbek" | "auto">("english");
  const languageRef = useRef(language);

  // Azure Speech states
  const [speechSDK, setSpeechSDK] = useState<any>(null);
  const [azureConfig, setAzureConfig] = useState<{ token: string; region: string } | null>(null);
  const [useAzure, setUseAzure] = useState(false);

  // Refs
  const recognitionRef = useRef<any>(null);
  const azureRecognizerRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const stageRef = useRef(stage);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const isSessionActiveRef = useRef<boolean>(false);
  const noSpeechTimeoutRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);
  const useAzureRef = useRef(false);

  useEffect(() => {
    noSpeechTimeoutRefVal.current = noSpeechTimeout;
  }, [noSpeechTimeout]);

  useEffect(() => {
    silenceThresholdRef.current = silenceThreshold;
  }, [silenceThreshold]);

  useEffect(() => {
    stageRef.current = stage;
  }, [stage]);

  useEffect(() => {
    wakeWordEnabledRef.current = wakeWordEnabled;
  }, [wakeWordEnabled]);

  useEffect(() => {
    useAzureRef.current = useAzure && !!speechSDK && !!azureConfig;
  }, [useAzure, speechSDK, azureConfig]);

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => {
      setNotice(null);
    }, 4000);
  };

  // Load Saved settings & Fetch Azure Token
  // Mount'da ~15 ta ovoz sozlamasi localStorage'dan yuklanadi. Buni useSyncExternalStore'ga
  // o'tkazish butun ovoz sozlamalari qatlamini qayta yozishni talab qiladi (PROJECT_RULES:
  // jarvis'ni buzmang), foyda esa faqat lint tozaligi.
  useEffect(() => {
    const saved = localStorage.getItem("ielts_theme");
    if (saved === "light" || saved === "dark") {
      // Mount'da saqlangan sozlamalarni localStorage'dan o'qish — tashqi manba bilan
      // sinxronlash. useSyncExternalStore'ga o'tkazish butun ovoz sozlamalari qatlamini
      // qayta yozishni talab qiladi (PROJECT_RULES: jarvis/speaking'ni buzmang).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTheme(saved);
    }
    const savedGender = localStorage.getItem("ielts_voice_gender");
    if (savedGender === "male" || savedGender === "female") {
      setGender(savedGender as any);
    }
    const savedRate = localStorage.getItem("ielts_voice_rate");
    if (savedRate) {
      setRate(parseFloat(savedRate));
    }
    const savedPitch = localStorage.getItem("ielts_voice_pitch");
    if (savedPitch) {
      setPitch(parseFloat(savedPitch));
    }
    const savedVoiceName = localStorage.getItem("ielts_voice_name");
    if (savedVoiceName) {
      setSelectedVoiceName(savedVoiceName);
    }
    const savedNoSpeech = localStorage.getItem("ielts_no_speech_timeout");
    if (savedNoSpeech) {
      setNoSpeechTimeout(parseInt(savedNoSpeech));
    }
    const savedElevenLabs = localStorage.getItem("ielts_use_eleven_labs");
    if (savedElevenLabs !== null) {
      setUseElevenLabs(savedElevenLabs === "true");
    }
    const savedSilence = localStorage.getItem("ielts_silence_threshold");
    if (savedSilence) {
      setSilenceThreshold(parseFloat(savedSilence));
    }
    // Jarvis' free-chat language is its own setting (jarvis_chat_language), separate from
    // ielts_practice_language (which is the exam FORMAT test pages use — TOPIK/HSK/JLPT/etc.).
    // Falls back to the legacy shared key once for existing users, then stays independent.
    const savedLang = localStorage.getItem("jarvis_chat_language") || localStorage.getItem("ielts_practice_language");
    if (savedLang === "english" || savedLang === "korean" || savedLang === "chinese" || savedLang === "japanese" || savedLang === "russian" || savedLang === "uzbek" || savedLang === "auto" || savedLang === "german") {
      setLanguage(savedLang as any);
    }
    const savedConvMode = localStorage.getItem("ielts_conversation_mode");
    if (savedConvMode === "tutor" || savedConvMode === "casual") {
      setConversationMode(savedConvMode as any);
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
    if (savedAvatar === "orb" || savedAvatar === "face" || savedAvatar === "robot" || savedAvatar === "animal" || savedAvatar === "alien" || savedAvatar === "ninja" || savedAvatar === "eva" || savedAvatar === "adam") {
      setAvatarStyle(savedAvatar as any);
    }
    const savedVerbosity = localStorage.getItem("ielts_verbosity");
    if (savedVerbosity === "concise" || savedVerbosity === "normal" || savedVerbosity === "detailed") {
      setVerbosity(savedVerbosity);
    }
    const savedXp = localStorage.getItem("ielts_vocab_xp");
    if (savedXp) setXp(parseInt(savedXp));
    const savedUzbekVoice = localStorage.getItem("ielts_uzbek_voice");
    if (savedUzbekVoice === "sardor" || savedUzbekVoice === "madina") setUzbekVoice(savedUzbekVoice);

    const savedActive = localStorage.getItem("ielts_active_languages");
    if (savedActive) {
      try {
        const parsed = JSON.parse(savedActive);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setActiveLangs(parsed);
        }
      } catch {}
    }

    const savedHints = localStorage.getItem("ielts_show_ui_hints");
    if (savedHints !== null) {
      setShowUIHints(savedHints === "true");
    }

    loadAzureToken();

    // Dynamic Azure SDK Import
    import("microsoft-cognitiveservices-speech-sdk")
      .then(SDK => setSpeechSDK(SDK))
      .catch(err => console.warn("Failed to load Azure Speech SDK:", err));
  }, []);

  const awardXp = (amount: number, message: string) => {
    setXp(prev => {
      const next = prev + amount;
      localStorage.setItem("ielts_vocab_xp", next.toString());
      return next;
    });
    setXpAnimation({ active: true, message });
    setTimeout(() => {
      setXpAnimation(null);
    }, 4000);
  };

  const checkVocabularyBooster = (text: string) => {
    const lowerText = text.toLowerCase();
    
    // Check if used band 9 word
    for (const item of VOCAB_BOOSTER_DATABASE) {
      const band9Regex = new RegExp(`\\b${item.band9}\\b`, 'i');
      if (band9Regex.test(lowerText)) {
        awardXp(item.xp, `Used "${item.band9}" instead of "${item.simple}" (+${item.xp} XP)!`);
        setVocabTip(null);
        return;
      }
    }
    
    // Check if used simple word instead
    for (const item of VOCAB_BOOSTER_DATABASE) {
      const simpleRegex = new RegExp(`\\b${item.simple}\\b`, 'i');
      if (simpleRegex.test(lowerText)) {
        setVocabTip({ simple: item.simple, band9: item.band9 });
        return;
      }
    }
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("ielts_theme", next);
  };

  const handleSaveLanguage = (lang: "english" | "korean" | "chinese" | "japanese" | "russian" | "uzbek" | "auto") => {
    setLanguage(lang);
    localStorage.setItem("jarvis_chat_language", lang);
  };

  const stopListeningAndAnalyzeRef = useRef<any>(null);
  // "Eng so'nggi callback" naqshi: nutqni tanish API'sining hodisa ishlovchisi
  // eski closure'ni ushlab qolmasligi uchun jonli funksiya ref'da saqlanadi.
  useEffect(() => {
    // "Eng so'nggi callback" naqshi: brauzer hodisa ishlovchilari eskirgan closure'ni
    // ushlab qolmasligi uchun jonli funksiya ref'da saqlanadi.
    // eslint-disable-next-line react-hooks/immutability
    stopListeningAndAnalyzeRef.current = stopListeningAndAnalyze;
  });

  // Dynamically update Speech Recognition language
  useEffect(() => {
    languageRef.current = language;
    if (recognitionRef.current) {
      if (language === "korean") {
        recognitionRef.current.lang = "ko-KR";
      } else if (language === "chinese") {
        recognitionRef.current.lang = "zh-CN";
      } else if (language === "japanese") {
        recognitionRef.current.lang = "ja-JP";
      } else if (language === "russian") {
        recognitionRef.current.lang = "ru-RU";
      } else if (language === "uzbek") {
        recognitionRef.current.lang = "uz-UZ";
      } else {
        recognitionRef.current.lang = "en-US";
      }
    }
  }, [language]);

  // Update greeting when personality, mode or language changes
  useEffect(() => {
    let greet = "";
    if (conversationMode === "casual") {
      if (language === "korean") {
        greet = "안녕하세요! 만나서 반가워요. 오늘 하루 어때요?";
      } else if (language === "chinese") {
        greet = "你好！很高兴和你聊天。今天过得怎么样？";
      } else if (language === "japanese") {
        greet = "こんにちは！お会いできて嬉しいです。今日の調子はいかがですか？";
      } else if (language === "russian") {
        greet = "Привет! Рад пообщаться с тобой. Как проходит твой день?";
      } else if (language === "uzbek") {
        greet = "Salom! Siz bilan suhbatlashishdan xursandman. Bugun qandaysiz?";
      } else {
        greet = "Hey there! It's so good to talk to you. How is your day going so far?";
      }
    } else {
      greet = GREETINGS[personality];
    }
    // Shaxsiyat / rejim / til almashganda suhbat qaytadan boshlanadi — bu yerda
    // nutqni to'xtatish nojo'ya ta'siri bilan birga bajarilishi shart.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setJarvisText(greet);
    setConversation([{ role: "ai", text: greet }]);
    setTranscript("");
    setInterimTranscript("");
    setStage("idle");
    // Nutq sintezi / tanish tizimini to'xtatish. Bu yordamchilar ichida ref o'zgaradi —
    // ataylab: ular React state'i emas, brauzer API'sining jonli holatini boshqaradi.
    // eslint-disable-next-line react-hooks/immutability
    stopAllSpeech();
  }, [personality, conversationMode, language]);

  // Reset silence timer and no-speech timer
  const resetNoSpeechTimeout = () => {
    if (noSpeechTimeoutRef.current) clearTimeout(noSpeechTimeoutRef.current);
    const timeoutDuration = noSpeechTimeoutRefVal.current * 1000;
    noSpeechTimeoutRef.current = setTimeout(() => {
      isSessionActiveRef.current = false;
      // Nutq sintezi / tanish tizimini to'xtatish. Bu yordamchilar ichida ref o'zgaradi —
      // ataylab: ular React state'i emas, brauzer API'sining jonli holatini boshqaradi.
      // eslint-disable-next-line react-hooks/immutability
      stopListening();
      setStage("idle");
      showNotice(`Jimlik sababli muloqot vaqtincha to'xtatildi (${noSpeechTimeoutRefVal.current}s).`);
    }, timeoutDuration);
  };

  // Initialize Browser Speech Recognition & Load System Voices
  useEffect(() => {
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;
      
      const loadVoices = () => {
        if (synthRef.current) {
          const availableVoices = synthRef.current.getVoices();
          setVoices(availableVoices);
          
          const savedVoiceName = localStorage.getItem("ielts_voice_name");
          if (!savedVoiceName) {
            let defaultVoice = availableVoices.find(v => v.lang.includes("en-GB") && v.name.toLowerCase().includes("female"));
            if (!defaultVoice) defaultVoice = availableVoices.find(v => v.lang.includes("en-US") && v.name.toLowerCase().includes("female"));
            if (!defaultVoice) defaultVoice = availableVoices.find(v => v.lang.includes("en"));
            if (defaultVoice) {
              setSelectedVoiceName(defaultVoice.name);
            }
          }
        }
      };
      
      loadVoices();
      if (synthRef.current && synthRef.current.onvoiceschanged !== undefined) {
        synthRef.current.onvoiceschanged = loadVoices;
      }

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: any) => {
          let finalTrans = "";
          let interimTrans = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const text = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTrans += text + " ";
            } else {
              interimTrans += text;
            }
          }

          if (stageRef.current === "idle" && wakeWordEnabledRef.current) {
             const trans = (finalTrans + interimTrans).toLowerCase();
             if (trans.includes("hey jarvis") || trans.includes("jarvis") || trans.includes("hey alex") || trans.includes("alex")) {
                try { recognitionRef.current.stop(); } catch(_) {}
                const startAudio = new Audio('https://www.soundjay.com/buttons/sounds/button-09.mp3');
                try { startAudio.play(); } catch(_) {}
                setTimeout(() => {
                   // Nutq sintezi / tanish tizimini to'xtatish. Bu yordamchilar ichida ref o'zgaradi —
                   // ataylab: ular React state'i emas, brauzer API'sining jonli holatini boshqaradi.
                   // eslint-disable-next-line react-hooks/immutability
                   startListening();
                }, 500);
             }
             return; // Do not update transcript UI while in idle/wake-word mode
          }

          if (finalTrans) {
            setTranscript((prev) => prev + finalTrans);
            setInterimTranscript("");
          } else {
            setInterimTranscript(interimTrans);
          }

          resetNoSpeechTimeout();
          
          if ((finalTrans + interimTrans).trim().length > 0 && silenceThresholdRef.current > 0 && stageRef.current === "listening") {
            if (silenceTimerRef.current) {
              clearTimeout(silenceTimerRef.current);
            }
            silenceTimerRef.current = setTimeout(() => {
              stopListeningAndAnalyzeRef.current();
            }, silenceThresholdRef.current * 1000);
          }
        };

        recognitionRef.current.onend = () => {
          if (stageRef.current === "listening" && !useAzureRef.current) {
            setTimeout(() => {
              try {
                if (stageRef.current === "listening") {
                  recognitionRef.current.start();
                }
              } catch (e) {
                console.log("Auto-restart ignored:", e);
              }
            }, 300);
          } else if (stageRef.current === "idle" && wakeWordEnabledRef.current) {
            setTimeout(() => {
              try {
                if (stageRef.current === "idle" && wakeWordEnabledRef.current) {
                  recognitionRef.current.start();
                }
              } catch (e) {}
            }, 300);
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          console.warn("Speech recognition error:", event.error);
        };
      }
    }
  }, []);

  // Manage wake word auto-start
  useEffect(() => {
    if (stage === "idle") {
      if (wakeWordEnabled && recognitionRef.current) {
        try { recognitionRef.current.start(); } catch(_) {}
      } else if (!wakeWordEnabled && recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch(_) {}
      }
    }
  }, [wakeWordEnabled, stage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAllSpeech();
      if (azureRecognizerRef.current) {
        try { azureRecognizerRef.current.close(); } catch (_) {}
      }
    };
  }, []);

  const speakBrowser = (text: string, onEnd?: () => void) => {
    if (synthRef.current) {
      synthRef.current.resume();
      synthRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      activeUtteranceRef.current = utterance;

      const selectedVoice = voices.find(v => v.name === selectedVoiceName);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang;
      } else {
        const voicesList = synthRef.current.getVoices();
        let targetVoice = voicesList.find(v => v.lang.includes("en-GB") && v.name.toLowerCase().includes(gender));
        if (!targetVoice) targetVoice = voicesList.find(v => v.lang.includes("en-US") && v.name.toLowerCase().includes(gender));
        if (!targetVoice) targetVoice = voicesList.find(v => v.lang.includes("en"));
        if (targetVoice) {
          utterance.voice = targetVoice;
          utterance.lang = targetVoice.lang;
        } else {
          utterance.lang = "en-US";
        }
      }

      utterance.rate = rate;
      utterance.pitch = pitch;

      setStage("speaking");
      utterance.onend = () => {
        setStage("idle");
        if (onEnd) onEnd();
      };
      utterance.onerror = (e) => {
        console.warn("Speech error", e);
        setStage("idle");
        if (onEnd) onEnd();
      };

      synthRef.current.speak(utterance);
    } else {
      setStage("idle");
      if (onEnd) onEnd();
    }
  };

  const stopAllSpeech = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    if (activeAudioRef.current) {
      try {
        activeAudioRef.current.pause();
        activeAudioRef.current.currentTime = 0;
      } catch (e) {
        console.warn("Audio pause error:", e);
      }
      activeAudioRef.current = null;
    }
  };

  /**
   * speakWithAzureTTS – uses Azure Neural TTS for a given language.
   * Returns a promise that resolves when audio completes.
   */
  const speakWithAzureTTS = async (text: string, lang: string, onEnd?: () => void) => {
    if (!text.trim()) {
      if (onEnd) onEnd();
      return;
    }
    const azureKey = customAzureKey || '';
    const azureRegion = customAzureRegion || azureConfig?.region || '';
    try {
      const response = await aiFetch('/api/speaking/azure-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language: lang, autoLang: true, gender, uzbekVoice, key: azureKey || undefined, region: azureRegion || undefined })
      });
      if (!response.ok) throw new Error('Azure TTS failed');
      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      activeAudioRef.current = audio;
      audio.playbackRate = rate;
      audio.onended = () => {
        activeAudioRef.current = null;
        if (onEnd) onEnd();
      };
      audio.onerror = () => {
        activeAudioRef.current = null;
        if (onEnd) onEnd();
      };
      await audio.play();
    } catch (err) {
      console.warn('Azure TTS error:', err);
      if (onEnd) onEnd();
    }
  };

  // Synthesize ONE chunk of text in ONE voice. English → ElevenLabs (premium),
  // Uzbek/Korean/Chinese/Japanese/Russian → free Edge native voice (single, consistent timbre).
  const fetchVoiceUrl = async (txt: string, voiceLang: "english" | "uzbek" | "korean" | "chinese" | "japanese" | "russian"): Promise<string | null> => {
    if (!txt || !txt.trim()) return null;
    const azureKey = customAzureKey || '';
    const azureRegion = customAzureRegion || azureConfig?.region || '';
    try {
      if (voiceLang === "english") {
        let res = await aiFetch('/api/speaking/synth', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: txt, gender }),
        });
        if (!res.ok) {
          res = await aiFetch('/api/speaking/azure-tts', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: txt, language: 'english', gender }),
          });
        }
        if (!res.ok) return null;
        return URL.createObjectURL(await res.blob());
      }
      const res = await aiFetch('/api/speaking/azure-tts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: txt, language: voiceLang, autoLang: false, gender, uzbekVoice: gender === 'female' ? 'madina' : 'sardor', key: azureKey || undefined, region: azureRegion || undefined }),
      });
      if (!res.ok) return null;
      return URL.createObjectURL(await res.blob());
    } catch { return null; }
  };

  const speak = async (text: string, onEnd?: () => void, uzbekText?: string) => {
    stopAllSpeech();
    setStage("thinking"); // Stay in thinking while loading audio
    const full = `${uzbekText && uzbekText.trim() ? uzbekText.trim() + ' ' : ''}${text || ''}`.trim();
    if (!full) { setStage('idle'); if (onEnd) onEnd(); return; }

    const playUrls = (urls: (string | null)[]) => {
      let i = 0;
      const playNext = () => {
        while (i < urls.length && !urls[i]) i++;
        if (i >= urls.length) { setStage('idle'); if (onEnd) onEnd(); return; }
        setStage("speaking"); // Move mouth ONLY when audio actually starts playing
        const audio = new Audio(urls[i] as string);
        i++;
        activeAudioRef.current = audio;
        try { audio.playbackRate = rate; } catch {}
        audio.onended = playNext;
        audio.onerror = playNext;
        audio.play().catch(playNext);
      };
      playNext();
    };

    // ALWAYS one consistent voice for the ENTIRE reply — it never switches mid-answer,
    // even when an Uzbek correction and an English question appear together.
    // Gender choice is preserved: female → Sarah/Madina, male → George/Sardor.
    // English-dominant reply → premium ElevenLabs; Uzbek/Korean/Chinese → Edge native voice.
    const voiceLang = language === 'auto' ? detectVoiceLang(full) : language;
    const url = await fetchVoiceUrl(full, voiceLang);
    playUrls([url]);
  };

  const speakElevenLabs = async (text: string, onEnd?: () => void) => {
    if (useElevenLabs) {
      try {
        setStage("thinking"); // Stay in thinking while loading audio
        const response = await aiFetch('/api/speaking/synth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            text, 
            gender,
            model_id: 'eleven_multilingual_v2',
            stability: 0.38,
            style: 0.15,
            voiceId: customVoiceId || undefined
          })
        });

        if (!response.ok) throw new Error('ElevenLabs synthesis failed');

        const blob = await response.blob();
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        activeAudioRef.current = audio;

        setStage("speaking"); // Move mouth ONLY when audio actually starts playing
        
        audio.preservesPitch = false;
        // @ts-expect-error webkitPreservesPitch standart TS tiplarida yo'q (faqat WebKit)
        if (typeof audio.webkitPreservesPitch !== 'undefined') {
          // @ts-expect-error webkitPreservesPitch standart TS tiplarida yo'q (faqat WebKit)
          audio.webkitPreservesPitch = false;
        }
        audio.playbackRate = pitch !== 1.0 ? rate * pitch : rate;

        audio.onended = () => {
          activeAudioRef.current = null;
          setStage("idle");
          if (onEnd) onEnd();
        };

        audio.onerror = (e) => {
          activeAudioRef.current = null;
          console.warn("Audio playback error, falling back to browser voice", e);
          speakBrowser(text, onEnd);
        };

        await audio.play();
      } catch (error) {
        activeAudioRef.current = null;
        console.warn("ElevenLabs failed, falling back to browser voice:", error);
        speakBrowser(text, onEnd);
      }
    } else {
      speakBrowser(text, onEnd);
    }
  };

  const toggleJarvis = () => {
    if (stage === "idle") {
      startListening();
    } else if (stage === "listening") {
      stopListeningAndAnalyze();
    } else if (stage === "speaking" || stage === "thinking") {
      isSessionActiveRef.current = false;
      stopAllSpeech();
      stopListening();
      if (noSpeechTimeoutRef.current) {
        clearTimeout(noSpeechTimeoutRef.current);
      }
      setStage("idle");
    }
  };

  const startBrowserListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setStage("listening");
      } catch (e) {
        console.warn("Browser SpeechRecognition failed:", e);
      }
    } else {
      showNotice("Sizning brauzeringizda ovozni aniqlash moslamasi topilmadi.");
    }
  };

  const startListening = async () => {
    isSessionActiveRef.current = true;
    setTranscript("");
    setInterimTranscript("");
    resetNoSpeechTimeout();

    if (useAzure && speechSDK && azureConfig) {
      try {
        if (azureRecognizerRef.current) {
          try { azureRecognizerRef.current.stopContinuousRecognitionAsync(); } catch (_) {}
        }
        const { token, region } = azureConfig;
        const speechConfig = speechSDK.SpeechConfig.fromAuthorizationToken(token, region);
        
        if (language === "korean") speechConfig.speechRecognitionLanguage = "ko-KR";
        else if (language === "chinese") speechConfig.speechRecognitionLanguage = "zh-CN";
        else if (language === "uzbek") speechConfig.speechRecognitionLanguage = "uz-UZ";
        else speechConfig.speechRecognitionLanguage = "en-US";

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
          resetNoSpeechTimeout();
          if (e.result.text.trim() && silenceThresholdRef.current > 0) {
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = setTimeout(() => stopListeningAndAnalyzeRef.current(), silenceThresholdRef.current * 1000);
          }
        };

        recognizer.recognized = (s: any, e: any) => {
          if (e.result.reason === speechSDK.ResultReason.RecognizedSpeech) {
            const text = e.result.text;
            if (text) {
              setTranscript(prev => (prev + " " + text).trim());
              setInterimTranscript("");
              resetNoSpeechTimeout();
              if (silenceThresholdRef.current > 0) {
                if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
                silenceTimerRef.current = setTimeout(() => stopListeningAndAnalyzeRef.current(), silenceThresholdRef.current * 1000);
              }
            }
          }
        };

        azureRecognizerRef.current = recognizer;
        recognizer.startContinuousRecognitionAsync();
        setStage("listening");
      } catch (err) {
        console.error("Failed starting Azure Recognizer:", err);
        startBrowserListening();
      }
    } else {
      startBrowserListening();
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

  const stopListeningAndAnalyze = async () => {
    if (noSpeechTimeoutRef.current) {
      clearTimeout(noSpeechTimeoutRef.current);
    }
    stopListening();

    const finalAnswer = (transcript + " " + interimTranscript).trim();
    setInterimTranscript("");

    if (!finalAnswer) {
      showNotice("Iltimos, mikrofonga biror narsa gapiring.");
      setStage("idle");
      return;
    }

    await submitUserMessage(finalAnswer);
  };

  // Shared: send a user message (from voice OR typed text) to the tutor.
  const submitUserMessage = async (finalAnswer: string) => {
    checkVocabularyBooster(finalAnswer);

    const updatedConversation = [...conversation, { role: "user" as const, text: finalAnswer }];
    setConversation(updatedConversation);
    setStage("thinking");
    setJarvisText("...");

    try {
      const response = await aiFetch('/api/speaking/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation: updatedConversation,
          personality: personality,
          language: language,
          conversationMode: conversationMode,
          verbosity: verbosity
        })
      });

      if (!response.ok) {
        throw new Error('Teacher javob bera olmadi. Tizimda xatolik.');
      }

      const data = await response.json();
      const aiReply = data.nextResponse;
      const speechText = data.speechText || aiReply;
      const uzbekTts = data.uzbekText || '';
      if (data.grammarReport && data.grammarReport.mistakesFound) {
        setGrammarReport(data.grammarReport);
      } else {
        setGrammarReport(null);
      }

      setJarvisText(aiReply);
      setConversation(prev => [...prev, { role: "ai" as const, text: aiReply }]);
      speak(speechText, () => {
        if (isSessionActiveRef.current) {
          startListening();
        }
      }, uzbekTts);
    } catch (error: any) {
      console.warn("Teacher API error:", error);
      const fallbackReplies = {
        kind: "Uzr, biroz aloqa yaxshi emas. Hammasi joyida, qaytadan gapirib ko'ring!",
        sarcastic: "Internetim qotib qoldi, lekin sizning ingliz tili xatolaringiz baribir ko'rinib turibdi. Qaytadan gapiring!",
        formal: "Tizim xatoligi yuz berdi. Iltimos, qaytadan urinib ko'ring.",
        toxic: "Tizim ham sizning signalingizdan charchadi shekilli, xatolik yuz berdi. Tezda qaytadan urinib ko'ring!",
        romantic: "Voy baxtim, aloqa uzilib qoldi. Sizni yana eshitishim uchun qaytadan gapira olasizmi?"
      };
      const fallbackSpeech = {
        kind: "Sorry, I had a connection issue. Please say that again.",
        sarcastic: "My server lagged, but your English mistakes are still there. Say it again!",
        formal: "A system error occurred. Please try again.",
        toxic: "Even the system is tired of your signal, an error occurred. Speak again!",
        romantic: "Oh dear, the connection was lost. Could you speak again for me?"
      };
      const fallbackText = fallbackReplies[personality];
      const fallbackSpeechText = fallbackSpeech[personality];
      
      setJarvisText(fallbackText);
      setConversation(prev => [...prev, { role: "ai" as const, text: fallbackText }]);
      speak(fallbackSpeechText, () => {
        if (isSessionActiveRef.current) {
          startListening();
        }
      });
    }
  };

  // Send a typed message (no microphone needed).
  const sendTyped = async () => {
    const text = typedMsg.trim();
    if (!text || stage === "thinking" || stage === "speaking") return;
    setTypedMsg("");
    try { stopListening(); } catch (_) {}
    setTranscript("");
    setInterimTranscript("");
    await submitUserMessage(text);
  };

  const isDark = theme === "dark";

  return (
    <div className={`min-h-screen flex flex-col font-sans overflow-hidden selection:bg-cyan-500/20 selection:text-cyan-400 relative transition-colors duration-300 ${
      isDark ? 'bg-[#020205] text-white' : 'bg-[#f4f5f8] text-[#18181b]'
    }`}>
      {/* 3 Interactive Face Innovations stylesheet */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes breath {
          0%, 100% { transform: translateY(0px) scaleY(1); }
          50% { transform: translateY(-1.5px) scaleY(1.006); }
        }
        .avatar-breath {
          animation: breath 4.2s ease-in-out infinite;
          transform-origin: bottom center;
        }

        @keyframes subtleSway {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(0.4deg); }
        }
        .avatar-sway {
          animation: subtleSway 9s ease-in-out infinite;
          transform-origin: bottom center;
        }

        @keyframes blink {
          0%, 96%, 100% { transform: scaleY(1); }
          98% { transform: scaleY(0.08); }
        }
        .avatar-blink-animation {
          animation: blink 4.5s ease-in-out infinite;
          transform-origin: center;
        }

        @keyframes speakingMouthEva {
          0%, 100% { ry: 1.2px; rx: 5.5px; }
          25% { ry: 3.5px; rx: 4.8px; }
          50% { ry: 2.0px; rx: 5.8px; }
          75% { ry: 4.2px; rx: 5px; }
        }
        .mouth-speaking-eva {
          animation: speakingMouthEva 0.22s ease-in-out infinite;
          transform-origin: 50px 65px;
        }

        @keyframes speakingMouthAdam {
          0%, 100% { ry: 1px; rx: 5px; }
          25% { ry: 2.8px; rx: 4.2px; }
          50% { ry: 1.5px; rx: 5.5px; }
          75% { ry: 3.2px; rx: 4.5px; }
        }
        .mouth-speaking-adam {
          animation: speakingMouthAdam 0.22s ease-in-out infinite;
          transform-origin: 50px 67px;
        }
      `}} />

      {notice && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className={`px-4 py-3 rounded-xl border backdrop-blur-md shadow-2xl flex items-center gap-2 text-xs font-semibold ${
            isDark 
              ? 'bg-zinc-950/80 border-cyan-500/30 text-cyan-400' 
              : 'bg-white/90 border-cyan-500/20 text-cyan-700'
          }`}>
            <span className="animate-pulse">🔔</span>
            {notice}
          </div>
        </div>
      )}
      
      {/* Background cyber glows */}
      <div className={`absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full blur-[130px] transition-colors duration-1000 pointer-events-none -z-10 ${
        isDark ? 'opacity-10' : 'opacity-15'
      } ${
        personality === 'kind' ? 'bg-emerald-500' :
        personality === 'formal' ? 'bg-purple-600' :
        personality === 'toxic' ? 'bg-rose-500' :
        personality === 'romantic' ? 'bg-sky-500' :
        'bg-amber-500'
      }`}></div>

      <header className="p-6 flex justify-between items-center z-10">
        <Link href="/dashboard" className={`transition-colors uppercase text-[10px] tracking-widest font-mono font-bold ${
          isDark ? 'text-zinc-550 hover:text-cyan-400' : 'text-zinc-500 hover:text-cyan-600'
        }`}>
          [ Terminate Session ]
        </Link>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-3 text-[10px] uppercase font-mono font-black tracking-widest text-zinc-500">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              TTS: {useElevenLabs ? "ElevenLabs (Premium)" : "Edge TTS (Free)"}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              STT: {useAzure ? "Azure (Neural)" : "Web Speech (Local)"}
            </span>
          </div>

          <button
            onClick={toggleTheme}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
              isDark
                ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white'
                : 'bg-white border-zinc-200 text-zinc-700 hover:text-black shadow-sm'
            }`}
          >
            {isDark ? "☀️ Light" : "🌙 Dark"}
          </button>
          
          <button
            onClick={() => setShowSettings(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
              isDark
                ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white'
                : 'bg-white border-zinc-200 text-zinc-700 hover:text-black shadow-sm'
            }`}
          >
            ⚙️ Sozlamalar
          </button>
          
          {xp > 0 && (
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-mono text-[9px] font-black uppercase tracking-wider shadow-[0_0_10px_rgba(16,185,129,0.15)]`}>
              <span>🏆 Vocab XP:</span>
              <span>{xp}</span>
            </div>
          )}
          
          <div className={`font-bold tracking-widest uppercase text-xs font-mono ${
            isDark ? 'text-cyan-500' : 'text-cyan-600'
          }`}>
            TEACHER // {conversationMode === "casual" ? "Casual Chat" : "IELTS Protocol"}
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 relative">
        {/* Dynamic customized grid background per avatar style */}
        {renderDynamicBackground(avatarStyle, isDark)}

        {/* Teacher Core Element */}
        {avatarStyle === "orb" ? (
          <button 
            onClick={toggleJarvis}
            className={`relative w-64 h-64 md:w-80 md:h-80 rounded-full border flex items-center justify-center cursor-pointer group z-10 orb-3d ${
              stage === 'listening' 
                ? 'orb-3d-glow-rose text-rose-500 orb-listening-anim scale-105'
                : stage === 'thinking'
                  ? 'orb-3d-glow-sky text-sky-500 orb-morph-anim scale-105'
                  : stage === 'speaking'
                    ? `orb-speaking-anim scale-105 ${
                        personality === 'kind' ? 'orb-3d-glow-emerald text-emerald-500' :
                        personality === 'formal' ? 'orb-3d-glow-purple text-purple-500' :
                        personality === 'toxic' ? 'orb-3d-glow-rose text-rose-500' :
                        personality === 'romantic' ? 'orb-3d-glow-sky text-sky-500' :
                        'orb-3d-glow-amber text-amber-500'
                      }`
                    : `orb-morph-anim ${
                        personality === 'kind' ? 'orb-3d-glow-emerald text-emerald-500' :
                        personality === 'formal' ? 'orb-3d-glow-purple text-purple-500' :
                        personality === 'toxic' ? 'orb-3d-glow-rose text-rose-500' :
                        personality === 'romantic' ? 'orb-3d-glow-sky text-sky-500' :
                        'orb-3d-glow-amber text-amber-500'
                      }`
            }`}
          >
            {/* Dynamic 3D Ripple Rings on listening */}
            {stage === 'listening' && (
              <>
                <div className="ripple-ring ripple-ring-1 text-rose-500/30"></div>
                <div className="ripple-ring ripple-ring-2 text-rose-500/20"></div>
                <div className="ripple-ring ripple-ring-3 text-rose-500/10"></div>
              </>
            )}
            
            {/* Static inner rings (no rotation — keeps the orb calm) */}
            <div className="absolute inset-4 border border-zinc-500/5 rounded-full pointer-events-none"></div>
            <div className="absolute inset-8 border border-zinc-500/5 rounded-full pointer-events-none"></div>

            <div className="text-center px-4 select-none z-20 w-full flex items-center justify-center">
              {stage === "idle" && (
                <div className="flex flex-col items-center gap-1.5 animate-pulse">
                  <span className="text-2xl drop-shadow-md">🎙️</span>
                  <span className="font-mono text-[9px] uppercase tracking-widest font-bold opacity-80 drop-shadow-md">
                    Tap to Speak
                  </span>
                </div>
              )}
              {stage === "listening" && (
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-2xl animate-ping text-rose-500">🔴</span>
                  <span className="font-mono text-[9px] uppercase tracking-widest font-bold text-rose-400 drop-shadow-md">
                    Listening
                  </span>
                </div>
              )}
              {stage === "thinking" && (
                <div className="flex flex-col items-center gap-2">
                  <div className="flex gap-1 h-3 items-end">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: '0ms', animationDuration: '0.8s' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: '150ms', animationDuration: '0.8s' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: '300ms', animationDuration: '0.8s' }} />
                  </div>
                  <span className="font-mono text-[9px] uppercase tracking-widest font-bold text-sky-400 drop-shadow-md">
                    O'ylanmoqda
                  </span>
                </div>
              )}
              {stage === "speaking" && (
                <div className="flex flex-col items-center gap-1.5">
                  <div className="flex gap-1 items-center justify-center h-5">
                    <div className="w-1 h-3 bg-current rounded animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-1 h-5 bg-current rounded animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-1 h-2 bg-current rounded animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                    <div className="w-1 h-4 bg-current rounded animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                  <span className="font-mono text-[9px] uppercase tracking-widest font-bold opacity-80 drop-shadow-md">
                    Speaking
                  </span>
                </div>
              )}
            </div>
          </button>
        ) : (
          <button 
            onClick={toggleJarvis}
            className={`relative w-72 h-72 md:w-96 md:h-96 flex items-center justify-center cursor-pointer group z-10 bg-transparent border-none outline-none focus:outline-none hover:scale-105 active:scale-95 transition-all duration-350`}
          >
            {/* Dynamic 3D Ripple Rings on listening for borderless avatar */}
            {stage === 'listening' && (
              <>
                <div className="ripple-ring ripple-ring-1 text-rose-500/25"></div>
                <div className="ripple-ring ripple-ring-2 text-rose-500/12"></div>
              </>
            )}
            <div className="w-full h-full flex items-center justify-center animate-in zoom-in-95 duration-500">
              {avatarStyle === "face" && renderCyberFace(stage)}
              {avatarStyle === "robot" && renderRoboTutor(stage)}
              {avatarStyle === "animal" && renderPandaMascot(stage)}
              {avatarStyle === "alien" && renderAlienTutor(stage)}
              {avatarStyle === "ninja" && renderNinjaTutor(stage)}
              {avatarStyle === "eva" && renderEvaTutor(stage, mousePos)}
              {avatarStyle === "adam" && renderAdamTutor(stage, mousePos)}
            </div>
          </button>
        )}

        {avatarStyle !== "orb" && (
          <div className={`mt-4 px-3.5 py-1.5 rounded-full text-[9px] uppercase font-mono tracking-widest font-black border backdrop-blur-md shadow-lg transition-all ${
            stage === 'listening' ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 animate-pulse' :
            stage === 'thinking' ? 'bg-sky-500/10 border-sky-500/30 text-sky-400 animate-pulse' :
            stage === 'speaking' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
            'bg-zinc-500/10 border-zinc-550/30 text-zinc-400'
          }`}>
            {stage === 'listening' ? '🎙️ Listening' :
             stage === 'thinking' ? '💬 O\'ylanmoqda' :
             stage === 'speaking' ? '🔊 Speaking' :
             '💤 Tap to Speak'}
          </div>
        )}

        {/* Subtitles / Text Output */}
        <div className="mt-16 text-center max-w-2xl z-10 px-4">
          
          {/* Grammar Report Card Toast */}
          {grammarReport && (
            <div className="mb-6 mx-auto bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-left animate-in fade-in slide-in-from-bottom-4 duration-500 relative shadow-[0_4px_30px_rgba(245,158,11,0.1)] backdrop-blur-md">
              <button 
                onClick={() => setGrammarReport(null)}
                className="absolute top-3 right-3 text-amber-500/50 hover:text-amber-500 font-bold"
              >✕</button>
              <div className="flex items-center gap-2 mb-2 text-amber-500 font-bold text-xs uppercase tracking-widest">
                <span>📝</span> Grammar Report
              </div>
              <div className="space-y-3 mt-3">
                <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-3 relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500/50"></div>
                  <span className="text-[10px] uppercase font-bold text-red-400 block mb-1">You said:</span>
                  <span className="text-sm font-medium text-red-300 line-through decoration-red-500/50">{grammarReport.userSentence}</span>
                </div>
                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3 relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500/50"></div>
                  <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-1">Better:</span>
                  <span className="text-sm font-bold text-emerald-300">{grammarReport.correctedSentence}</span>
                </div>
                <p className="text-xs text-amber-200/80 leading-relaxed font-medium mt-2 px-1">
                  {grammarReport.explanation}
                </p>
              </div>
            </div>
          )}

          {/* Waveform visualizer beneath orb */}
          {stage === 'speaking' && (
            <div className="flex justify-center gap-1.5 mb-6 h-8 items-center">
              {[...Array(12)].map((_, i) => {
                const heights = ["h-3", "h-6", "h-4", "h-7", "h-2", "h-5", "h-8", "h-3", "h-6", "h-4", "h-7", "h-2"];
                return (
                  <div
                    key={i}
                    className={`w-1 rounded transition-all duration-300 ${
                      personality === 'kind' ? 'bg-emerald-500' :
                      personality === 'formal' ? 'bg-purple-500' :
                      personality === 'toxic' ? 'bg-rose-500' :
                      personality === 'romantic' ? 'bg-sky-500' : 'bg-amber-500'
                    } ${heights[i]} animate-pulse`}
                    style={{ animationDelay: `${i * 0.05}s`, animationDuration: "0.6s" }}
                  />
                );
              })}
            </div>
          )}

          <p className={`text-lg md:text-xl font-medium leading-relaxed drop-shadow-sm min-h-[60px] transition-colors ${
            isDark ? 'text-zinc-100' : 'text-zinc-800'
          }`}>
            "{jarvisText}"
          </p>

          {stage === "listening" && silenceThreshold > 0 && (
            <p className="text-[10px] uppercase font-mono text-zinc-500 animate-pulse mt-2 mb-4">
              ⏱️ Jimlik aniqlansa avtomatik yuboriladi ({silenceThreshold}s)
            </p>
          )}
          
          {(transcript || interimTranscript) && stage === "listening" && (
            <div className={`mt-8 border rounded-xl p-4 text-left max-w-md mx-auto shadow-2xl animate-in fade-in transition-all ${
              isDark ? 'bg-zinc-950/80 border-zinc-900' : 'bg-white border-zinc-200'
            }`}>
              <p className="text-[10px] uppercase font-bold tracking-wider text-rose-500 font-mono block mb-2">Live Transcript:</p>
              <p className={`text-sm italic font-mono ${
                isDark ? 'text-zinc-400' : 'text-zinc-650'
              }`}>
                {transcript} <span className={isDark ? 'text-zinc-600 not-italic' : 'text-zinc-400 not-italic'}>{interimTranscript}</span>
              </p>
            </div>
          )}
        </div>

        {/* Vocabulary Booster Suggestion Box */}
        {vocabTip && (
          <div className={`mt-6 p-4 rounded-xl border animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-md mx-auto shadow-2xl flex items-center justify-between gap-4 z-15 relative ${
            isDark ? 'bg-zinc-950/90 border-emerald-500/30' : 'bg-emerald-50/90 border-emerald-500/20'
          }`}>
            <div className="flex flex-col gap-1 text-left">
              <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 font-mono">💡 Band 9 Vocabulary Tip</span>
              <span className={`text-xs leading-normal ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                You used <strong className="text-rose-500 font-bold">"{vocabTip.simple}"</strong>. Next time, try using <strong className="text-emerald-400 font-bold">"{vocabTip.band9}"</strong> instead to boost your IELTS score!
              </span>
            </div>
            <button 
              onClick={() => setVocabTip(null)} 
              className={`text-xs p-1 opacity-60 hover:opacity-100 ${isDark ? 'text-white' : 'text-black'}`}
            >
              ✕
            </button>
          </div>
        )}

        {/* XP Level Up Toast */}
        {xpAnimation?.active && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 animate-bounce">
            <div className="px-6 py-4 rounded-2xl bg-emerald-500 text-black border-2 border-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.6)] font-black text-center uppercase tracking-widest text-xs flex flex-col items-center gap-1">
              <span className="text-xl">✨ LEVEL UP! ✨</span>
              <span className="text-[10px] tracking-normal font-bold">{xpAnimation.message}</span>
            </div>
          </div>
        )}

        {/* Type instead of speak — for users who can't use a mic */}
        <div className="w-full max-w-xl mt-8 z-10 px-2">
          <div className={`flex items-center gap-2 rounded-2xl border px-2 py-2 ${isDark ? 'bg-zinc-950/60 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'}`}>
            <input
              value={typedMsg}
              onChange={(e) => setTypedMsg(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); sendTyped(); } }}
              placeholder={stage === 'thinking' || stage === 'speaking' ? 'Teacher javob bermoqda…' : 'Yozib yuboring (mikrofon shart emas)…'}
              disabled={stage === 'thinking' || stage === 'speaking'}
              className={`flex-1 bg-transparent outline-none text-sm px-3 py-2 disabled:opacity-50 ${isDark ? 'text-white placeholder:text-zinc-600' : 'text-zinc-900 placeholder:text-zinc-400'}`}
            />
            <button
              onClick={sendTyped}
              disabled={!typedMsg.trim() || stage === 'thinking' || stage === 'speaking'}
              className="shrink-0 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold text-sm px-5 py-2 rounded-xl transition-colors"
            >
              Yuborish
            </button>
          </div>
          {showUIHints && (
            <p className={`text-center text-[10px] mt-2 font-mono tracking-wider ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>🎙 Ovoz uchun yadroni bosing · ⌨ yoki shu yerga yozing</p>
          )}
        </div>

        {/* Conversation Log Toggle */}
        {conversation.length > 1 && (
          <div className={`w-full max-w-xl mt-12 border-t pt-6 z-10 transition-all ${
            isDark ? 'border-zinc-900/60' : 'border-zinc-200'
          }`}>
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className={`text-[10px] font-bold font-mono tracking-widest uppercase transition-colors mx-auto block ${
                isDark ? 'text-zinc-550 hover:text-zinc-300' : 'text-zinc-450 hover:text-zinc-800'
              }`}
            >
              {showHistory ? "[ Hide Conversation Log ]" : "[ Show Conversation Log ]"}
            </button>

            {showHistory && (
              <div className="mt-4 space-y-4 max-h-[200px] overflow-y-auto pr-2">
                {conversation.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] p-3.5 rounded-xl border text-sm leading-relaxed transition-all ${
                      msg.role === "user" 
                        ? (isDark ? 'bg-zinc-900/40 border-zinc-800 text-zinc-200' : 'bg-zinc-100 border-zinc-200 text-zinc-800') 
                        : (isDark ? 'bg-zinc-950/60 border-zinc-900 text-zinc-400' : 'bg-white border-zinc-200 text-zinc-500')
                    }`}>
                      <span className="text-[8px] font-bold uppercase tracking-wider font-mono block opacity-40 mb-1">
                        {msg.role === "user" ? "You" : "Teacher"}
                      </span>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Settings Modal (Overlay) */}
        {/* Premium Payment Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-lg flex items-center justify-center z-50 p-6 animate-in fade-in duration-300">
            <div className="border border-amber-500/30 bg-gradient-to-b from-zinc-950 to-black text-white p-8 rounded-3xl max-w-sm w-full shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

              <button
                onClick={() => setShowPaymentModal(false)}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors text-base"
              >
                ✕
              </button>

              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-3xl">
                  👑
                </div>
                <div>
                  <h3 className="font-extrabold text-xl tracking-tight">Pro obuna</h3>
                  <p className="text-[10px] text-amber-500 uppercase font-mono tracking-widest font-black mt-0.5">
                    Premium AI hamrohlar
                  </p>
                </div>

                <p className="text-zinc-400 text-xs leading-relaxed px-2">
                  Fotorealistik AI hamrohlar, cheksiz jonli suhbat va cheksiz AI baholash
                  Pro obunada ochiladi.
                </p>

                <a
                  href="/pro"
                  className="block w-full bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-widest py-3.5 rounded-xl transition-colors"
                >
                  Tariflarni ko’rish
                </a>

                <p className="text-[10px] text-zinc-600 leading-relaxed">
                  Obuna hisobingizga bog’lanadi va barcha qurilmalarda ishlaydi.
                </p>
              </div>
            </div>
          </div>
        )}
      
        {showSettings && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in-50 duration-200">
            <div className={`border p-8 rounded-2xl max-w-md w-full shadow-2xl transition-all ${
              isDark ? 'bg-zinc-950 border-zinc-900 text-white' : 'bg-white border-zinc-200 text-zinc-900'
            }`}>
              <div className="flex justify-between items-center mb-6 border-b pb-3 border-zinc-900/30 dark:border-zinc-800/60">
                <h3 className="font-bold text-base flex items-center gap-1.5">
                  <span>⚙️</span> Ovoz va Muloqot Sozlamalari
                </h3>
                <button onClick={() => setShowSettings(false)} className={`text-xl hover:opacity-75 ${isDark ? "text-zinc-400 hover:text-white" : "text-zinc-500 hover:text-black"}`}>✕</button>
              </div>
              
              <div className="space-y-5 overflow-y-auto max-h-[65vh] pr-2 scrollbar-none text-xs">
                
                {/* Language Selector */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Muloqot tili (Practice Language)</label>
                  <div className={`p-1.5 grid grid-cols-3 gap-1.5 border rounded-xl ${
                    isDark ? 'bg-zinc-900/50 border-zinc-850' : 'bg-zinc-50 border-zinc-200'
                  }`}>
                    {[
                      { key: "auto", label: "Auto", isAuto: true },
                      { key: "english", label: "English" },
                      { key: "uzbek", label: "O'zbek" },
                      { key: "korean", label: "Korean" },
                      { key: "chinese", label: "Chinese" },
                      { key: "japanese", label: "Japanese" },
                      { key: "russian", label: "Russian" }
                    ].filter(opt => opt.isAuto || opt.key === "uzbek" || activeLangs.includes(opt.key)).map((langOpt) => (
                      <button
                        key={langOpt.key}
                        type="button"
                        onClick={() => handleSaveLanguage(langOpt.key as any)}
                        className={`py-1.5 px-1 rounded-lg text-[10px] font-bold transition-all border text-center flex items-center justify-center gap-1.5 ${
                          language === langOpt.key
                            ? 'bg-cyan-500 text-black border-transparent shadow-sm'
                            : (isDark
                              ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white'
                              : 'bg-white border-zinc-250 text-zinc-750 hover:text-black shadow-sm')
                        }`}
                      >
                        <FlagIcon lang={langOpt.key} className="w-3.5 h-3.5 rounded-full overflow-hidden shrink-0" />
                        <span>{langOpt.label}</span>
                      </button>
                    ))}
                  </div>
                  {language === "auto" && (
                    <p className="text-[10px] text-cyan-500/80 font-medium">✨ Auto: qaysi tilda gapirsangiz/yozsangiz — shu tilda javob beradi va bitta ovozda o'qiydi.</p>
                  )}
                </div>

                {/* Active Languages Selector */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Faol Tillar (Active Courses)</label>
                  <p className="text-[9px] text-zinc-500 -mt-1.5">Dashboard va sozlamalarda chiqadigan kurslarni tanlang:</p>
                  <div className={`p-2 grid grid-cols-2 gap-2 border rounded-xl ${
                    isDark ? 'bg-zinc-900/50 border-zinc-850' : 'bg-zinc-50 border-zinc-200'
                  }`}>
                    {[
                      { id: "english", label: "English" },
                      { id: "russian", label: "Русский" },
                      { id: "japanese", label: "日本語" },
                      { id: "korean", label: "한국어" },
                      { id: "chinese", label: "中文" }
                    ].map((l) => {
                      const isActive = activeLangs.includes(l.id);
                      return (
                        <label 
                          key={l.id} 
                          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border cursor-pointer select-none text-[10px] font-bold transition-all ${
                            isActive 
                              ? (isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-zinc-300 text-zinc-900 shadow-sm') 
                              : 'opacity-40 border-transparent text-zinc-500'
                          }`}
                        >
                          <input 
                            type="checkbox"
                            checked={isActive}
                            onChange={() => toggleActiveLanguage(l.id)}
                            className="accent-cyan-500 rounded cursor-pointer w-3 h-3 shrink-0"
                          />
                          <FlagIcon lang={l.id} className="w-3.5 h-3.5 rounded-full overflow-hidden shrink-0" />
                          <span>{l.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* UI Display Settings */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">UI Sozlamalari (UI Display)</label>
                  <label className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border cursor-pointer select-none text-[10px] font-bold transition-all ${
                    showUIHints 
                      ? (isDark ? 'bg-zinc-900/50 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900 shadow-sm') 
                      : 'opacity-45 border-zinc-800/20 text-zinc-500'
                  }`}>
                    <input 
                      type="checkbox"
                      checked={showUIHints}
                      onChange={() => {
                        const next = !showUIHints;
                        setShowUIHints(next);
                        localStorage.setItem("ielts_show_ui_hints", next.toString());
                      }}
                      className="accent-cyan-500 rounded cursor-pointer w-3.5 h-3.5 shrink-0"
                    />
                    <span>💡 Mikrofon/yozish yordamchi matnini ko'rsatish</span>
                  </label>
                </div>

                {/* Avatar Style Selector */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Muloqot Avatari (AI Avatar)</label>
                  <div className={`p-1.5 grid grid-cols-4 gap-1.5 border rounded-xl ${
                    isDark ? 'bg-zinc-900/50 border-zinc-850' : 'bg-zinc-50 border-zinc-200'
                  }`}>
                    {[
                      { key: "orb", label: "🔮 Orb" },
                      { key: "face", label: "👤 Face" },
                      { key: "robot", label: "🤖 Robot" },
                      { key: "animal", label: "🐼 Mascot" },
                      { key: "alien", label: "👽 Alien" },
                      { key: "ninja", label: "🥷 Ninja" },
                      { key: "eva", label: "👑 Eva", premium: true },
                      { key: "adam", label: "👑 Adam", premium: true }
                    ].map((opt) => {
                      const isLocked = opt.premium && !premiumUnlocked;
                      const isSelected = avatarStyle === opt.key;
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => {
                            if (isLocked) {
                              setSelectedPremiumAvatar(opt.key as any);
                              setShowPaymentModal(true);
                              return;
                            }
                            setAvatarStyle(opt.key as any);
                            localStorage.setItem("ielts_avatar_style", opt.key);
                          }}
                          className={`py-2 rounded-lg text-[9px] font-bold transition-all border text-center relative flex flex-col items-center justify-center gap-0.5 ${
                            isSelected
                              ? 'bg-cyan-500 text-black border-transparent shadow-sm'
                              : (isDark
                                ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-750'
                                : 'bg-white border-zinc-250 text-zinc-750 hover:text-black shadow-sm hover:bg-zinc-50')
                          }`}
                        >
                          <span>{opt.label}</span>
                          {isLocked && (
                            <span className="text-[7px] text-amber-500 font-extrabold uppercase scale-90 -mt-0.5">
                              🔒 Lock
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Verbosity Selector */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">AI Gapirish Hajmi (Verbosity)</label>
                  <div className={`p-1 flex gap-1 border rounded-xl ${
                    isDark ? 'bg-zinc-900/50 border-zinc-850' : 'bg-zinc-50 border-zinc-200'
                  }`}>
                    {[
                      { key: "concise", label: "Qisqa", desc: "20-30 so'z" },
                      { key: "normal", label: "O'rtacha", desc: "40-60 so'z" },
                      { key: "detailed", label: "Batafsil", desc: "70-100 so'z" }
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => {
                          setVerbosity(opt.key as any);
                          localStorage.setItem("ielts_verbosity", opt.key);
                        }}
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
                          verbosity === opt.key
                            ? 'bg-cyan-500 text-black border-transparent shadow-sm'
                            : (isDark
                              ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white'
                              : 'bg-white border-zinc-250 text-zinc-750 hover:text-black shadow-sm')
                        }`}
                        title={opt.desc}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Conversation Mode Selector */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Muloqot Rejimi (Conversation Mode)</label>
                  <div className={`p-1 flex gap-1 border rounded-xl ${
                    isDark ? 'bg-zinc-900/50 border-zinc-850' : 'bg-zinc-50 border-zinc-200'
                  }`}>
                    {[
                      { key: "tutor", label: "🎓 IELTS Tutor" },
                      { key: "casual", label: "💬 Casual Chat" }
                    ].map((modeOpt) => (
                      <button
                        key={modeOpt.key}
                        type="button"
                        onClick={() => {
                          setConversationMode(modeOpt.key as any);
                          localStorage.setItem("ielts_conversation_mode", modeOpt.key);
                        }}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                          conversationMode === modeOpt.key
                            ? 'bg-cyan-500 text-black border-transparent shadow-sm'
                            : (isDark
                              ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white'
                              : 'bg-white border-zinc-250 text-zinc-750 hover:text-black shadow-sm')
                        }`}
                      >
                        {modeOpt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Personality Selector */}
                {conversationMode === "tutor" && (
                  <div className="flex flex-col gap-2 animate-in fade-in duration-200">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Ustoz Shaxsiyati (Tone)</label>
                    <div className={`p-1.5 border rounded-xl flex flex-col gap-1.5 ${
                      isDark ? 'bg-zinc-900/50 border-zinc-850' : 'bg-zinc-50 border-zinc-200'
                    }`}>
                      {[
                        { key: "kind", label: "😇 Mehribon (Kind)", desc: "Do'stona va rag'batlantiruvchi" },
                        { key: "sarcastic", label: "😈 Pichingchi (Strict)", desc: "Kinoyali va xatolarga keskin" },
                        { key: "formal", label: "👔 Rasmiy (Academic)", desc: "Akademik va jiddiy tahlil" },
                        { key: "toxic", label: "🤬 Asabiy (Toxic)", desc: "Asabi tez o'qituvchi, tanbeh beradi" },
                        { key: "romantic", label: "💖 Romantik (Emotional)", desc: "Jonim, asalim deb erkalab suhbatlashadi" }
                      ].map((p) => (
                        <button
                          key={p.key}
                          onClick={() => setPersonality(p.key as any)}
                          className={`w-full p-2.5 rounded-lg text-left transition-all border ${
                            personality === p.key
                              ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 font-bold shadow-inner'
                              : (isDark ? 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-805/30' : 'border-transparent text-zinc-650 hover:text-zinc-900 hover:bg-zinc-200/50')
                          }`}
                        >
                          <div className="text-xs">{p.label}</div>
                          <div className="text-[10px] opacity-60 font-normal leading-normal">{p.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ═══ AZURE SPEECH — Premium Setup ═══ */}
                <div className={`border rounded-2xl overflow-hidden transition-all ${
                  isDark ? 'border-cyan-500/20 bg-gradient-to-br from-zinc-900/80 to-zinc-950/80' : 'border-cyan-500/20 bg-gradient-to-br from-cyan-50/50 to-white'
                }`}>
                  {/* Header */}
                  <div className={`px-4 py-3 flex items-center justify-between border-b ${
                    isDark ? 'border-zinc-800/60 bg-cyan-500/5' : 'border-cyan-100 bg-cyan-500/5'
                  }`}>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-cyan-500/15 flex items-center justify-center text-base">🎯</div>
                      <div>
                        <div className="font-black text-xs tracking-wide">Azure Neural Speech</div>
                        <div className="text-[9px] text-zinc-500">O'zbek ovozi · Talaffuz tahlili · Bepul</div>
                      </div>
                    </div>
                    <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      azureConfig && useAzure
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-zinc-500/10 text-zinc-500 border border-zinc-700/30'
                    }`}>
                      {azureConfig && useAzure ? '● FAOL' : '○ OFF'}
                    </div>
                  </div>

                  <div className="p-4 flex flex-col gap-3">
                    {/* Key + Region inputs */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">API Key</label>
                        <input
                          type="password"
                          placeholder="d0c1b7abc..."
                          value={customAzureKey}
                          onChange={e => {
                            setCustomAzureKey(e.target.value);
                            localStorage.setItem("ielts_custom_azure_key", e.target.value);
                          }}
                          className={`border rounded-lg p-2 text-[10px] focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono ${
                            isDark ? 'bg-zinc-950 border-zinc-800 text-cyan-400 placeholder-zinc-700' : 'bg-white border-zinc-200 text-zinc-900 placeholder-zinc-400 shadow-sm'
                          }`}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Region</label>
                        <input
                          type="text"
                          placeholder="eastus"
                          value={customAzureRegion}
                          onChange={e => {
                            setCustomAzureRegion(e.target.value);
                            localStorage.setItem("ielts_custom_azure_region", e.target.value);
                          }}
                          className={`border rounded-lg p-2 text-[10px] focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono ${
                            isDark ? 'bg-zinc-950 border-zinc-800 text-cyan-400 placeholder-zinc-700' : 'bg-white border-zinc-200 text-zinc-900 placeholder-zinc-400 shadow-sm'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Uzbek Voice Selector — Erkak vs Ayol */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">O'zbek AI Ovozi</label>
                      <div className={`p-1 flex gap-1 border rounded-xl ${
                        isDark ? 'bg-zinc-950/60 border-zinc-800' : 'bg-zinc-100 border-zinc-200'
                      }`}>
                        {[
                          { key: "sardor", label: "👨 Erkak", sub: "Natural" },
                          { key: "madina", label: "👩 Ayol", sub: "Yumshoq" }
                        ].map(v => (
                          <button
                            key={v.key}
                            type="button"
                            onClick={() => {
                              setUzbekVoice(v.key as any);
                              const g = v.key === "madina" ? "female" : "male";
                              setGender(g as any);
                              localStorage.setItem("ielts_uzbek_voice", v.key);
                              localStorage.setItem("ielts_voice_gender", g);
                            }}
                            className={`flex-1 py-2 rounded-lg flex flex-col items-center gap-0.5 transition-all border ${
                              uzbekVoice === v.key
                                ? 'bg-cyan-500 text-black border-transparent shadow-md'
                                : isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-750' : 'bg-white border-zinc-300 text-zinc-600 hover:bg-zinc-50'
                            }`}
                          >
                            <span className="text-xs font-black">{v.label}</span>
                            <span className="text-[8px] opacity-70 font-normal">{v.sub}</span>
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          const testTxt = uzbekVoice === 'sardor'
                            ? "Salom, men o'zbek tilida gapiradigan sun'iy intellekt yordamchisiman. IELTS tayyorgarligingizda yordam beraman."
                            : "Salom, men o'zbek tilida gapiradigan sun'iy intellekt yordamchisiman. Ingliz tilingizdagi xatolarni birga tuzatamiz.";
                          await speakWithAzureTTS(testTxt, 'uzbek', () => setStage('idle'));
                        }}
                        className={`w-full py-1.5 rounded-lg text-[10px] font-bold border transition-all flex items-center justify-center gap-1 ${
                          isDark ? 'bg-zinc-800/60 border-zinc-700 text-zinc-300 hover:text-cyan-400 hover:border-cyan-500/30' : 'bg-white border-zinc-200 text-zinc-600 hover:text-cyan-600 shadow-sm'
                        }`}
                      >
                        🔊 Ovozni sinab ko'rish
                      </button>
                    </div>

                    {/* Toggle / Info */}
                    {azureConfig ? (
                      <button
                        type="button"
                        onClick={() => {
                          const v = !useAzure;
                          setUseAzure(v);
                          localStorage.setItem("ielts_use_azure_speech", v.toString());
                        }}
                        className={`w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider border transition-all ${
                          useAzure
                            ? 'bg-gradient-to-r from-cyan-500 to-cyan-400 text-black border-transparent shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                            : isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-cyan-500/30' : 'bg-white border-zinc-200 text-zinc-700 shadow-sm hover:border-cyan-300'
                        }`}
                      >
                        {useAzure ? '✓ Azure Speech (STT): FAOL' : 'Azure Speech (STT): O\'CHIRILGAN'}
                      </button>
                    ) : (
                      <div className={`p-3 rounded-xl border text-[10px] text-center leading-relaxed ${
                        isDark ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400' : 'bg-emerald-50 border-emerald-250 text-emerald-750 shadow-sm'
                      }`}>
                        ✨ <strong>O'zbek AI Ovozi: FAOL!</strong> Tizim Edge/Azure bepul tarmoq ovozini ishlatmoqda. Kalit kiritish shart emas. Talaffuz tahlili (STT) uchun o'z kalitingizni kiritishingiz mumkin.
                      </div>
                    )}
                  </div>
                </div>

                {/* ═══ ELEVENLABS VOICE CLONE — Premium Section ═══ */}
                <div className={`border rounded-2xl overflow-hidden transition-all ${
                  isDark ? 'border-purple-500/20 bg-gradient-to-br from-zinc-900/80 to-zinc-950/80' : 'border-purple-500/20 bg-gradient-to-br from-purple-50/50 to-white'
                }`}>
                  {/* Header */}
                  <div className={`px-4 py-3 flex items-center justify-between border-b ${
                    isDark ? 'border-zinc-800/60 bg-purple-500/5' : 'border-purple-100 bg-purple-500/5'
                  }`}>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-purple-500/15 flex items-center justify-center text-base">🎙️</div>
                      <div>
                        <div className="font-black text-xs tracking-wide">ElevenLabs Voice Clone</div>
                        <div className="text-[9px] text-zinc-500">O'z ovozingizda gapiradigan AI yarating</div>
                      </div>
                    </div>
                    {customVoiceId && (
                      <div className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-purple-500/15 text-purple-400 border border-purple-500/30">
                        ● Ulangan
                      </div>
                    )}
                  </div>

                  <div className="p-4 flex flex-col gap-3">
                    {/* Step 1: Record */}
                    <div className={`rounded-xl border p-3 flex flex-col gap-2 ${
                      isDark ? 'bg-zinc-950/60 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
                    }`}>
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full text-[9px] font-black flex items-center justify-center ${
                          recordedBlob ? 'bg-emerald-500 text-black' : 'bg-zinc-700 text-zinc-300'
                        }`}>1</span>
                        <span className="text-[10px] font-bold text-zinc-400">Ovozingizni yozing (2-3 daqiqa)</span>
                      </div>
                      <div className="flex gap-2 items-center">
                        <button
                          type="button"
                          onClick={async () => {
                            if (isRecording) {
                              // Stop recording
                              mediaRecorderRef.current?.stop();
                              setIsRecording(false);
                              clearInterval(recordingTimerRef.current);
                            } else {
                              // Start recording
                              try {
                                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                                recordingChunksRef.current = [];
                                const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
                                mr.ondataavailable = e => { if (e.data.size > 0) recordingChunksRef.current.push(e.data); };
                                mr.onstop = () => {
                                  const blob = new Blob(recordingChunksRef.current, { type: 'audio/webm' });
                                  setRecordedBlob(blob);
                                  stream.getTracks().forEach(t => t.stop());
                                };
                                mr.start();
                                mediaRecorderRef.current = mr;
                                setIsRecording(true);
                                setRecordingSeconds(0);
                                setRecordedBlob(null);
                                recordingTimerRef.current = setInterval(() => {
                                  setRecordingSeconds(s => s + 1);
                                }, 1000);
                              } catch {
                                showNotice('Mikrofon ruxsati kerak!');
                              }
                            }
                          }}
                          className={`flex-1 py-2 rounded-lg font-black text-[10px] uppercase tracking-wider transition-all border flex items-center justify-center gap-1.5 ${
                            isRecording
                              ? 'bg-rose-500 text-white border-transparent shadow-[0_0_15px_rgba(244,63,94,0.4)] animate-pulse'
                              : recordedBlob
                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                : isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-purple-500/40' : 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100'
                          }`}
                        >
                          {isRecording ? (
                            <><span className="w-2 h-2 rounded-sm bg-white inline-block"/> To'xtatish ({Math.floor(recordingSeconds/60)}:{String(recordingSeconds%60).padStart(2,'0')})</>
                          ) : recordedBlob ? (
                            <>✓ Yozildi — qayta yozish</>
                          ) : (
                            <>🎤 Yozishni boshlash</>
                          )}
                        </button>
                        {recordedBlob && (
                          <button
                            type="button"
                            onClick={() => {
                              const url = URL.createObjectURL(recordedBlob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = 'voice-sample.webm';
                              a.click();
                              URL.revokeObjectURL(url);
                            }}
                            className={`px-3 py-2 rounded-lg font-bold text-[10px] border transition-all ${
                              isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white' : 'bg-white border-zinc-200 text-zinc-600 shadow-sm hover:text-black'
                            }`}
                          >
                            ⬇ Yuklab olish
                          </button>
                        )}
                      </div>
                      {isRecording && (
                        <p className="text-[9px] text-zinc-500 italic">
                          Tabiiy gapirib turing — kitob o'qing, IELTS mavzularida gapiring...
                        </p>
                      )}
                    </div>

                    {/* Step 2: Upload to ElevenLabs */}
                    <div className={`rounded-xl border p-3 flex flex-col gap-1.5 ${
                      isDark ? 'bg-zinc-950/60 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
                    }`}>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full text-[9px] font-black flex items-center justify-center bg-zinc-700 text-zinc-300">2</span>
                        <span className="text-[10px] font-bold text-zinc-400">ElevenLabs ga yuklang va Voice ID oling</span>
                      </div>
                      <a
                        href="https://elevenlabs.io/app/voice-lab"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-bold border transition-all bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20"
                      >
                        🔗 elevenlabs.io ga o'tish →
                      </a>
                      <p className="text-[9px] text-zinc-500 leading-relaxed">
                        Voice Lab → Add Voice → Instant Voice Clone → yuklab olgan faylni tanlang → Add → Voice ID ni ko'chiring
                      </p>
                    </div>

                    {/* Step 3: Paste Voice ID */}
                    <div className={`rounded-xl border p-3 flex flex-col gap-2 ${
                      isDark ? 'bg-zinc-950/60 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
                    }`}>
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full text-[9px] font-black flex items-center justify-center ${
                          customVoiceId ? 'bg-emerald-500 text-black' : 'bg-zinc-700 text-zinc-300'
                        }`}>3</span>
                        <span className="text-[10px] font-bold text-zinc-400">Voice ID ni kiriting</span>
                      </div>
                      <input
                        type="text"
                        placeholder="e.g. EXAVITQu4vr4xnSDxMaL"
                        value={customVoiceId}
                        onChange={e => {
                          setCustomVoiceId(e.target.value);
                          localStorage.setItem("ielts_custom_voice_id", e.target.value);
                        }}
                        className={`border rounded-lg p-2.5 text-[10px] font-mono focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all ${
                          customVoiceId
                            ? isDark ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border-emerald-300 text-emerald-700'
                            : isDark ? 'bg-zinc-950 border-zinc-800 text-white placeholder-zinc-700' : 'bg-white border-zinc-200 text-zinc-900 placeholder-zinc-400 shadow-sm'
                        }`}
                      />
                      {customVoiceId && (
                        <p className="text-[9px] text-emerald-400 font-bold">✓ Klonlangan ovoz ulandi! Ingliz gaplar o'z ovozingizda gapiriladi.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* VAD Silence threshold */}
                <div className={`p-4 border rounded-xl transition-all ${isDark ? "bg-zinc-900/50 border-zinc-850" : "bg-zinc-50 border-zinc-200"}`}>
                  <div className="flex flex-col gap-1 mb-3">
                    <span className="font-extrabold text-sm">Avtomatik yuborish (VAD)</span>
                    <span className="text-[10px] text-zinc-500 leading-normal">Gapirishdan to'xtaganingizda tizim muloqotni avtomatik davom ettiradi.</span>
                  </div>
                  <div className="flex gap-2">
                    {[
                      { label: "O'chirilgan", value: 0 },
                      { label: "Tez (1.5s)", value: 1.5 },
                      { label: "O'rtacha (2s)", value: 2 },
                      { label: "Sekin (3s)", value: 3 }
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setSilenceThreshold(opt.value);
                          localStorage.setItem("ielts_silence_threshold", opt.value.toString());
                        }}
                        className={`flex-1 py-1.5 rounded-lg font-bold transition-all border ${
                          silenceThreshold === opt.value
                            ? "bg-cyan-500 text-black border-transparent shadow-sm"
                            : isDark ? "bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white" : "bg-white border-zinc-200 text-zinc-700 hover:text-black shadow-sm"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Auto-Stop on No Speech */}
                <div className={`p-4 border rounded-xl transition-all ${isDark ? "bg-zinc-900/50 border-zinc-850" : "bg-zinc-50 border-zinc-200"}`}>
                  <div className="flex flex-col gap-1 mb-3">
                    <span className="font-extrabold text-sm">Jimlikda avtomatik to'xtash</span>
                    <span className="text-[10px] text-zinc-500 leading-normal font-normal">Hech narsa gapirmasangiz, muloqot vaqtincha to'xtatiladi.</span>
                  </div>
                  
                  <div className="flex gap-2">
                    {[
                      { label: "30 soniya", value: 30 },
                      { label: "1 daqiqa", value: 60 }
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setNoSpeechTimeout(opt.value);
                          localStorage.setItem("ielts_no_speech_timeout", opt.value.toString());
                        }}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                          noSpeechTimeout === opt.value
                            ? 'bg-cyan-500 text-black border-transparent shadow-sm'
                            : (isDark
                              ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white'
                              : 'bg-white border-zinc-250 text-zinc-705 hover:text-black shadow-sm')
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ElevenLabs Premium Toggle */}
                <div className={`flex items-center justify-between p-4 border rounded-xl transition-all ${
                  isDark ? "bg-zinc-900/50 border-zinc-850" : "bg-zinc-50 border-zinc-200"
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-base ${useElevenLabs ? 'bg-purple-500/15' : 'bg-zinc-700/30'}`}>🎙️</div>
                    <div className="flex flex-col">
                      <span className="font-extrabold text-xs">ElevenLabs Premium TTS</span>
                      <span className="text-[9px] text-zinc-500">{useElevenLabs ? 'Yuqori sifatli ovoz (Ingliz uchun)' : "O'chirilgan — tizim ovozi ishlatiladi"}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const val = !useElevenLabs;
                      setUseElevenLabs(val);
                      localStorage.setItem("ielts_use_eleven_labs", val.toString());
                    }}
                    className={`w-11 h-6 rounded-full transition-all relative flex-shrink-0 ${
                      useElevenLabs ? 'bg-purple-500' : isDark ? 'bg-zinc-700' : 'bg-zinc-300'
                    }`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                      useElevenLabs ? 'left-[calc(100%-1.375rem)]' : 'left-0.5'
                    }`} />
                  </button>
                </div>

                {/* Wake Word Auto-Start Toggle */}
                <div className={`flex items-center justify-between p-4 border rounded-xl transition-all ${
                  isDark ? "bg-zinc-900/50 border-zinc-850" : "bg-zinc-50 border-zinc-200"
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-base ${wakeWordEnabled ? 'bg-emerald-500/15' : 'bg-zinc-700/30'}`}>🗣️</div>
                    <div className="flex flex-col">
                      <span className="font-extrabold text-xs">"Hey Jarvis" avto-faollashuv</span>
                      <span className="text-[9px] text-zinc-500">{wakeWordEnabled ? 'Kutish rejimida sizni eshitib turadi' : "O'chirilgan — mikrofon ishlamaydi"}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const val = !wakeWordEnabled;
                      setWakeWordEnabled(val);
                      localStorage.setItem("ielts_wake_word", val.toString());
                    }}
                    className={`w-11 h-6 rounded-full transition-all relative flex-shrink-0 ${
                      wakeWordEnabled ? 'bg-emerald-500' : isDark ? 'bg-zinc-700' : 'bg-zinc-300'
                    }`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                      wakeWordEnabled ? 'left-[calc(100%-1.375rem)]' : 'left-0.5'
                    }`} />
                  </button>
                </div>

                {/* Voice Gender Selection */}
                <div className="flex flex-col gap-2">
                  <label className="font-bold uppercase tracking-wider text-zinc-500">Ovoz turi (Voice Gender)</label>
                  <div className={`p-1 border rounded-xl flex gap-1 ${isDark ? "bg-zinc-900/50 border-zinc-850" : "bg-zinc-50 border-zinc-200"}`}>
                    {[
                      { key: "male", label: "👨 Erkak (Male)" },
                      { key: "female", label: "👩 Ayol (Female)" }
                    ].map(g => (
                      <button
                        key={g.key}
                        onClick={() => {
                          setGender(g.key as any);
                          const uv = g.key === "female" ? "madina" : "sardor";
                          setUzbekVoice(uv as any);
                          localStorage.setItem("ielts_voice_gender", g.key);
                          localStorage.setItem("ielts_uzbek_voice", uv);
                        }}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all border ${
                          gender === g.key
                            ? "bg-cyan-500 text-black border-transparent shadow-sm"
                            : isDark ? "bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white" : "bg-white border-zinc-200 text-zinc-700 hover:text-black shadow-sm"
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Speech rate / speed */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between font-bold uppercase tracking-wider text-zinc-500">
                    <span>Ovoz tezligi (Speed)</span>
                    <span className="font-mono text-cyan-400">{rate}x</span>
                  </div>
                  <input
                    type="range" min="0.5" max="1.5" step="0.05"
                    value={rate}
                    onChange={e => {
                      const val = parseFloat(e.target.value);
                      setRate(val);
                      localStorage.setItem("ielts_voice_rate", val.toString());
                    }}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>

                {/* Voice Pitch Slider */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between font-bold uppercase tracking-wider text-zinc-550">
                    <span>Ovoz ohangi (Pitch)</span>
                    <span className="font-mono text-cyan-400">{pitch}</span>
                  </div>
                  <input 
                    type="range" min="0.5" max="1.5" step="0.05"
                    value={pitch}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setPitch(val);
                      localStorage.setItem("ielts_voice_pitch", val.toString());
                    }}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>

                {!useElevenLabs && (
                  <div className="flex flex-col gap-2">
                    <label className="font-bold uppercase tracking-wider text-zinc-500">Tizim ovozi (Browser Voice)</label>
                    <select
                      value={selectedVoiceName}
                      onChange={e => {
                        setSelectedVoiceName(e.target.value);
                        localStorage.setItem("ielts_voice_name", e.target.value);
                      }}
                      className={`border rounded-lg p-3 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                        isDark ? "bg-zinc-900 border-zinc-800 text-white" : "bg-zinc-50 border-zinc-200 text-zinc-900 shadow-sm"
                      }`}
                    >
                      {voices.map(v => (
                        <option key={v.name} value={v.name}>
                          {v.name} ({v.lang})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="pt-3 flex gap-4">
                  <button
                    onClick={() => speak("Testing voice configuration.", () => {})}
                    className={`flex-1 border py-3 rounded-lg font-bold uppercase tracking-wider transition-colors ${
                      isDark ? "bg-zinc-900 hover:bg-zinc-850 border-zinc-800 text-white" : "bg-zinc-50 hover:bg-zinc-100 border-zinc-250 text-zinc-800"
                    }`}
                  >
                    Test Speech
                  </button>
                  <button
                    onClick={() => {
                      loadAzureToken();
                      setShowSettings(false);
                    }}
                    className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-black py-3 rounded-lg font-bold uppercase tracking-wider transition-colors"
                  >
                    Saqlash
                  </button>
                </div>

              </div>
            </div>
          </div>
        )}

        <footer className="p-6 text-center z-10">
          <p className="text-zinc-550 text-[10px] uppercase tracking-widest font-mono">
            {stage === "idle" ? "Gapirish uchun yadro ustiga bosing" : stage === "listening" ? "Javobni yakunlash uchun yadro ustiga bosing" : "Teacher gapirmoqda..."}
          </p>
        </footer>
      </main>
    </div>
  );
}
