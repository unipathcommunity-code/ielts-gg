import { NextResponse } from "next/server";
import { supabaseAdmin, adminAuthorized } from "@/lib/supabaseAdmin";

export const runtime = "nodejs"; // secret key must run server-side, not edge

// List all reading content (admin only)
export async function GET(req: Request) {
  if (!adminAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [{ data: passages }, { data: questions }, { data: vocab }] = await Promise.all([
    supabaseAdmin.from("reading_passages").select("*").order("order_index"),
    supabaseAdmin.from("reading_questions").select("*").order("order_index"),
    supabaseAdmin.from("reading_vocab").select("*").order("order_index"),
  ]);
  return NextResponse.json({ passages: passages || [], questions: questions || [], vocab: vocab || [] });
}

// Create or update a passage (with its questions + vocab)
export async function POST(req: Request) {
  if (!adminAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { id, title, order_index = 0, paragraphs = [], questions = [], vocab = [] } = body || {};
  if (!id || !title) return NextResponse.json({ error: "id va title majburiy" }, { status: 400 });

  const up = await supabaseAdmin.from("reading_passages").upsert({ id, title, paragraphs, order_index });
  if (up.error) return NextResponse.json({ error: up.error.message }, { status: 500 });

  // Replace questions + vocab for this passage
  await supabaseAdmin.from("reading_questions").delete().eq("passage_id", id);
  await supabaseAdmin.from("reading_vocab").delete().eq("passage_id", id);

  if (Array.isArray(questions) && questions.length) {
    const qrows = questions.map((q: any, i: number) => ({
      passage_id: id, qid: q.qid, kind: q.kind, number: q.number,
      prompt: q.prompt, short_label: q.short_label || q.prompt, answer_key: q.answer_key, order_index: i,
    }));
    const qr = await supabaseAdmin.from("reading_questions").insert(qrows);
    if (qr.error) return NextResponse.json({ error: qr.error.message }, { status: 500 });
  }
  if (Array.isArray(vocab) && vocab.length) {
    const vrows = vocab.map((v: any, i: number) => ({
      passage_id: id, word: v.word, definition: v.definition, translation: v.translation, order_index: i,
    }));
    const vr = await supabaseAdmin.from("reading_vocab").insert(vrows);
    if (vr.error) return NextResponse.json({ error: vr.error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

// Delete a passage (cascades to its questions + vocab)
export async function DELETE(req: Request) {
  if (!adminAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id kerak" }, { status: 400 });
  const r = await supabaseAdmin.from("reading_passages").delete().eq("id", id);
  if (r.error) return NextResponse.json({ error: r.error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
