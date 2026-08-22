# kmb.education

AI asosidagi **ko'p yo'nalishli** til va imtihon platformasi. Live: **https://ielts-gg.vercel.app**

Bitta akkaunt — bir nechta yo'nalish. Har biri alohida tayyorlanadi: o'z formati, o'z vaqti,
o'z ball shkalasi va o'z statistikasi bilan.

| Yo'nalish | Nima | Holati |
|---|---|---|
| IELTS Academic | 4 ko'nikma, 0-9 band | live |
| Multilevel (Milliy sertifikat) | UzBMB CEFR, har bo'lim 0-75 ball | live |
| Grammatika (ingliz tili) | A1 → C1 darslar + mashqlar | beta |
| So'zlashuv | Jonli AI suhbatdosh | live |
| TOPIK · HSK · JLPT · TORFL | Koreys · xitoy · yapon · rus tili | beta |

## Stack

Next.js 16 (App Router) · React 19 · Tailwind v4 · Supabase · OpenAI (`gpt-4o-mini` + `tts-1`)

## Ishga tushirish

```bash
npm install
npm run dev        # http://localhost:3000
```

`.env.local` kerak. Minimal to'plam:

```
OPENAI_API_KEY=...              # AI matn + TTS uchun (majburiy)
NEXT_PUBLIC_SUPABASE_URL=...    # kontent, progress, obuna
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SECRET_KEY=...         # faqat server (admin, kvota, promo)
ADMIN_EMAIL=...
ADMIN_PASSWORD=...
```

Ixtiyoriy (bo'lmasa Edge TTS'ga tushadi):
```
AZURE_SPEECH_KEY=...
AZURE_SPEECH_REGION=...
```

### Ma'lumotlar bazasi

Supabase SQL Editor'da ikkala faylni ishga tushiring:

1. `supabase/schema.sql` — reading/listening kontenti va sertifikatlar
2. `supabase/schema_v2.sql` — foydalanuvchi progressi, yo'nalishga yozilish, obuna
   (`entitlements`), AI kvotasi (`usage_events`), promo kodlar va kontent banki

**Muhim:** `schema_v2.sql` ishga tushirilmaguncha progress faqat brauzerda saqlanadi va
AI kvotasi tekshirilmaydi (ataylab fail-open — baza yiqilsa ilova to'xtab qolmasin).

## Tekshirish

```bash
npx tsc --noEmit -p tsconfig.json
npm run build
npx eslint src                       # 0 error bo'lishi shart
```

## Asosiy sahifalar

| Yo'l | Nima |
|---|---|
| `/start` | kirish kvizi — til va yo'nalish tanlash |
| `/tracks` | yo'nalishlar hub'i |
| `/t/[track]` | shu yo'nalishning dashboard'i |
| `/t/[track]/test/{reading,listening,writing,speaking,pronunciation,mock}` | test modullari |
| `/t/grammar-en/lessons` | grammatika darslari (A1→C1) |
| `/pro` | tariflar, obuna holati, promo kod |
| `/jarvis` | ovozli AI suhbatdosh |
| `/vocabulary` | interval takrorlash (SRS) |
| `/stats`, `/profile`, `/strategy`, `/movies` | qo'shimcha |
| `/admin` | kontent boshqaruvi |
| `/certificate/[code]` | sertifikat tekshiruvi |

Eski `/dashboard` va `/test/*` manzillari aktiv yo'nalishga redirect qiladi.

## Biznes modeli

| Reja | Narx | Nima kiradi |
|---|---|---|
| Bepul | 0 | Barcha yo'nalishlar, cheksiz Reading/Listening, kuniga 3 ta AI baholash |
| Pro | 99 000 so'm/oy | Cheksiz AI baholash va jonli suhbat, mock, sertifikat |
| Pro yillik | 890 000 so'm/yil | ↑ + 2 oy tekin |
| O'quv markazi | ~35 000 so'm/o'quvchi | O'qituvchi paneli (rejalashtirilgan) |

Narxlar `src/lib/pricing.ts` da — landing va `/pro` shu bitta manbadan o'qiydi.
To'lov provayderi (Payme/Click) hali ulanmagan; Pro promo kod orqali beriladi
(`/api/promo/redeem`).

## AI agentlar uchun

Kod ustida ishlashdan oldin **`PROJECT_RULES.md`** ni o'qing — bu majburiy.
Ayniqsa "YO'NALISH (TRACK)" va "STATE VA localStorage" bo'limlarini.
