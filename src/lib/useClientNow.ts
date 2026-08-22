"use client";

import { useEffect, useState } from "react";

/**
 * Klient tomonidagi vaqt tamg'asi (timestamp).
 *
 * `Date.now()` ni to'g'ridan-to'g'ri render ichida chaqirish mumkin emas: bu sahifalar
 * statik prerender qilinadi, shuning uchun serverdagi vaqt (build vaqti) klientdagi
 * vaqtdan farq qiladi va React hydration mismatch xatosini beradi.
 *
 * Bu hook mount bo'lgunga qadar `null` qaytaradi — ya'ni server va klientning birinchi
 * renderi bir xil bo'ladi — keyin haqiqiy vaqtni beradi. Chaqiruvchi tomon `null` holatini
 * hisobga olishi kerak (odatda bo'sh ro'yxat ko'rsatib turadi).
 */
export function useClientNow(): number | null {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    // Ataylab: bu qiymat faqat klientda mavjud, shuning uchun mount'dan keyin o'rnatiladi.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now());
  }, []);

  return now;
}
