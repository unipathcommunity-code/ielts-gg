# PROJECT RULES — bu kodbazani tahrirlashdan oldin o'qing

> Oxirgi tekshiruv: **2026-08-22**. Bu hujjatdagi har bir da'vo o'sha kuni kod bilan solishtirib
> tasdiqlangan. Kodni o'zgartirsangiz — bu hujjatni ham yangilang.

Siz mavjud, **jonli ishlab turgan** loyiha ustida ishlayapsiz: **kmb.education** (repo nomi hali
`IELTS GG`) — AI asosidagi **ko'p yo'nalishli** til va imtihon platformasi. Bu repoda boshqa AI
assistentlar ham ishlaydi.
**Asosiy vazifangiz: ishlab turgan funksiyalarni BUZMASDAN qiymat qo'shish.**

## ENG MUHIM TUSHUNCHA: YO'NALISH (TRACK)

Ilova endi faqat IELTS emas. `src/lib/tracks.ts` — **yagona haqiqat manbai**: qaysi
yo'nalishlar bor, ularning bo'limlari, vaqti, ball shkalasi va AI baholash mezoni.

| Track id | Nima |
|---|---|
| `ielts` | IELTS Academic, 0-9 band |
| `multilevel` | UzBMB Milliy sertifikat, har bo'lim 0-75 ball, CEFR daraja |
| `grammar-en` | Grammatika kursi A1→C1 (`src/lib/grammar.ts`) |
| `speaking-en` | Erkin so'zlashuv |
| `topik` / `hsk` / `jlpt` / `torfl` | Koreys / xitoy / yapon / rus tili imtihonlari |

**Qoidalar:**
- Yangi imtihon qo'shish = `tracks.ts` ga bitta yozuv. Test sahifalariga tegmang.
- Sahifada imtihon nomi/ball yorlig'i kerak bo'lsa — `useTrack()` dan oling,
  `getExamFormat(currentLang)` dan EMAS (u faqat til darajasidagi eski qatlam).
- `usePracticeLanguage()` endi aktiv yo'nalishning tilini qaytaradi. Yangi kod
  to'g'ridan-to'g'ri `useTrack()` ishlatsin.
- Marshrutlar: `/tracks` (hub), `/t/[track]` (dashboard), `/t/[track]/test/[skill]`,
  `/t/[track]/lessons`. Eski `/test/*` va `/dashboard` — redirect, o'chirmang.

## STACK — haqiqiy holat

