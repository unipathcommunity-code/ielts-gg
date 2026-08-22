import { notFound } from "next/navigation";
import { getAllTracks, isTrackId } from "@/lib/tracks";

// Noto'g'ri yo'nalish id'si bilan kelingan URL 404 beradi — IELTS'ga jimgina
// tushib qolmaydi, aks holda foydalanuvchi noto'g'ri imtihonni ishlab yuborardi.
export function generateStaticParams() {
  return getAllTracks().map((t) => ({ track: t.id }));
}

export default async function TrackLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ track: string }>;
}) {
  const { track } = await params;
  if (!isTrackId(track)) notFound();
  return <>{children}</>;
}
