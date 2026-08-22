import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

// Intentionally public (like a real certificate-verification service) — looks up
// ONE certificate by its unguessable verify_code and returns only display-safe
// fields. Never returns user_id/email; only exact-code lookups are possible
// (no listing), so this cannot be used to enumerate other users' certificates.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  if (!code) return NextResponse.json({ error: "code is required" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("certificates")
    .select("full_name, exam_name, score_label, native_score, issued_at, verify_code")
    .eq("verify_code", code)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Sertifikat topilmadi" }, { status: 404 });
  }

  return NextResponse.json(data);
}