| Qatlam | Nima ishlatiladi |
|---|---|
| Framework | Next.js 16.2.9 (App Router), React 19.2.4 |
| Stil | Tailwind v4 (`@tailwindcss/postcss`) |
| Ma'lumotlar bazasi | Supabase (`@supabase/supabase-js`) |
| **AI matn** | **OpenAI `gpt-4o-mini`** — `src/lib/aiClient.ts`, `callAI()` |
| **TTS (asosiy)** | **OpenAI TTS `tts-1`** — ovozlar `onyx` (erkak) / `nova` (ayol) |
| TTS (ko'p tilli) | Microsoft Edge TTS (bepul, kalitsiz) — `azure-tts` route ichida |
| TTS (ixtiyoriy) | Azure Neural TTS — faqat `AZURE_SPEECH_KEY` bo'lsa |
| STT | Browser Web Speech API + Azure Speech SDK (ixtiyoriy) |

### Provayder haqida — eski hujjatlardagi yolg'onlar
Bu loyihada **Anthropic ham, ElevenLabs ham, Gemini ham ISHLATILMAYDI.**
Ilgari hujjatlarda uchalasi ham turli joyda da'vo qilingan edi va bu bir necha agentni adashtirgan.
Yagona haqiqat manbai — `src/lib/aiClient.ts`. Shubhangiz bo'lsa, o'sha faylni oching.

`.env.local` da hali `ANTHROPIC_API_KEY`, `ELEVENLABS_API_KEY`, `GEMINI_API_KEY` turishi mumkin —
ular **kodda hech qayerda o'qilmaydi**, qoldiq xolos.

## HARD RULES — bularni hech qachon buzmang

1. **Minimal, qo'shimcha tahrirlar qiling.** Kichik o'zgarish uchun butun faylni qayta yozmang.
   So'ralmagan bo'lsa "tozalik uchun" refaktor qilmang.

2. **Quyidagilarni o'chirmang / soddalashtirmang:**
   - **Conversational Speaking** — `src/app/t/[track]/test/speaking/page.tsx`. Part 1 **va** Part 3 suhbat
     rejimida: `/api/speaking/chat` ga `part:1` (Part 3 uchun `discussion:true`) yuboradi va
     nomzodning javobiga reaksiya bildiradi.
   - **Chat API** — `src/app/api/speaking/chat/route.ts`. Ikki rejim (`tutor` / `casual`),
     **7 ta shaxsiyat**: `kind`, `sarcastic`, `formal`, `toxic`, `romantic`, `brat`, `akaxon`.
     Tillar: english / uzbek / korean / chinese / japanese / russian. `verbosity` (concise /
     normal / detailed). JSON qaytaradi. Barcha tarmoqlarni saqlang.
   - **TTS** — `src/app/api/speaking/synth/route.ts` (OpenAI) va
     `src/app/api/speaking/azure-tts/route.ts` (Edge/Azure, `autoLang` bilan jumla-jumla til
     aniqlash).
   - **Sahifalar** — `/start`, `/tracks`, `/t/[track]`, `/pro`, `/vocabulary`, `/stats`,
     `/jarvis`, `/movies`, `/strategy`, `/certificate/[code]`, `/admin` (+ `src/app/api/admin/*`).
   - **Supabase kontent** — reading & listening Supabase'dan yuklanadi, inline fallback bilan.
     `src/lib/supabase.ts`, `src/lib/supabaseAdmin.ts`, `supabase/schema.sql`. **Fallback'ni saqlang.**
   - **Display settings** — `src/components/DisplaySettings.tsx` (zoom + rang), test sahifalarida.
   - **Kvota va obuna** — `src/lib/entitlements.ts` (server), `src/lib/apiClient.ts` (klient).
     Qimmat AI route'lari boshida `checkQuota(...)` turadi. Uni olib tashlamang.
     `localStorage`da "premium" bayrog'i **YO'Q va bo'lmasligi kerak** — obuna faqat
     Supabase `entitlements` jadvalida.

3. **Dinamik importlarga ehtiyot bo'ling.** Bu paketlar faqat `await import()` yoki `require()`
   orqali chaqiriladi — oddiy grep va `tsc` ularni topmaydi, lekin olib tashlasangiz runtime'da
   ishlamay qoladi:
   - `microsoft-cognitiveservices-speech-sdk` -> `jarvis/page.tsx`, `test/speaking/page.tsx`
   - `html-to-image` -> `components/Certificate.tsx`
   - `msedge-tts` -> `api/speaking/azure-tts/route.ts` (`require()` bilan!)

4. **MAXFIY KALITLAR:** hech qachon `NEXT_PUBLIC_*` o'zgaruvchisiga yoki klient kodiga kalit qo'ymang.
   - Faqat server: `OPENAI_API_KEY`, `SUPABASE_SECRET_KEY`, `ADMIN_PASSWORD`, `ADMIN_EMAIL`,
     `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION`
   - Ochiq: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

5. **Next.js 16** eski versiyalardan farq qiladi — config/API'ga tegishdan oldin
   `node_modules/next/dist/docs/` ni o'qing (`AGENTS.md` ga qarang).

## STATE VA localStorage — yangi qoida

`useEffect` ichida `localStorage` o'qib `setState` qilish **taqiqlanadi**: birinchi kadr
noto'g'ri chiziladi va React 19 lint xato beradi. `src/lib/clientStore.ts` dan foydalaning:
`useHydrated()`, `useStoredJSON()`, `useStoredRawState()`. Tayyor qatlamlar:
`usePrepPlan()`, `useVocabSrs()`, `useTestHistory()`, `useLessonProgress()`.

`npx eslint src` **0 xato** bilan o'tishi shart. Ovoz kodidagi bir nechta ataylab
qoldirilgan `eslint-disable` bor — ularning har birida sababi yozilgan, olib tashlamang.

## MA'LUMOTLAR BAZASI

`supabase/schema.sql` — kontent jadvallari (eski).
`supabase/schema_v2.sql` — **foydalanuvchi progressi, obuna, kvota va kontent banki.**
Bu fayl Supabase SQL Editor'da ishga tushirilishi kerak. **Ishga tushirilmaguncha:**
kvota tekshiruvi jimgina o'tkazib yuboriladi (ataylab: baza yiqilsa ilova to'xtamasin),
progress esa faqat localStorage'da qoladi.

## VAZIFANI "TUGADIM" deyishdan OLDIN majburiy

```bash
npx tsc --noEmit -p tsconfig.json   # exit 0 bo'lishi shart
npm run build                        # muvaffaqiyatli kompilyatsiya bo'lishi shart
npx eslint src                       # 0 ERROR bo'lishi shart (warning bo'lishi mumkin)
```
Ikkalasidan biri yiqilsa — avval tuzating. **Build'ni hech qachon buzuq qoldirmang.**

## GIT

Repo 2026-08-21 da git ostiga olindi. Har bir mantiqiy o'zgarish uchun alohida commit qiling —
shunda buzilgan narsani orqaga qaytarish mumkin bo'ladi.
`.gitignore` `.env*` ni himoyalaydi; **hech qachon `git add -f` bilan env faylni qo'shmang.**

## DEPLOY

- Vercel loyihasi: **`ielts-gg`** (team `hasanov`), live: **https://ielts-gg.vercel.app**
- `.vercel/project.json` shu loyihaga bog'langan. Yangi Vercel loyihasi yaratmang.
- Eski hujjatlarda `kmw-bb.vercel.app` deb yozilgan edi — **u manzil 404 qaytaradi, o'lik.**
- Env o'zgaruvchilar Vercel'da allaqachon o'rnatilgan. Ularni bo'sh qiymat bilan almashtirmang.

## STYLE

Mavjud kodga moslashing: qora fon + amber `#f59e0b` urg'u, **UI matni o'zbekcha**, Tailwind klasslari.

---
Biror o'zgarish nimanidir buzishi mumkinligiga shubhangiz bo'lsa — kichikroq, qo'shimcha variantni tanlang.
