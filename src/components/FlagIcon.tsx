"use client";

import { useId } from "react";

export function FlagIcon({ lang, className = "w-4 h-4 rounded-full overflow-hidden inline-block" }: { lang: string; className?: string }) {
  const uid = useId().replace(/[:]/g, "");
  const clipId = `circleViewFlag${uid}`;

  if (lang === "english") {
    return (
      <span className={className}>
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <clipPath id={clipId}><circle cx="50" cy="50" r="50"/></clipPath>
          <g clipPath={`url(#${clipId})`}>
            <rect width="100" height="100" fill="#012169"/>
            <path d="M 0,0 L 100,100 M 100,0 L 0,100" stroke="#fff" strokeWidth="12"/>
            <path d="M 0,0 L 100,100 M 100,0 L 0,100" stroke="#C8102E" strokeWidth="8"/>
            <path d="M 50,0 L 50,100 M 0,50 L 100,50" stroke="#fff" strokeWidth="20"/>
            <path d="M 50,0 L 50,100 M 0,50 L 100,50" stroke="#C8102E" strokeWidth="12"/>
          </g>
        </svg>
      </span>
    );
  }
  if (lang === "german") {
    return (
      <span className={className}>
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <clipPath id={clipId}><circle cx="50" cy="50" r="50"/></clipPath>
          <g clipPath={`url(#${clipId})`}>
            <rect y="0" width="100" height="33.3" fill="#000000"/>
            <rect y="33.3" width="100" height="33.3" fill="#DD0000"/>
            <rect y="66.6" width="100" height="33.4" fill="#FFCC00"/>
          </g>
        </svg>
      </span>
    );
  }
  if (lang === "russian") {
    return (
      <span className={className}>
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <clipPath id={clipId}><circle cx="50" cy="50" r="50"/></clipPath>
          <g clipPath={`url(#${clipId})`}>
            <rect y="0" width="100" height="33.3" fill="#fff"/>
            <rect y="33.3" width="100" height="33.3" fill="#0039A6"/>
            <rect y="66.6" width="100" height="33.4" fill="#D52B1E"/>
          </g>
        </svg>
      </span>
    );
  }
  if (lang === "japanese") {
    return (
      <span className={className}>
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <clipPath id={clipId}><circle cx="50" cy="50" r="50"/></clipPath>
          <g clipPath={`url(#${clipId})`}>
            <rect width="100" height="100" fill="#fff" stroke="#e2e8f0" strokeWidth="2"/>
            <circle cx="50" cy="50" r="28" fill="#BC002D"/>
          </g>
        </svg>
      </span>
    );
  }
  if (lang === "korean") {
    return (
      <span className={className}>
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <clipPath id={clipId}><circle cx="50" cy="50" r="50"/></clipPath>
          <g clipPath={`url(#${clipId})`}>
            <rect width="100" height="100" fill="#fff" stroke="#e2e8f0" strokeWidth="2"/>
            <path d="M 50,22 A 28 28 0 0 1 50,78 A 14 14 0 0 1 50,50 A 14 14 0 0 0 50,22" fill="#CD2E3A"/>
            <path d="M 50,78 A 28 28 0 0 1 50,22 A 14 14 0 0 1 50,50 A 14 14 0 0 0 50,78" fill="#0047A0"/>
            <rect x="25" y="25" width="4" height="12" fill="#000" transform="rotate(-45 25 25)"/>
            <rect x="31" y="25" width="4" height="12" fill="#000" transform="rotate(-45 25 25)"/>
            <rect x="37" y="25" width="4" height="12" fill="#000" transform="rotate(-45 25 25)"/>
            <rect x="63" y="63" width="4" height="12" fill="#000" transform="rotate(-45 63 63)"/>
            <rect x="69" y="63" width="4" height="12" fill="#000" transform="rotate(-45 63 63)"/>
            <rect x="75" y="63" width="4" height="12" fill="#000" transform="rotate(-45 63 63)"/>
          </g>
        </svg>
      </span>
    );
  }
  if (lang === "chinese") {
    return (
      <span className={className}>
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <clipPath id={clipId}><circle cx="50" cy="50" r="50"/></clipPath>
          <g clipPath={`url(#${clipId})`}>
            <rect width="100" height="100" fill="#EE1C25"/>
            <polygon points="25,30 20,45 35,35 15,35 30,45" fill="#FFFF00" transform="scale(0.85) translate(5, 5)"/>
          </g>
        </svg>
      </span>
    );
  }
  if (lang === "uzbek") {
    return (
      <span className={className}>
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <clipPath id={clipId}><circle cx="50" cy="50" r="50"/></clipPath>
          <g clipPath={`url(#${clipId})`}>
            <rect y="0" width="100" height="30" fill="#0099B5"/>
            <rect y="30" width="100" height="4" fill="#D52B1E"/>
            <rect y="34" width="100" height="32" fill="#fff"/>
            <rect y="66" width="100" height="4" fill="#D52B1E"/>
            <rect y="70" width="100" height="30" fill="#009A49"/>
            <circle cx="24" cy="15" r="7" fill="#fff"/>
            <circle cx="26" cy="15" r="7" fill="#0099B5"/>
            <circle cx="37" cy="11" r="1.2" fill="#fff"/>
            <circle cx="42" cy="11" r="1.2" fill="#fff"/>
            <circle cx="47" cy="11" r="1.2" fill="#fff"/>
            <circle cx="39" cy="16" r="1.2" fill="#fff"/>
            <circle cx="44" cy="16" r="1.2" fill="#fff"/>
            <circle cx="41" cy="21" r="1.2" fill="#fff"/>
          </g>
        </svg>
      </span>
    );
  }
  if (lang === "auto") {
    return (
      <span className={className}>
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <linearGradient id={`aiGrad${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="50" fill={`url(#aiGrad${uid})`} />
          <path d="M50 25 L53 38 L66 41 L53 44 L50 57 L47 44 L34 41 L47 38 Z" fill="#fff" />
          <path d="M72 58 L73.5 64 L79.5 65.5 L73.5 67 L72 73 L70.5 67 L64.5 65.5 L70.5 64 Z" fill="#fff" />
        </svg>
      </span>
    );
  }
  return null;
}
