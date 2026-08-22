"use client";

import confetti from "canvas-confetti";
import { useEffect } from "react";

export function fireConfetti() {
  const duration = 3000;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 5,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ["#f59e0b", "#06b6d4", "#ec4899", "#ef4444", "#3b82f6"]
    });
    confetti({
      particleCount: 5,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ["#f59e0b", "#06b6d4", "#ec4899", "#ef4444", "#3b82f6"]
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };
  frame();
}

export function ConfettiOnMount() {
  useEffect(() => {
    fireConfetti();
  }, []);
  return null;
}
