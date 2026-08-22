"use client";

import { motion } from "framer-motion";
import { AmbientBackground } from "@/components/AmbientBackground";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex-1 flex flex-col h-full"
    >
      <AmbientBackground />
      {children}
    </motion.div>
  );
}
