import { supabase } from "@/lib/supabase";

export interface CertificateRecord {
  id: string;
  user_id: string;
  full_name: string;
  exam_format: string;
  exam_name: string;
  score_label: string;
  native_score: string;
  band_numeric: number;
  verify_code: string;
  issued_at: string;
}

function generateVerifyCode(): string {
  const hex = crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase();
  return `KMW-${hex}`;
}

export async function issueCertificate(params: {
  userId: string;
  fullName: string;
  examFormat: string;
  examName: string;
  scoreLabel: string;
  nativeScore: string;
  bandNumeric: number;
}): Promise<{ data: CertificateRecord | null; error: string | null }> {
  const { data, error } = await supabase
    .from("certificates")
    .insert({
      user_id: params.userId,
      full_name: params.fullName,
      exam_format: params.examFormat,
      exam_name: params.examName,
      score_label: params.scoreLabel,
      native_score: params.nativeScore,
      band_numeric: params.bandNumeric,
      verify_code: generateVerifyCode(),
    })
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as CertificateRecord, error: null };
}

export async function listMyCertificates(userId: string): Promise<CertificateRecord[]> {
  const { data, error } = await supabase
    .from("certificates")
    .select("*")
    .eq("user_id", userId)
    .order("issued_at", { ascending: false });

  if (error) {
    console.warn("Failed to load certificates:", error.message);
    return [];
  }
  return (data as CertificateRecord[]) || [];
}
