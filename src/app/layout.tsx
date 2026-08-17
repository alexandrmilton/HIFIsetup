import type { Metadata } from "next";
import { Manrope, Playfair_Display } from "next/font/google";
import "./globals.css";
import { getLocale } from "@/lib/i18n/server";
import { getTheme } from "@/lib/theme-server";

// Manrope carries the geometric feel of the reference design; Playfair gives
// the slogan its serif accent. Both ship Cyrillic, which Arial-only did not.
const manrope = Manrope({ subsets: ["latin", "cyrillic"], variable: "--font-sans", display: "swap" });
const playfair = Playfair_Display({ subsets: ["latin", "cyrillic"], variable: "--font-serif", style: ["italic", "normal"], display: "swap" });

export const metadata: Metadata = {
  title: "HiFiSetup — Hi‑Fi сетапи",
  description: "Натхнення для вашого ідеального звуку. Досліджуйте реальні аудіо-сетапи, діліться своїм та знаходьте нові ідеї.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [locale, theme] = await Promise.all([getLocale(), getTheme()]);
  return <html lang={locale} data-theme={theme} className={`${manrope.variable} ${playfair.variable}`}><body>{children}</body></html>;
}
