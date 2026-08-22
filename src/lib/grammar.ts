// ─────────────────────────────────────────────────────────────────────────────
// GRAMMATIKA KURSI — A1 dan C1 gacha o'quv rejasi.
//
// Tuzilishi: daraja → modul → dars. Har dars o'zbekcha tushuntirish, asosiy
// qoidalar va misollar bilan keladi. Mashqlar `/api/grammar/exercises` orqali
// AI tomonidan shu darsning aniq mavzusi bo'yicha yaratiladi va keyinchalik
// kontent bankiga (content_items) saqlanadi.
//
// Nega qattiq kodda: bu ro'yxat — kursning skeleti, u kamdan-kam o'zgaradi va
// ilova internetsiz ham to'liq ko'rinishi kerak. Mashqlar esa dinamik.
// ─────────────────────────────────────────────────────────────────────────────

export type GrammarLevel = "A1" | "A2" | "B1" | "B2" | "C1";

export interface GrammarExample {
  en: string;
  uz: string;
}

export interface GrammarLesson {
  id: string;
  level: GrammarLevel;
  module: string;
  title: string;
  /** Bir qatorli tavsif — ro'yxatda ko'rinadi. */
  summary: string;
  /** Asosiy qoidalar, o'zbekcha. */
  points: string[];
  examples: GrammarExample[];
  /** O'zbek tilida so'zlashuvchilar ko'p qiladigan xato. */
  commonMistake?: { wrong: string; right: string; why: string };
}

