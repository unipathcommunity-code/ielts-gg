import { NextResponse } from "next/server";
import { supabaseAdmin, adminAuthorized } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!adminAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [{ data: tests }, { data: questions }, { data: vocab }] = await Promise.all([
    supabaseAdmin.from("listening_tests").select("*").order("order_index"),
    supabaseAdmin.from("listening_questions").select("*").order("order_index"),
    supabaseAdmin.from("listening_vocab").select("*").order("order_index"),
  ]);
  return NextResponse.json({ tests: tests || [], questions: questions || [], vocab: vocab || [] });
}

export async function POST(req: Request) {
  if (!adminAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { id, title, order_index = 0, sentences = [], transcript_html = "", questions = [], vocab = [] } = body || {};
  if (!id || !title) return NextResponse.json({ error: "id va title majburiy" }, { status: 400 });

  const up = await supabaseAdmin.from("listening_tests").upsert({ id, title, sentences, transcript_html, order_index });
  if (up.error) return NextResponse.json({ error: up.error.message }, { status: 500 });

  await supabaseAdmin.from("listening_questions").delete().eq("test_id", id);
  await supabaseAdmin.from("listening_vocab").delete().eq("test_id", id);

  if (Array.isArray(questions) && questions.length) {
    const qrows = questions.map((q: any, i: number) => ({
      test_id: id, qid: q.qid, prompt: q.prompt, answer_key: q.answer_key, order_index: i,
      options: q.kind === "mcq"
        ? { kind: "mcq", choices: q.options || [] }
        : { kind: "fill", prefix: q.prefix || "", suffix: q.suffix || "" },
    }));
    const qr = await supabaseAdmin.from("listening_questions").insert(qrows);
    if (qr.error) return NextResponse.json({ error: qr.error.message }, { status: 500 });
  }
  if (Array.isArray(vocab) && vocab.length) {
    const vrows = vocab.map((v: any, i: number) => ({ test_id: id, word: v.word, definition: v.definition, translation: v.translation, order_index: i }));
    const vr = await supabaseAdmin.from("listening_vocab").insert(vrows);
    if (vr.error) return NextResponse.json({ error: vr.error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  if (!adminAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id kerak" }, { status: 400 });
  const r = await supabaseAdmin.from("listening_tests").delete().eq("id", id);
  if (r.error) return NextResponse.json({ error: r.error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
