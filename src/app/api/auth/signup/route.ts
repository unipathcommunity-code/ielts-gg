import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs"; // service-role key must run server-side

// Creates a user that is already confirmed, so they can sign in immediately
// without waiting for an email confirmation link.
export async function POST(req: Request) {
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const { email, password } = body || {};
  if (!email || !password) return NextResponse.json({ error: "Email va parol majburiy" }, { status: 400 });
  
  const disposableDomains = ['mailinator.com', 'tempmail.com', 'yopmail.com', 'getnada.com', 'dispostable.com', 'sharklasers.com', 'guerrillamail.com', 'temp-mail.org', '10minutemail.com'];
  const domain = String(email).toLowerCase().split('@')[1];
  if (disposableDomains.includes(domain)) {
    return NextResponse.json({ error: "Vaqtinchalik (disposable) email manzillaridan foydalanish taqiqlanadi." }, { status: 400 });
  }

  if (String(password).length < 6) return NextResponse.json({ error: "Parol kamida 6 belgi bo'lishi kerak" }, { status: 400 });

  const { error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    const m = error.message || "";
    if (/already.*registered|already.*exists|duplicate/i.test(m)) {
      return NextResponse.json({ error: "Bu email allaqachon ro'yxatdan o'tgan. Kiring." }, { status: 409 });
    }
    return NextResponse.json({ error: m }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
