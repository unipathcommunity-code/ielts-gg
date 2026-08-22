"use client";

import { motion } from "framer-motion";
import { useTestHistory } from "@/lib/useTestHistory";
import { CheckCircle2, Lock, Star } from "lucide-react";

export function SmartProgressMap() {
  const history = useTestHistory();
  const testsTaken = history.length;
  
  const nodes = [
    { id: 1, label: "Beginner", threshold: 0 },
    { id: 2, label: "Novice", threshold: 5 },
    { id: 3, label: "Intermediate", threshold: 15 },
    { id: 4, label: "Advanced", threshold: 30 },
    { id: 5, label: "Master", threshold: 50 },
  ];

  return (
    <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-[50px] -z-10" />
      <h3 className="text-lg font-black mb-6">Bosqichlar (Progress Map)</h3>
      
      <div className="flex justify-between items-center relative">
        {/* Connecting Line */}
        <div className="absolute left-0 right-0 h-1 bg-zinc-200 dark:bg-zinc-800 top-1/2 -translate-y-1/2 z-0" />
        <div 
          className="absolute left-0 h-1 bg-amber-500 top-1/2 -translate-y-1/2 z-0 transition-all duration-1000" 
          style={{ width: `${Math.min(100, (testsTaken / 50) * 100)}%` }}
        />

        {nodes.map((node, i) => {
          const isCompleted = testsTaken >= node.threshold;
          const isCurrent = testsTaken >= node.threshold && (i === nodes.length - 1 || testsTaken < nodes[i + 1].threshold);
          
          return (
            <div key={node.id} className="relative z-10 flex flex-col items-center gap-2">
              <motion.div 
                initial={{ scale: 0 }} 
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className={`w-10 h-10 rounded-full flex items-center justify-center border-4 ${
                  isCompleted ? "bg-amber-500 border-amber-200 dark:border-amber-900 text-white shadow-[0_0_15px_rgba(245,158,11,0.5)]" : 
                  "bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-400"
                } ${isCurrent ? "ring-4 ring-amber-500/30 animate-pulse" : ""}`}
              >
                {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Lock className="w-4 h-4" />}
              </motion.div>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${isCompleted ? "text-amber-500" : "text-zinc-500"}`}>
                {node.label}
              </span>
            </div>
          );
        })}
      </div>
      
      <div className="mt-6 flex items-center justify-between text-xs font-medium text-zinc-500 bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-xl">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-amber-500" />
          <span>Sizning testlaringiz: <strong className="text-black dark:text-white">{testsTaken}</strong></span>
        </div>
        <span>Keyingi bosqichgacha: {Math.max(0, (nodes.find(n => n.threshold > testsTaken)?.threshold || 50) - testsTaken)} ta test</span>
      </div>
    </div>
  );
}
