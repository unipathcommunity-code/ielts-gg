"use client";

// `/dashboard` endi mustaqil sahifa emas: har bir yo'nalishning O'Z dashboard'i
// `/t/[track]` da. Bu yerda faqat aktiv yo'nalishga yo'naltiramiz — eski
// havolalar, PWA yorliqlari va ilova ichidagi tugmalar buzilmaydi.

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getActiveTrackId } from "@/lib/progress";

export default function DashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/t/${getActiveTrackId()}`);
  }, [router]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#050505] flex items-center justify-center">
      <span className="w-8 h-8 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
    </div>
  );
}
