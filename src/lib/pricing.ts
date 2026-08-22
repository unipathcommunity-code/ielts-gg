// Narx modeli — landing sahifasi va /pro sahifasi bir manbadan o'qiydi.
//
// Mahalliy bozorga moslangan. Taqqoslash uchun (2026-avgust holatiga ko'ra):
// MockSpace.uz — bitta mock 50 000 so'm, oyiga 250 000 so'm (15 ta mock).
// Bizning Pro shu narxning yarmidan arzon va cheksiz AI feedback beradi, ustiga
// kunlik reja, jonli suhbat va grammatika kursi qo'shiladi.

export interface Plan {
  id: "free" | "pro" | "pro_yearly" | "org";
  name: string;
  tagline: string;
  /** So'mda. null = individual kelishuv. */
  priceUzs: number | null;
  period: string;
  highlight?: boolean;
  badge?: string;
  features: string[];
  /** Bepul rejada mavjud emasligi ko'rsatiladigan imkoniyatlar. */
  missing?: string[];
  cta: { label: string; href: string };
}

export function formatUzs(amount: number): string {
  // uz-UZ ajratgichi uzilmas probel (U+00A0) — oddiy probelga o'giramiz,
  // aks holda qidiruv/nusxalashda g'alati belgi chiqadi.
  return amount.toLocaleString("uz-UZ").replace(/[ ,]/g, " ") + " so'm";
}

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Bepul",
    tagline: "Darajangizni aniqlash va sinab ko'rish uchun.",
    priceUzs: 0,
    period: "",
    features: [
      "Barcha yo'nalishlar: IELTS, Multilevel, TOPIK, HSK, JLPT",
      "Cheksiz Reading va Listening testlari",
      "Kuniga 3 ta AI baholash (Writing/Speaking)",
      "Kunlik reja va statistika",
    ],
    missing: ["Cheksiz AI baholash", "Jonli AI suhbat (kunlik limit past)", "Sertifikat"],
    cta: { label: "Boshlash", href: "/start" },
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Imtihonga jiddiy tayyorlanayotganlar uchun.",
    priceUzs: 99000,
    period: "/oy",
    highlight: true,
    badge: "Eng mashhur",
    features: [
      "Bepul rejadagi hamma narsa",
      "Cheksiz AI Writing va Speaking baholash",
      "Jonli AI suhbatdosh — cheklovsiz",
      "To'liq mock imtihonlar va sertifikat",
      "Barcha yo'nalishlarni bir vaqtda olib borish",
    ],
    cta: { label: "Pro ochish", href: "/pro" },
  },
  {
    id: "pro_yearly",
    name: "Pro — yillik",
    tagline: "Ikki oy tekin. Uzoq tayyorgarlik uchun.",
    priceUzs: 890000,
    period: "/yil",
    features: [
      "Pro rejadagi hamma narsa",
      "2 oy tekin (12 oy narxi = 10 oy)",
      "Yangi yo'nalishlarga birinchi bo'lib kirish",
    ],
    cta: { label: "Yillik olish", href: "/pro" },
  },
  {
    id: "org",
    name: "O'quv markazi",
    tagline: "Markazlar, maktablar va kompaniyalar uchun.",
    priceUzs: 35000,
    period: "/o'quvchi · oyiga",
    features: [
      "O'qituvchi paneli: guruhlar va o'quvchilar",
      "Kim qaysi bosqichda — jonli nazorat",
      "O'z test bankingizni yuklash",
      "Kamida 20 o'quvchi",
    ],
    cta: { label: "Bog'lanish", href: "mailto:contact@kmb.education" },
  },
];

export function planById(id: Plan["id"]): Plan {
  return PLANS.find((p) => p.id === id) || PLANS[0];
}
