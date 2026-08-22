"use client";

// Kirgandan keyin bir marta: serverdagi natijalarni lokal keshga qo'shadi va
// hali yuborilmagan lokal natijalarni serverga jo'natadi.
//
// Buni root layout'ga qo'yamiz, chunki foydalanuvchi ilovaning istalgan
// sahifasidan kirishi mumkin va sinxronizatsiya bir marta ishlashi kerak.

import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/useAuth";
import { syncProgress } from "@/lib/progress";

export function ProgressSync() {
  const { user } = useAuth();
  const syncedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!user || syncedFor.current === user.id) return;
    syncedFor.current = user.id;
    void syncProgress(user.id);
  }, [user]);

  return null;
}
