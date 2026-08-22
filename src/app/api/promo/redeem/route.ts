import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveRequester } from "@/lib/entitlements";

// PROMO KOD → Pro obuna.
//
// To'lov provayderi (Payme/Click) ulanmaguncha Pro'ni shu yo'l bilan beramiz.
// Muhimi: yozuvni FAQAT server qiladi (SUPABASE_SECRET_KEY bilan) — `entitlements`
// jadvaliga klientdan yozish RLS bilan taqiqlangan, shuning uchun brauzerdan
// "premium" ni yoqib olishning iloji yo'q.

interface PromoRow {
  code: string;
  plan: string;
  days: number;
  max_uses: number;
  used_count: number;
  expires_at: string | null;
}

export async function POST(request: Request) {
  try {
    const who = await resolveRequester(request);
    if (!who.userId) {
      return NextResponse.json(
        { error: "auth_required", message: "Promo kodni ishlatish uchun avval hisobingizga kiring." },
        { status: 401 }
      );
    }

    const { code } = await request.json();
    const normalized = String(code || "").trim().toUpperCase();
    if (!normalized) {
      return NextResponse.json({ error: "empty", message: "Promo kodni kiriting." }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("promo_codes")
      .select("code,plan,days,max_uses,used_count,expires_at")
      .eq("code", normalized)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: "lookup_failed", message: "Kodni tekshirib bo'lmadi. Birozdan keyin urinib ko'ring." },
        { status: 500 }
      );
    }

    const promo = data as PromoRow | null;
    if (!promo) {
      return NextResponse.json({ error: "not_found", message: "Bunday promo kod topilmadi." }, { status: 404 });
    }
    if (promo.expires_at && new Date(promo.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: "expired", message: "Bu promo kodning muddati tugagan." }, { status: 410 });
    }
    if (promo.used_count >= promo.max_uses) {
      return NextResponse.json({ error: "used_up", message: "Bu promo kod limiti tugagan." }, { status: 409 });
    }

    // Bir foydalanuvchi bitta kodni ikki marta ishlata olmaydi (unique (code, user_id)).
    const { error: redeemError } = await supabaseAdmin
      .from("promo_redemptions")
      .insert({ code: promo.code, user_id: who.userId });

    if (redeemError) {
      return NextResponse.json(
        { error: "already_used", message: "Siz bu koddan allaqachon foydalangansiz." },
        { status: 409 }
      );
    }

    const expiresAt = new Date(Date.now() + promo.days * 86400000).toISOString();
    const { error: entError } = await supabaseAdmin.from("entitlements").insert({
      user_id: who.userId,
      plan: promo.plan,
      source: "promo",
      expires_at: expiresAt,
      note: `promo:${promo.code}`,
    });

    if (entError) {
      return NextResponse.json(
        { error: "grant_failed", message: "Obunani faollashtirib bo'lmadi. Qo'llab-quvvatlashga murojaat qiling." },
        { status: 500 }
      );
    }

    await supabaseAdmin
      .from("promo_codes")
      .update({ used_count: promo.used_count + 1 })
      .eq("code", promo.code);

    return NextResponse.json({
      ok: true,
      plan: promo.plan,
      days: promo.days,
      expiresAt,
      message: `Tabriklaymiz! ${promo.days} kunlik ${promo.plan.toUpperCase()} obuna faollashtirildi.`,
    });
  } catch {
    return NextResponse.json(
      { error: "bad_request", message: "So'rovni o'qib bo'lmadi." },
      { status: 400 }
    );
  }
}
