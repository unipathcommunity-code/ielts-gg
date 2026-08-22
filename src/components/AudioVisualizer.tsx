"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function AudioVisualizer({ isRecording }: { isRecording: boolean }) {
  const [bars, setBars] = useState<number[]>(Array(5).fill(10));

  useEffect(() => {
    if (!isRecording) {
      const timer = setTimeout(() => setBars(Array(5).fill(10)), 0);
      return () => clearTimeout(timer);
    }

    const interval = setInterval(() => {
      setBars(prev => prev.map(() => 10 + Math.random() * 30));
    }, 100);

    return () => clearInterval(interval);
  }, [isRecording]);

  return (
    <div className="flex items-center gap-1 h-12">
      {bars.map((height, i) => (
        <motion.div
          key={i}
          animate={{ height }}
          transition={{ duration: 0.1, ease: "linear" }}
          className="w-1.5 bg-amber-500 rounded-full"
          style={{ minHeight: "4px" }}
        />
      ))}
    </div>
  );
}
