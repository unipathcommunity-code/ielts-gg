import { NextResponse } from "next/server";
import { supabaseAdmin, adminAuthorized } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!adminAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) throw error;
    
    const mapped = (data?.users || []).map((u: any) => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      metadata: u.user_metadata || {},
    }));
    
    return NextResponse.json({ users: mapped });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
