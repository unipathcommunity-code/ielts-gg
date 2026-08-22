import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { BottomNav } from "@/components/BottomNav";
import { FloatingJarvis } from "@/components/FloatingJarvis";
import { OnboardingModal } from "@/components/OnboardingModal";
import { ProgressSync } from "@/components/ProgressSync";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin", "latin-ext"],
});

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "kmb.education — IELTS, Multilevel va til imtihonlari",
  description:
    "IELTS, Multilevel (Milliy sertifikat), TOPIK, HSK, JLPT va grammatika — har biri alohida yo'nalish. Sun'iy intellekt bilan baholash, jonli suhbat va shaxsiy reja.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html
        lang="en"
        suppressHydrationWarning
        className={`${plusJakarta.variable} font-sans h-full antialiased`}
      >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <ProgressSync />
          <FloatingJarvis />
          <OnboardingModal />
          <BottomNav />
        </ThemeProvider>
      </body>
    </html>
  );
}
