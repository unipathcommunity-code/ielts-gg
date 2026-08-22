// Seeds the 3 listening tests (+ questions + vocab) into Supabase.
// Run: node scripts/seed-listening.mjs   (with SB_URL and SB_SECRET in env)
import { LISTENING_TESTS } from "./listening-data.mjs";

const URL = process.env.SB_URL;
const KEY = process.env.SB_SECRET;
if (!URL || !KEY) { console.error("Set SB_URL and SB_SECRET env vars"); process.exit(1); }
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", "User-Agent": "kmw-bb-seed/1.0" };

async function del(table) {
  const r = await fetch(`${URL}/rest/v1/${table}?id=neq.__none__`, { method: "DELETE", headers: { ...H, Prefer: "return=minimal" } });
  if (!r.ok && r.status !== 404) console.warn("delete", table, r.status, await r.text());
}
async function insert(table, rows) {
  if (!rows.length) return;
  const r = await fetch(`${URL}/rest/v1/${table}`, { method: "POST", headers: { ...H, Prefer: "return=minimal" }, body: JSON.stringify(rows) });
  if (!r.ok) { console.error("INSERT FAIL", table, r.status, await r.text()); process.exit(1); }
  console.log(`  ✓ ${table}: ${rows.length}`);
}

async function main() {
  console.log("Seeding listening content → Supabase");
  await del("listening_tests"); // cascades to questions + vocab
  const tests = Object.values(LISTENING_TESTS);
  await insert("listening_tests", tests.map((t, i) => ({ id: t.id, title: t.title, sentences: t.sentences, transcript_html: t.transcriptHtml, order_index: i })));
  await insert("listening_questions", tests.flatMap(t => t.questions.map((q, i) => ({
    test_id: t.id, qid: q.qid, prompt: q.prompt,
    options: q.kind === "mcq" ? { kind: "mcq", choices: q.options } : { kind: "fill", prefix: q.prefix || "", suffix: q.suffix || "" },
    answer_key: q.answer_key, order_index: i,
  }))));
  await insert("listening_vocab", tests.flatMap(t => t.vocab.map((v, i) => ({ test_id: t.id, word: v.word, definition: v.definition, translation: v.translation, order_index: i }))));
  console.log("Done.");
}
main().catch(e => { console.error(e); process.exit(1); });