export const GRAMMAR_LESSONS: GrammarLesson[] = [
  // ── A1 ─────────────────────────────────────────────────────────────────────
  {
    id: "a1-to-be",
    level: "A1",
    module: "Asoslar",
    title: "To be (am / is / are)",
    summary: "Ingliz tilidagi eng asosiy fe'l — 'bo'lmoq'.",
    points: [
      "I bilan am, he/she/it bilan is, we/you/they bilan are ishlatiladi.",
      "O'zbek tilida 'Men talabaman' deganda alohida fe'l yo'q, ingliz tilida esa 'am' MAJBURIY.",
      "Inkor: am not / is not (isn't) / are not (aren't).",
      "So'roq: fe'l oldinga chiqadi — Are you a student?",
    ],
    examples: [
      { en: "I am a student.", uz: "Men talabaman." },
      { en: "She is at home.", uz: "U uyda." },
      { en: "They are not ready.", uz: "Ular tayyor emas." },
    ],
    commonMistake: {
      wrong: "I student.",
      right: "I am a student.",
      why: "O'zbek tilida bog'lovchi fe'l tushib qoladi, ingliz tilida esa 'am' hech qachon tushmaydi.",
    },
  },
  {
    id: "a1-articles",
    level: "A1",
    module: "Asoslar",
    title: "Artikllar: a / an / the",
    summary: "O'zbek tilida yo'q, ingliz tilida esa har qadamda uchraydigan so'zchalar.",
    points: [
      "a/an — noaniq: birinchi marta tilga olinayotgan sanaladigan narsa.",
      "an — unli TOVUSH bilan boshlanadigan so'zlar oldidan (an hour, an MP — yozilishi emas, aytilishi muhim).",
      "the — aniq: tinglovchi qaysi narsa haqida ekanini biladi.",
      "Sanalmaydigan va ko'plik so'zlar oldidan umumiy ma'noda artikl qo'yilmaydi: I like music.",
    ],
    examples: [
      { en: "I bought a book. The book was expensive.", uz: "Men kitob sotib oldim. O'sha kitob qimmat edi." },
      { en: "She is an engineer.", uz: "U muhandis." },
      { en: "Water is important.", uz: "Suv muhim." },
    ],
    commonMistake: {
      wrong: "I am engineer.",
      right: "I am an engineer.",
      why: "Kasb bildiruvchi birlik so'z oldidan artikl shart.",
    },
  },
  {
    id: "a1-present-simple",
    level: "A1",
    module: "Zamonlar",
    title: "Present Simple",
    summary: "Doimiy holat, odat va faktlar zamoni.",
    points: [
      "he/she/it bilan fe'lga -s qo'shiladi: he works.",
      "Inkor va so'roqda do/does ishlatiladi va asosiy fe'l ASL holatiga qaytadi: He doesn't work (works emas).",
      "Chastota ravishlari (always, usually, often, never) asosiy fe'ldan oldin, 'to be' dan keyin turadi.",
    ],
    examples: [
      { en: "I work in a bank.", uz: "Men bankda ishlayman." },
      { en: "She does not live here.", uz: "U bu yerda yashamaydi." },
      { en: "Do they speak English?", uz: "Ular ingliz tilida gapirishadimi?" },
    ],
    commonMistake: {
      wrong: "He don't like tea.",
      right: "He doesn't like tea.",
      why: "Uchinchi shaxs birlikda 'does' ishlatiladi.",
    },
  },
  {
    id: "a1-present-continuous",
    level: "A1",
    module: "Zamonlar",
    title: "Present Continuous",
    summary: "Hozir, ayni damda sodir bo'layotgan ish.",
    points: [
      "Tuzilishi: am/is/are + fe'l-ing.",
      "Ayni damda yoki shu davrda davom etayotgan ish uchun.",
      "Holat fe'llari (know, want, like, believe) odatda -ing shaklida ishlatilmaydi.",
    ],
    examples: [
      { en: "I am reading a book now.", uz: "Men hozir kitob o'qiyapman." },
      { en: "They are living in Tashkent this year.", uz: "Ular bu yil Toshkentda yashashyapti." },
    ],
    commonMistake: {
      wrong: "I am knowing the answer.",
      right: "I know the answer.",
      why: "'know' — holat fe'li, u davomli shaklda ishlatilmaydi.",
    },
  },
  {
    id: "a1-plurals",
    level: "A1",
    module: "Otlar",
    title: "Ko'plik shakllari",
    summary: "-s, -es va qoidaga bo'ysunmaydigan shakllar.",
    points: [
      "Ko'pchilik ot -s oladi: book → books.",
      "-s, -sh, -ch, -x, -o bilan tugasa -es: box → boxes.",
      "Undosh + y bo'lsa, y → ies: city → cities.",
      "Istisnolar: child → children, man → men, foot → feet, person → people.",
    ],
    examples: [
      { en: "There are three children in the room.", uz: "Xonada uchta bola bor." },
      { en: "I need two boxes.", uz: "Menga ikkita quti kerak." },
    ],
  },
  {
    id: "a1-there-is",
    level: "A1",
    module: "Asoslar",
    title: "There is / There are",
    summary: "Biror narsaning mavjudligini bildirish.",
    points: [
      "there is — birlik va sanalmaydigan otlar bilan.",
      "there are — ko'plik bilan.",
      "O'zbekchadagi 'bor' ga to'g'ri keladi, lekin gap boshida turadi.",
    ],
    examples: [
      { en: "There is a park near my house.", uz: "Uyim yonida park bor." },
      { en: "There are many students here.", uz: "Bu yerda ko'p talabalar bor." },
    ],
  },

  // ── A2 ─────────────────────────────────────────────────────────────────────
  {
    id: "a2-past-simple",
    level: "A2",
    module: "Zamonlar",
    title: "Past Simple",
    summary: "O'tmishda tugagan ish.",
    points: [
      "To'g'ri fe'llar -ed oladi: work → worked.",
      "Noto'g'ri fe'llarni yodlash kerak: go → went, see → saw, have → had.",
      "Inkor/so'roqda did ishlatiladi, fe'l asl holatiga qaytadi: Did you go? / I didn't go.",
      "Aniq o'tmish vaqti bilan ishlatiladi: yesterday, last year, in 2020.",
    ],
    examples: [
      { en: "I visited my grandmother last week.", uz: "O'tgan hafta buvimnikiga bordim." },
      { en: "She didn't come to the party.", uz: "U bazmga kelmadi." },
    ],
    commonMistake: {
      wrong: "I didn't went there.",
      right: "I didn't go there.",
      why: "'did' allaqachon o'tgan zamonni ko'rsatgan, fe'l asl shaklda qoladi.",
    },
  },
  {
    id: "a2-past-continuous",
    level: "A2",
    module: "Zamonlar",
    title: "Past Continuous",
    summary: "O'tmishning ma'lum bir daqiqasida davom etayotgan ish.",
    points: [
      "Tuzilishi: was/were + fe'l-ing.",
      "Ko'pincha Past Simple bilan birga: uzoq ish davom etayotganda qisqa ish sodir bo'ladi.",
      "'while' uzoq ish bilan, 'when' qisqa ish bilan ishlatiladi.",
    ],
    examples: [
      { en: "I was cooking when he called.", uz: "U qo'ng'iroq qilganda men ovqat pishirayotgandim." },
      { en: "While they were sleeping, it started to rain.", uz: "Ular uxlayotganda yomg'ir boshlandi." },
    ],
  },
  {
    id: "a2-comparatives",
    level: "A2",
    module: "Sifatlar",
    title: "Qiyosiy va orttirma daraja",
    summary: "bigger, the biggest, more interesting.",
    points: [
      "Qisqa sifatlar: -er / the -est (big → bigger → the biggest).",
      "Uzun sifatlar (2+ bo'g'in): more / the most (interesting → more interesting).",
      "Istisnolar: good → better → the best, bad → worse → the worst.",
      "Qiyoslashda 'than' ishlatiladi: bigger than.",
    ],
    examples: [
      { en: "Tashkent is bigger than Samarkand.", uz: "Toshkent Samarqanddan katta." },
      { en: "This is the most difficult question.", uz: "Bu eng qiyin savol." },
    ],
    commonMistake: {
      wrong: "more better",
      right: "better",
      why: "Ikki marta qiyoslash bo'lmaydi.",
    },
  },
  {
    id: "a2-future",
    level: "A2",
    module: "Zamonlar",
    title: "Kelasi zamon: will va be going to",
    summary: "Ikkalasi ham kelajak, lekin ma'nosi boshqa.",
    points: [
      "will — gapirish paytida qabul qilingan qaror, taxmin, va'da.",
      "be going to — oldindan o'ylangan reja yoki ko'rinib turgan dalil.",
      "Present Continuous ham yaqin, kelishilgan rejalar uchun ishlatiladi: I'm meeting him at 5.",
    ],
    examples: [
      { en: "I'll help you with that.", uz: "Men senga bunda yordam beraman." },
      { en: "We are going to buy a house next year.", uz: "Kelasi yil uy sotib olmoqchimiz." },
    ],
  },
  {
    id: "a2-modals",
    level: "A2",
    module: "Modal fe'llar",
    title: "can, must, should, have to",
    summary: "Imkoniyat, majburiyat va maslahat.",
    points: [
      "Modal fe'ldan keyin 'to' qo'yilmaydi (have to dan tashqari): I can swim.",
      "must — ichki majburiyat yoki qat'iy qoida; have to — tashqi majburiyat.",
      "mustn't — taqiq; don't have to — shart emas. Bu ikkisi butunlay boshqa ma'no!",
      "should — maslahat.",
    ],
    examples: [
      { en: "You mustn't smoke here.", uz: "Bu yerda chekish mumkin emas." },
      { en: "You don't have to come early.", uz: "Erta kelishingiz shart emas." },
    ],
    commonMistake: {
      wrong: "I can to swim.",
      right: "I can swim.",
      why: "Modal fe'ldan keyin 'to' ishlatilmaydi.",
    },
  },
  {
    id: "a2-countable",
    level: "A2",
    module: "Otlar",
    title: "Sanaladigan va sanalmaydigan otlar",
    summary: "much / many / a lot of / some / any.",
    points: [
      "many — sanaladigan, much — sanalmaydigan otlar bilan.",
      "a lot of / lots of — ikkalasi bilan ham ishlaydi.",
      "some — tasdiqda, any — inkor va so'roqda (taklif qilishdan tashqari).",
      "advice, information, news, money — ingliz tilida SANALMAYDI.",
    ],
    examples: [
      { en: "How much money do you need?", uz: "Sizga qancha pul kerak?" },
      { en: "He gave me some useful advice.", uz: "U menga foydali maslahat berdi." },
    ],
    commonMistake: {
      wrong: "I need some advices.",
      right: "I need some advice.",
      why: "'advice' sanalmaydi, ko'plik shakli yo'q.",
    },
  },

  // ── B1 ─────────────────────────────────────────────────────────────────────
  {
    id: "b1-present-perfect",
    level: "B1",
    module: "Zamonlar",
    title: "Present Perfect",
    summary: "O'tmishdagi ishning HOZIRGA bog'liqligi.",
    points: [
      "Tuzilishi: have/has + V3.",
      "Aniq o'tmish vaqti aytilsa — Past Simple, aytilmasa va natija muhim bo'lsa — Present Perfect.",
      "for — davomiylik (for 3 years), since — boshlanish nuqtasi (since 2020).",
      "already / yet / just / ever / never shu zamon bilan yuradi.",
    ],
    examples: [
      { en: "I have lived here for five years.", uz: "Men bu yerda besh yildan beri yashayman." },
      { en: "Have you ever been to London?", uz: "Hech Londonda bo'lganmisiz?" },
    ],
    commonMistake: {
      wrong: "I have seen him yesterday.",
      right: "I saw him yesterday.",
      why: "'yesterday' aniq o'tmish vaqti — u Present Perfect bilan ishlatilmaydi.",
    },
  },
  {
    id: "b1-conditionals-1-2",
    level: "B1",
    module: "Shart gaplar",
    title: "Shart gaplar: 0, 1, 2-tur",
    summary: "if bilan tuzilgan gaplar va ularning mantiqiy farqi.",
    points: [
      "0-tur: If + Present, Present — doimiy haqiqat.",
      "1-tur: If + Present Simple, will + V1 — real kelajak.",
      "2-tur: If + Past Simple, would + V1 — xayoliy hozir/kelajak.",
      "'if' bo'limida will ISHLATILMAYDI.",
    ],
    examples: [
      { en: "If it rains, we will stay home.", uz: "Yomg'ir yog'sa, uyda qolamiz." },
      { en: "If I were you, I would accept the offer.", uz: "Sizning o'rningizda bo'lsam, taklifni qabul qilardim." },
    ],
    commonMistake: {
      wrong: "If I will have time, I will call you.",
      right: "If I have time, I will call you.",
      why: "'if' ergash gapida kelasi zamon shakli ishlatilmaydi.",
    },
  },
  {
    id: "b1-passive",
    level: "B1",
    module: "Majhul nisbat",
    title: "Passive Voice",
    summary: "Ish bajaruvchisi emas, ishning o'zi muhim bo'lganda.",
    points: [
      "Tuzilishi: to be (kerakli zamonda) + V3.",
      "Bajaruvchini ko'rsatish uchun 'by' ishlatiladi, lekin ko'pincha umuman ko'rsatilmaydi.",
      "Rasmiy uslubda va akademik yozuvda juda ko'p uchraydi — IELTS Writing Task 1 uchun muhim.",
    ],
    examples: [
      { en: "The bridge was built in 1990.", uz: "Ko'prik 1990-yilda qurilgan." },
      { en: "English is spoken all over the world.", uz: "Ingliz tilida butun dunyoda gapiriladi." },
    ],
  },
  {
    id: "b1-reported-speech",
    level: "B1",
    module: "O'zga gap",
    title: "Reported Speech",
    summary: "Birovning gapini o'z so'zingiz bilan yetkazish.",
    points: [
      "Zamon bir pog'ona orqaga suriladi: Present Simple → Past Simple.",
      "Olmoshlar va vaqt so'zlari ham o'zgaradi: today → that day, tomorrow → the next day.",
      "say — kimga aytilgani ko'rsatilmaydi; tell — kimga aytilgani ko'rsatiladi (tell me).",
      "So'roq gaplarda so'z tartibi TASDIQ tartibiga qaytadi.",
    ],
    examples: [
      { en: "He said he was tired.", uz: "U charchaganini aytdi." },
      { en: "She asked where I lived.", uz: "U mendan qayerda yashashimni so'radi." },
    ],
    commonMistake: {
      wrong: "She asked where did I live.",
      right: "She asked where I lived.",
      why: "O'zga gapda so'roq tartibi saqlanmaydi.",
    },
  },
  {
    id: "b1-relative-clauses",
    level: "B1",
    module: "Ergash gaplar",
    title: "Relative Clauses (who / which / that)",
    summary: "Otni aniqlab keladigan ergash gaplar.",
    points: [
      "who — odam, which — narsa, that — ikkalasi (faqat aniqlovchi gaplarda).",
      "Aniqlovchi (defining) gap vergulsiz yoziladi va otni aniqlash uchun SHART.",
      "Qo'shimcha ma'lumot beruvchi (non-defining) gap vergul bilan ajratiladi va 'that' olmaydi.",
      "whose — egalik, where — joy.",
    ],
    examples: [
      { en: "The man who called you is my brother.", uz: "Sizga qo'ng'iroq qilgan odam mening akam." },
      { en: "My car, which is very old, broke down.", uz: "Mashinam, u juda eski, buzildi." },
    ],
  },
  {
    id: "b1-gerund-infinitive",
    level: "B1",
    module: "Fe'l shakllari",
    title: "Gerund va Infinitive",
    summary: "-ing yoki to + fe'l — qaysi biri kerak?",
    points: [
      "Predlogdan keyin har doim -ing: good at swimming.",
      "enjoy, avoid, suggest, mind, finish → -ing.",
      "want, decide, hope, promise, agree → to + fe'l.",
      "stop / remember / forget ikkalasi bilan ham ishlatiladi, lekin MA'NOSI o'zgaradi.",
    ],
    examples: [
      { en: "I stopped smoking.", uz: "Chekishni tashladim." },
      { en: "I stopped to smoke.", uz: "Chekish uchun to'xtadim." },
    ],
  },

  // ── B2 ─────────────────────────────────────────────────────────────────────
  {
    id: "b2-perfect-continuous",
    level: "B2",
    module: "Zamonlar",
    title: "Perfect Continuous zamonlar",
    summary: "Ishning davomiyligiga urg'u.",
    points: [
      "Present Perfect Continuous: have/has been + V-ing — hozirgacha davom etayotgan ish.",
      "Past Perfect Continuous: had been + V-ing — o'tmishdagi nuqtagacha davom etgan ish.",
      "Natija emas, JARAYON va davomiylik muhim bo'lganda ishlatiladi.",
    ],
    examples: [
      { en: "I have been studying English for six years.", uz: "Olti yildan beri ingliz tilini o'rganib kelyapman." },
      { en: "He was tired because he had been working all night.", uz: "U charchagan edi, chunki tun bo'yi ishlagan edi." },
    ],
  },
  {
    id: "b2-conditionals-3-mixed",
    level: "B2",
    module: "Shart gaplar",
    title: "3-tur va aralash shart gaplar",
    summary: "O'tmishdagi afsus va uning bugungi oqibati.",
    points: [
      "3-tur: If + Past Perfect, would have + V3 — o'tmishdagi xayoliy holat.",
      "Aralash: o'tmishdagi shart → hozirgi natija (If I had studied, I would be a doctor now).",
      "IELTS Speaking Part 3 da afsus va farazni ifodalash uchun juda foydali.",
    ],
    examples: [
      { en: "If I had known, I would have told you.", uz: "Bilganimda edi, senga aytardim." },
      { en: "If she had taken the job, she would be in London now.", uz: "Ishni qabul qilganida, hozir Londonda bo'lardi." },
    ],
  },
  {
    id: "b2-linking-words",
    level: "B2",
    module: "Bog'lovchilar",
    title: "Bog'lovchilar va kohesiya",
    summary: "IELTS Writing'dagi Coherence & Cohesion mezoni aynan shu haqda.",
    points: [
      "Qarama-qarshilik: however, nevertheless, whereas, although.",
      "Sabab-oqibat: therefore, consequently, due to, owing to.",
      "Qo'shimcha: moreover, furthermore, in addition.",
      "'although' + gap, 'despite' + ot/-ing — bu ikkisi almashib ketmasin.",
    ],
    examples: [
      { en: "Although it was expensive, he bought it.", uz: "Qimmat bo'lsa ham, uni sotib oldi." },
      { en: "Despite the rain, we went out.", uz: "Yomg'irga qaramay, tashqariga chiqdik." },
    ],
    commonMistake: {
      wrong: "Despite it was raining...",
      right: "Despite the rain... / Although it was raining...",
      why: "'despite' dan keyin gap emas, ot yoki -ing keladi.",
    },
  },
  {
    id: "b2-articles-advanced",
    level: "B2",
    module: "Otlar",
    title: "Murakkab artikl holatlari",
    summary: "Umumlashtirish, geografik nomlar va noyob obyektlar.",
    points: [
      "Umumiy ma'noda ko'plik: Dogs are loyal (artiklsiz).",
      "Noyob obyektlar: the sun, the moon, the Internet.",
      "Mamlakatlar odatda artiklsiz, lekin: the USA, the UK, the Netherlands.",
      "Orttirma daraja va tartib son oldidan har doim 'the': the best, the first.",
    ],
    examples: [
      { en: "The rich should help the poor.", uz: "Boylar kambag'allarga yordam berishi kerak." },
      { en: "He went to the United Arab Emirates.", uz: "U BAAga bordi." },
    ],
  },
  {
    id: "b2-inversion",
    level: "B2",
    module: "Uslub",
    title: "Inversiya (urg'u berish)",
    summary: "Rasmiy va ta'sirchan uslub — yuqori band uchun.",
    points: [
      "Inkor ma'noli so'z gap boshida kelsa, so'z tartibi so'roq tartibiga o'tadi.",
      "Never have I seen..., Rarely does he..., Not only did she...",
      "Only after / Only when bilan ham inversiya ishlatiladi.",
      "Og'zaki nutqda kam, yozma va rasmiy uslubda ko'p uchraydi.",
    ],
    examples: [
      { en: "Never have I seen such a beautiful place.", uz: "Hech qachon bunday go'zal joyni ko'rmaganman." },
      { en: "Not only did he apologise, but he also paid for the damage.", uz: "U nafaqat uzr so'radi, balki zararni ham to'ladi." },
    ],
  },

  // ── C1 ─────────────────────────────────────────────────────────────────────
  {
    id: "c1-subjunctive",
    level: "C1",
    module: "Uslub",
    title: "Subjunctive va farazli shakllar",
    summary: "Rasmiy talab, taklif va farazlar.",
    points: [
      "suggest / recommend / insist / demand dan keyin: that + shaxs + fe'lning ASL shakli.",
      "I wish / If only + Past Simple — hozirgi afsus; + Past Perfect — o'tmishdagi afsus.",
      "It's time + Past Simple: It's time we left.",
    ],
    examples: [
      { en: "The committee recommended that he be promoted.", uz: "Qo'mita uni lavozimga ko'tarishni tavsiya qildi." },
      { en: "I wish I had studied harder.", uz: "Qattiqroq o'qiganimda edi." },
    ],
  },
  {
    id: "c1-nominalisation",
    level: "C1",
    module: "Akademik uslub",
    title: "Nominalizatsiya",
    summary: "Fe'lni otga aylantirib, akademik zichlik hosil qilish.",
    points: [
      "Fe'l → ot: decide → decision, analyse → analysis, grow → growth.",
      "Akademik matnlarda fikr fe'l orqali emas, ot orqali ifodalanadi.",
      "IELTS Writing Task 2 da Lexical Resource ballini oshiradi.",
      "Haddan ortiq ishlatilsa matn og'irlashadi — me'yorni saqlang.",
    ],
    examples: [
      { en: "The government decided to invest. → The government's decision to invest...", uz: "Hukumat sarmoya kiritishga qaror qildi. → Hukumatning sarmoya kiritish qarori..." },
      { en: "The population grew rapidly. → The rapid growth of the population...", uz: "Aholi tez o'sdi. → Aholining tez o'sishi..." },
    ],
  },
  {
    id: "c1-hedging",
    level: "C1",
    module: "Akademik uslub",
    title: "Hedging — ehtiyotkor da'vo",
    summary: "Akademik yozuvda mutlaq da'vodan qochish.",
    points: [
      "may / might / could — ehtimollik.",
      "tend to, appear to, seem to — umumlashtirishni yumshatadi.",
      "It could be argued that... — o'z fikringizni ehtiyotkorlik bilan berish.",
      "'always', 'never', 'all people' kabi mutlaq so'zlar akademik uslubda zaif hisoblanadi.",
    ],
    examples: [
      { en: "This may suggest that income affects health.", uz: "Bu daromad sog'liqqa ta'sir qilishini ko'rsatishi mumkin." },
      { en: "Younger people tend to prefer online learning.", uz: "Yoshlar onlayn ta'limni afzal ko'rish tamoyiliga ega." },
    ],
  },
  {
    id: "c1-cleft",
    level: "C1",
    module: "Uslub",
    title: "Cleft gaplar (urg'uni ko'chirish)",
    summary: "It is... that / What... is — fikrni ta'kidlash.",
    points: [
      "It-cleft: It was John who broke the window.",
      "Wh-cleft: What I need is more time.",
      "Speaking Part 3 va Writing'da fikrni ajratib ko'rsatish uchun ishlatiladi.",
    ],
    examples: [
      { en: "What surprised me most was the cost.", uz: "Meni eng ko'p hayratlantirgani narx bo'ldi." },
      { en: "It is education that changes societies.", uz: "Jamiyatni o'zgartiradigan narsa — bu ta'lim." },
    ],
  },
];

export const GRAMMAR_LEVELS: GrammarLevel[] = ["A1", "A2", "B1", "B2", "C1"];

export function lessonsByLevel(level: GrammarLevel): GrammarLesson[] {
  return GRAMMAR_LESSONS.filter((l) => l.level === level);
}

export function getLesson(id: string): GrammarLesson | undefined {
  return GRAMMAR_LESSONS.find((l) => l.id === id);
}

export function nextLesson(id: string): GrammarLesson | undefined {
  const i = GRAMMAR_LESSONS.findIndex((l) => l.id === id);
  return i >= 0 ? GRAMMAR_LESSONS[i + 1] : undefined;
}
