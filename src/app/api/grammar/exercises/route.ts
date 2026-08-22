import { NextResponse } from "next/server";
import { callAI } from "@/lib/aiClient";
import { checkQuota } from "@/lib/entitlements";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getLesson } from "@/lib/grammar";

// GRAMMATIKA MASHQLARI.
//
// Gibrid kontent strategiyasi: mashqlar AI tomonidan yaratiladi, LEKIN bir marta —
// keyin kontent bankiga (`content_items`) yoziladi va keyingi barcha foydalanuvchilar
// o'sha tayyor mashqlarni oladi. Shu tufayli har ochilishda pul ketmaydi va hamma
// bir xil mashqni ko'radi (natijalarni taqqoslash mumkin bo'ladi).

interface Exercise {
  id: string;
  type: "gap" | "choice" | "correct";
  prompt: string;
  options?: string[];
  answer: string;
  explanationUz: string;
}

function parseJSON(text: string): unknown {
  let clean = text.trim();
  if (clean.startsWith("```")) {
    const nl = clean.indexOf("\n");
    if (nl !== -1) clean = clean.slice(nl + 1);
    if (clean.endsWith("```")) clean = clean.slice(0, -3);
  }
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  if (start !== -1 && end > start) clean = clean.slice(start, end + 1);
  return JSON.parse(clean);
}

export async function POST(request: Request) {
  try {
    const { lessonId } = await request.json();
    const lesson = getLesson(String(lessonId || ""));
    if (!lesson) {
      return NextResponse.json({ error: "unknown_lesson" }, { status: 404 });
    }

    const contentId = `grammar-en:exercise:${lesson.id}`;

    // 1) Bankda bormi?
    const { data: cached } = await supabaseAdmin
      .from("content_items")
      .select("payload")
      .eq("id", contentId)
      .eq("status", "published")
      .maybeSingle();

    if (cached?.payload) {
      const payload = cached.payload as { exercises?: Exercise[] };
      if (payload.exercises?.length) {
        return NextResponse.json({ exercises: payload.exercises, source: "bank" });
      }
    }

    // 2) Bankda yo'q — AI yozadi. Bu chaqiruv kvotaga kiradi.
    const gate = await checkQuota(request, "chat", "grammar-en");
    if (gate.denied) return gate.denied.response;

    const systemPrompt = `You write English grammar exercises for Uzbek-speaking learners.
Return ONLY valid JSON, no prose.

Target CEFR level: ${lesson.level}
Grammar topic: ${lesson.title}
Rules the learner has just studied:
${lesson.points.map((p, i) => `${i + 1}. ${p}`).join("\n")}

Produce exactly 8 exercises testing THIS topic only, ordered from easier to harder.
Mix the types: 4 of type "choice", 3 of type "gap", 1 of type "correct".
- "choice": prompt contains the sentence with ___ ; give 3-4 plausible options; answer is the exact correct option string.
- "gap": prompt contains the sentence with ___ ; no options; answer is the single word or short phrase that fills it.
- "correct": prompt is one sentence containing exactly one grammar mistake on this topic; answer is the fully corrected sentence.

Every explanationUz MUST be written in Uzbek (Latin script), 1-2 sentences, and must name the rule that applies.
Keep vocabulary appropriate for ${lesson.level}.

JSON shape:
{"exercises":[{"id":"e1","type":"choice","prompt":"She ___ to school every day.","options":["go","goes","going"],"answer":"goes","explanationUz":"..."}]}`;

    const raw = await callAI(systemPrompt, `Create the 8 exercises for: ${lesson.title}`, 2500, true);
    const parsed = parseJSON(raw) as { exercises?: Exercise[] };
    const exercises = (parsed.exercises || []).filter(
      (e) => e && e.prompt && e.answer && e.explanationUz
    );

    if (!exercises.length) {
      return NextResponse.json({ error: "generation_failed" }, { status: 502 });
    }

    // 3) Bankka yozamiz — keyingi safar tekinga keladi.
    await supabaseAdmin.from("content_items").upsert(
      {
        id: contentId,
        track_id: "grammar-en",
        skill: "grammar",
        level: lesson.level,
        title: `${lesson.title} — mashqlar`,
        payload: { exercises },
        source: "ai",
        status: "published",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    return NextResponse.json({ exercises, source: "ai" });
  } catch (e) {
    console.error("grammar exercises failed:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
