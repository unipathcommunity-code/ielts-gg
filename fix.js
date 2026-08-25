const fs = require('fs');
let code = fs.readFileSync('src/app/movies/[id]/page.tsx', 'utf8');

// 1. Fix the subtitle rendering on video
code = code.replace(
  /\{SAMPLE_SUBTITLES\[1\]\.text\.split\(" "\)\.map\(\(word, i\) => \(/g,
  {(SAMPLE_SUBTITLES.find(s => s.id === activeSubId)?.text || "").split(" ").map((word, i) => (
);

// 2. Fix the dictionary rendering
code = code.replace(
  /<div className="mb-6">\s*<p className="font-medium text-lg">Lug'at boyligi, so'zlar zaxirasi<\/p>\s*<p className="text-sm text-zinc-500 mt-2">Misol: Reading books is a good way to expand your <span className="font-bold text-zinc-700 dark:text-zinc-300">vocabulary<\/span>\.<\/p>\s*<\/div>/g,
  <div className="mb-6">
                  <p className="font-medium text-lg text-emerald-500">{MOCK_DICT[selectedWord]?.trans || "Lug'atda topilmadi"}</p>
                  <p className="text-sm text-zinc-500 mt-2">Misol: {MOCK_DICT[selectedWord]?.ex || "Bu so'z uchun misol yo'q."}</p>
                </div>
);

// 3. Add MOCK_DICT if it's not there
if (!code.includes('MOCK_DICT')) {
  code = code.replace(
    /const SAMPLE_SUBTITLES = \[/g,
    const MOCK_DICT: Record<string, { trans: string, ex: string }> = {
  welcome: { trans: "Xush kelibsiz", ex: "Welcome to our platform!" },
  global: { trans: "Global, umumjahon", ex: "This is a global issue." },
  ecosystem: { trans: "Ekotizim", ex: "The global ecosystem is changing." },
  language: { trans: "Til", ex: "English is a global language." },
  learning: { trans: "O'rganish", ex: "Learning is a lifelong process." },
  here: { trans: "Bu yerda", ex: "Here is your book." },
  you: { trans: "Siz", ex: "You are welcome." },
  can: { trans: "Qila olmoq", ex: "You can do it!" },
  watch: { trans: "Tomosha qilmoq", ex: "I watch movies every day." },
  movies: { trans: "Kinolar", ex: "I love watching movies." },
  and: { trans: "Va", ex: "You and I." },
  improve: { trans: "Yaxshilamoq", ex: "Read books to improve your English." },
  your: { trans: "Sizning", ex: "This is your book." },
  vocabulary: { trans: "Lug'at boyligi", ex: "Expand your vocabulary." },
  simultaneously: { trans: "Bir vaqtning o'zida", ex: "He laughed and cried simultaneously." },
  if: { trans: "Agar", ex: "If it rains, we will stay home." },
  encounter: { trans: "Duch kelmoq", ex: "We encountered a problem." },
  an: { trans: "Bir", ex: "It is an apple." },
  unfamiliar: { trans: "Notanish", ex: "I saw an unfamiliar face." },
  word: { trans: "So'z", ex: "What does this word mean?" },
  simply: { trans: "Shunchaki", ex: "Simply click the button." },
  click: { trans: "Bosmoq", ex: "Click on the link." },
  on: { trans: "Ustida", ex: "The book is on the table." },
  it: { trans: "U", ex: "It is a cat." },
  will: { trans: "Xohish, -ajak", ex: "It will rain." },
  be: { trans: "Bo'lmoq", ex: "I will be there." },
  automatically: { trans: "Avtomatik tarzda", ex: "The door opens automatically." },
  saved: { trans: "Saqlangan", ex: "Your work is saved." },
  to: { trans: "-ga", ex: "Go to school." },
  personal: { trans: "Shaxsiy", ex: "This is my personal computer." },
  dictionary: { trans: "Lug'at", ex: "I use a dictionary to learn words." }
};\n\nconst SAMPLE_SUBTITLES = [
  );
}

fs.writeFileSync('src/app/movies/[id]/page.tsx', code);
