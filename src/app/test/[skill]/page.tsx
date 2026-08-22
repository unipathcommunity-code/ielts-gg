"use client";

// Eski `/test/reading` ko'rinishidagi havolalar (bookmarklar, tashqi linklar,
// ilova ichidagi eski tugmalar) buzilmasligi uchun — aktiv yo'nalishning
// mos sahifasiga yo'naltiramiz.

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getActiveTrackId } from "@/lib/progress";
import { DEFAULT_TRACK_ID, getTrack, trackSkills } from "@/lib/tracks";

const KNOWN = ["reading", "listening", "writing", "speaking", "pronunciation", "mock"];

export default function LegacyTestRedirect() {
  const params = useParams<{ skill?: string | string[] }>();
  const raw = params?.skill;
  const skill = Array.isArray(raw) ? raw[0] : raw;
  const router = useRouter();

  useEffect(() => {
    if (!skill || !KNOWN.includes(skill)) {
      router.replace("/tracks");
      return;
    }

    const trackId = getActiveTrackId();
    const track = getTrack(trackId);

    // Yo'nalishda bu ko'nikma umuman bo'lmasa (masalan grammatika kursida
    // Listening yo'q) — yo'nalish sahifasiga qaytaramiz, 404 ko'rsatmaymiz.
    const supported =
      skill === "mock" || skill === "pronunciation" || trackSkills(track).includes(skill as never);

    router.replace(supported ? `/t/${track.id}/test/${skill}` : `/t/${track.id}`);
  }, [skill, router]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#050505] flex items-center justify-center">
      <span className="w-8 h-8 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
      <span className="sr-only">Yo&apos;naltirilmoqda… ({DEFAULT_TRACK_ID})</span>
    </div>
  );
}
